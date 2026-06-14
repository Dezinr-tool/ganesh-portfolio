import Anthropic from "@anthropic-ai/sdk";
import { AGENTS } from "@/lib/agents/router";
import {
  getMemoriesSince,
  INSIGHT_CATEGORIES,
  type InsightCategory,
  type Memory,
} from "@/lib/memory-store";
import {
  buildCategoryInsights,
  buildWeeklyInsights,
  type CategoryInsights,
  type WeeklyInsights,
} from "@/lib/insights-service";

export type GeneratedWeeklyInsights = WeeklyInsights & {
  insights: string[];
  focusArea: string;
  generatedBy: "claude" | "rules";
};

export type GeneratedCategoryInsights = CategoryInsights & {
  trends: string[];
  generatedBy: "claude" | "rules";
};

const INSIGHT_CATEGORY_SET = new Set<string>(INSIGHT_CATEGORIES);

function insightMemories(memories: Memory[]): Memory[] {
  return memories.filter((m) => INSIGHT_CATEGORY_SET.has(m.category));
}

function memoriesToPromptBlock(memories: Memory[], limit: number = 40): string {
  if (memories.length === 0) {
    return "No meeting observations stored yet.";
  }

  return memories
    .slice(0, limit)
    .map((m) => {
      const parts = [
        `[${m.category}]`,
        m.clientName ? `client=${m.clientName}` : null,
        m.projectName ? `project=${m.projectName}` : null,
        m.sentimentScore !== null ? `sentiment=${m.sentimentScore}` : null,
        `importance=${m.importance}`,
        m.content,
      ].filter(Boolean);
      return parts.join(" | ");
    })
    .join("\n");
}

async function synthesizeWithClaude(
  system: string,
  userContent: string,
): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: AGENTS.meeting_analysis.model,
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: userContent }],
    });

    const block = response.content.find((b) => b.type === "text");
    return block?.type === "text" ? block.text.trim() : null;
  } catch {
    return null;
  }
}

function parseJsonFromText<T>(raw: string): T | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as T;
  } catch {
    return null;
  }
}

/**
 * Weekly insights synthesized from last 30 days of meeting memories.
 * Uses claude-sonnet-4-6 when available; falls back to rule-based summary.
 */
export async function generateWeeklyInsights(
  sessionId: string,
): Promise<GeneratedWeeklyInsights> {
  const base = await buildWeeklyInsights(sessionId);
  const memories = insightMemories(await getMemoriesSince(sessionId, 30));

  const claudeRaw = await synthesizeWithClaude(
    `You are Ganesh's executive coach. Analyze meeting observation logs and return ONLY valid JSON:
{
  "summary": "2-3 sentence natural language weekly insight (like a trusted senior colleague)",
  "insights": ["3-5 honest bullet insights — include gaps and avoidance patterns, not just positives"],
  "focusArea": "one key focus for this coming week"
}
Be direct. Ground every point in the observations. Indian English tone.`,
    `Observations from the last 30 days (${memories.length} total):\n\n${memoriesToPromptBlock(memories)}`,
  );

  if (claudeRaw) {
    const parsed = parseJsonFromText<{
      summary?: string;
      insights?: string[];
      focusArea?: string;
    }>(claudeRaw);

    if (parsed?.summary) {
      return {
        ...base,
        summary: parsed.summary,
        highlights: parsed.insights?.length ? parsed.insights : base.highlights,
        insights: parsed.insights ?? base.highlights,
        focusArea: parsed.focusArea ?? "Pick one recurring gap from recent meetings and address it deliberately this week.",
        generatedBy: "claude",
      };
    }
  }

  return {
    ...base,
    insights: base.highlights,
    focusArea: "Review last week's meeting patterns and pick one skill to sharpen.",
    generatedBy: "rules",
  };
}

/**
 * Category deep-dive with patterns, trends, and suggestions.
 */
export async function generateCategoryInsights(
  sessionId: string,
  category: InsightCategory,
): Promise<GeneratedCategoryInsights> {
  const base = await buildCategoryInsights(sessionId, category);
  const memories = await getMemoriesSince(sessionId, 30, category);

  const claudeRaw = await synthesizeWithClaude(
    `You are Ganesh's executive coach. Analyze ${category} meeting observations. Return ONLY valid JSON:
{
  "patterns": ["string"],
  "trends": ["string describing week-over-week or sentiment trends"],
  "suggestions": ["actionable suggestions"]
}
Be honest and specific. Indian English tone.`,
    `Category: ${category}\nObservations:\n${memoriesToPromptBlock(memories, 30)}`,
  );

  if (claudeRaw) {
    const parsed = parseJsonFromText<{
      patterns?: string[];
      trends?: string[];
      suggestions?: string[];
    }>(claudeRaw);

    if (parsed) {
      return {
        ...base,
        patterns: parsed.patterns?.length ? parsed.patterns : base.patterns,
        trends: parsed.trends ?? [],
        suggestions: parsed.suggestions?.length
          ? parsed.suggestions
          : base.suggestions,
        generatedBy: "claude",
      };
    }
  }

  const trends =
    base.trend === "up"
      ? [`${category} observations increased vs prior week.`]
      : base.trend === "down"
        ? [`${category} observations decreased vs prior week.`]
        : [`${category} activity stable week-over-week.`];

  return {
    ...base,
    trends,
    generatedBy: "rules",
  };
}

export function formatGeneratedWeeklyForPrompt(
  insights: GeneratedWeeklyInsights,
): string {
  const bullets = insights.insights.map((i) => `- ${i}`).join("\n");
  return `${insights.summary}

${bullets}

Key focus this week: ${insights.focusArea}`;
}
