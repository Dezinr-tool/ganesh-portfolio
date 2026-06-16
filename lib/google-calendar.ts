import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { google } from "googleapis";
import type { calendar_v3 } from "googleapis";
import { sql } from "@/lib/db";
import { classifyCalendarEvents } from "@/lib/ea-meeting-schedule";

const TOKEN_PATH = path.join(process.cwd(), ".calendar-tokens.json");
const LEGACY_TOKEN_ROW_ID = "default";
export const IST_TIMEZONE = "Asia/Kolkata";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/meetings.space.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
];

export function encodeCalendarOAuthState(sessionId: string): string {
  return Buffer.from(JSON.stringify({ sessionId }), "utf8").toString("base64url");
}

export function decodeCalendarOAuthState(
  state: string | null | undefined,
): string | null {
  if (!state?.trim()) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(state.trim(), "base64url").toString("utf8"),
    ) as { sessionId?: string };
    return typeof parsed.sessionId === "string" && parsed.sessionId.length > 0
      ? parsed.sessionId
      : null;
  } catch {
    return null;
  }
}

function log(...args: unknown[]) {
  void args;
}

export type CalendarTokens = {
  access_token?: string | null;
  refresh_token?: string | null;
  scope?: string | null;
  token_type?: string | null;
  expiry_date?: number | null;
};

type CalendarTokenRow = {
  access_token: string | null;
  refresh_token: string | null;
  expiry_date: string | null;
  account_email: string | null;
};

export type CalendarEventItem = {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
  meetLink?: string;
  attendees?: string[];
  isAllDay: boolean;
};

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

export function extractEmailsFromText(text: string): string[] {
  const matches = text.match(EMAIL_REGEX) ?? [];
  return [...new Set(matches.map((email) => email.toLowerCase()))];
}

export function mergeAttendeeEmails(
  ...sources: (string[] | string | undefined)[]
): string[] {
  const emails = new Set<string>();

  for (const source of sources) {
    if (!source) continue;

    if (Array.isArray(source)) {
      for (const email of source) {
        const normalized = email.trim().toLowerCase();
        if (normalized) emails.add(normalized);
      }
      continue;
    }

    for (const email of extractEmailsFromText(source)) {
      emails.add(email);
    }
  }

  return [...emails];
}

/** Must match Google Cloud Console → OAuth client → Authorized redirect URIs exactly. */
export const CALENDAR_OAUTH_REDIRECT_URI =
  "http://localhost:3000/api/ea/calendar/callback";

export const PRODUCTION_CALENDAR_OAUTH_REDIRECT_URIS = [
  "https://www.designbyganesh.com/api/ea/calendar/callback",
  "https://designbyganesh.com/api/ea/calendar/callback",
] as const;

/** Register all of these in Google Cloud Console for the same OAuth client. */
export const GOOGLE_CONSOLE_REDIRECT_URIS = [
  CALENDAR_OAUTH_REDIRECT_URI,
  ...PRODUCTION_CALENDAR_OAUTH_REDIRECT_URIS,
];

function isLocalOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function isProductionSiteOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return (
      hostname === "designbyganesh.com" || hostname === "www.designbyganesh.com"
    );
  } catch {
    return false;
  }
}

export function getCalendarOAuthRedirectUri(origin?: string): string {
  if (origin && isLocalOrigin(origin)) {
    const { protocol, host } = new URL(origin);
    return `${protocol}//${host}/api/ea/calendar/callback`;
  }

  // Production: always use canonical www URI (must match Google Console exactly).
  if (
    process.env.VERCEL_ENV === "production" ||
    (origin && isProductionSiteOrigin(origin))
  ) {
    return PRODUCTION_CALENDAR_OAUTH_REDIRECT_URIS[0];
  }

  return CALENDAR_OAUTH_REDIRECT_URI;
}

