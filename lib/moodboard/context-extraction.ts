import type { MoodboardQuestion } from "./db-types";
import { hasStoredAnswer, normalizeAnswer } from "./question-flow";

export type ExtractedContext = {
  brandName?: string;
  projectType?: string;
  url?: string;
  brandType?: "New brand" | "Redesign/Refresh";
  industry?: string;
  targetAudience?: string;
  businessDescription?: string;
  hints: string[];
};

const OPENING_STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "my",
  "our",
  "this",
  "that",
  "new",
  "their",
  "need",
  "create",
  "making",
  "build",
  "design",
]);

const BRAND_PATTERNS = [
  /\b(?:mood\s*board|moodboard)\s+for\s+(?:the\s+|a\s+|my\s+)?([a-z0-9][\w.-]{1,48})\b/i,
  /\b(?:brand|project|company|startup|app|product)\s+(?:for\s+|called\s+)?([a-z0-9][\w.-]{1,48})\b/i,
  /\b([a-z0-9][\w.-]{1,48})\s+(?:website|web\s*site|app|company|brand|startup)\b/i,
  /\bfor\s+(?:the\s+|a\s+|my\s+)?([a-z0-9][\w.-]{1,48})\b/i,
  /\bworking\s+on\s+(?:the\s+|a\s+|my\s+)?([a-z0-9][\w.-]{1,48})\b/i,
  /\b(?:called|named)\s+([a-z0-9][\w.-]{1,48})\b/i,
];

const PROJECT_TYPE_RULES: Array<{ pattern: RegExp; value: string }> = [
  { pattern: /\b(website|web\s*site|landing\s*page|site redesign)\b/i, value: "Website" },
  { pattern: /\b(mobile\s*app|app\s*redesign|\bapp\b)\b/i, value: "App" },
  { pattern: /\b(logo|logotype|wordmark)\b/i, value: "Logo" },
  { pattern: /\b(campaign|ad\s*campaign|marketing\s*campaign)\b/i, value: "Campaign" },
  {
    pattern: /\b(brand\s*identity|branding|visual\s*identity|rebrand)\b/i,
    value: "Brand Identity",
  },
];

const INDUSTRY_RULES: Array<{ pattern: RegExp; value: string }> = [
  { pattern: /\bB2B\s+SaaS\b/i, value: "B2B SaaS" },
  { pattern: /\bB2C\s+SaaS\b/i, value: "B2C SaaS" },
  { pattern: /\bSaaS\b/i, value: "SaaS" },
  { pattern: /\b(fintech|healthtech|edtech|proptech|HR\s*tech|hr\s*tech)\b/i, value: "$0" },
  { pattern: /\b(e-?commerce|DTC|direct-to-consumer)\b/i, value: "E-commerce" },
  { pattern: /\b(hospitality|restaurant|food\s*&?\s*beverage)\b/i, value: "Hospitality" },
  { pattern: /\b(fashion|beauty|skincare)\b/i, value: "Fashion & Beauty" },
];

const REDESIGN_PATTERN =
  /\b(redesign|revamp|refresh|rebrand|makeover|overhaul|new\s*look)\b/i;
const NEW_BRAND_PATTERN = /\b(new\s*brand|from\s*scratch|starting\s*fresh|launching)\b/i;

const AUDIENCE_PATTERNS = [
  /\b(?:B2B\s+SaaS|B2C\s+SaaS|SaaS)\s+for\s+([^,.]+)/i,
  /\bfor\s+([a-z0-9][\w\s-]{2,40}?\s+(?:teams?|users?|professionals?|people|customers?|founders?|developers?|marketers?|managers?))/i,
  /\b(targeting|serving)\s+([^,.]+)/i,
  /\b(HR\s+teams?|human\s+resources(?:\s+teams?)?|developers|designers|marketers|founders|consumers)\b/i,
];

const B2B_SAAS_DESCRIPTION =
  /\bit'?s\s+(?:a\s+)?(B2B\s+SaaS(?:\s+for\s+[^,.]+)?)/i;

