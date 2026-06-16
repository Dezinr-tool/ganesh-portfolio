import { NextRequest, NextResponse } from "next/server";
import { markDirectionSelected } from "@/lib/moodboard/db-store";
import { isValidMoodboardSessionId } from "@/lib/moodboard/analytics";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionId = body.sessionId as string;
    const directionIndex = Number(body.directionIndex);
    const directionName = body.directionName as string;

    if (!sessionId || !isValidMoodboardSessionId(sessionId)) {
      return NextResponse.json({ error: "Invalid session id." }, { status: 400 });
    }
    if (!directionIndex || directionIndex < 1 || directionIndex > 3) {
      return NextResponse.json({ error: "Invalid direction index." }, { status: 400 });
    }
    if (!directionName?.trim()) {
      return NextResponse.json({ error: "directionName required." }, { status: 400 });
    }

    await markDirectionSelected(sessionId, directionIndex, directionName.trim());

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[moodboard/select-direction] error:", error);
    return NextResponse.json({ error: "Failed to save selection." }, { status: 500 });
  }
}