export function getCalendarOAuthDebugInfo(
  sessionId: string,
  origin?: string,
): {
  redirectUri: string;
  authUrl: string;
  clientIdSuffix: string;
  sessionId: string;
  clientId: string;
  registerTheseRedirectUris: readonly string[];
} {
  const redirectUri = getCalendarOAuthRedirectUri(origin);
  const authUrl = getAuthUrl(sessionId, origin);
  const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
  return {
    redirectUri,
    authUrl,
    clientIdSuffix: clientId ? clientId.slice(-12) : "missing",
    clientId: clientId || "missing",
    sessionId,
    registerTheseRedirectUris: GOOGLE_CONSOLE_REDIRECT_URIS,
  };
}

export function getAuthUrl(sessionId: string, origin?: string): string {
  const redirectUri = getCalendarOAuthRedirectUri(origin);
  const oauth2Client = createOAuth2Client(origin);
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state: encodeCalendarOAuthState(sessionId),
  });

  console.info("[google-calendar] getAuthUrl origin:", origin ?? "(none)");
  console.info("[google-calendar] getAuthUrl redirect_uri:", redirectUri);
  console.info("[google-calendar] getAuthUrl full URL:", url);

  return url;
}

export function createOAuth2Client(origin?: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials not configured.");
  }

  const redirectUri = getCalendarOAuthRedirectUri(origin);
  console.info("[google-calendar] OAuth2 client redirect_uri:", redirectUri);

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export async function loadTokens(
  sessionId: string,
): Promise<CalendarTokens | null> {
  try {
    await migrateLegacyDefaultTokens(sessionId);

    const tokens = await loadTokensFromDb(sessionId);
    if (tokens) return tokens;

    return await migrateTokensFromFile(sessionId);
  } catch (error) {
    log("loadTokens: failed", {
      sessionId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

async function migrateLegacyDefaultTokens(sessionId: string): Promise<void> {
  if (sessionId === LEGACY_TOKEN_ROW_ID) return;

  const existing = await loadCalendarTokenRow(sessionId);
  if (existing?.refresh_token || existing?.access_token) return;

  const { rows } = await sql<CalendarTokenRow>`
    SELECT access_token, refresh_token, expiry_date, account_email
    FROM ea_calendar_tokens
    WHERE id = ${LEGACY_TOKEN_ROW_ID}
    LIMIT 1
  `;
  const legacy = rows[0];
  if (!legacy?.refresh_token && !legacy?.access_token) return;

  await sql`
    INSERT INTO ea_calendar_tokens (
      id, access_token, refresh_token, expiry_date, account_email, updated_at
    )
    VALUES (
      ${sessionId},
      ${legacy.access_token},
      ${legacy.refresh_token},
      ${legacy.expiry_date},
      ${legacy.account_email},
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      access_token = EXCLUDED.access_token,
      refresh_token = COALESCE(EXCLUDED.refresh_token, ea_calendar_tokens.refresh_token),
      expiry_date = EXCLUDED.expiry_date,
      account_email = COALESCE(EXCLUDED.account_email, ea_calendar_tokens.account_email),
      updated_at = NOW()
  `;

  log("migrateLegacyDefaultTokens: copied legacy default tokens", { sessionId });
}

async function loadTokensFromDb(
  sessionId: string,
): Promise<CalendarTokens | null> {
  log("loadTokens: reading from database", { sessionId });
  const { rows } = await sql<{
    access_token: string | null;
    refresh_token: string | null;
    expiry_date: string | null;
  }>`
    SELECT access_token, refresh_token, expiry_date
    FROM ea_calendar_tokens
    WHERE id = ${sessionId}
    LIMIT 1
  `;

  if (rows.length === 0) {
    log("loadTokens: no tokens in database", { sessionId });
    return null;
  }

  const row = rows[0];
  const tokens: CalendarTokens = {
    access_token: row.access_token,
    refresh_token: row.refresh_token,
    expiry_date: row.expiry_date != null ? Number(row.expiry_date) : null,
  };

  log("loadTokens: success", {
    sessionId,
    hasAccessToken: !!tokens.access_token,
    hasRefreshToken: !!tokens.refresh_token,
    expiryDate: tokens.expiry_date
      ? new Date(tokens.expiry_date).toISOString()
      : null,
  });

  return tokens;
}

async function migrateTokensFromFile(
  sessionId: string,
): Promise<CalendarTokens | null> {
  try {
    log("loadTokens: checking legacy file", { path: TOKEN_PATH, sessionId });
    const raw = await fs.readFile(TOKEN_PATH, "utf8");
    const tokens = JSON.parse(raw) as CalendarTokens;

    if (!tokens.refresh_token && !tokens.access_token) {
      return null;
    }

    log("loadTokens: migrating legacy file tokens to database", { sessionId });
    await upsertTokens(sessionId, tokens);
    try {
      await fs.unlink(TOKEN_PATH);
      log("loadTokens: removed legacy token file after migration", { path: TOKEN_PATH });
    } catch {
      /* file may already be absent */
    }
    return tokens;
  } catch {
    return null;
  }
}

async function upsertTokens(
  sessionId: string,
  tokens: CalendarTokens,
): Promise<void> {
  await sql`
    INSERT INTO ea_calendar_tokens (id, access_token, refresh_token, expiry_date, updated_at)
    VALUES (
      ${sessionId},
      ${tokens.access_token ?? null},
      ${tokens.refresh_token ?? null},
      ${tokens.expiry_date ?? null},
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      access_token = EXCLUDED.access_token,
      refresh_token = COALESCE(EXCLUDED.refresh_token, ea_calendar_tokens.refresh_token),
      expiry_date = EXCLUDED.expiry_date,
      updated_at = NOW()
  `;
}

export async function saveTokens(
  sessionId: string,
  tokens: CalendarTokens,
): Promise<void> {
  const existing = (await loadTokensFromDb(sessionId)) ?? {};
  const merged: CalendarTokens = {
    ...existing,
    ...tokens,
    refresh_token: tokens.refresh_token ?? existing.refresh_token ?? null,
  };

  await upsertTokens(sessionId, merged);
  log("saveTokens: wrote tokens to database", {
    sessionId,
    hasAccessToken: !!merged.access_token,
    hasRefreshToken: !!merged.refresh_token,
  });
}

function hasGoogleOAuthConfig(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export async function isCalendarConnected(sessionId: string): Promise<boolean> {
  if (!hasGoogleOAuthConfig()) {
    log("isCalendarConnected: false — missing GOOGLE_CLIENT_ID/SECRET");
    return false;
  }

  await migrateLegacyDefaultTokens(sessionId);
  const tokens = await loadTokens(sessionId);
  const connected = !!(tokens?.refresh_token || tokens?.access_token);
  log("isCalendarConnected", { sessionId, connected });
  return connected;
}

export async function disconnectCalendar(sessionId: string): Promise<void> {
  await sql`
    DELETE FROM ea_calendar_tokens
    WHERE id = ${sessionId}
  `;
  log("disconnectCalendar: removed tokens from database", { sessionId });
}

async function loadCalendarTokenRow(
  sessionId: string,
): Promise<CalendarTokenRow | null> {
  const { rows } = await sql<CalendarTokenRow>`
    SELECT access_token, refresh_token, expiry_date, account_email
    FROM ea_calendar_tokens
    WHERE id = ${sessionId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

async function saveCalendarAccountEmail(
  sessionId: string,
  email: string,
): Promise<void> {
  await sql`
    UPDATE ea_calendar_tokens
    SET account_email = ${email}, updated_at = NOW()
    WHERE id = ${sessionId}
  `;
}

const EMAIL_ADDRESS_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function resolveGoogleAccountEmail(
  auth: InstanceType<typeof google.auth.OAuth2>,
): Promise<string | null> {
  try {
    const oauth2 = google.oauth2({ version: "v2", auth });
    const { data } = await oauth2.userinfo.get();
    if (data.email) return data.email;
  } catch {
    // fall through to other strategies
  }

  const accessToken = auth.credentials.access_token;
  if (accessToken) {
    try {
      const response = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (response.ok) {
        const data = (await response.json()) as { email?: string };
        if (data.email) return data.email;
      }
    } catch {
      // fall through to calendar fallback
    }
  }

  try {
    const calendar = google.calendar({ version: "v3", auth });
    const { data } = await calendar.calendarList.list({ maxResults: 10 });
    const primary =
      data.items?.find((item) => item.primary) ?? data.items?.[0];
    const calendarId = primary?.id?.trim();
    if (calendarId && EMAIL_ADDRESS_PATTERN.test(calendarId)) {
      return calendarId;
    }
  } catch {
    // no email available
  }

  return null;
}

export async function fetchGoogleAccountEmail(
  sessionId: string,
): Promise<string | null> {
  const auth = await getAuthenticatedClient(sessionId);
  if (!auth) return null;
  return resolveGoogleAccountEmail(auth);
}

export type CalendarConnectionStatus = {
  connected: boolean;
  email: string | null;
};

export async function getCalendarConnectionStatus(
  sessionId: string,
): Promise<CalendarConnectionStatus> {
  await migrateLegacyDefaultTokens(sessionId);

  const row = await loadCalendarTokenRow(sessionId);
  const hasTokens = !!(row?.refresh_token || row?.access_token);
  if (!hasTokens) {
    return { connected: false, email: null };
  }

  if (row?.account_email) {
    return { connected: true, email: row.account_email };
  }

  const auth = await getAuthenticatedClient(sessionId);
  if (auth) {
    const email = await resolveGoogleAccountEmail(auth);
    if (email) {
      await saveCalendarAccountEmail(sessionId, email);
      return { connected: true, email };
    }
  }

  return { connected: true, email: null };
}

export async function getAuthenticatedClient(sessionId: string) {
  if (!hasGoogleOAuthConfig()) {
    log("getAuthenticatedClient: missing OAuth env vars");
    return null;
  }

  let oauth2Client;
  try {
    oauth2Client = createOAuth2Client();
  } catch (error) {
    log("getAuthenticatedClient: failed to create OAuth client", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }

  const tokens = await loadTokens(sessionId);

  if (!tokens) {
    log("getAuthenticatedClient: no tokens in database", { sessionId });
    return null;
  }

  oauth2Client.setCredentials({
    access_token: tokens.access_token ?? undefined,
    refresh_token: tokens.refresh_token ?? undefined,
    scope: tokens.scope ?? undefined,
    token_type: tokens.token_type ?? undefined,
    expiry_date: tokens.expiry_date ?? undefined,
  });

  oauth2Client.on("tokens", (newTokens) => {
    void saveTokens(sessionId, { ...tokens, ...newTokens });
  });

  const isExpired =
    !tokens.access_token ||
    (tokens.expiry_date != null && tokens.expiry_date <= Date.now() + 60_000);

  log("getAuthenticatedClient: token state", {
    isExpired,
    hasRefreshToken: !!tokens.refresh_token,
  });

  if (isExpired && tokens.refresh_token) {
    try {
      log("getAuthenticatedClient: refreshing access token");
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
      await saveTokens(sessionId, { ...tokens, ...credentials });
      log("getAuthenticatedClient: refresh success");
    } catch (error) {
      log("getAuthenticatedClient: refresh failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      if (isExpired) {
        return null;
      }
    }
  }

  if (
    !oauth2Client.credentials.access_token ||
    (oauth2Client.credentials.expiry_date != null &&
      oauth2Client.credentials.expiry_date <= Date.now() + 60_000)
  ) {
    return null;
  }

  return oauth2Client;
}

/** Fresh OAuth access token for Google Calendar + Meet APIs */
export async function getGoogleAccessToken(
  sessionId: string,
): Promise<string | null> {
  const client = await getAuthenticatedClient(sessionId);
  if (!client) return null;
  const token = client.credentials.access_token;
  return typeof token === "string" && token.length > 0 ? token : null;
}

export async function exchangeCodeForTokens(
  sessionId: string,
  code: string,
  origin?: string,
): Promise<void> {
  const redirectUri = getCalendarOAuthRedirectUri(origin);
  console.info("[google-calendar] exchangeCodeForTokens redirect_uri:", redirectUri);

  const oauth2Client = createOAuth2Client(origin);
  const { tokens } = await oauth2Client.getToken(code);
  await saveTokens(sessionId, tokens);
  oauth2Client.setCredentials(tokens);

  const email = await resolveGoogleAccountEmail(oauth2Client);
  if (email) {
    await saveCalendarAccountEmail(sessionId, email);
  }
}

function extractMeetLink(event: calendar_v3.Schema$Event): string | undefined {
  if (event.hangoutLink) return event.hangoutLink;

  const videoEntry = event.conferenceData?.entryPoints?.find(
    (entry) => entry.entryPointType === "video",
  );
  return videoEntry?.uri ?? undefined;
}

function parseEvent(event: calendar_v3.Schema$Event): CalendarEventItem | null {
  if (!event.id || !event.summary) return null;

  const startRaw = event.start?.dateTime ?? event.start?.date;
  const endRaw = event.end?.dateTime ?? event.end?.date;
  if (!startRaw || !endRaw) return null;

  return {
    id: event.id,
    title: event.summary,
    start: startRaw,
    end: endRaw,
    location: event.location ?? undefined,
    description: event.description ?? undefined,
    meetLink: extractMeetLink(event),
    attendees:
      event.attendees
        ?.map((attendee) => attendee.email?.toLowerCase())
        .filter((email): email is string => !!email) ?? undefined,
    isAllDay: !event.start?.dateTime,
  };
}

export function startOfToday(): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((p) => p.type === "year")?.value ?? "1970";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";

  return new Date(`${year}-${month}-${day}T00:00:00+05:30`);
}

export function endOfToday(): Date {
  const start = startOfToday();
  return new Date(start.getTime() + 24 * 60 * 60 * 1000);
}

export function normalizeDateTime(value: string): string {
  const trimmed = value.trim();
  if (/([+-]\d{2}:\d{2}|Z)$/.test(trimmed)) return trimmed;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(trimmed)) {
    return `${trimmed}+05:30`;
  }
  return trimmed;
}

export async function fetchCalendarEvents(
  sessionId: string,
): Promise<{
  today: CalendarEventItem[];
  upcoming: CalendarEventItem[];
}> {
  log("fetchCalendarEvents: start", { sessionId });
  const auth = await getAuthenticatedClient(sessionId);
  if (!auth) {
    log("fetchCalendarEvents: no auth client");
    return { today: [], upcoming: [] };
  }

  const calendar = google.calendar({ version: "v3", auth });
  const todayStart = startOfToday();
  const todayEnd = endOfToday();
  const upcomingEnd = new Date(todayEnd);
  upcomingEnd.setDate(upcomingEnd.getDate() + 7);

  log("fetchCalendarEvents: listing", {
    timeMin: todayStart.toISOString(),
    timeMax: upcomingEnd.toISOString(),
  });

  const { data } = await calendar.events.list({
    calendarId: "primary",
    timeMin: todayStart.toISOString(),
    timeMax: upcomingEnd.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 50,
  });

  const events = (data.items ?? [])
    .map(parseEvent)
    .filter((e): e is CalendarEventItem => e !== null);

  const { today, upcoming } = classifyCalendarEvents(events);

  log("fetchCalendarEvents: success", {
    total: events.length,
    today: today.length,
    upcoming: upcoming.length,
  });

  return { today, upcoming };
}

export async function createCalendarEvent(
  sessionId: string,
  input: {
    title: string;
    start: string;
    end: string;
    description?: string;
    location?: string;
    attendees?: string[];
  },
): Promise<CalendarEventItem> {
  const start = normalizeDateTime(input.start);
  const end = normalizeDateTime(input.end);
  const attendees = mergeAttendeeEmails(input.attendees);

  log("createCalendarEvent: start", {
    title: input.title,
    start,
    end,
    attendeeCount: attendees.length,
  });

  const auth = await getAuthenticatedClient(sessionId);
  if (!auth) {
    throw new Error("Calendar not connected or auth failed.");
  }

  const calendar = google.calendar({ version: "v3", auth });

  try {
    const { data } = await calendar.events.insert({
      calendarId: "primary",
      conferenceDataVersion: 1,
      sendUpdates: attendees.length > 0 ? "all" : "none",
      requestBody: {
        summary: input.title,
        description: input.description,
        location: input.location,
        start: { dateTime: start, timeZone: IST_TIMEZONE },
        end: { dateTime: end, timeZone: IST_TIMEZONE },
        ...(attendees.length > 0
          ? { attendees: attendees.map((email) => ({ email })) }
          : {}),
        conferenceData: {
          createRequest: {
            requestId: randomUUID(),
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      },
    });

    const parsed = parseEvent(data);
    if (!parsed) {
      throw new Error("Failed to parse created event.");
    }

    log("createCalendarEvent: success", {
      id: parsed.id,
      title: parsed.title,
      meetLink: parsed.meetLink ?? null,
      attendees: parsed.attendees ?? [],
    });

    return parsed;
  } catch (error) {
    const googleError =
      error && typeof error === "object" && "response" in error
        ? (error as { response?: { data?: unknown } }).response?.data
        : undefined;

    log("createCalendarEvent: failed", {
      error: error instanceof Error ? error.message : String(error),
      googleError,
    });
    throw error instanceof Error ? error : new Error("Failed to create event.");
  }
}

export async function updateCalendarEvent(
  sessionId: string,
  eventId: string,
  input: {
    title: string;
    start: string;
    end: string;
    description?: string;
    location?: string;
    attendees?: string[];
  },
): Promise<CalendarEventItem> {
  const start = normalizeDateTime(input.start);
  const end = normalizeDateTime(input.end);
  const attendees = mergeAttendeeEmails(input.attendees);

  log("updateCalendarEvent: start", {
    eventId,
    title: input.title,
    start,
    end,
    attendeeCount: attendees.length,
  });

  const auth = await getAuthenticatedClient(sessionId);
  if (!auth) {
    throw new Error("Calendar not connected or auth failed.");
  }

  const calendar = google.calendar({ version: "v3", auth });

  try {
    const { data } = await calendar.events.patch({
      calendarId: "primary",
      eventId,
      sendUpdates: attendees.length > 0 ? "all" : "none",
      requestBody: {
        summary: input.title,
        description: input.description,
        location: input.location,
        start: { dateTime: start, timeZone: IST_TIMEZONE },
        end: { dateTime: end, timeZone: IST_TIMEZONE },
        attendees: attendees.map((email) => ({ email })),
      },
    });

    const parsed = parseEvent(data);
    if (!parsed) {
      throw new Error("Failed to parse updated event.");
    }

    log("updateCalendarEvent: success", { id: parsed.id, title: parsed.title });
    return parsed;
  } catch (error) {
    const googleError =
      error && typeof error === "object" && "response" in error
        ? (error as { response?: { data?: unknown } }).response?.data
        : undefined;

    log("updateCalendarEvent: failed", {
      eventId,
      error: error instanceof Error ? error.message : String(error),
      googleError,
    });
    throw error instanceof Error ? error : new Error("Failed to update event.");
  }
}

export async function deleteCalendarEvent(
  sessionId: string,
  eventId: string,
): Promise<void> {
  log("deleteCalendarEvent: start", { eventId, sessionId });

  const auth = await getAuthenticatedClient(sessionId);
  if (!auth) {
    throw new Error("Calendar not connected or auth failed.");
  }

  const calendar = google.calendar({ version: "v3", auth });

  try {
    await calendar.events.delete({
      calendarId: "primary",
      eventId,
      sendUpdates: "all",
    });
    log("deleteCalendarEvent: success", { eventId });
  } catch (error) {
    const googleError =
      error && typeof error === "object" && "response" in error
        ? (error as { response?: { data?: unknown } }).response?.data
        : undefined;

    log("deleteCalendarEvent: failed", {
      eventId,
      error: error instanceof Error ? error.message : String(error),
      googleError,
    });
    throw error instanceof Error ? error : new Error("Failed to delete event.");
  }
}

export async function getTodayEventsContext(
  sessionId: string,
): Promise<string | null> {
  if (!(await isCalendarConnected(sessionId))) return null;

  try {
    const { today, upcoming } = await fetchCalendarEvents(sessionId);

    if (today.length === 0 && upcoming.length === 0) {
      return "Ganesh has no calendar events today or in the next 7 days.";
    }

    const formatEvent = (e: CalendarEventItem) => {
      const time = e.isAllDay
        ? "All day"
        : new Date(e.start).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          });
      const loc = e.location ? ` @ ${e.location}` : "";
      return `- ${time}: ${e.title}${loc}`;
    };

    const lines: string[] = [];

    if (today.length > 0) {
      lines.push("Today's calendar:");
      lines.push(...today.map(formatEvent));
    } else {
      lines.push("No events on the calendar today.");
    }

    if (upcoming.length > 0) {
      lines.push("\nUpcoming (next 7 days):");
      lines.push(
        ...upcoming.slice(0, 10).map((e) => {
          const date = new Date(e.start).toLocaleDateString("en-IN", {
            weekday: "short",
            month: "short",
            day: "numeric",
          });
          const time = e.isAllDay
            ? "All day"
            : new Date(e.start).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              });
          return `- ${date} ${time}: ${e.title}`;
        }),
      );
    }

    return lines.join("\n");
  } catch (error) {
    console.error("Failed to fetch calendar context:", error);
    return null;
  }
}

export function formatEventTime(event: CalendarEventItem): string {
  if (event.isAllDay) return "All day";
  return new Date(event.start).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function eventsOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** Find events conflicting with the given time slot (±30 min buffer). */
export async function findConflictingEvents(
  sessionId: string,
  startIso: string,
  endIso: string,
): Promise<CalendarEventItem[]> {
  const start = new Date(normalizeDateTime(startIso));
  const end = new Date(normalizeDateTime(endIso));
  const windowStart = new Date(start.getTime() - 30 * 60 * 1000);
  const windowEnd = new Date(end.getTime() + 30 * 60 * 1000);

  const auth = await getAuthenticatedClient(sessionId);
  if (!auth) return [];

  const calendar = google.calendar({ version: "v3", auth });

  try {
    const { data } = await calendar.events.list({
      calendarId: "primary",
      timeMin: windowStart.toISOString(),
      timeMax: windowEnd.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = (data.items ?? [])
      .map(parseEvent)
      .filter((e): e is CalendarEventItem => e !== null);

    return events.filter((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      return eventsOverlap(start, end, eventStart, eventEnd);
    });
  } catch (error) {
    log("findConflictingEvents: failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

export type DailyBriefing = {
  date: string;
  eventCount: number;
  firstEvent: CalendarEventItem | null;
  events: CalendarEventItem[];
  conflicts: Array<{ eventA: string; eventB: string; time: string }>;
  summary: string;
};

export async function getDailyBriefing(
  sessionId: string,
): Promise<DailyBriefing | null> {
  if (!(await isCalendarConnected(sessionId))) return null;

  try {
    const { today } = await fetchCalendarEvents(sessionId);
    const date = new Date().toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: IST_TIMEZONE,
    });

    const conflicts: DailyBriefing["conflicts"] = [];
    for (let i = 0; i < today.length; i++) {
      for (let j = i + 1; j < today.length; j++) {
        const a = today[i];
        const b = today[j];
        if (
          eventsOverlap(
            new Date(a.start),
            new Date(a.end),
            new Date(b.start),
            new Date(b.end),
          )
        ) {
          conflicts.push({
            eventA: a.title,
            eventB: b.title,
            time: formatEventTime(a),
          });
        }
      }
    }

    const firstEvent = today[0] ?? null;
    let summary = `Aaj ${today.length} meeting${today.length === 1 ? "" : "s"} hai.`;

    if (firstEvent) {
      summary += ` Pehli: ${firstEvent.title} at ${formatEventTime(firstEvent)}.`;
    } else {
      summary = "Aaj calendar khali hai — koi meeting nahi.";
    }

    if (conflicts.length > 0) {
      summary += ` ${conflicts.length} conflict${conflicts.length === 1 ? "" : "s"} detected.`;
    }

    return {
      date,
      eventCount: today.length,
      firstEvent,
      events: today,
      conflicts,
      summary,
    };
  } catch (error) {
    log("getDailyBriefing: failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
