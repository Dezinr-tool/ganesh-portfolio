import { NextRequest, NextResponse } from "next/server";
import { refinePresentationDirection } from "@/lib/moodboard/presentation-generator";
import { saveRefinementTrainingRecord } from "@/lib/moodboard/training-memory";
import type { MoodboardPresentationDirection } from "@/lib/moodboard/db-types";
import type { MoodboardModelId } from "@/lib/moodboard/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const answers = (body.answers ?? {}) as Record<string, unknown>;
    const modelId = (body.modelId ?? "claude-sonnet") as MoodboardModelId;
    const direction = body.direction as MoodboardPresentationDirection;
    const refineNote = body.refineNote as string;
    const extras = body.extras;

    if (!direction?.directionName || !refineNote?.trim()) {
      return NextResponse.json({ error: "Direction and refine note required." }, { status: 400 });
    }

    const selectedOutputSections = (body.selectedOutputSections ?? direction.selectedSections ?? []) as string[];

    const refined = await refinePresentationDirection({
      answers,
      modelId,
      direction,
      refineNote,
      extras,
      selectedOutputSections,
    });

    const sessionId = body.sessionId as string | undefined;
    if (sessionId) {
      void saveRefinementTrainingRecord({
        sessionId,
        directionName: direction.directionName,
        refineNote,
        beforeSummary: {
          name: direction.directionName,
          tagline: direction.tagline,
          moodKeywords: direction.moodKeywords,
        },
        afterDirection: refined,
      });
    }

    return NextResponse.json({ direction: refined });
  } catch (error) {
    console.error("[moodboard/refine-presentation] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Refinement failed." },
      { status: 500 },
    );
  }
}
