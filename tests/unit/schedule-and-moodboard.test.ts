import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  classifyCalendarEvents,
  dbMeetingMatchesCalendarEvent,
  dedupeDbMeetings,
  mergeCalendarWithDbMeetings,
} from "@/lib/ea-meeting-schedule";
import { normalizeDateTime, type CalendarEventItem } from "@/lib/google-calendar";
import type { EAMeeting } from "@/lib/meetings-store";
import {
  extractJsonObject,
  looksLikeMarkdownDirections,
  normalizeCardDirection,
  parseDirectionsFromPayload,
  tryParseDirectionsFromText,
} from "@/lib/moodboard/direction-json";

// 26 Oct 2026, 14:00 IST
const NOW = new Date("2026-10-26T08:30:00Z");

const ev = (id: string, start: string, end: string, over: Partial<CalendarEventItem> = {}): CalendarEventItem => ({
  id,
  title: id,
  start,
  end,
  isAllDay: false,
  ...over,
});

const meeting = (over: Partial<EAMeeting>): EAMeeting =>
  ({ id: "m1", title: "Sync", meetingUrl: null, scheduledAt: null, ...over }) as EAMeeting;

describe("calendar classification (IST)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  it("splits today's remaining events from upcoming ones, sorted", () => {
    const events = [
      ev("later-today", "2026-10-26T17:00:00+05:30", "2026-10-26T18:00:00+05:30"),
      ev("ended", "2026-10-26T09:00:00+05:30", "2026-10-26T10:00:00+05:30"),
      ev("in-progress", "2026-10-26T13:30:00+05:30", "2026-10-26T14:30:00+05:30"),
      ev("tomorrow", "2026-10-27T10:00:00+05:30", "2026-10-27T11:00:00+05:30"),
      ev("yesterday", "2026-10-25T10:00:00+05:30", "2026-10-25T11:00:00+05:30"),
    ];
    const { today, upcoming } = classifyCalendarEvents(events, NOW);
    expect(today.map((e) => e.id)).toEqual(["in-progress", "later-today"]);
    expect(upcoming.map((e) => e.id)).toEqual(["tomorrow"]);
  });

  it("treats an event at 00:30 IST as today even though it is the previous UTC day", () => {
    vi.setSystemTime(new Date("2026-10-25T18:45:00Z")); // 00:15 IST on the 26th
    const e = ev("early", "2026-10-26T00:30:00+05:30", "2026-10-26T01:00:00+05:30");
    expect(classifyCalendarEvents([e], new Date()).today.map((x) => x.id)).toEqual(["early"]);
  });

  it("keeps all-day events for today and drops duplicate ids", () => {
    const allDay = ev("holiday", "2026-10-26", "2026-10-27", { isAllDay: true });
    const { today } = classifyCalendarEvents([allDay, allDay], NOW);
    expect(today).toHaveLength(1);
  });

  it("matches DB meetings to calendar events by link or by title within a minute", () => {
    const cal = ev("c", "2026-10-26T17:00:00+05:30", "2026-10-26T18:00:00+05:30", {
      title: "Design Review",
      meetLink: "https://meet.google.com/abc/",
    });
    expect(
      dbMeetingMatchesCalendarEvent(
        meeting({ meetingUrl: "HTTPS://meet.google.com/abc", scheduledAt: "2026-10-26T11:30:30Z" }),
        cal,
      ),
    ).toBe(true);
    expect(
      dbMeetingMatchesCalendarEvent(meeting({ title: " design review ", scheduledAt: "2026-10-26T11:30:00Z" }), cal),
    ).toBe(true);
    expect(
      dbMeetingMatchesCalendarEvent(meeting({ title: "Design Review", scheduledAt: "2026-10-26T11:35:00Z" }), cal),
    ).toBe(false);
  });

  it("adds DB-only meetings to today without duplicating calendar ones", () => {
    const cal = ev("c", "2026-10-26T17:00:00+05:30", "2026-10-26T18:00:00+05:30", { title: "Design Review" });
    const merged = mergeCalendarWithDbMeetings({ today: [cal], upcoming: [] }, [
      meeting({ id: "dup", title: "Design Review", scheduledAt: "2026-10-26T11:30:00Z" }),
      meeting({ id: "extra", title: "Quick call", scheduledAt: "2026-10-26T10:00:00Z" }),
      meeting({ id: "past", title: "Old", scheduledAt: "2026-10-26T04:00:00Z" }),
      meeting({ id: "no-time", title: "Floating" }),
    ], NOW);
    expect(merged.today.map((e) => e.id)).toEqual(["db:extra", "c"]);
    expect(merged.today[0].end).toBe("2026-10-26T10:30:00.000Z");
  });

  it("dedupes DB meetings on url + time + title", () => {
    const a = meeting({ id: "a", meetingUrl: "https://x", scheduledAt: "t", title: "A" });
    const b = meeting({ id: "b", meetingUrl: "HTTPS://X", scheduledAt: "t", title: "a" });
    expect(dedupeDbMeetings([a, b]).map((m) => m.id)).toEqual(["a"]);
  });

  it("assumes IST for calendar times without an offset", () => {
    expect(normalizeDateTime("2026-10-26T10:00")).toBe("2026-10-26T10:00+05:30");
    expect(normalizeDateTime("2026-10-26T10:00:00Z")).toBe("2026-10-26T10:00:00Z");
    expect(normalizeDateTime("2026-10-26")).toBe("2026-10-26");
  });
});

