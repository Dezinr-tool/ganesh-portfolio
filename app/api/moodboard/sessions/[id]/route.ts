import { NextRequest, NextResponse } from "next/server";
import { requireBrainOwner } from "@/lib/brain-owner-auth";
import {
  getSessionAnalytics,
  isValidMoodboardSessionId,
} from "@/lib/moodboard/analytics";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const denied = requireBrainOwner(request);
  if (denied) return denied;

  try {
    const { id } = await params;
    if (!isValidMoodboardSessionId(id)) {
      return NextResponse.json({ error: "Invalid session id." }, { status: 400 });
    }

    const analytics = await getSessionAnalytics(id);
    if (!analytics) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("[moodboard/sessions/id] GET error:", error);
    return NextResponse.json({ error: "Failed to load session." }, { status: 500 });
  }
}
