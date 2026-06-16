import type { MoodboardQuestion, MoodboardSession } from "./db-types";
import type { MoodboardPresentationDirection } from "./db-types";
import { MOODBOARD_MODELS } from "./models";
import type { MoodboardModelId } from "./types";
import { getNextQuestion, hasStoredAnswer } from "./question-flow";
import { getSelectedOutputSections } from "./output-sections";
import { PRE_CONFIRMATION_ANSWERS_KEY } from "../pre-generation-types";

export { hasStoredAnswer };

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
  currentQuestion: MoodboardQuestion | null;
  intakeComplete: boolean;
};

export function questionUsesOptionsCard(question: MoodboardQuestion): boolean {
  if (question.question_type === "multi_section_select") return true;
  if (question.question_type === "chips") {
    const opts = question.chips_options;
    return Array.isArray(opts) && opts.length > 0;
  }
  return false;
}

function formatAnswerDisplay(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object" && value !== null && "text" in value) {
    const obj = value as { text?: string; files?: unknown[] };
    const parts = [obj.text?.trim()].filter(Boolean);
    if (obj.files?.length) parts.push(`${obj.files.length} file(s)`);
    return parts.join(" · ") || "[uploaded files]";
  }
  return String(value);
}

function parseModelId(value: string | null | undefined): MoodboardModelId | null {
  if (!value) return null;
  return MOODBOARD_MODELS.some((m) => m.id === value) ? (value as MoodboardModelId) : null;
}

export function restoreSessionState(
  session: MoodboardSession,
  questions: MoodboardQuestion[],
): RestoredSessionState {
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
      currentQuestion: null,
      intakeComplete: true,
    };
  }

  const hasProgress = Object.keys(answers).some((key) => hasStoredAnswer(answers[key]));
  if (!hasProgress) {
    return {
      answers,
      messages: [],
      directions: [],
      selectedOutputSections,
      modelId,
      conversationStarted: false,
      currentQuestion: null,
      intakeComplete: false,
    };
  }

  const messages: RestoredChatMessage[] = [
    {
      id: "restore-welcome",
      role: "assistant",
      text: "Great — I'll ask a few questions to understand your brand, then generate 3 visual directions.",
    },
  ];

  let currentQuestion: MoodboardQuestion | null = null;
  let cursor: string | null = null;

  while (true) {
    const next = getNextQuestion(cursor, answers, questions);
    if (!next) break;
    if (!hasStoredAnswer(answers[next.key], next.key)) {
      currentQuestion = next;
      break;
    }

    if (!questionUsesOptionsCard(next)) {
      messages.push({
        id: `restore-q-${next.key}`,
        role: "assistant",
        text: next.question_text,
      });
    }
    messages.push({
      id: `restore-a-${next.key}`,
      role: "user",
      text: formatAnswerDisplay(answers[next.key]),
    });

    cursor = next.key;
  }

  if (currentQuestion && !questionUsesOptionsCard(currentQuestion)) {
    messages.push({
      id: `restore-q-active-${currentQuestion.key}`,
      role: "assistant",
      text: currentQuestion.question_text,
    });
  }

  return {
    answers,
    messages,
    directions: [],
    selectedOutputSections,
    modelId,
    conversationStarted: true,
    currentQuestion,
    intakeComplete: false,
  };
}
