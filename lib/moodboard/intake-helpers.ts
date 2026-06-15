import type { MoodboardQuestion } from "./db-types";
import { normalizeAnswer } from "./question-flow";

const DUPLICATE_WINDOW_MS = 2000;

const VAGUE_FOLLOW_UPS: Record<string, string> = {
  q1: "For example — is this a product brand, agency, or personal project?",
  q2: "For example — what product or service do they offer, and who is it for?",
  q4b: "For example — outdated visuals, poor mobile UX, or messaging that feels off-brand?",
  q5: "For example — DTC skincare, B2B fintech, or hospitality?",
  q6: "For example — who specifically is the business for? Age, lifestyle, what they care about?",
  q8: "For example — slow checkout, confusing navigation, or lack of trust?",
  q9: "For example — feeling confident, saving time, or belonging to a community?",
  q10: "For example — direct competitors in the same category or region?",
  q11: "For example — what you admire or dislike about their visual approach?",
  q12: "For example — brands or sites whose aesthetic you'd want to echo?",
  q18: "For example — clichés, colors, or styles that feel wrong for this brand?",
};

const BRAND_CORRECTION_PREFIX =
  /^(?:no|not|actually|wrong|nope)[\s,—-]+(?:it'?s|its|that'?s)\s+/i;

export function isDuplicateSubmit(
  last: { text: string; at: number } | null,
  text: string,
  now = Date.now(),
): boolean {
  if (!last) return false;
  return (
    last.text === text.trim().toLowerCase() && now - last.at < DUPLICATE_WINDOW_MS
  );
}

export function isOpenQuestion(question: MoodboardQuestion): boolean {
  return question.question_type === "open";
}

export function isVagueOpenAnswer(question: MoodboardQuestion, value: unknown): boolean {
  if (!isOpenQuestion(question)) return false;
  const text = normalizeAnswer(value);
  if (!text) return false;
  if (parseBrandCorrection(text)) return false;
  return text.split(/\s+/).filter(Boolean).length < 3;
}

export function getVagueFollowUp(question: MoodboardQuestion): string {
  const example =
    VAGUE_FOLLOW_UPS[question.key] ??
    "A sentence or two would help me tailor the directions.";
  return `Can you tell me a bit more? ${example}`;
}

export type BrandCorrection = {
  brand: string;
  description?: string;
};

export function parseBrandCorrection(text: string): BrandCorrection | null {
  const trimmed = text.trim();
  if (!BRAND_CORRECTION_PREFIX.test(trimmed)) return null;

  const rest = trimmed.replace(BRAND_CORRECTION_PREFIX, "").trim();
  if (!rest) return null;

  const commaIdx = rest.indexOf(",");
  if (commaIdx > 0) {
    const brand = rest.slice(0, commaIdx).trim();
    const description = rest.slice(commaIdx + 1).trim();
    if (brand) {
      return description ? { brand, description } : { brand };
    }
  }

  return { brand: rest };
}

export function formatBrandCorrectionAck(correction: BrandCorrection): string {
  if (correction.description) {
    return `Got it — ${correction.brand}, ${correction.description}. Let me update that.`;
  }
  return `Got it — ${correction.brand}. Let me update that.`;
}

export function questionHasChips(question: MoodboardQuestion | null): boolean {
  if (!question) return false;
  if (question.question_type === "multi_section_select") return true;
  if (question.question_type !== "chips") return false;
  const opts = question.chips_options;
  return Array.isArray(opts) && opts.length > 0;
}