function formatBrandDisplay(name: string): string {
  if (!name) return name;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function isLikelyAudienceToken(value: string): boolean {
  return /^(hr|teams?|users?|people|customers?|developers?|marketers?|founders?|consumers?|managers?)$/i.test(
    value.trim(),
  );
}

function cleanBrandCandidate(candidate: string): string | null {
  const cleaned = candidate
    .replace(/['"]/g, "")
    .replace(/[.,!?;:]+$/, "")
    .trim();
  if (cleaned.length < 2) return null;
  if (OPENING_STOP_WORDS.has(cleaned.toLowerCase())) return null;
  if (isLikelyAudienceToken(cleaned)) return null;
  if (/^(website|app|logo|campaign|redesign|revamp|moodboard)$/i.test(cleaned)) {
    return null;
  }
  return cleaned;
}

export function extractUrl(text: string): string | null {
  const https = text.match(/\bhttps?:\/\/[^\s,)]+/i);
  if (https) return normalizeUrl(https[0]);

  const www = text.match(/\bwww\.[^\s,)]+/i);
  if (www) return normalizeUrl(`https://${www[0]}`);

  const domain = text.match(
    /\b([a-z0-9][\w-]*\.(?:com|ai|io|co|org|net|app|dev|in|uk))(?:\/[^\s,)]*)?\b/i,
  );
  if (domain) {
    const raw = domain[0];
    return normalizeUrl(raw.startsWith("http") ? raw : `https://${raw}`);
  }

  return null;
}

function normalizeUrl(url: string): string {
  let normalized = url.replace(/[.,;:!?)]+$/, "");
  if (!normalized.startsWith("http")) {
    normalized = `https://${normalized}`;
  }
  return normalized;
}

export function extractBrandNameFromMessage(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  for (const pattern of BRAND_PATTERNS) {
    const match = trimmed.match(pattern);
    const candidate = cleanBrandCandidate(match?.[1]?.trim() ?? "");
    if (candidate) return candidate;
  }

  const url = extractUrl(trimmed);
  if (url) {
    try {
      const hostname = new URL(url).hostname.replace(/^www\./, "");
      const root = hostname.split(".")[0];
      if (root && root.length >= 2) return root;
    } catch {
      /* ignore invalid url */
    }
  }

  const words = trimmed.split(/\s+/);
  if (
    words.length <= 3 &&
    !/\b(need|want|create|make|help|moodboard|design|build)\b/i.test(trimmed)
  ) {
    return cleanBrandCandidate(trimmed);
  }

  return null;
}

export function extractFromMessage(text: string): ExtractedContext {
  const trimmed = text.trim();
  const hints: string[] = [];
  const result: ExtractedContext = { hints };

  if (!trimmed) return result;

  const brandName = extractBrandNameFromMessage(trimmed);
  if (brandName) result.brandName = brandName;

  for (const { pattern, value } of PROJECT_TYPE_RULES) {
    if (pattern.test(trimmed)) {
      result.projectType = value;
      break;
    }
  }

  const url = extractUrl(trimmed);
  if (url) result.url = url;

  if (REDESIGN_PATTERN.test(trimmed) || url) {
    result.brandType = "Redesign/Refresh";
  } else if (NEW_BRAND_PATTERN.test(trimmed)) {
    result.brandType = "New brand";
  }

  for (const { pattern, value } of INDUSTRY_RULES) {
    const match = trimmed.match(pattern);
    if (match) {
      result.industry = value === "$0" ? match[0] : value;
      hints.push(`industry:${result.industry}`);
      break;
    }
  }

  for (const pattern of AUDIENCE_PATTERNS) {
    const match = trimmed.match(pattern);
    const audience = (match?.[1] ?? match?.[0])?.trim();
    if (audience && audience.length >= 3) {
      result.targetAudience = audience;
      hints.push(`audience:${audience}`);
      break;
    }
  }

  const saasDesc = trimmed.match(B2B_SAAS_DESCRIPTION);
  if (saasDesc) {
    result.businessDescription = saasDesc[1].trim();
    if (!result.industry) result.industry = "B2B SaaS";
  }

  if (/\bSaaS\b/i.test(trimmed) && !result.industry) {
    result.industry = "SaaS";
  }

  if (
    result.brandName &&
    result.targetAudience &&
    result.brandName.toLowerCase() === result.targetAudience.toLowerCase()
  ) {
    delete result.targetAudience;
  }

  if (
    result.brandName &&
    result.businessDescription &&
    isLikelyAudienceToken(result.brandName)
  ) {
    delete result.brandName;
  }

  return result;
}

