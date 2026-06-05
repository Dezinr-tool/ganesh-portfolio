import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { google } from "googleapis";
import type { calendar_v3 } from "googleapis";
import { sql } from "@/lib/db";

const TOKEN_PATH = path.join(process.cwd(), ".calendar-tokens.json");
const TOKEN_ROW_ID = "default";
const IST_TIMEZONE = "Asia/Kolkata";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

function log(step: string, data?: Record<string, unknown>) {
  if (data) {
    console.log(`[google-calendar] ${step}`, data);
    return;
  }
  console.log(`[google-calendar] ${step}`);
}

export type CalendarTokens = {
  access_token?: string | null;
  refresh_token?: string | null;
  scope?: string | null;
  token_type?: string | null;
  expiry_date?: number | null;
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

function getRedirectUri(): string {
  const base =
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/api/ea/calendar/callback`;
}

export function createOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials not configured.");
  }

  return new google.auth.OAuth2(clientId, clientSecret, getRedirectUri());
}

export async function loadTokens(): Promise<CalendarTokens | null> {
  try {
    const tokens = await loadTokensFromDb();
    if (tokens) return tokens;

    return await migrateTokensFromFile();
  } catch (error) {
    log("loadTokens: failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

async function loadTokensFromDb(): Promise<CalendarTokens | null> {
  log("loadTokens: reading from database");
  const { rows } = await sql<{
    access_token: string | null;
    refresh_token: string | null;
    expiry_date: string | null;
  }>`
    SELECT access_token, refresh_token, expiry_date
    FROM ea_calendar_tokens
    WHERE id = ${TOKEN_ROW_ID}
    LIMIT 1
  `;

  if (rows.length === 0) {
    log("loadTokens: no tokens in database");
    return null;
  }

  const row = rows[0];
  const tokens: CalendarTokens = {
    access_token: row.access_token,
    refresh_token: row.refresh_token,
    expiry_date: row.expiry_date != null ? Number(row.expiry_date) : null,
  };

  log("loadTokens: success", {
    hasAccessToken: !!tokens.access_token,
    hasRefreshToken: !!tokens.refresh_token,
    expiryDate: tokens.expiry_date
      ? new Date(tokens.expiry_date).toISOString()
      : null,
  });

  return tokens;
}

async function migrateTokensFromFile(): Promise<CalendarTokens | null> {
  try {
    log("loadTokens: checking legacy file", { path: TOKEN_PATH });
    const raw = await fs.readFile(TOKEN_PATH, "utf8");
    const tokens = JSON.parse(raw) as CalendarTokens;

    if (!tokens.refresh_token && !tokens.access_token) {
      return null;
    }

    log("loadTokens: migrating legacy file tokens to database");
    await upsertTokens(tokens);
    return tokens;
  } catch {
    return null;
  }
}

async function upsertTokens(tokens: CalendarTokens): Promise<void> {
  await sql`
    INSERT INTO ea_calendar_tokens (id, access_token, refresh_token, expiry_date, updated_at)
    VALUES (
      ${TOKEN_ROW_ID},
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

export async function saveTokens(tokens: CalendarTokens): Promise<void> {
  const existing = (await loadTokensFromDb()) ?? {};
  const merged: CalendarTokens = {
    ...existing,
    ...tokens,
    refresh_token: tokens.refresh_token ?? existing.refresh_token ?? null,
  };

  await upsertTokens(merged);
  log("saveTokens: wrote tokens to database", {
    hasAccessToken: !!merged.access_token,
    hasRefreshToken: !!merged.refresh_token,
  });
}

function hasGoogleOAuthConfig(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export async function isCalendarConnected(): Promise<boolean> {
  if (!hasGoogleOAuthConfig()) {
    log("isCalendarConnected: false — missing GOOGLE_CLIENT_ID/SECRET");
    return false;
  }

  const tokens = await loadTokens();
  const connected = !!(tokens?.refresh_token || tokens?.access_token);
  log("isCalendarConnected", { connected });
  return connected;
}

export async function getAuthenticatedClient() {
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

  const tokens = await loadTokens();

  if (!tokens) {
    log("getAuthenticatedClient: no tokens in database");
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
    void saveTokens({ ...tokens, ...newTokens });
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
      await saveTokens({ ...tokens, ...credentials });
      log("getAuthenticatedClient: refresh success");
    } catch (error) {
      log("getAuthenticatedClient: refresh failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      if (!tokens.access_token) {
        return null;
      }
    }
  }

  return oauth2Client;
}

export function getAuthUrl(): string {
  const oauth2Client = createOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
}

export async function exchangeCodeForTokens(code: string): Promise<void> {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  await saveTokens(tokens);
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

function startOfToday(): Date {
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

function endOfToday(): Date {
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

export async function fetchCalendarEvents(): Promise<{
  today: CalendarEventItem[];
  upcoming: CalendarEventItem[];
}> {
  log("fetchCalendarEvents: start");
  const auth = await getAuthenticatedClient();
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

  const today: CalendarEventItem[] = [];
  const upcoming: CalendarEventItem[] = [];

  for (const event of events) {
    const eventStart = new Date(event.start);
    if (eventStart < todayEnd) {
      today.push(event);
    } else {
      upcoming.push(event);
    }
  }

  log("fetchCalendarEvents: success", {
    total: events.length,
    today: today.length,
    upcoming: upcoming.length,
  });

  return { today, upcoming };
}

export async function createCalendarEvent(input: {
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  attendees?: string[];
}): Promise<CalendarEventItem> {
  const start = normalizeDateTime(input.start);
  const end = normalizeDateTime(input.end);
  const attendees = mergeAttendeeEmails(input.attendees);

  log("createCalendarEvent: start", {
    title: input.title,
    start,
    end,
    attendeeCount: attendees.length,
  });

  const auth = await getAuthenticatedClient();
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

  const auth = await getAuthenticatedClient();
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

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  log("deleteCalendarEvent: start", { eventId });

  const auth = await getAuthenticatedClient();
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

export async function getTodayEventsContext(): Promise<string | null> {
  if (!(await isCalendarConnected())) return null;

  try {
    const { today, upcoming } = await fetchCalendarEvents();

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
