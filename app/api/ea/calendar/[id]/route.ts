import { NextRequest, NextResponse } from "next/server";
import { resolveEaSessionId } from "@/lib/ea-api-auth";
import {
  deleteCalendarEvent,
  isCalendarConnected,
  normalizeDateTime,
  updateCalendarEvent,
} from "@/lib/google-calendar";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const sessionId = await resolveEaSessionId(request);
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await context.params;

    if (!(await isCalendarConnected(sessionId))) {
      return NextResponse.json(
        { error: "Google Calendar not connected." },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { title, start, end, description, location, attendees } = body;

    if (!title?.trim() || !start || !end) {
      return NextResponse.json(
        { error: "Title, start, and end are required." },
        { status: 400 },
      );
    }

    const event = await updateCalendarEvent(sessionId, id, {
      title: title.trim(),
      start: normalizeDateTime(start),
      end: normalizeDateTime(end),
      description: description?.trim(),
      location: location?.trim(),
      attendees: Array.isArray(attendees) ? attendees : undefined,
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error("[ea/calendar PATCH] error:", error);
    return NextResponse.json(
      { error: "Failed to update calendar event." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const sessionId = await resolveEaSessionId(request);
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await context.params;

    if (!(await isCalendarConnected(sessionId))) {
      return NextResponse.json(
        { error: "Google Calendar not connected." },
        { status: 400 },
      );
    }

    await deleteCalendarEvent(sessionId, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ea/calendar DELETE] error:", error);
    return NextResponse.json(
      { error: "Failed to delete calendar event." },
      { status: 500 },
    );
  }
}
