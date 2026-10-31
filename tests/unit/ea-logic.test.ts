import { afterEach, describe, expect, it, vi } from "vitest";
import {
  classifyActionItem,
  classifyActionItems,
  parseActionItemEntry,
  priorityFromDueDate,
} from "@/lib/action-item-classifier";
import { detectMeetingLinks, platformLabel } from "@/lib/meeting-detector";
import { createSseStream, readSseStream, sseResponse } from "@/lib/ai-sse";
import type { CalendarEventItem } from "@/lib/google-calendar";

afterEach(() => vi.useRealTimers());

describe("action items", () => {
  it("parses 'Owner: task' strings and plain strings", () => {
    expect(parseActionItemEntry("Ganesh: send the deck")).toEqual({ title: "send the deck", assignee: "Ganesh" });
    expect(parseActionItemEntry("  ship v2  ")).toEqual({ title: "ship v2" });
    expect(parseActionItemEntry("   ")).toBeNull();
  });

  it("parses object entries and drops blanks", () => {
    expect(parseActionItemEntry({ title: " Review ", assignee: " ", dueDate: "2026-11-01" })).toEqual({
      title: "Review",
      assignee: null,
      dueDate: "2026-11-01",
    });
    expect(parseActionItemEntry({ title: "" })).toBeNull();
    expect(parseActionItemEntry(42)).toBeNull();
    expect(parseActionItemEntry(null)).toBeNull();
  });

  it("classifies by who owns the task", () => {
    expect(classifyActionItem({ title: "t" }, "Ganesh").taskType).toBe("team_task");
    expect(classifyActionItem({ title: "t", assignee: "ganesh das" }, "Ganesh")).toMatchObject({
      taskType: "my_task",
      assignedTo: "Ganesh",
    });
    expect(classifyActionItem({ title: "t", assignee: "Priya" }, "Ganesh")).toMatchObject({
      taskType: "assigned_task",
      assignedTo: "Priya",
    });
  });

  it("dedupes repeated items case-insensitively", () => {
    const items = classifyActionItems(["Priya: Send deck", "Priya: send deck", "", { title: "Other" }], "Ganesh");
    expect(items.map((i) => i.title)).toEqual(["Send deck", "Other"]);
  });

  it("derives priority from the due date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-26T00:00:00Z"));
    expect(priorityFromDueDate(null)).toBe("Normal");
    expect(priorityFromDueDate("not a date")).toBe("Normal");
    expect(priorityFromDueDate("2026-10-26T12:00:00Z")).toBe("High");
    expect(priorityFromDueDate("2026-10-20")).toBe("High");
    expect(priorityFromDueDate("2026-10-30")).toBe("Medium");
    expect(priorityFromDueDate("2026-12-01")).toBe("Normal");
  });
});

describe("meeting link detection", () => {
  const event = (over: Partial<CalendarEventItem>): CalendarEventItem =>
    ({ id: "e1", title: "Sync", start: "2026-10-27T10:00:00Z", ...over }) as CalendarEventItem;

  it("detects the Google Meet link Calendar puts in meetLink", () => {
    const [found] = detectMeetingLinks([event({ meetLink: "https://meet.google.com/abc-defg-hij" })]);
    expect(found).toEqual({
      meetingUrl: "https://meet.google.com/abc-defg-hij",
      platform: "google_meet",
      title: "Sync",
      scheduledAt: "2026-10-27T10:00:00Z",
      eventId: "e1",
    });
  });

  it("detects bare zoom.us and Teams links in the description", () => {
    const found = detectMeetingLinks([
      event({ description: "Join: https://zoom.us/j/123456 or https://teams.microsoft.com/l/meetup-join/xyz." }),
    ]);
    expect(found.map((m) => [m.platform, m.meetingUrl])).toEqual([
      ["zoom", "https://zoom.us/j/123456"],
      ["teams", "https://teams.microsoft.com/l/meetup-join/xyz"],
    ]);
  });

  it("detects vanity Zoom subdomains and strips trailing punctuation", () => {
    const [found] = detectMeetingLinks([event({ location: "(https://acme.zoom.us/j/999)," })]);
    expect(found.meetingUrl).toBe("https://acme.zoom.us/j/999");
  });

  it("does not report the same link twice for one event", () => {
    const link = "https://meet.google.com/abc-defg-hij";
    expect(detectMeetingLinks([event({ meetLink: link, description: `Link: ${link}` })])).toHaveLength(1);
  });

  it("ignores lookalike domains and events without links", () => {
    expect(detectMeetingLinks([event({ description: "https://example.com/zoom" })])).toEqual([]);
    expect(detectMeetingLinks([event({})])).toEqual([]);
  });

  it("labels platforms", () => {
    expect(platformLabel("teams")).toBe("Microsoft Teams");
    expect(platformLabel("google_meet")).toBe("Google Meet");
  });
});

describe("SSE streaming", () => {
  it("round-trips events and returns the completed result", async () => {
    const stream = createSseStream(async (send) => {
      send({ type: "status", message: "working" });
      send({ type: "delta", text: "hi" });
      send({ type: "complete", result: { ok: 1 } });
    });
    const res = sseResponse(stream);
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    const seen: string[] = [];
    await expect(readSseStream(res, (e) => seen.push(e.type))).resolves.toEqual({ ok: 1 });
    expect(seen).toEqual(["status", "delta", "complete"]);
  });

  it("turns a handler exception into an error event the reader throws", async () => {
    const res = sseResponse(createSseStream(async () => {
      throw new Error("model overloaded");
    }));
    await expect(readSseStream(res, () => {})).rejects.toThrow("model overloaded");
  });

  it("handles events split across network chunks", async () => {
    const enc = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(enc.encode('data: {"type":"comp'));
        c.enqueue(enc.encode('lete","result":7}\n\ndata: not-json\n\n'));
        c.close();
      },
    });
    await expect(readSseStream(new Response(body), () => {})).resolves.toBe(7);
  });

  it("surfaces the JSON error of a failed response", async () => {
    const res = new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    await expect(readSseStream(res, () => {})).rejects.toThrow("Unauthorized");
    await expect(readSseStream(new Response("oops", { status: 500 }), () => {})).rejects.toThrow(
      "Request failed (500)",
    );
  });
});

describe("meeting link detection — lookalikes", () => {
  it("ignores a platform domain that only appears in another site's URL", () => {
    const found = detectMeetingLinks([
      { id: "e", title: "t", start: "s", description: "https://evil.test/?next=zoom.us/j/1" } as CalendarEventItem,
    ]);
    expect(found).toEqual([]);
  });
});
