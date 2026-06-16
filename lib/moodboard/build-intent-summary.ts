import { extractBrandName, extractProjectType, normalizeAnswer } from "./question-flow";
import { INTAKE_FIELDS } from "./intake-fields";

export type IntentSummary = {
  brand_name: string;
  what_they_said: string[];
  key_quotes: string[];
  known_info: Record<string, string>;
  emotional_signals: string[];
  explicit_requests: string[];
  things_to_avoid: string[];
  references_mentioned: string[];
  url_research: string | null;
  project_type: string | null;
  audience: string | null;
};

const EMOTIONAL_PATTERN =
  /\b(premium|minimal(?:ist)?|luxury|luxurious|bold|friendly|corporate|playful|clean|modern|elegant|vibrant|warm|organic|edgy|sophisticated|professional|youthful|refined|rustic|techy|futuristic|trustworthy|approachable|authentic|inclusive|sustainable|confident|serene|dramatic|understated|expressive)\b/gi;

const REQUEST_PATTERN =
  /\b(?:want|need|looking for|must|should|please|make sure|focus on|emphasize|highlight|include|show|feel like|aim for)\s+([^.!?\n]{8,120})/gi;

const AVOID_PATTERN =
  /\b(?:avoid|don't|do not|never|no|not)\s+([^.!?\n]{4,80})/gi;

const REFERENCE_PATTERN =
  /\b(?:like|similar to|inspired by|reference|competitor(?:s)?(?:\s+like)?|not like)\s+([A-Z][\w\s&.-]{1,40})/gi;

function uniqueStrings(items: string[], limit = 12): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = item.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item.trim());
    if (out.length >= limit) break;
  }
  return out;
}

function pickKeyQuotes(messages: string[], max = 4): string[] {
  const scored = messages
    .map((text) => {
      const words = text.split(/\s+/).length;
      const score =
        words +
        (EMOTIONAL_PATTERN.test(text) ? 8 : 0) +
        (/\b(must|need|want|avoid|luxury|minimal|premium)\b/i.test(text) ? 6 : 0);
      EMOTIONAL_PATTERN.lastIndex = 0;
      return { text, score };
    })
    .sort((a, b) => b.score - a.score);

  return uniqueStrings(
    scored.slice(0, max).map((s) => s.text),
    max,
  );
}

function collectSignals(text: string, pattern: RegExp): string[] {
  return [...text.matchAll(pattern)].map((m) => m[1]?.trim() ?? m[0]?.trim()).filter(Boolean);
}

export function buildIntentSummary(
  answers: Record<string, unknown>,
  extras?: {
    brandResearch?: string;
    websiteAnalysis?: string;
    competitorResearch?: string;
    documentExtract?: string;
  },
): IntentSummary {
  const chatHistory =
    (answers._chat_history as Array<{ role: string; text: string }> | undefined) ?? [];
  const userMessages = chatHistory
    .filter((m) => m.role === "user")
    .map((m) => m.text.trim())
    .filter(Boolean);

  if (!userMessages.length && typeof answers.q2 === "string") {
    userMessages.push(String(answers.q2).trim());
  }

  const allUserText = userMessages.join("\n");
  const emotional_signals = uniqueStrings(
    [...allUserText.matchAll(EMOTIONAL_PATTERN)].map((m) => m[0].toLowerCase()),
    10,
  );

  const explicit_requests = uniqueStrings([
    ...collectSignals(allUserText, REQUEST_PATTERN),
    normalizeAnswer(answers.q14),
    normalizeAnswer(answers.q15),
  ].filter(Boolean));

  const things_to_avoid = uniqueStrings([
    ...collectSignals(allUserText, AVOID_PATTERN),
    normalizeAnswer(answers.q18),
  ].filter(Boolean));

  const references_mentioned = uniqueStrings([
    ...collectSignals(allUserText, REFERENCE_PATTERN),
    normalizeAnswer(answers.q10),
    normalizeAnswer(answers.q12),
  ].filter(Boolean));

  const known_info: Record<string, string> = {};
  for (const field of INTAKE_FIELDS) {
    const val = normalizeAnswer(answers[field.key]);
    if (val) known_info[field.label] = val;
  }

  const urlParts = [
    extras?.websiteAnalysis,
    extras?.brandResearch,
    extras?.competitorResearch,
    extras?.documentExtract,
    typeof answers._url_research === "string" ? answers._url_research : null,
  ].filter(Boolean);

  return {
    brand_name: extractBrandName(answers),
    what_they_said: userMessages,
    key_quotes: pickKeyQuotes(userMessages),
    known_info,
    emotional_signals,
    explicit_requests,
    things_to_avoid,
    references_mentioned,
    url_research: urlParts.length ? urlParts.join("\n\n").slice(0, 800) : null,
    project_type: extractProjectType(answers) || null,
    audience: normalizeAnswer(answers.q6) || null,
  };
}

/** Compact intent block (~500 tokens target) for generation prompts. */
export function formatIntentForPrompt(intent: IntentSummary): string {
  const lines: string[] = [
    `Brand: ${intent.brand_name}`,
    intent.project_type ? `Project: ${intent.project_type}` : "",
    intent.audience ? `Audience: ${intent.audience}` : "",
    "",
    "USER'S ACTUAL WORDS:",
    ...intent.what_they_said.slice(-6).map((m) => `- "${m}"`),
    "",
    "KEY QUOTES:",
    ...intent.key_quotes.map((q) => `- "${q.slice(0, 200)}"`),
    "",
    "WHAT WE KNOW:",
    ...Object.entries(intent.known_info).map(([k, v]) => `- ${k}: ${v.slice(0, 120)}`),
    "",
    `EMOTIONAL SIGNALS: ${intent.emotional_signals.join(", ") || "—"}`,
    `EXPLICIT REQUESTS: ${intent.explicit_requests.join("; ") || "—"}`,
    `THINGS TO AVOID: ${intent.things_to_avoid.join("; ") || "—"}`,
    `REFERENCES: ${intent.references_mentioned.join(", ") || "—"}`,
  ];

  if (intent.url_research) {
    lines.push("", "URL RESEARCH:", intent.url_research.slice(0, 400));
  }

  return lines.filter(Boolean).join("\n").slice(0, 2200);
}

export function buildIntentSystemPrompt(): string {
  return `You are a world-class creative director.
Generate exactly ONE moodboard direction per request.

CRITICAL RULES:
1. The direction must directly respond to what THIS specific user asked for
2. If they said 'minimal' — make it genuinely ultra-minimal, not generic 'clean'
3. If they said 'luxury' — directions must feel premium, not template luxury
4. If they mentioned a competitor — differentiate clearly from that competitor
5. Direction names must be specific to this brand (e.g. "Velvet Nocturne" for fragrance), never generic ("Modern Style", "Bold Vision", "Clean Minimal")
6. Color palettes must fit this brand and audience
7. Never use template language — every word must earn its place
8. Output must feel like a senior creative director who deeply understood the brief

Return ONLY valid JSON: { "direction": { ... } }`;
}
