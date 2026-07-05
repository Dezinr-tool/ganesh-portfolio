import { insertMoodboardEvent } from "./analytics";
import type { MoodboardPresentationDirection } from "./db-types";

type TrainingPayload = Record<string, unknown>;

async function record(
  sessionId: string,
  eventType: string,
  payload: TrainingPayload,
): Promise<void> {
  try {
    await insertMoodboardEvent({ sessionId, eventType, payload });
  } catch (err) {
    console.error(`[training-memory] ${eventType} failed:`, err);
  }
}

/** User free-text prompt during intake (landing or chat composer). */
export async function saveUserPromptTrainingRecord(input: {
  sessionId: string;
  text: string;
  source: "landing" | "chat";
  messageIndex?: number;
}): Promise<void> {
  await record(input.sessionId, "training_user_prompt", {
    text: input.text,
    source: input.source,
    messageIndex: input.messageIndex,
    capturedAt: new Date().toISOString(),
  });
}

/** Capture full intake context for future agent training. */
export async function saveIntakeTrainingSnapshot(input: {
  sessionId: string;
  messages: Array<{ role: string; text: string }>;
  answers: Record<string, unknown>;
  modelId?: string;
  extras?: Record<string, unknown>;
}): Promise<void> {
  await record(input.sessionId, "training_intake", {
    modelId: input.modelId,
    messageCount: input.messages.length,
    messages: input.messages.slice(-40),
    answers: input.answers,
    extras: input.extras,
    capturedAt: new Date().toISOString(),
  });
}

/** Capture generation output + prompts for training corpus. */
export async function saveGenerationTrainingRecord(input: {
  sessionId: string;
  answers: Record<string, unknown>;
  directions: MoodboardPresentationDirection[];
  modelId?: string;
  selectedOutputSections?: string[];
  preConfirmation?: Record<string, unknown>;
}): Promise<void> {
  await record(input.sessionId, "training_generation", {
    modelId: input.modelId,
    selectedOutputSections: input.selectedOutputSections,
    preConfirmation: input.preConfirmation,
    answers: input.answers,
    directionSummaries: input.directions.map((d) => ({
      name: d.directionName,
      tagline: d.tagline,
      moodKeywords: d.moodKeywords,
      uiDescription: d.uiSection?.description?.slice(0, 500),
      palette: d.colorPalette?.map((c) => c.hex),
      typography: d.typography
        ? { heading: d.typography.heading, body: d.typography.body }
        : undefined,
    })),
    fullDirections: input.directions,
    capturedAt: new Date().toISOString(),
  });
}

/** Capture refinement loops — what users asked to improve. */
export async function saveRefinementTrainingRecord(input: {
  sessionId: string;
  directionName: string;
  refineNote: string;
  beforeSummary?: Record<string, unknown>;
  afterDirection?: MoodboardPresentationDirection;
}): Promise<void> {
  await record(input.sessionId, "training_refinement", {
    directionName: input.directionName,
    refineNote: input.refineNote,
    beforeSummary: input.beforeSummary,
    afterSummary: input.afterDirection
      ? {
          name: input.afterDirection.directionName,
          tagline: input.afterDirection.tagline,
          moodKeywords: input.afterDirection.moodKeywords,
        }
      : undefined,
    capturedAt: new Date().toISOString(),
  });
}

/** User chip / structured answer selection during intake. */
export async function saveChipAnswerTrainingRecord(input: {
  sessionId: string;
  questionKey: string;
  questionText: string;
  value: string | string[];
}): Promise<void> {
  await record(input.sessionId, "training_chip_answer", {
    questionKey: input.questionKey,
    questionText: input.questionText,
    value: input.value,
    capturedAt: new Date().toISOString(),
  });
}
