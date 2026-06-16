import {
  extractFromMessage,
  mergeExtractedIntoAnswers,
  type ExtractedContext,
} from "./context-extraction";
import { hasStoredAnswer } from "./question-flow";

export type ChatMessageInput = {
  role: "user" | "assistant";
  text: string;
};

const VISUAL_FEEL_PATTERN =
  /\b(minimal(?:ist)?|bold|luxury|luxurious|playful|clean|modern|premium|elegant|vibrant|warm|corporate|organic|edgy|sophisticated|friendly|professional|youthful|refined|rustic|techy|futuristic)\b/gi;

const COLOR_PATTERN =
  /\b(blue|red|green|neutral|earth tones?|monochrome|pastel|dark mode|light mode|warm palette|cool palette|black and white|navy|teal|gold|muted|vibrant colors?)\b/gi;

const COMPETITOR_PATTERN =
  /\b(?:like|similar to|competitors?(?:\s+like)?|inspired by|not like)\s+([A-Z][\w\s&.-]{1,40})/gi;

const VALUES_PATTERN =
  /\b(trust(?:worthy)?|innovative|reliable|approachable|authentic|inclusive|sustainable|transparent|friendly|premium)\b/gi;

function extractExtendedSignals(text: string): Partial<Record<string, string>> {
  const out: Partial<Record<string, string>> = {};
  const trimmed = text.trim();
  if (!trimmed) return out;

  const feels = [...trimmed.matchAll(VISUAL_FEEL_PATTERN)].map((m) => m[0].toLowerCase());
  if (feels.length) {
    out.q14 = [...new Set(feels)].slice(0, 6).join(", ");
  }

  const colors = [...trimmed.matchAll(COLOR_PATTERN)].map((m) => m[0].toLowerCase());
  if (colors.length) {
    out.q15 = [...new Set(colors)].slice(0, 4).join(", ");
  }

  const competitors = [...trimmed.matchAll(COMPETITOR_PATTERN)].map((m) => m[1].trim());
  if (competitors.length) {
    out.q10 = competitors.slice(0, 3).join(", ");
  }

  const values = [...trimmed.matchAll(VALUES_PATTERN)].map((m) => m[0].toLowerCase());
  if (values.length && !out.q14) {
    out.q14 = [...new Set(values)].slice(0, 5).join(", ");
  }

  if (/\bavoid\b/i.test(trimmed)) {
    const avoidMatch = trimmed.match(/\bavoid\s+([^.!?]+)/i);
    if (avoidMatch?.[1]) out.q18 = avoidMatch[1].trim();
  }

  return out;
}

function mergeExtended(
  answers: Record<string, unknown>,
  extended: Partial<Record<string, string>>,
): Record<string, unknown> {
  const next = { ...answers };
  for (const [key, value] of Object.entries(extended)) {
    if (value && !hasStoredAnswer(next[key], key)) {
      next[key] = value;
    }
  }
  return next;
}

export function extractKnownInfoFromMessages(
  messages: ChatMessageInput[],
  existingAnswers: Record<string, unknown> = {},
): Record<string, unknown> {
  let answers = { ...existingAnswers };

  for (const msg of messages) {
    if (msg.role !== "user") continue;
    const extracted: ExtractedContext = extractFromMessage(msg.text);
    answers = mergeExtractedIntoAnswers(answers, extracted);
    answers = mergeExtended(answers, extractExtendedSignals(msg.text));
  }

  return answers;
}
