import { NextRequest, NextResponse } from "next/server";
import { createSseStream, sseResponse } from "@/lib/ai-sse";
import { saveDirectionsToDb, updateSession } from "@/lib/moodboard/db-store";
import { generatePresentationDirections } from "@/lib/moodboard/presentation-generator";
import { extractBrandName } from "@/lib/moodboard/question-flow";
import type { MoodboardModelId } from "@/lib/moodboard/types";

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
    const answers = (body.answers ?? {}) as Record<string, unknown>;
    const modelId = (body.modelId ?? "claude-sonnet") as MoodboardModelId;
    const sessionId = body.sessionId as string | undefined;
    const stream = body.stream === true;
    const extras = body.extras as
      | {
          brandResearch?: string;
          websiteAnalysis?: string;
          competitorResearch?: string;
          documentExtract?: string;
        }
      | undefined;

    if (!VALID_MODELS.has(modelId)) {
      return NextResponse.json({ error: "Invalid model." }, { status: 400 });
    }

    if (stream) {
      const sse = createSseStream(async (send) => {
        send({ type: "status", message: "Building three distinct directions…" });
        const directions = await generatePresentationDirections({
          answers,
          modelId,
          extras,
          onDelta: () => {
            send({ type: "status", message: "Generating moodboard directions…" });
          },
        });

        if (directions.length !== 3) {
          throw new Error(`Expected 3 directions, got ${directions.length}.`);
        }

        if (sessionId) {
          await updateSession(sessionId, {
            generated_directions: directions,
            brand_name: extractBrandName(answers),
            status: "complete",
          });
          await saveDirectionsToDb(sessionId, directions);
        }

        send({ type: "complete", result: { directions } });
      });
      return sseResponse(sse);
    }

    const directions = await generatePresentationDirections({
      answers,
      modelId,
      extras,
    });

    if (directions.length !== 3) {
      return NextResponse.json(
        { error: `Expected 3 directions, got ${directions.length}.` },
        { status: 500 },
      );
    }

    if (sessionId) {
      await updateSession(sessionId, {
        generated_directions: directions,
        brand_name: extractBrandName(answers),
        status: "complete",
      });
      await saveDirectionsToDb(sessionId, directions);
    }

    return NextResponse.json({ directions });
  } catch (error) {
    console.error("[moodboard/generate-presentation] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed." },
      { status: 500 },
    );
  }
}
