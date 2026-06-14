import {
  getTodayEventsContext,
  isCalendarConnected,
} from "@/lib/google-calendar";
import { deleteCached, getCached, setCache } from "@/lib/calendarCache";

function connectionKey(sessionId: string): string {
  return `calendar:connected:${sessionId}`;
}

function eventsKey(sessionId: string): string {
  return `calendar:events:${sessionId}`;
}

export async function getCachedCalendarConnected(
  sessionId: string,
): Promise<boolean> {
  const key = connectionKey(sessionId);
  const cached = getCached<boolean>(key);
  if (cached !== null) return cached;

  const value = await isCalendarConnected(sessionId);
  setCache(key, value);
  return value;
}

export async function getCachedCalendarEventsContext(
  sessionId: string,
  forceFresh = false,
): Promise<string | null> {
  const key = eventsKey(sessionId);

  if (!forceFresh) {
    const cached = getCached<string | null>(key);
    if (cached !== null) return cached;
  }

  const connected = await getCachedCalendarConnected(sessionId);
  if (!connected) {
    setCache(key, null);
    return null;
  }

  const value = await getTodayEventsContext(sessionId);
  setCache(key, value);
  return value;
}

export function invalidateCalendarEventsCache(sessionId: string): void {
  deleteCached(eventsKey(sessionId));
}

export function invalidateCalendarConnectionCache(sessionId: string): void {
  deleteCached(connectionKey(sessionId));
}
