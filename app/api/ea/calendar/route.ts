import { NextRequest, NextResponse } from "next/server";
import { resolveEaSessionId } from "@/lib/ea-api-auth";
import { mergeCalendarWithDbMeetings } from "@/lib/ea-meeting-schedule";
import {
  createCalendarEvent,
  fetchCalendarEvents,
  getAuthenticatedClient,
  isCalendarConnected,
  normalizeDateTime,
} from "@/lib/google-calendar";
import { listMeetings } from "@/lib/meetings-store";

export async function GET(request: NextRequest) {
  try {
    const sessionId = await resolveEaSessionId(request);
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const connected = await isCalendarConnected(sessionId);

    if (!connected) {
      return NextResponse.json({ connected: false, today: [], upcoming: [] });
    }

    const auth = await getAuthenticatedClient(sessionId);
    if (!auth) {
      console.error(
        "[ea/calendar GET] tokens exist but auth client unavailable",
        { sessionId },
      );
      return NextResponse.json({
        connected: false,
        today: [],
        upcoming: [],
        error: "Calendar auth failed. Reconnect from dashboard.",
      });
    }

    const calendar = await fetchCalendarEvents(sessionId);
    const dbMeetings = await listMeetings(sessionId);
    const merged = mergeCalendarWithDbMeetings(calendar, dbMeetings);
    return NextResponse.json({
      connected: true,
      today: merged.today,
      upcoming: merged.upcoming,
    });
  } catch (error) {
    console.error("[ea/calendar GET] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar events." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionId = await resolveEaSessionId(request);
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const connected = await isCalendarConnected(sessionId);
    if (!connected) {
      return NextResponse.json(
        { error: "Google Calendar not connected." },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { title, start, end, description, location } = body;

    if (!title?.trim() || !start || !end) {
      return NextResponse.json(
        { error: "Title, start, and end are required." },
        { status: 400 },
      );
    }

    const event = await createCalendarEvent(sessionId, {
      title: title.trim(),
      start: normalizeDateTime(start),
      end: normalizeDateTime(end),
      description: description?.trim(),
      location: location?.trim(),
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("[ea/calendar POST] error:", error);
    return NextResponse.json(
      { error: "Failed to create calendar event." },
      { status: 500 },
    );
  }
}