describe("moodboard direction JSON", () => {
  it("extracts JSON from a fenced model reply", () => {
    expect(extractJsonObject('Here you go:\n```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(extractJsonObject("no json")).toBeNull();
    expect(extractJsonObject("{broken")).toBeNull();
  });

  it("normalises a direction with snake_case keys and short hex codes", () => {
    const dir = normalizeCardDirection(
      {
        direction_name: "Quiet Luxury",
        tagline: "Less, better",
        concept: "Calm",
        mood_keywords: ["calm", 1],
        colors: [{ hex: "#abc", name: "Mist", role: "Surface" }, { hex: "112233" }],
        typography: { heading: { font: "Playfair" }, body: "Inter", style: "Editorial" },
        do: ["whitespace"],
        avoid: ["neon"],
      },
      0,
    );
    expect(dir.directionName).toBe("Quiet Luxury");
    expect(dir.directionIndex).toBe(1);
    expect(dir.moodKeywords).toEqual(["calm", "1"]);
    expect(dir.colorPalette).toHaveLength(5);
    expect(dir.colorPalette?.[0]).toEqual({ hex: "#aabbcc", name: "Mist", role: "Background" });
    expect(dir.colorPalette?.[1]).toMatchObject({ hex: "#112233", role: "Secondary" });
    expect(dir.typography?.heading.font).toBe("Playfair");
    expect(dir.typography?.body).toMatchObject({ font: "Inter", rationale: "Editorial" });
    expect(dir.dosDonts).toEqual({ dos: ["whitespace"], donts: ["neon"] });
    expect(dir.photography).toBeNull();
  });

  it("parses at most three directions from a payload", () => {
    const four = { directions: [{}, {}, {}, {}] };
    expect(parseDirectionsFromPayload(four)).toHaveLength(3);
    expect(parseDirectionsFromPayload({ direction: { name: "Solo" } })?.[0].directionName).toBe("Solo");
    expect(parseDirectionsFromPayload({ directions: [] })).toBeNull();
    expect(parseDirectionsFromPayload("nope")).toBeNull();
    expect(tryParseDirectionsFromText('{"directions":[{"name":"A"}]}')?.[0].directionName).toBe("A");
  });

  it("detects markdown-formatted directions but not JSON ones", () => {
    expect(looksLikeMarkdownDirections("## Direction 1 — Bold\n...")).toBe(true);
    expect(looksLikeMarkdownDirections("Direction 1 ... Direction 2 ...")).toBe(true);
    expect(looksLikeMarkdownDirections('{"directions":[{"name":"A"}]}')).toBe(false);
    expect(looksLikeMarkdownDirections("Just a chat reply")).toBe(false);
  });
});
