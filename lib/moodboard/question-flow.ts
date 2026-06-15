import type { MoodboardQuestion } from "./db-types";
import { OPTIONAL_QUESTION_KEYS } from "./question-seed";

export function normalizeAnswer(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object" && value !== null && "text" in value) {
    return String((value as { text?: string }).text ?? "").trim();
  }
  return String(value).trim();
}

export function shouldShowQuestion(
  question: MoodboardQuestion,
  answers: Record<string, unknown>,
): boolean {
  if (!question.is_active) return false;
  if (!question.parent_key) return true;

  const parentAnswer = normalizeAnswer(answers[question.parent_key]);
  if (!parentAnswer) return false;

  if (question.follow_up_condition) {
    return parentAnswer === question.follow_up_condition;
  }

  return true;
}

export function getFirstQuestion(questions: MoodboardQuestion[]): MoodboardQuestion | null {
  const sorted = [...questions]
    .filter((q) => q.is_active && !q.parent_key)
    .sort((a, b) => a.order_index - b.order_index);
  return sorted[0] ?? null;
}

export function getNextQuestion(
  currentKey: string | null,
  answers: Record<string, unknown>,
  questions: MoodboardQuestion[],
): MoodboardQuestion | null {
  const sorted = [...questions]
    .filter((q) => q.is_active)
    .sort((a, b) => a.order_index - b.order_index);

  if (!currentKey) {
    return getFirstQuestion(questions);
  }

  const currentIdx = sorted.findIndex((q) => q.key === currentKey);
  if (currentIdx === -1) return null;

  for (let i = currentIdx + 1; i < sorted.length; i++) {
    const q = sorted[i];
    if (shouldShowQuestion(q, answers)) return q;
  }

  return null;
}

export function isQuestionOptional(key: string): boolean {
  return OPTIONAL_QUESTION_KEYS.has(key);
}

export function isIntakeComplete(
  currentKey: string | null,
  answers: Record<string, unknown>,
  questions: MoodboardQuestion[],
): boolean {
  if (!currentKey) return false;
  return getNextQuestion(currentKey, answers, questions) === null;
}

export function extractBrandName(answers: Record<string, unknown>): string {
  return normalizeAnswer(answers.q1) || "Your Brand";
}

export function extractProjectType(answers: Record<string, unknown>): string {
  return normalizeAnswer(answers.q3) || "Brand";
}

export function buildBriefFromAnswers(
  answers: Record<string, unknown>,
  extras?: {
    brandResearch?: string;
    websiteAnalysis?: string;
    competitorResearch?: string;
    documentExtract?: string;
  },
): string {
  const lines: string[] = [];

  const add = (label: string, key: string) => {
    const val = normalizeAnswer(answers[key]);
    if (val) lines.push(`${label}: ${val}`);
  };

  add("Brand name", "q1");
  add("Business description", "q2");
  add("Project type", "q3");
  add("Brand type", "q4");
  add("Existing URL", "q4a");
  add("Redesign problems", "q4b");
  add("Industry", "q5");
  add("Target audience", "q6");
  add("Personas", "q7");
  add("Pain points", "q8");
  add("User aspiration", "q9");
  add("Competitors", "q10");
  add("Competitor likes/dislikes", "q11");
  add("Admired brands", "q12");
  add("References", "q13");
  add("Brand feel", "q14");
  add("Color direction", "q15");
  add("Typography", "q16");
  add("Illustration style", "q17");
  add("Avoid", "q18");

  if (extras?.brandResearch) {
    lines.push(`Brand research:\n${extras.brandResearch}`);
  }
  if (extras?.websiteAnalysis) {
    lines.push(`Website analysis:\n${extras.websiteAnalysis}`);
  }
  if (extras?.competitorResearch) {
    lines.push(`Competitor research:\n${extras.competitorResearch}`);
  }
  if (extras?.documentExtract) {
    lines.push(`Questionnaire extract:\n${extras.documentExtract}`);
  }

  return lines.join("\n\n");
}