export function mergeExtractedIntoAnswers(
  answers: Record<string, unknown>,
  extracted: ExtractedContext,
): Record<string, unknown> {
  const next = { ...answers };

  if (extracted.brandName && !hasStoredAnswer(next.q1, "q1")) {
    next.q1 = extracted.brandName;
  }
  if (extracted.projectType && !hasStoredAnswer(next.q3, "q3")) {
    next.q3 = extracted.projectType;
  }
  if (extracted.brandType && !hasStoredAnswer(next.q4, "q4")) {
    next.q4 = extracted.brandType;
  }
  if (extracted.url && !hasStoredAnswer(next.q4a, "q4a")) {
    if (!hasStoredAnswer(next.q4, "q4")) {
      next.q4 = "Redesign/Refresh";
    }
    next.q4a = extracted.url;
  }
  if (extracted.industry && !hasStoredAnswer(next.q5, "q5")) {
    next.q5 = extracted.industry;
  }
  if (extracted.targetAudience && !hasStoredAnswer(next.q6, "q6")) {
    next.q6 = extracted.targetAudience;
  }
  if (extracted.businessDescription && !hasStoredAnswer(next.q2, "q2")) {
    next.q2 = extracted.businessDescription;
  }

  return next;
}

export function personalizeQuestionText(
  question: MoodboardQuestion,
  answers: Record<string, unknown>,
): string {
  const brand = normalizeAnswer(answers.q1);
  if (question.key === "q2" && brand) {
    return `Tell me a bit about what ${formatBrandDisplay(brand)} does. What's the product or service?`;
  }
  return question.question_text;
}

export function buildIntakeAcknowledgment(
  answers: Record<string, unknown>,
  extracted: ExtractedContext,
  nextQuestion: MoodboardQuestion | null,
): string {
  const brand = normalizeAnswer(answers.q1) || extracted.brandName;
  const projectType = normalizeAnswer(answers.q3) || extracted.projectType;
  const isRedesign =
    normalizeAnswer(answers.q4) === "Redesign/Refresh" ||
    extracted.brandType === "Redesign/Refresh";
  const url = normalizeAnswer(answers.q4a) || extracted.url;

  let msg = "Got it";
  if (brand) {
    const brandLabel = formatBrandDisplay(brand);
    if (projectType && isRedesign) {
      msg = `Got it — ${brandLabel}, ${projectType.toLowerCase()} redesign`;
    } else if (projectType) {
      msg = `Got it — ${brandLabel}, ${projectType.toLowerCase()}`;
    } else {
      msg = `Got it — creating a moodboard for ${brandLabel}`;
    }
  }

  msg += ".";

  if (url) {
    msg += ` Researching ${url}…`;
    return msg;
  }

  if (nextQuestion?.key === "q2" && brand) {
    return `${msg.replace(/\.$/, "")}. ${personalizeQuestionText(nextQuestion, answers)}`;
  }

  return msg;
}

export function ackIncludesQuestion(
  nextQuestion: MoodboardQuestion | null,
  answers: Record<string, unknown>,
  extracted: ExtractedContext,
): boolean {
  const url = normalizeAnswer(answers.q4a) || extracted.url;
  return nextQuestion?.key === "q2" && Boolean(normalizeAnswer(answers.q1)) && !url;
}
