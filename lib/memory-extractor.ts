import type { InsightCategory } from "@/lib/memory-store";

export type ExtractedMemory = {
  content: string;
  category: "preference" | "fact" | "instruction" | "context" | "meeting";
  importance: number;
};

export type ExtractedTranscriptMemory = {
  content: string;
  category: InsightCategory;
  clientName: string | null;
  projectName: string | null;
  sentimentScore: number;
  importance: number;
};

export type TranscriptContext = {
  meetingTitle?: string | null;
  clientName?: string | null;
  projectName?: string | null;
};

const REMEMBER_PATTERN =
  /\b(remember that|remember this|yaad rakh|yaad rakho|note that|don't forget)\b/i;

const PREFERENCE_PATTERN =
  /\b(i prefer|i like|i always|i usually|mujhe pasand|mujhe achha lagta|prefer karta|pasand hai)\b/i;

const FACT_PATTERN =
  /\b(i work at|my team|my client|mera client|meri team|i am a|i'm a|main .* mein kaam|mera role)\b/i;

type CategoryRule = {
  category: InsightCategory;
  patterns: RegExp[];
  importance: number;
};

const TRANSCRIPT_RULES: CategoryRule[] = [
  {
    category: "design",
    importance: 7,
    patterns: [
      /\b(design system|figma|prototype|handoff|visual|ui|ux|component|wireframe|mockup|aesthetic|minimal|clean design|design token|accessibility|a11y|craft|pixel|layout|typography|spacing)\b/i,
      /\b(iteration|review|walkthrough|redline|spec|design-dev)\b/i,
    ],
  },
  {
    category: "business",
    importance: 8,
    patterns: [
      /\b(pric(e|ing)|budget|cost|rate|hourly|fixed cost|proposal|sow|scope|contract|invoice|payment|discount|retainer|quote|bid)\b/i,
      /\b(pitch|positioning|value prop|roi|deliverable|milestone|phase|descope|change request)\b/i,
    ],
  },
  {
    category: "client",
    importance: 8,
    patterns: [
      /\b(client|stakeholder|founder|ceo|pm|product manager|marketing lead|customer)\b/i,
      /\b(they (want|need|said|asked|prefer)|client (feedback|approval|review))\b/i,
      /\b(relationship|trust|ghosting|follow up|escalat)\b/i,
    ],
  },
  {
    category: "leadership",
    importance: 7,
    patterns: [
      /\b(let me walk you through|the key (point|decision)|i'll delegate|team will|designer will|pushback|present|facilitat|agenda|action item)\b/i,
      /\b(standup|sync|alignment|handover|lead|manage|direct)\b/i,
    ],
  },
  {
    category: "emotional",
    importance: 7,
    patterns: [
      /\b(frustrated|confused|happy|excited|concerned|worried|stress|tired|enthusias|skeptic|hesitant|positive|negative|at risk|deal|momentum)\b/i,
      /\b(great call|went well|didn't land|awkward|tension|push back|reluctant)\b/i,
    ],
  },
  {
    category: "learning",
    importance: 8,
    patterns: [
      /\b(i'm not sure|not sure|let me check|get back to you|need to think|don't know|uncertain|good question|i'll find out|need to learn|figure out)\b/i,
      /\b(gap|improve|develop|skill|training|avoid|defer|escalate to)\b/i,
    ],
  },
];

const POSITIVE_WORDS =
  /\b(great|excellent|love|perfect|happy|excited|yes|absolutely|approved|forward|momentum|enthusias)\b/i;
const NEGATIVE_WORDS =
  /\b(frustrated|angry|concerned|worried|confused|hesitant|reluctant|pushback|delay|cancel|pause|risk|problem|issue|unhappy)\b/i;

const PRICING_PUSHBACK =
  /\b(too (high|expensive|much)|budget|can't afford|lower the|discount|cheaper|price (is|seems)|cost concern)\b/i;

const CLIENT_NAME_PATTERN =
  /\b(?:client|with|from|for)\s+([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)?)\b/g;

function cleanExtract(text: string): string {
  return text
    .replace(/^(remember that|remember this|yaad rakh|note that)\s*/i, "")
    .trim()
    .slice(0, 280);
}

function clampSentiment(score: number): number {
  return Math.max(-1, Math.min(1, Math.round(score * 100) / 100));
}

export function scoreSentiment(text: string): number {
  const lower = text.toLowerCase();
  let score = 0;
  if (POSITIVE_WORDS.test(lower)) score += 0.4;
  if (NEGATIVE_WORDS.test(lower)) score -= 0.4;
  if (/\b(very|really|extremely)\s+(happy|frustrated|concerned)\b/i.test(lower)) {
    score += lower.includes("happy") ? 0.3 : -0.3;
  }
  if (score === 0) return 0.1;
  return clampSentiment(score);
}

function splitTranscriptSegments(transcript: string): string[] {
  return transcript
    .split(/\n+|(?<=[.!?])\s+/)
    .map((s) => s.replace(/^\[[\d:]+\]\s*/, "").trim())
    .filter((s) => s.length >= 20);
}

function inferClientName(
  segment: string,
  context: TranscriptContext,
): string | null {
  if (context.clientName?.trim()) return context.clientName.trim();
  const match = CLIENT_NAME_PATTERN.exec(segment);
  CLIENT_NAME_PATTERN.lastIndex = 0;
  return match?.[1]?.trim() ?? null;
}

function inferProjectName(
  segment: string,
  context: TranscriptContext,
): string | null {
  if (context.projectName?.trim()) return context.projectName.trim();
  if (context.meetingTitle?.trim()) return context.meetingTitle.trim();
  const projectMatch = segment.match(
    /\b(project|for)\s+([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)?)\b/,
  );
  return projectMatch?.[2]?.trim() ?? null;
}

function matchCategory(segment: string): CategoryRule | null {
  for (const rule of TRANSCRIPT_RULES) {
    if (rule.patterns.some((p) => p.test(segment))) {
      return rule;
    }
  }
  return null;
}

export function extractMemoriesFromMessage(
  userMessage: string,
  assistantResponse?: string,
): ExtractedMemory[] {
  void assistantResponse;
  const trimmed = userMessage.trim();
  if (!trimmed || trimmed.length < 8) return [];

  const lower = trimmed.toLowerCase();
  const results: ExtractedMemory[] = [];

  if (REMEMBER_PATTERN.test(lower)) {
    const content = cleanExtract(trimmed);
    if (content.length >= 8) {
      results.push({ content, category: "instruction", importance: 9 });
    }
    return results;
  }

  if (PREFERENCE_PATTERN.test(lower)) {
    results.push({
      content: trimmed.slice(0, 280),
      category: "preference",
      importance: 8,
    });
    return results;
  }

  if (FACT_PATTERN.test(lower)) {
    results.push({
      content: trimmed.slice(0, 280),
      category: "fact",
      importance: 7,
    });
    return results;
  }

  return [];
}

/**
 * Extract professional intelligence memories from a meeting transcript.
 * Covers design, business, client, leadership, emotional, and learning categories.
 */
export function extractMemoriesFromTranscript(
  transcript: string,
  meetingTitleOrContext?: string | TranscriptContext,
): ExtractedTranscriptMemory[] {
  const context: TranscriptContext =
    typeof meetingTitleOrContext === "string"
      ? { meetingTitle: meetingTitleOrContext, projectName: meetingTitleOrContext }
      : (meetingTitleOrContext ?? {});

  const trimmed = transcript.trim();
  if (!trimmed || trimmed.length < 30) return [];

  const segments = splitTranscriptSegments(trimmed);
  const seen = new Set<string>();
  const results: ExtractedTranscriptMemory[] = [];

  for (const segment of segments) {
    const rule = matchCategory(segment);
    if (!rule) continue;

    const key = `${rule.category}:${segment.slice(0, 80).toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const sentimentScore = scoreSentiment(segment);
    let importance = rule.importance;
    if (Math.abs(sentimentScore) >= 0.5) importance = Math.min(10, importance + 1);
    if (rule.category === "business" && PRICING_PUSHBACK.test(segment)) {
      importance = 9;
    }

    results.push({
      content: segment.slice(0, 280),
      category: rule.category,
      clientName: inferClientName(segment, context),
      projectName: inferProjectName(segment, context),
      sentimentScore,
      importance,
    });
  }

  return results;
}

export function isInsightCategory(value: string): value is InsightCategory {
  return (
    value === "design" ||
    value === "business" ||
    value === "client" ||
    value === "leadership" ||
    value === "emotional" ||
    value === "learning"
  );
}

export function hasPricingPushback(text: string): boolean {
  return PRICING_PUSHBACK.test(text);
}

export function isMorningHour(isoDate: string): boolean {
  const hour = new Date(isoDate).getHours();
  return hour >= 6 && hour < 12;
}
