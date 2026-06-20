import type { MoodboardSession } from "./db-types";
import type { MoodboardPresentationDirection } from "./db-types";
import { MOODBOARD_MODELS } from "./models";
import type { MoodboardModelId } from "./types";
import { hasStoredAnswer } from "./question-flow";
import { getSelectedOutputSections } from "./output-sections";
import { PRE_CONFIRMATION_ANSWERS_KEY } from "../pre-generation-types";
import { isReadyToGenerate } from "./intake-fields";

export type RestoredChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

export type RestoredSessionState = {
  answers: Record<string, unknown>;
  messages: RestoredChatMessage[];
  directions: MoodboardPresentationDirection[];
  selectedOutputSections: string[];
  modelId: MoodboardModelId | null;
  conversationStarted: boolean;
  readyToGenerate: boolean;
  intakeComplete: boolean;
};

export { hasStoredAnswer };

function parseModelId(value: string | null | undefined): MoodboardModelId | null {
  if (!value) return null;
  return MOODBOARD_MODELS.some((m) => m.id === value) ? (value as MoodboardModelId) : null;
}

export function restoreSessionState(session: MoodboardSession): RestoredSessionState {
  const answers = { ...(session.answers ?? {}) };
  delete answers[PRE_CONFIRMATION_ANSWERS_KEY];

  const directions = session.generated_directions ?? [];
  const selectedOutputSections =
    session.selected_output_sections?.length
      ? session.selected_output_sections
      : getSelectedOutputSections(answers);
  const modelId = parseModelId(session.selected_model);

  if (directions.length > 0) {
    return {
      answers,
      messages: [],
      directions,
      selectedOutputSections,
      modelId,
      conversationStarted: true,
      readyToGenerate: false,
      intakeComplete: true,
    };
  }

  const rawHistory = answers._chat_history;
  let messages: RestoredChatMessage[] = [];

  if (Array.isArray(rawHistory)) {
    messages = rawHistory.map((entry, index) => {
      const row = entry as { role?: string; text?: string };
      return {
        id: `restore-${index}`,
        role: row.role === "assistant" ? "assistant" : "user",
        text: String(row.text ?? ""),
      };
    });
  } else if (answers._opening_message) {
    messages = [
      {
        id: "restore-user",
        role: "user",
        text: String(answers._opening_message),
      },
    ];
  }

  const hasAnswerFields = Object.keys(answers).some(
    (key) => !key.startsWith("_") && hasStoredAnswer(answers[key], key),
  );

  const conversationStarted = messages.length > 0 || directions.length > 0;

  return {
    answers,
    messages,
    directions: [],
    selectedOutputSections,
    modelId,
    conversationStarted,
    readyToGenerate: isReadyToGenerate(answers) || hasAnswerFields,
    intakeComplete: false,
  };
}
