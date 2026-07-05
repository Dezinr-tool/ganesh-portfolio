import type { MoodboardQuestion } from "./db-types";
import { MOODBOARD_QUESTION_SEED } from "./question-seed";
import {
  getFirstUnansweredQuestion,
  isQuestionOptional,
} from "./question-flow";

/** Static question list for client-side chip resolution (no DB round-trip). */
export function getSeedQuestions(): MoodboardQuestion[] {
  return MOODBOARD_QUESTION_SEED.map((q, i) => ({
    ...q,
    id: `seed-${q.key}`,
    is_active: true,
    created_at: new Date(2024, 0, i + 1).toISOString(),
  }));
}

export function isChipQuestion(question: MoodboardQuestion): boolean {
  if (question.category === "output_sections") return false;
  if (question.question_type === "chips") {
    const opts = question.chips_options;
    return Array.isArray(opts) && opts.length > 0;
  }
  return false;
}

export function resolveIntakeChipQuestion(
  answers: Record<string, unknown>,
  dismissedKeys: Set<string> = new Set(),
): MoodboardQuestion | null {
  const questions = getSeedQuestions();
  const next = getFirstUnansweredQuestion(answers, questions);
  if (!next || dismissedKeys.has(next.key)) return null;
  if (!isChipQuestion(next)) return null;
  return next;
}

export function isOptionalChipQuestion(question: MoodboardQuestion): boolean {
  return isQuestionOptional(question.key);
}
