import { NextRequest, NextResponse } from "next/server";
import { requireBrainOwner } from "@/lib/brain-owner-auth";
import {
  getSessionEvents,
  isValidMoodboardSessionId,
} from "@/lib/moodboard/analytics";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ "session-id": string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const denied = requireBrainOwner(request);
  if (denied) return denied;

  try {
    const { "session-id": sessionId } = await params;
    if (!isValidMoodboardSessionId(sessionId)) {
      return NextResponse.json({ error: "Invalid session id." }, { status: 400 });
    }

    const events = await getSessionEvents(sessionId);
    return NextResponse.json({ events, count: events.length });
  } catch (error) {
    console.error("[moodboard/events/session-id] GET error:", error);
    return NextResponse.json({ error: "Failed to load events." }, { status: 500 });
  }
}
