import { IA_QUESTIONS } from "./question-seed";
import type { IaQuestion } from "./types";

export function normalizeAnswer(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object" && value !== null && "text" in value) {
    return String((value as { text?: string }).text ?? "").trim();
  }
  return String(value).trim();
}

const MULTI_USER = new Set([
  "2 user types",
  "3+ user types",
  "Admin + End user",
]);

function matchesFollowUp(question: IaQuestion, answers: Record<string, unknown>): boolean {
  if (!question.parent_key) return true;

  const parentAnswer = normalizeAnswer(answers[question.parent_key]);

  if (question.follow_up_condition === "MULTI_USER") {
    return MULTI_USER.has(parentAnswer);
  }

  if (question.parent_key === "q3a") {
    return normalizeAnswer(answers.q3) === "Restructuring existing";
  }

  if (question.follow_up_condition) {
    return parentAnswer === question.follow_up_condition;
  }

  return Boolean(parentAnswer);
}

export function shouldShowQuestion(
  question: IaQuestion,
  answers: Record<string, unknown>,
): boolean {
  if (!question.parent_key) return true;
  return matchesFollowUp(question, answers);
}

export function getFirstQuestion(): IaQuestion {
  return IA_QUESTIONS[0]!;
}

export function getNextQuestion(
  currentKey: string | null,
  answers: Record<string, unknown>,
): IaQuestion | null {
  const sorted = [...IA_QUESTIONS].sort((a, b) => a.order_index - b.order_index);

  if (!currentKey) return sorted[0] ?? null;

  const currentIdx = sorted.findIndex((q) => q.key === currentKey);
  if (currentIdx === -1) return null;

  for (let i = currentIdx + 1; i < sorted.length; i++) {
    const q = sorted[i];
    if (shouldShowQuestion(q, answers)) return q;
  }

  return null;
}

export function extractProductName(answers: Record<string, unknown>): string {
  const q1 = normalizeAnswer(answers.q1);
  const firstPart = q1.split(/[—–-]/)[0]?.trim();
  const words = firstPart?.split(/\s+/).slice(0, 4).join(" ");
  return words || "Your Product";
}

export function extractProductType(answers: Record<string, unknown>): string {
  return normalizeAnswer(answers.q2) || "Web App";
}

export function extractClientName(answers: Record<string, unknown>): string {
  return extractProductName(answers);
}

export function isQuestionOptional(key: string): boolean {
  return IA_QUESTIONS.find((q) => q.key === key)?.is_optional ?? false;
}

export function buildBriefFromAnswers(answers: Record<string, unknown>): string {
  const lines: string[] = [];
  for (const q of IA_QUESTIONS) {
    const val = normalizeAnswer(answers[q.key]);
    if (val) lines.push(`${q.question_text}\n${val}`);
  }
  return lines.join("\n\n");
}
