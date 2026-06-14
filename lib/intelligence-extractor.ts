import Anthropic from "@anthropic-ai/sdk";
import { AGENTS } from "@/lib/agents/router";

export type IntelligenceCategory =
  | "design"
  | "business"
  | "strategy"
  | "client"
  | "leadership"
  | "emotional"
  | "development"
  | "learning";

export type IntelligenceItem = {
  category: IntelligenceCategory;
  subcategory?: string;
  insight: string;
  rawContext?: string;
  clientName?: string;
  projectName?: string;
  sentiment: number;
  confidence: number;
  importance: number;
  tags: string[];
};

export type ClientProfile = {
  clientName: string;
  company?: string;
  communicationStyle?: string;
  decisionStyle?: string;
  sentiment: number;
  preferences: string[];
  redFlags: string[];
};

export type ExtractionResult = {
  intelligence: IntelligenceItem[];
  clientProfiles: ClientProfile[];
  patterns: string[];
  meetingSentimentOverall: number;
  keyMoments: string[];
};

const EXTRACTION_PROMPT = `You are an intelligence extraction engine.
Analyze this professional meeting transcript and extract structured insights.

Extract insights across these categories:

DESIGN: Visual preferences, aesthetic decisions, design process patterns,
tool preferences, delivery expectations, feedback on designs

BUSINESS: Pricing discussions, budget signals, ROI expectations,
competitive mentions, business model discussions, revenue/growth topics

STRATEGY: Long-term plans mentioned, strategic decisions, market positioning,
product roadmap discussions, partnership opportunities

CLIENT: Client personality, communication style, decision-making patterns,
what they care about most, their internal dynamics, approval process

LEADERSHIP: How the meeting was run, presentation effectiveness,
objection handling, negotiation style, confidence signals,
moments of authority or uncertainty

EMOTIONAL: Sentiment shifts during meeting, excitement/resistance signals,
trust building moments, tension points, energy levels

DEVELOPMENT: Technical decisions, tech stack discussions,
build vs buy decisions, timeline pressures, resource constraints

LEARNING: Gaps identified, questions that couldn't be answered confidently,
skills to develop, patterns to improve, missed opportunities

For each insight:
- Be specific, not generic ("client prefers 3 options" not "client has preferences")
- Include the raw context quote when relevant
- Rate sentiment -1.0 to 1.0
- Rate importance 1-10 (10 = critical pattern to remember)
- Tag with relevant keywords

Also extract:
- Client profile if a client is present
- Overall meeting sentiment
- 3-5 key moments that defined the meeting

Return ONLY valid JSON, no markdown, no explanation.

Format:
{
  "intelligence": [...],
  "clientProfiles": [...],
  "patterns": ["pattern 1", "pattern 2"],
  "meetingSentimentOverall": 0.0,
  "keyMoments": ["moment 1", "moment 2"]
}`;

const VALID_CATEGORIES = new Set<string>([
  "design",
  "business",
  "strategy",
  "client",
  "leadership",
  "emotional",
  "development",
  "learning",
]);

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeItem(raw: Partial<IntelligenceItem>): IntelligenceItem | null {
  if (!raw.insight?.trim()) return null;
  const category = VALID_CATEGORIES.has(raw.category ?? "")
    ? (raw.category as IntelligenceCategory)
    : "learning";

  return {
    category,
    subcategory: raw.subcategory,
    insight: raw.insight.trim().slice(0, 500),
    rawContext: raw.rawContext?.trim().slice(0, 500),
    clientName: raw.clientName?.trim(),
    projectName: raw.projectName?.trim(),
    sentiment: clamp(Number(raw.sentiment) || 0, -1, 1),
    confidence: clamp(Number(raw.confidence) || 0.5, 0, 1),
    importance: clamp(Math.round(Number(raw.importance) || 5), 1, 10),
    tags: Array.isArray(raw.tags)
      ? raw.tags.filter((t): t is string => typeof t === "string").slice(0, 10)
      : [],
  };
}

