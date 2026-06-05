import {
  getTodayEventsContext,
  isCalendarConnected,
} from "@/lib/google-calendar";

const CONNECTION_TTL_MS = 5 * 60 * 1000;
const EVENTS_TTL_MS = 2 * 60 * 1000;

let connectionCache: { value: boolean; expiresAt: number } | null = null;
let eventsCache: { value: string | null; expiresAt: number } | null = null;

export async function getCachedCalendarConnected(): Promise<boolean> {
  const now = Date.now();

  if (connectionCache && connectionCache.expiresAt > now) {
    return connectionCache.value;
  }

  const value = await isCalendarConnected();
  connectionCache = { value, expiresAt: now + CONNECTION_TTL_MS };
  return value;
}

export async function getCachedCalendarEventsContext(
  forceFresh = false,
): Promise<string | null> {
  const now = Date.now();

  if (!forceFresh && eventsCache && eventsCache.expiresAt > now) {
    return eventsCache.value;
  }

  const connected = await getCachedCalendarConnected();
  if (!connected) {
    eventsCache = { value: null, expiresAt: now + EVENTS_TTL_MS };
    return null;
  }

  const value = await getTodayEventsContext();
  eventsCache = { value, expiresAt: now + EVENTS_TTL_MS };
  return value;
}

export function invalidateCalendarEventsCache(): void {
  eventsCache = null;
}

export function invalidateCalendarConnectionCache(): void {
  connectionCache = null;
}
