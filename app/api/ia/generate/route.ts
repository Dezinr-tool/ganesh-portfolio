import { NextRequest, NextResponse } from "next/server";
import { createSseStream, sseResponse } from "@/lib/ai-sse";
import { generateIaDocument, getIndustryPatternForAnswers } from "@/lib/ia/generator";
import {
  getIaSession,
  persistIaOutput,
  updateIaSession,
  updateIaSessionExtended,
} from "@/lib/ia/db-store";
import {
  extractClientName,
  extractProductName,
  extractProductType,
} from "@/lib/ia/question-flow";
import type { IaModelId } from "@/lib/ia/types";
import type { UserPreConfirmation } from "@/lib/pre-generation-types";
import { PRE_CONFIRMATION_ANSWERS_KEY } from "@/lib/pre-generation-types";

const VALID_MODELS = new Set<IaModelId>(["claude-haiku", "claude-sonnet", "gpt-4o"]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const answers = (body.answers ?? {}) as Record<string, unknown>;
    const modelId = (body.modelId ?? "claude-sonnet") as IaModelId;
    const sessionId = body.sessionId as string | undefined;
    const stream = body.stream === true;
    const extras = body.extras as { documentExtract?: string } | undefined;

    if (!VALID_MODELS.has(modelId)) {
      return NextResponse.json({ error: "Invalid model." }, { status: 400 });
    }

    const preConfirmation = body.preConfirmation as UserPreConfirmation | undefined;
    const fromAnswers = answers[PRE_CONFIRMATION_ANSWERS_KEY] as
      | UserPreConfirmation
      | undefined;
    const userConfirmations = preConfirmation ?? fromAnswers;

    async function persistOutput(
      output: Awaited<ReturnType<typeof generateIaDocument>>,
    ) {
      if (!sessionId) return;
      const industryPattern = getIndustryPatternForAnswers(answers);
      await updateIaSession(sessionId, {
        answers,
        ia_output: output,
        status: "complete",
        client_name: extractClientName(answers),
        project_name: extractProductName(answers),
        product_type: extractProductType(answers),
        industry_pattern_used: industryPattern,
      });
      await updateIaSessionExtended(sessionId, {
        industry_pattern_used: industryPattern,
      });
      await persistIaOutput(sessionId, output);
    }

    if (stream) {
      const sse = createSseStream(async (send) => {
        send({ type: "status", message: "Generating information architecture…" });
        const output = await generateIaDocument({
          answers,
          modelId,
          extras: extras?.documentExtract,
          userConfirmations,
          onStatus: (msg) => send({ type: "status", message: msg }),
        });

        await persistOutput(output);
        send({ type: "complete", result: { output } });
      });
      return sseResponse(sse);
    }

    const output = await generateIaDocument({
      answers,
      modelId,
      extras: extras?.documentExtract,
      userConfirmations,
    });

    await persistOutput(output);

    const session = sessionId ? await getIaSession(sessionId) : null;
    return NextResponse.json({ output, session });
  } catch (error) {
    console.error("[ia/generate] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed." },
      { status: 500 },
    );
  }
}
