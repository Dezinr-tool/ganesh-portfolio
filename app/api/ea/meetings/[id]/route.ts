import { NextRequest, NextResponse } from "next/server";
import { requireEaSession } from "@/lib/ea-api-auth";
import {
  getMeetingById,
  listActionItemsForMeeting,
  updateMeeting,
} from "@/lib/meetings-store";
import type { MeetingPlatform, MeetingStatus } from "@/lib/meetings-store";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireEaSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await context.params;
    const meeting = await getMeetingById(id, auth.sessionId);

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found." }, { status: 404 });
    }

    const actionItems = await listActionItemsForMeeting(id, auth.sessionId);
    return NextResponse.json({ meeting, actionItems });
  } catch (error) {
    console.error("[ea/meetings/[id] GET] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch meeting." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireEaSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await context.params;
    const body = await request.json();

    const meeting = await updateMeeting(id, auth.sessionId, {
      status: body.status as MeetingStatus | undefined,
      rawTranscript: body.rawTranscript,
      processedSummary: body.processedSummary,
      actionItems: body.actionItems,
      attendees: body.attendees,
      title: body.title,
      meetingUrl: body.meetingUrl,
      meetingPlatform: body.meetingPlatform as MeetingPlatform | undefined,
      scheduledAt: body.scheduledAt,
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found." }, { status: 404 });
    }

    return NextResponse.json({ meeting });
  } catch (error) {
    console.error("[ea/meetings/[id] PATCH] error:", error);
    return NextResponse.json(
      { error: "Failed to update meeting." },
      { status: 500 },
    );
  }
}
