import { NextRequest, NextResponse } from "next/server";
import { requireBrainOwner } from "@/lib/brain-owner-auth";
import {
  getAllEvents,
  insertMoodboardEvent,
  isValidMoodboardSessionId,
} from "@/lib/moodboard/analytics";
import { getSessionBySessionId } from "@/lib/moodboard/db-store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = requireBrainOwner(request);
  if (denied) return denied;

  try {
    const limit = Number(request.nextUrl.searchParams.get("limit") ?? "500");
    const events = await getAllEvents(limit);
    return NextResponse.json({ events, count: events.length });
  } catch (error) {
    console.error("[moodboard/events] GET error:", error);
    return NextResponse.json({ error: "Failed to load events." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionId = body.sessionId as string;
    const eventType = body.eventType as string;

    if (!sessionId || !eventType) {
      return NextResponse.json(
        { error: "sessionId and eventType required." },
        { status: 400 },
      );
    }
    if (!isValidMoodboardSessionId(sessionId)) {
      return NextResponse.json({ error: "Invalid session id." }, { status: 400 });
    }

    const session = await getSessionBySessionId(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    const payload =
      body.payload && typeof body.payload === "object"
        ? (body.payload as Record<string, unknown>)
        : {};
    const durationMs =
      typeof body.durationMs === "number" ? Math.round(body.durationMs) : undefined;
    const questionKey =
      typeof body.questionKey === "string" ? body.questionKey : undefined;

    await insertMoodboardEvent({
      sessionId,
      eventType,
      questionKey: questionKey ?? (typeof payload.questionKey === "string" ? payload.questionKey : undefined),
      payload,
      durationMs,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[moodboard/events] POST error:", error);
    return NextResponse.json({ error: "Failed to record event." }, { status: 500 });
  }
}
