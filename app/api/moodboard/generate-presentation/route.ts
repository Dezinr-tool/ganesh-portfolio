import { NextRequest, NextResponse } from "next/server";
import { createSseStream, sseResponse } from "@/lib/ai-sse";
import { saveDirectionsToDb, updateSession, getSessionBySessionId } from "@/lib/moodboard/db-store";
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

    async function persistAndLearn(
      directions: Awaited<ReturnType<typeof generatePresentationDirections>>,
    ) {
      if (sessionId) {
        await updateSession(sessionId, {
          generated_directions: directions,
          brand_name: extractBrandName(answers),
          selected_output_sections: selectedOutputSections,
          status: "complete",
        });
        await saveDirectionsToDb(sessionId, directions, {
          modelUsed: modelId,
          selectedOutputSections,
        });
        await updateSession(sessionId, { selected_model: modelId });
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

    if (stream) {
      const sse = createSseStream(async (send) => {
        send({ type: "status", message: "Building three distinct directions…" });
        const directions = await generatePresentationDirections({
          answers,
          modelId,
          extras,
          selectedOutputSections,
          clientName,
          projectType: projectType ? String(projectType) : undefined,
          userConfirmations,
          onDelta: () => {
            send({ type: "status", message: "Generating moodboard directions…" });
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

    const directions = await generatePresentationDirections({
      answers,
      modelId,
      extras,
      selectedOutputSections,
      clientName,
      projectType: projectType ? String(projectType) : undefined,
      userConfirmations,
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
