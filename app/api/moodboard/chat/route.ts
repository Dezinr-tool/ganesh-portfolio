import { NextRequest, NextResponse } from "next/server";
import {
  clearSessionDirections,
  getSessionBySessionId,
  markSessionGenerationComplete,
  saveSingleDirectionToDb,
  updateSession,
} from "@/lib/moodboard/db-store";
import { extractKnownInfoFromMessages } from "@/lib/moodboard/extract-known-info";
import {
  enrichChatContext,
  mergeStoredExtras,
  type MoodboardExtras,
} from "@/lib/moodboard/chat-enrichment";
import { generateIntakeReply, streamIntakeReply } from "@/lib/moodboard/intake-chat";
import {
  countCoreFields,
  isReadyToGenerate,
} from "@/lib/moodboard/intake-fields";
import {
  looksLikeMarkdownDirections,
  tryParseDirectionsFromText,
} from "@/lib/moodboard/direction-json";
import { replySignalsSectionsPicker } from "@/lib/moodboard/sections-picker-question";
import {
  extractBrandName,
  extractProjectType,
} from "@/lib/moodboard/question-flow";
import type { MoodboardModelId } from "@/lib/moodboard/types";
import { createSseStream, sseResponse } from "@/lib/ai-sse";

export const dynamic = "force-dynamic";

const VALID_MODELS = new Set<MoodboardModelId>([
  "claude-haiku",
  "claude-sonnet",
  "claude-nano",
  "gpt-4o",
  "gemini-pro",
]);

type ChatMessage = { role: "user" | "assistant"; text: string };

type ChatResult = {
  type: "chat" | "moodboard_output";
  reply?: string;
  directions?: Awaited<ReturnType<typeof tryParseDirectionsFromText>>;
  answers: Record<string, unknown>;
  extras: MoodboardExtras;
  readyToGenerate: boolean;
  showSectionsPicker?: boolean;
  fieldCount: number;
  researched: boolean;
};

function persistSessionAsync(
  sessionId: string,
  answers: Record<string, unknown>,
  messages: ChatMessage[],
  patch?: { status?: string },
): void {
  void (async () => {
    try {
      const existing = await getSessionBySessionId(sessionId);
      await updateSession(sessionId, {
        answers: {
          ...(existing?.answers ?? {}),
          ...answers,
          _chat_history: messages,
        },
        brand_name: extractBrandName(answers),
        project_type: extractProjectType(answers),
        status: patch?.status ?? "in_progress",
      });
    } catch (error) {
      console.error("[moodboard/chat] persist failed:", error);
    }
  })();
}

function buildChatPayload(
  reply: string,
  answers: Record<string, unknown>,
  extras: MoodboardExtras,
  researched: boolean,
): ChatResult {
  const fieldCount = countCoreFields(answers);
  const readyToGenerate = isReadyToGenerate(answers);
  const blockedMarkdown = looksLikeMarkdownDirections(reply);
  const safeReply = blockedMarkdown
    ? "Pick what to include in the selector above the input — color, typography, icons, and more — then press Continue."
    : reply;

  const answersWithExtras = {
    ...answers,
    _moodboard_extras: extras,
  };

  return {
    type: "chat",
    reply: safeReply,
    answers: answersWithExtras,
    extras,
    readyToGenerate,
    showSectionsPicker:
      blockedMarkdown || readyToGenerate || replySignalsSectionsPicker(safeReply),
    fieldCount,
    researched,
  };
}

async function handleMoodboardOutput(
  sessionId: string,
  parsedDirections: NonNullable<Awaited<ReturnType<typeof tryParseDirectionsFromText>>>,
  answers: Record<string, unknown>,
  extras: MoodboardExtras,
  messages: ChatMessage[],
  modelId: MoodboardModelId,
  researched: boolean,
): Promise<ChatResult> {
  await clearSessionDirections(sessionId);
  for (const dir of parsedDirections) {
    await saveSingleDirectionToDb(sessionId, dir, { modelUsed: modelId });
  }
  await markSessionGenerationComplete(sessionId, parsedDirections, {
    modelUsed: modelId,
  });
  persistSessionAsync(sessionId, { ...answers, _moodboard_extras: extras }, messages, {
    status: "complete",
  });

  return {
    type: "moodboard_output",
    directions: parsedDirections,
    answers: { ...answers, _moodboard_extras: extras },
    extras,
    readyToGenerate: isReadyToGenerate(answers),
    fieldCount: countCoreFields(answers),
    researched,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionId = body.sessionId as string | undefined;
    const messages = (body.messages ?? []) as ChatMessage[];
    const clientAnswers = (body.answers ?? {}) as Record<string, unknown>;
    const modelId = (body.modelId ?? "claude-sonnet") as MoodboardModelId;
    const stream = body.stream === true;
    const clientExtras = (body.extras ?? {}) as MoodboardExtras;

    if (!VALID_MODELS.has(modelId)) {
      return NextResponse.json({ error: "Invalid model." }, { status: 400 });
    }

    let answers = extractKnownInfoFromMessages(messages, clientAnswers);
    let extras = mergeStoredExtras(clientExtras, clientAnswers);

    const enriched = await enrichChatContext(answers, extras, clientAnswers, {
      maxWaitMs: 1500,
    });
    answers = enriched.answers;
    extras = enriched.extras;
    let researched = enriched.researched;
    const enrichmentContinuation = enriched.continuation;

    const runReply = async (onDelta?: (text: string) => void): Promise<string> => {
      if (onDelta) {
        return streamIntakeReply(messages, answers, modelId, extras, onDelta);
      }
      return generateIntakeReply(messages, answers, modelId, extras);
    };

    const finalize = async (reply: string): Promise<ChatResult> => {
      const parsedDirections = tryParseDirectionsFromText(reply);

      if (parsedDirections?.length && sessionId) {
        return handleMoodboardOutput(
          sessionId,
          parsedDirections,
          answers,
          extras,
          messages,
          modelId,
          researched,
        );
      }

      const payload = buildChatPayload(reply, answers, extras, researched);

      if (sessionId) {
        persistSessionAsync(sessionId, payload.answers, messages);
      }

      void enrichmentContinuation.then((finished) => {
        if (!sessionId) return;
        if (
          !finished.researched &&
          finished.extras.brandResearch === extras.brandResearch &&
          finished.extras.websiteAnalysis === extras.websiteAnalysis
        ) {
          return;
        }
        persistSessionAsync(
          sessionId,
          { ...finished.answers, _moodboard_extras: finished.extras },
          messages,
        );
      });

      return payload;
    };

    if (stream) {
      return sseResponse(
        createSseStream(async (send) => {
          send({ type: "status", message: "Thinking…" });
          const reply = await runReply((partial) => {
            send({ type: "delta", text: partial });
          });
          const result = await finalize(reply);
          send({ type: "complete", result });
        }),
      );
    }

    const reply = await runReply();
    const result = await finalize(reply);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[moodboard/chat] error:", error);
    return NextResponse.json({ error: "Chat failed." }, { status: 500 });
  }
}
