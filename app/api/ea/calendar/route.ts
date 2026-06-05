import { NextResponse } from "next/server";
import {
  createCalendarEvent,
  fetchCalendarEvents,
  getAuthenticatedClient,
  isCalendarConnected,
  normalizeDateTime,
} from "@/lib/google-calendar";

export async function GET() {
  try {
    console.log("[ea/calendar GET] start");
    const connected = await isCalendarConnected();
    console.log("[ea/calendar GET] isCalendarConnected:", connected);

    if (!connected) {
      return NextResponse.json({ connected: false, today: [], upcoming: [] });
    }

    const auth = await getAuthenticatedClient();
    if (!auth) {
      console.error(
        "[ea/calendar GET] tokens exist but auth client unavailable",
      );
      return NextResponse.json({
        connected: false,
        today: [],
        upcoming: [],
        error: "Calendar auth failed. Reconnect from dashboard.",
      });
    }

    const { today, upcoming } = await fetchCalendarEvents();
    console.log("[ea/calendar GET] events:", {
      today: today.length,
      upcoming: upcoming.length,
    });

    return NextResponse.json({ connected: true, today, upcoming });
  } catch (error) {
    console.error("[ea/calendar GET] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar events." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log("[ea/calendar POST] start");
    const connected = await isCalendarConnected();
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

    const event = await createCalendarEvent({
      title: title.trim(),
      start: normalizeDateTime(start),
      end: normalizeDateTime(end),
      description: description?.trim(),
      location: location?.trim(),
    });

    console.log("[ea/calendar POST] created:", event.id);
    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("[ea/calendar POST] error:", error);
    return NextResponse.json(
      { error: "Failed to create calendar event." },
      { status: 500 },
    );
  }
}
