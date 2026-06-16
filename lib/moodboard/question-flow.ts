import type { MoodboardQuestion } from "./db-types";
import { OPTIONAL_QUESTION_KEYS } from "./question-seed";

const INTERNAL_ANSWER_KEYS = new Set(["_opening_message"]);

export function normalizeAnswer(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object" && value !== null && "text" in value) {
    return String((value as { text?: string }).text ?? "").trim();
  }
  return String(value).trim();
}

export function hasStoredAnswer(value: unknown, key?: string): boolean {
  if (key && INTERNAL_ANSWER_KEYS.has(key)) return false;
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object" && value !== null) {
    if ("text" in value) {
      const obj = value as { text?: string; files?: unknown[] };
      const text = String(obj.text ?? "").trim();
      return text.length > 0 || (Array.isArray(obj.files) && obj.files.length > 0);
    }
    return Object.keys(value).length > 0;
  }
  return true;
}

export function shouldShowQuestion(
  question: MoodboardQuestion,
  answers: Record<string, unknown>,
): boolean {
  if (!question.is_active) return false;
  if (!question.parent_key) return true;

  const parentAnswer = answers[question.parent_key];

  if (question.parent_key === "q_output_sections") {
    if (!Array.isArray(parentAnswer)) return false;
    if (!question.follow_up_condition) return true;
    return (parentAnswer as unknown[]).includes(question.follow_up_condition);
  }

  const parentStr = normalizeAnswer(parentAnswer);
  if (!parentStr && !Array.isArray(parentAnswer)) return false;

  if (question.follow_up_condition) {
    return parentStr === question.follow_up_condition;
  }

  return true;
}

export function isIntakeQuestion(question: MoodboardQuestion): boolean {
  return question.category !== "output_sections";
}

export function getFirstQuestion(questions: MoodboardQuestion[]): MoodboardQuestion | null {
  const sorted = [...questions]
    .filter((q) => q.is_active && !q.parent_key && isIntakeQuestion(q))
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

export function getFirstUnansweredQuestion(
  answers: Record<string, unknown>,
  questions: MoodboardQuestion[],
): MoodboardQuestion | null {
  const sorted = [...questions]
    .filter((q) => q.is_active)
    .sort((a, b) => a.order_index - b.order_index);

  for (const q of sorted) {
    if (!shouldShowQuestion(q, answers)) continue;
    if (!hasStoredAnswer(answers[q.key], q.key)) return q;
  }

  return null;
}

export function getNextUnansweredQuestion(
  afterKey: string | null,
  answers: Record<string, unknown>,
  questions: MoodboardQuestion[],
): MoodboardQuestion | null {
  let cursor = afterKey;

  for (let i = 0; i < 50; i++) {
    const next = getNextQuestion(cursor, answers, questions);
    if (!next) return null;
    if (hasStoredAnswer(answers[next.key], next.key)) {
      cursor = next.key;
      continue;
    }
    return next;
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
  add("Product type", "q_output_product_type");
  add("Illustration style preference", "q_output_illustration_style");
  add("Icon style preference", "q_output_icon_style");

  const sections = answers.q_output_sections;
  if (Array.isArray(sections) && sections.length) {
    lines.push(`Output sections: ${sections.join(", ")}`);
  }

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
