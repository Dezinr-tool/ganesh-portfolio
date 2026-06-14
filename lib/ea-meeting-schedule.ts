import type { CalendarEventItem } from "@/lib/google-calendar";
import { endOfToday, startOfToday } from "@/lib/google-calendar";
import type { EAMeeting } from "@/lib/meetings-store";

const IST_OFFSET = "+05:30";

export function dedupeCalendarEventsById(
  events: CalendarEventItem[],
): CalendarEventItem[] {
  const seen = new Set<string>();
  const deduped: CalendarEventItem[] = [];

  for (const event of events) {
    if (seen.has(event.id)) continue;
    seen.add(event.id);
    deduped.push(event);
  }

  return deduped;
}

function getEventWindow(event: CalendarEventItem): { startMs: number; endMs: number } {
  if (event.isAllDay) {
    const startDay = event.start.slice(0, 10);
    const endDay = event.end.slice(0, 10);
    const start = new Date(`${startDay}T00:00:00${IST_OFFSET}`);
    const end = new Date(`${endDay}T00:00:00${IST_OFFSET}`);
    return { startMs: start.getTime(), endMs: end.getTime() };
  }

  return {
    startMs: new Date(event.start).getTime(),
    endMs: new Date(event.end).getTime(),
  };
}

/** Event overlaps today's calendar day in IST and has not ended yet. */
export function isEventTodayInIST(
  event: CalendarEventItem,
  now: Date = new Date(),
): boolean {
  const todayStartMs = startOfToday().getTime();
  const todayEndMs = endOfToday().getTime();
  const { startMs, endMs } = getEventWindow(event);
  const nowMs = now.getTime();

  const overlapsToday = startMs < todayEndMs && endMs > todayStartMs;
  if (!overlapsToday) return false;

  if (event.isAllDay) {
    return startMs < todayEndMs;
  }

  return endMs > nowMs;
}

/** Event starts after today's window in IST (tomorrow+ within fetch range). */
export function isEventUpcomingAfterToday(event: CalendarEventItem): boolean {
  const todayEndMs = endOfToday().getTime();
  const { startMs } = getEventWindow(event);
  return startMs >= todayEndMs;
}

export function classifyCalendarEvents(
  events: CalendarEventItem[],
  now: Date = new Date(),
): { today: CalendarEventItem[]; upcoming: CalendarEventItem[] } {
  const deduped = dedupeCalendarEventsById(events);
  const today: CalendarEventItem[] = [];
  const upcoming: CalendarEventItem[] = [];

  for (const event of deduped) {
    if (isEventTodayInIST(event, now)) {
      today.push(event);
    } else if (isEventUpcomingAfterToday(event)) {
      upcoming.push(event);
    }
  }

  today.sort((a, b) => getEventWindow(a).startMs - getEventWindow(b).startMs);
  upcoming.sort((a, b) => getEventWindow(a).startMs - getEventWindow(b).startMs);

  return { today, upcoming };
}

function normalizeUrl(url: string): string {
  return url.trim().toLowerCase().replace(/\/+$/, "");
}

function timesNear(a: string | null, b: string, toleranceMs = 60_000): boolean {
  if (!a) return false;
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) <= toleranceMs;
}

export function dbMeetingMatchesCalendarEvent(
  meeting: EAMeeting,
  event: CalendarEventItem,
): boolean {
  if (
    meeting.meetingUrl &&
    event.meetLink &&
    normalizeUrl(meeting.meetingUrl) === normalizeUrl(event.meetLink) &&
    timesNear(meeting.scheduledAt, event.start)
  ) {
    return true;
  }

  if (
    meeting.title &&
    meeting.scheduledAt &&
    meeting.title.trim().toLowerCase() === event.title.trim().toLowerCase() &&
    timesNear(meeting.scheduledAt, event.start)
  ) {
    return true;
  }

  return false;
}

function isDbMeetingTodayAndUpcoming(
  meeting: EAMeeting,
  now: Date = new Date(),
): boolean {
  if (!meeting.scheduledAt) return false;

  const startMs = new Date(meeting.scheduledAt).getTime();
  const todayStartMs = startOfToday().getTime();
  const todayEndMs = endOfToday().getTime();
  const nowMs = now.getTime();

  if (startMs < todayStartMs || startMs >= todayEndMs) return false;

  const estimatedEndMs = startMs + 30 * 60 * 1000;
  return estimatedEndMs > nowMs;
}

function dbMeetingToCalendarEvent(meeting: EAMeeting): CalendarEventItem {
  const start = meeting.scheduledAt ?? new Date().toISOString();
  const startMs = new Date(start).getTime();

  return {
    id: `db:${meeting.id}`,
    title: meeting.title?.trim() || "Untitled meeting",
    start,
    end: new Date(startMs + 30 * 60 * 1000).toISOString(),
    meetLink: meeting.meetingUrl ?? undefined,
    isAllDay: false,
  };
}

export function dedupeDbMeetings(meetings: EAMeeting[]): EAMeeting[] {
  const seen = new Set<string>();
  const deduped: EAMeeting[] = [];

  for (const meeting of meetings) {
    const key = [
      (meeting.meetingUrl ?? "").toLowerCase(),
      meeting.scheduledAt ?? "",
      (meeting.title ?? "").toLowerCase(),
    ].join("|");

    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(meeting);
  }

  return deduped;
}

/** Merge calendar events with local DB meetings — calendar wins on duplicates. */
export function mergeCalendarWithDbMeetings(
  calendar: { today: CalendarEventItem[]; upcoming: CalendarEventItem[] },
  dbMeetings: EAMeeting[],
  now: Date = new Date(),
): { today: CalendarEventItem[]; upcoming: CalendarEventItem[] } {
  const dbDeduped = dedupeDbMeetings(dbMeetings);
  const allCalendar = dedupeCalendarEventsById([
    ...calendar.today,
    ...calendar.upcoming,
  ]);

  const dbTodayExtras = dbDeduped
    .filter((meeting) => isDbMeetingTodayAndUpcoming(meeting, now))
    .filter(
      (meeting) =>
        !allCalendar.some((event) => dbMeetingMatchesCalendarEvent(meeting, event)),
    )
    .map(dbMeetingToCalendarEvent);

  const today = dedupeCalendarEventsById([
    ...calendar.today,
    ...dbTodayExtras,
  ]).sort(
    (a, b) => getEventWindow(a).startMs - getEventWindow(b).startMs,
  );

  return {
    today,
    upcoming: calendar.upcoming,
  };
}
