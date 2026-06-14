import { NextRequest, NextResponse } from "next/server";
import { requireEaSession } from "@/lib/ea-api-auth";
import { processMeetingFull } from "@/lib/meeting-pipeline";
import { getMeetingById, updateMeeting } from "@/lib/meetings-store";
import { AGENTS } from "@/lib/agents/router";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireEaSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await context.params;
    const meeting = await getMeetingById(id, auth.sessionId);

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found." }, { status: 404 });
    }

    if (!meeting.rawTranscript?.trim()) {
      return NextResponse.json(
        { error: "No transcript to process." },
        { status: 400 },
      );
    }

    await updateMeeting(id, auth.sessionId, { status: "processing" });

    const result = await processMeetingFull(
      meeting,
      meeting.rawTranscript,
      auth.sessionId,
    );

    const updated = await getMeetingById(id, auth.sessionId);

    return NextResponse.json({
      ...result,
      meeting: updated,
      agent: "meeting_analysis",
      model: AGENTS.meeting_analysis.model,
    });
  } catch (error) {
    console.error("[ea/meetings/[id]/process] error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process meeting.",
      },
      { status: 500 },
    );
  }
}
