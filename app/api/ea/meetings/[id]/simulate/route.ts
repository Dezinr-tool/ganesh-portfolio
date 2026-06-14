import { NextRequest, NextResponse } from "next/server";
import { requireEaSession } from "@/lib/ea-api-auth";
import { getMeetingById, updateMeeting } from "@/lib/meetings-store";
import { processMeetingFull } from "@/lib/meeting-pipeline";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireEaSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const action = body.action as "join" | "transcript" | "leave";

    const meeting = await getMeetingById(id, auth.sessionId);
    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found." }, { status: 404 });
    }

    if (action === "join") {
      const updated = await updateMeeting(id, auth.sessionId, {
        status: "recording",
      });
      return NextResponse.json({ meeting: updated, simulated: true });
    }

    if (action === "transcript") {
      const text = body.text as string | undefined;
      if (!text?.trim()) {
        return NextResponse.json(
          { error: "Transcript text is required." },
          { status: 400 },
        );
      }

      const updated = await updateMeeting(id, auth.sessionId, {
        rawTranscript: text.trim(),
        status: "processing",
      });
      return NextResponse.json({ meeting: updated, simulated: true });
    }

    if (action === "leave") {
      const current = await getMeetingById(id, auth.sessionId);
      if (!current?.rawTranscript?.trim()) {
        return NextResponse.json(
          { error: "No transcript saved. Use action transcript first." },
          { status: 400 },
        );
      }

      const result = await processMeetingFull(
        current,
        current.rawTranscript,
        auth.sessionId,
      );
      const updated = await getMeetingById(id, auth.sessionId);
      return NextResponse.json({
        meeting: updated,
        ...result,
        simulated: true,
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    console.error("[ea/meetings/[id]/simulate] error:", error);
    return NextResponse.json(
      { error: "Simulation failed." },
      { status: 500 },
    );
  }
}
