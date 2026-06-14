import { NextRequest, NextResponse } from "next/server";
import { generateMoodboardDirections } from "@/lib/moodboard/generator";
import { createSseStream, sseResponse } from "@/lib/ai-sse";
import type { MoodboardBrief, MoodboardModelId, MoodboardTab } from "@/lib/moodboard/types";

const VALID_TABS = new Set<MoodboardTab>(["logo", "website", "campaign"]);
const VALID_MODELS = new Set<MoodboardModelId>([
  "claude-haiku",
  "claude-sonnet",
  "claude-nano",
  "gpt-4o",
  "gemini-pro",
]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tab = body.tab as MoodboardTab;
    const modelId = (body.modelId ?? "claude-sonnet") as MoodboardModelId;
    const brief = body.brief as MoodboardBrief;
    const stream = body.stream === true;

    if (!tab || !VALID_TABS.has(tab)) {
      return NextResponse.json({ error: "Invalid tab." }, { status: 400 });
    }
    if (!VALID_MODELS.has(modelId)) {
      return NextResponse.json({ error: "Invalid model." }, { status: 400 });
    }

    if (stream) {
      const sse = createSseStream(async (send) => {
        send({ type: "status", message: "Building three distinct directions…" });
        const directions = await generateMoodboardDirections({
          brief: brief ?? { tab },
          tab,
          modelId,
          onDelta: () => {
            send({ type: "status", message: "Generating moodboard directions…" });
          },
        });
        if (directions.length !== 3) {
          throw new Error(`Expected 3 directions, got ${directions.length}.`);
        }
        send({ type: "complete", result: { directions } });
      });
      return sseResponse(sse);
    }

    const directions = await generateMoodboardDirections({
      brief: brief ?? { tab },
      tab,
      modelId,
    });

    if (directions.length !== 3) {
      return NextResponse.json(
        { error: `Expected 3 directions, got ${directions.length}.` },
        { status: 500 },
      );
    }

    return NextResponse.json({ directions });
  } catch (error) {
    console.error("[moodboard/generate] error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Generation failed.",
      },
      { status: 500 },
    );
  }
}
