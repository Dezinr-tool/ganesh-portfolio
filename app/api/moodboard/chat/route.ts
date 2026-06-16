import { NextRequest, NextResponse } from "next/server";
import {
  clearSessionDirections,
  getSessionBySessionId,
  markSessionGenerationComplete,
  saveSingleDirectionToDb,
  updateSession,
} from "@/lib/moodboard/db-store";
import { extractKnownInfoFromMessages } from "@/lib/moodboard/extract-known-info";
import { generateIntakeReply } from "@/lib/moodboard/intake-chat";
import {
  countCoreFields,
  isReadyToGenerate,
} from "@/lib/moodboard/intake-fields";
import { scrapeWebsite } from "@/lib/moodboard/scraper";
import { researchBrandName } from "@/lib/moodboard/brand-research";
import {
  extractBrandName,
  extractProjectType,
  hasStoredAnswer,
  normalizeAnswer,
} from "@/lib/moodboard/question-flow";
import {
  looksLikeMarkdownDirections,
  tryParseDirectionsFromText,
} from "@/lib/moodboard/direction-json";
import { replySignalsSectionsPicker } from "@/lib/moodboard/sections-picker-question";
import type { MoodboardModelId } from "@/lib/moodboard/types";

export const dynamic = "force-dynamic";

const VALID_MODELS = new Set<MoodboardModelId>([
  "claude-haiku",
  "claude-sonnet",
  "claude-nano",
  "gpt-4o",
  "gemini-pro",
]);

type ChatMessage = { role: "user" | "assistant"; text: string };

function formatWebsiteAnalysis(analysis: Awaited<ReturnType<typeof scrapeWebsite>>): string {
  return `${analysis.title}: ${analysis.personality}. ${analysis.tone}. Colors: ${analysis.colors?.join(", ")}. ${analysis.description ?? ""}`.trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionId = body.sessionId as string | undefined;
    const messages = (body.messages ?? []) as ChatMessage[];
    const clientAnswers = (body.answers ?? {}) as Record<string, unknown>;
    const modelId = (body.modelId ?? "claude-sonnet") as MoodboardModelId;
    const clientExtras = (body.extras ?? {}) as {
      websiteAnalysis?: string;
      brandResearch?: string;
      competitorResearch?: string;
      documentExtract?: string;
    };

    if (!VALID_MODELS.has(modelId)) {
      return NextResponse.json({ error: "Invalid model." }, { status: 400 });
    }

    let answers = extractKnownInfoFromMessages(messages, clientAnswers);
    const extras = { ...clientExtras };

    const prevUrl = normalizeAnswer(clientAnswers.q4a);
    const newUrl = normalizeAnswer(answers.q4a);
    let researched = false;

    if (newUrl && newUrl !== prevUrl) {
      try {
        const analysis = await scrapeWebsite(newUrl);
        extras.websiteAnalysis = formatWebsiteAnalysis(analysis);
        researched = true;
        if (!hasStoredAnswer(answers.q2, "q2")) {
          answers = {
            ...answers,
            q2: `${analysis.title}. ${analysis.description || analysis.personality}. ${analysis.tone}`,
          };
        }
      } catch {
        /* research is optional */
      }
    }

    if (
      hasStoredAnswer(answers.q1, "q1") &&
      hasStoredAnswer(answers.q2, "q2") &&
      !extras.brandResearch
    ) {
      try {
        const result = await researchBrandName(String(answers.q1));
        if (result.analysis) {
          extras.brandResearch = formatWebsiteAnalysis(result.analysis);
        }
      } catch {
        /* optional */
      }
    }

    const reply = await generateIntakeReply(messages, answers, modelId, extras);
    const fieldCount = countCoreFields(answers);
    const readyToGenerate = isReadyToGenerate(answers);

    const parsedDirections = tryParseDirectionsFromText(reply);

    if (parsedDirections?.length && sessionId) {
      await clearSessionDirections(sessionId);
      for (const dir of parsedDirections) {
        await saveSingleDirectionToDb(sessionId, dir, { modelUsed: modelId });
      }
      await markSessionGenerationComplete(sessionId, parsedDirections, {
        modelUsed: modelId,
      });
      await updateSession(sessionId, {
        answers: {
          ...(await getSessionBySessionId(sessionId))?.answers,
          ...answers,
          _chat_history: messages,
        },
        brand_name: extractBrandName(answers),
        project_type: extractProjectType(answers),
      });

      return NextResponse.json({
        type: "moodboard_output",
        directions: parsedDirections,
        answers,
        extras,
        readyToGenerate,
        fieldCount,
        researched,
      });
    }

    const blockedMarkdown = looksLikeMarkdownDirections(reply);
    const safeReply = blockedMarkdown
      ? "Pick what to include in the selector above the input — color, typography, icons, and more — then press Continue."
      : reply;

    if (sessionId) {
      const existing = await getSessionBySessionId(sessionId);
      const chatHistory = messages;
      await updateSession(sessionId, {
        answers: {
          ...(existing?.answers ?? {}),
          ...answers,
          _chat_history: chatHistory,
        },
        brand_name: extractBrandName(answers),
        project_type: extractProjectType(answers),
        status: "in_progress",
      });
    }

    return NextResponse.json({
      type: "chat",
      reply: safeReply,
      answers,
      extras,
      readyToGenerate,
      showSectionsPicker:
        blockedMarkdown || readyToGenerate || replySignalsSectionsPicker(safeReply),
      fieldCount,
      researched,
    });
  } catch (error) {
    console.error("[moodboard/chat] error:", error);
    return NextResponse.json({ error: "Chat failed." }, { status: 500 });
  }
}
