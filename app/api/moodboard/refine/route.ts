import { NextRequest, NextResponse } from "next/server";
import { refineMoodboardDirection } from "@/lib/moodboard/generator";
import type {
  MoodboardBrief,
  MoodboardDirection,
  MoodboardModelId,
  MoodboardTab,
} from "@/lib/moodboard/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tab = body.tab as MoodboardTab;
    const modelId = (body.modelId ?? "claude-sonnet") as MoodboardModelId;
    const brief = body.brief as MoodboardBrief;
    const direction = body.direction as MoodboardDirection;
    const refineNote =
      typeof body.refineNote === "string" ? body.refineNote.trim() : "";

    if (!direction || !refineNote) {
      return NextResponse.json(
        { error: "Direction and refine note are required." },
        { status: 400 },
      );
    }

    const refined = await refineMoodboardDirection({
      brief: brief ?? { tab },
      tab,
      modelId,
      direction,
      refineNote,
    });

    return NextResponse.json({ direction: refined });
  } catch (error) {
    console.error("[moodboard/refine] error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Refinement failed.",
      },
      { status: 500 },
    );
  }
}
