import { NextRequest, NextResponse } from "next/server";
import { createSseStream, sseResponse } from "@/lib/ai-sse";
import {
  clearSessionDirections,
  getSessionBySessionId,
  markSessionGenerationComplete,
  saveSingleDirectionToDb,
  updateSession,
} from "@/lib/moodboard/db-store";
import { generatePresentationDirections } from "@/lib/moodboard/presentation-generator";
import { getSelectedOutputSections } from "@/lib/moodboard/output-sections";
import { extractBrandName } from "@/lib/moodboard/question-flow";
import { saveMoodboardLearnings } from "@/lib/context-saveback";
import type { MoodboardModelId } from "@/lib/moodboard/types";
import type { UserPreConfirmation } from "@/lib/pre-generation-types";
import { PRE_CONFIRMATION_ANSWERS_KEY } from "@/lib/pre-generation-types";

const VALID_MODELS = new Set<MoodboardModelId>([
  "claude-haiku",
  "claude-sonnet",
  "claude-nano",
  "gpt-4o",
  "gemini-pro",
]);

/** Generation always uses Sonnet for quality; chat model is ignored here. */
const GENERATION_MODEL: MoodboardModelId = "claude-sonnet";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const answers = (body.answers ?? {}) as Record<string, unknown>;
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

    const selectedOutputSections = (
      (body.selectedOutputSections as string[] | undefined)?.length
        ? body.selectedOutputSections
        : getSelectedOutputSections(answers)
    ) as string[];

    const dbSession = sessionId ? await getSessionBySessionId(sessionId) : null;
    const clientName =
      extractBrandName(answers) || dbSession?.brand_name || undefined;
    const projectType =
      (answers.q3 as string | undefined) ?? dbSession?.project_type ?? undefined;

    const preConfirmation = body.preConfirmation as UserPreConfirmation | undefined;
    const fromAnswers = answers[PRE_CONFIRMATION_ANSWERS_KEY] as
      | UserPreConfirmation
      | undefined;
    const userConfirmations = preConfirmation ?? fromAnswers;

    async function persistDirection(
      direction: Awaited<ReturnType<typeof generatePresentationDirections>>[number],
    ) {
      if (!sessionId) return;
      await saveSingleDirectionToDb(sessionId, direction, {
        modelUsed: GENERATION_MODEL,
        selectedOutputSections,
      });
    }

    async function persistAndLearn(
      directions: Awaited<ReturnType<typeof generatePresentationDirections>>,
    ) {
      if (sessionId) {
        await markSessionGenerationComplete(sessionId, directions, {
          modelUsed: GENERATION_MODEL,
          selectedOutputSections,
        });
        await updateSession(sessionId, {
          brand_name: extractBrandName(answers),
        });
      }
      if (clientName) {
        try {
          await saveMoodboardLearnings({
            clientName,
            projectType: projectType ? String(projectType) : undefined,
            sessionId,
            answers,
            directions,
          });
        } catch (err) {
          console.error("[moodboard/generate-presentation] saveback failed:", err);
        }
      }
    }

    const generationInput = {
      answers,
      modelId: GENERATION_MODEL,
      extras,
      selectedOutputSections,
      clientName,
      projectType: projectType ? String(projectType) : undefined,
      userConfirmations,
    };

    if (stream) {
      const sse = createSseStream(async (send) => {
        if (sessionId) {
          await updateSession(sessionId, {
            status: "generating",
            generation_status: "generating",
          });
          await clearSessionDirections(sessionId);
        }

        send({ type: "status", message: "Analyzing your brief…" });

        const collected: Awaited<ReturnType<typeof generatePresentationDirections>> = [];

        const directions = await generatePresentationDirections({
          ...generationInput,
          onStatus: (message) => send({ type: "status", message }),
          onDirection: async (direction, index) => {
            await persistDirection(direction);
            collected.push(direction);
            send({ type: "direction", direction, directionIndex: index });
          },
        });

        if (directions.length !== 3) {
          throw new Error(`Expected 3 directions, got ${directions.length}.`);
        }

        await persistAndLearn(directions);
        send({ type: "complete", result: { directions } });
      });
      return sseResponse(sse);
    }

    if (sessionId) {
      await updateSession(sessionId, {
        status: "generating",
        generation_status: "generating",
      });
      await clearSessionDirections(sessionId);
    }

    const directions = await generatePresentationDirections({
      ...generationInput,
      onDirection: persistDirection,
    });

    if (directions.length !== 3) {
      return NextResponse.json(
        { error: `Expected 3 directions, got ${directions.length}.` },
        { status: 500 },
      );
    }

    await persistAndLearn(directions);

    return NextResponse.json({ directions });
  } catch (error) {
    console.error("[moodboard/generate-presentation] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed." },
      { status: 500 },
    );
  }
}
