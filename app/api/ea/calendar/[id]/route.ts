import { NextRequest, NextResponse } from "next/server";
import {
  deleteCalendarEvent,
  isCalendarConnected,
  normalizeDateTime,
  updateCalendarEvent,
} from "@/lib/google-calendar";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    console.log("[ea/calendar PATCH]", id);

    if (!(await isCalendarConnected())) {
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

    const event = await updateCalendarEvent(id, {
      title: title.trim(),
      start: normalizeDateTime(start),
      end: normalizeDateTime(end),
      description: description?.trim(),
      location: location?.trim(),
      attendees: Array.isArray(attendees) ? attendees : undefined,
    });

    console.log("[ea/calendar PATCH] updated:", event.id);
    return NextResponse.json({ event });
  } catch (error) {
    console.error("[ea/calendar PATCH] error:", error);
    return NextResponse.json(
      { error: "Failed to update calendar event." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    console.log("[ea/calendar DELETE]", id);

    if (!(await isCalendarConnected())) {
      return NextResponse.json(
        { error: "Google Calendar not connected." },
        { status: 400 },
      );
    }

    await deleteCalendarEvent(id);
    console.log("[ea/calendar DELETE] success:", id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ea/calendar DELETE] error:", error);
    return NextResponse.json(
      { error: "Failed to delete calendar event." },
      { status: 500 },
    );
  }
}