function normalizeProfile(raw: Partial<ClientProfile>): ClientProfile | null {
  if (!raw.clientName?.trim()) return null;
  return {
    clientName: raw.clientName.trim(),
    company: raw.company?.trim(),
    communicationStyle: raw.communicationStyle?.trim(),
    decisionStyle: raw.decisionStyle?.trim(),
    sentiment: clamp(Number(raw.sentiment) || 0, -1, 1),
    preferences: Array.isArray(raw.preferences)
      ? raw.preferences.filter((p): p is string => typeof p === "string")
      : [],
    redFlags: Array.isArray(raw.redFlags)
      ? raw.redFlags.filter((f): f is string => typeof f === "string")
      : [],
  };
}

function parseExtractionResult(raw: unknown): ExtractionResult {
  const data = raw as Partial<ExtractionResult>;
  const intelligence = (Array.isArray(data.intelligence) ? data.intelligence : [])
    .map((item) => normalizeItem(item as Partial<IntelligenceItem>))
    .filter((item): item is IntelligenceItem => item !== null);

  const clientProfiles = (
    Array.isArray(data.clientProfiles) ? data.clientProfiles : []
  )
    .map((p) => normalizeProfile(p as Partial<ClientProfile>))
    .filter((p): p is ClientProfile => p !== null);

  return {
    intelligence,
    clientProfiles,
    patterns: Array.isArray(data.patterns)
      ? data.patterns.filter((p): p is string => typeof p === "string").slice(0, 10)
      : [],
    meetingSentimentOverall: clamp(Number(data.meetingSentimentOverall) || 0, -1, 1),
    keyMoments: Array.isArray(data.keyMoments)
      ? data.keyMoments.filter((m): m is string => typeof m === "string").slice(0, 5)
      : [],
  };
}

export async function extractIntelligence(
  transcript: string,
  context?: {
    meetingTitle?: string;
    clientName?: string;
    projectName?: string;
    meetingType?: string;
  },
): Promise<ExtractionResult> {
  const trimmed = transcript.trim();
  if (!trimmed || trimmed.length < 30) {
    return {
      intelligence: [],
      clientProfiles: [],
      patterns: [],
      meetingSentimentOverall: 0,
      keyMoments: [],
    };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[intelligence-extractor] ANTHROPIC_API_KEY not configured");
    return {
      intelligence: [],
      clientProfiles: [],
      patterns: [],
      meetingSentimentOverall: 0,
      keyMoments: [],
    };
  }

  try {
    const contextStr = context
      ? `Meeting: ${context.meetingTitle || "Unknown"}
Client: ${context.clientName || "Unknown"}
Project: ${context.projectName || "Unknown"}
Type: ${context.meetingType || "General"}

`
      : "";

    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: AGENTS.meeting_analysis.model,
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: `${EXTRACTION_PROMPT}

${contextStr}TRANSCRIPT:
${trimmed.slice(0, 8000)}`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const text =
      textBlock?.type === "text" ? textBlock.text.replace(/```json|```/g, "").trim() : "{}";

    return parseExtractionResult(JSON.parse(text));
  } catch (error) {
    console.error("[intelligence-extractor] Failed:", error);
    return {
      intelligence: [],
      clientProfiles: [],
      patterns: [],
      meetingSentimentOverall: 0,
      keyMoments: [],
    };
  }
}

export async function extractIntelligenceFromChat(
  userMessage: string,
  assistantResponse: string,
): Promise<IntelligenceItem[]> {
  const items: IntelligenceItem[] = [];
  const combined = `${userMessage} ${assistantResponse}`.toLowerCase();

  if (combined.includes("client") || combined.includes("project")) {
    if (
      combined.includes("budget") ||
      combined.includes("cost") ||
      combined.includes("price") ||
      combined.includes("quote")
    ) {
      items.push({
        category: "business",
        subcategory: "pricing",
        insight: `Pricing discussion: ${userMessage.slice(0, 100)}`,
        sentiment: 0,
        confidence: 0.6,
        importance: 7,
        tags: ["pricing", "business"],
      });
    }
  }

  if (
    combined.includes("how do i") ||
    combined.includes("help me") ||
    combined.includes("not sure") ||
    combined.includes("kaise")
  ) {
    items.push({
      category: "learning",
      subcategory: "skill_gap",
      insight: `Knowledge gap identified: ${userMessage.slice(0, 100)}`,
      sentiment: -0.2,
      confidence: 0.5,
      importance: 5,
      tags: ["learning", "development"],
    });
  }

  return items;
}
