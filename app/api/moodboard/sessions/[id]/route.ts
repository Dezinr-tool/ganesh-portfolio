import { NextRequest, NextResponse } from "next/server";
import { requireSessionsAdmin } from "@/lib/moodboard/sessions-admin-auth";
import {
  getSessionAnalytics,
  isValidMoodboardSessionId,
} from "@/lib/moodboard/analytics";
import { deleteMoodboardSession } from "@/lib/moodboard/delete-session";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const denied = await requireSessionsAdmin(request);
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

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const denied = await requireSessionsAdmin(request);
  if (denied) return denied;

  try {
    const { id } = await params;
    if (!isValidMoodboardSessionId(id)) {
      return NextResponse.json({ error: "Invalid session id." }, { status: 400 });
    }

    const deleted = await deleteMoodboardSession(id);
    if (!deleted) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[moodboard/sessions/id] DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete session." }, { status: 500 });
  }
}
