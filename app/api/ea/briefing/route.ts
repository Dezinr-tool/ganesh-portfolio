import { NextRequest, NextResponse } from "next/server";
import { resolveEaSessionId } from "@/lib/ea-api-auth";
import { getDailyBriefing } from "@/lib/google-calendar";
import { getCachedCalendarConnected } from "@/lib/ea-calendar-cache";

export async function GET(request: NextRequest) {
  try {
    const sessionId = await resolveEaSessionId(request);
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const connected = await getCachedCalendarConnected(sessionId);
    if (!connected) {
      return NextResponse.json({
        connected: false,
        summary: "Google Calendar is not connected. Connect from the dashboard.",
        eventCount: 0,
        events: [],
        conflicts: [],
      });
    }

    const briefing = await getDailyBriefing(sessionId);
    if (!briefing) {
      return NextResponse.json({
        connected: true,
        summary: "Could not fetch today's calendar.",
        eventCount: 0,
        events: [],
        conflicts: [],
      });
    }

    return NextResponse.json({
      connected: true,
      date: briefing.date,
      summary: briefing.summary,
      eventCount: briefing.eventCount,
      firstEvent: briefing.firstEvent
        ? {
            title: briefing.firstEvent.title,
            start: briefing.firstEvent.start,
            end: briefing.firstEvent.end,
            meetLink: briefing.firstEvent.meetLink,
          }
        : null,
      events: briefing.events.map((e) => ({
        title: e.title,
        start: e.start,
        end: e.end,
        meetLink: e.meetLink,
      })),
      conflicts: briefing.conflicts,
    });
  } catch (error) {
    console.error("[ea/briefing] error:", error);
    return NextResponse.json(
      { error: "Failed to generate briefing." },
      { status: 500 },
    );
  }
}
