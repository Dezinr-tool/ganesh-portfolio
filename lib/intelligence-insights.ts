import Anthropic from "@anthropic-ai/sdk";
import { AGENTS } from "@/lib/agents/router";
import {
  getIntelligence,
  getIntelligenceStats,
  getPatterns,
} from "@/lib/intelligence-store";

export type IntelligenceNarrative = {
  narrative: string;
  stats: Awaited<ReturnType<typeof getIntelligenceStats>>;
  patterns: Array<{ description: string; evidenceCount: number }>;
  suggestions: string[];
  topLearnings: string[];
};

export async function buildIntelligenceNarrative(
  sessionId: string,
): Promise<IntelligenceNarrative> {
  const stats = await getIntelligenceStats(sessionId);
  const patterns = await getPatterns(sessionId);
  const recent = await getIntelligence(sessionId, { limit: 30, minImportance: 5 });

  const topLearnings = recent
    .filter((i) => i.category === "learning" || i.importance >= 8)
    .slice(0, 3)
    .map((i) => i.insight);

  const patternSummary = patterns
    .slice(0, 5)
    .map((p) => `${p.description} (seen ${p.evidence_count}x)`);

  const suggestions = [
    stats.avgSentiment !== null && stats.avgSentiment < 0
      ? "Recent client sentiment is dipping — schedule proactive check-ins."
      : null,
    stats.patternCount > 0
      ? "Review recurring patterns before your next client call."
      : null,
    stats.totalInsights < 5
      ? "Process more meetings to build intelligence depth."
      : null,
  ].filter((s): s is string => !!s);

  const fallbackNarrative =
    stats.totalInsights === 0
      ? "No intelligence captured yet. Process a meeting transcript to start building your professional intelligence layer."
      : `You have ${stats.totalInsights} insights from ${stats.meetingSources} meetings, ${stats.clientCount} clients profiled, and ${stats.patternCount} patterns identified.${
          stats.avgSentiment !== null
            ? ` Average sentiment: ${stats.avgSentiment.toFixed(2)}.`
            : ""
        }`;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || recent.length === 0) {
    return {
      narrative: fallbackNarrative,
      stats,
      patterns: patterns.map((p) => ({
        description: p.description,
        evidenceCount: p.evidence_count,
      })),
      suggestions: suggestions.length > 0 ? suggestions : ["Keep processing meetings to refine insights."],
      topLearnings,
    };
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: AGENTS.chat.model,
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `Write a 2-3 sentence weekly intelligence summary for Ganesh (Design Manager). Be specific and honest. Indian English tone.

Stats: ${JSON.stringify(stats)}
Patterns: ${patternSummary.join("; ") || "none yet"}
Recent insights:
${recent.slice(0, 15).map((i) => `- [${i.category}] ${i.insight}`).join("\n")}

Return ONLY the narrative paragraph, no JSON.`,
        },
      ],
    });

    const block = response.content.find((b) => b.type === "text");
    const narrative =
      block?.type === "text" ? block.text.trim() : fallbackNarrative;

    return {
      narrative,
      stats,
      patterns: patterns.map((p) => ({
        description: p.description,
        evidenceCount: p.evidence_count,
      })),
      suggestions:
        suggestions.length > 0
          ? suggestions
          : ["Ask Virtual EA for category-specific deep dives."],
      topLearnings,
    };
  } catch {
    return {
      narrative: fallbackNarrative,
      stats,
      patterns: patterns.map((p) => ({
        description: p.description,
        evidenceCount: p.evidence_count,
      })),
      suggestions,
      topLearnings,
    };
  }
}

export type ToolContextInput = {
  tool: "moodboard" | "ia" | "proposal" | "presentation";
  projectBrief?: string;
  clientName?: string;
  projectType?: string;
};

export async function buildToolContext(
  sessionId: string,
  input: ToolContextInput,
): Promise<Record<string, unknown>> {
  const items = await getIntelligence(sessionId, {
    clientName: input.clientName,
    limit: 25,
    minImportance: 4,
  });

  const designItems = items.filter((i) => i.category === "design");
  const businessItems = items.filter((i) => i.category === "business");
  const clientItems = items.filter((i) => i.category === "client");

  const fallback: Record<string, unknown> = {
    moodboard: {
      styleDirection: designItems.slice(0, 3).map((i) => i.insight),
      clientContext: clientItems.slice(0, 3).map((i) => i.insight),
      avoid: [],
      moodKeywords: ["modern", "editorial", "premium"],
    },
    ia: {
      userPatterns: ["task-focused"],
      clientExpectations: clientItems.slice(0, 2).map((i) => i.insight),
      projectComplexity: input.projectType ?? "medium",
      suggestedStructure: ["dashboard", "tasks", "reports"],
    },
    proposal: {
      clientDecisionStyle: "collaborative",
      pricingSensitivity: "medium",
      valueDrivers: businessItems.slice(0, 2).map((i) => i.insight),
      riskFactors: [],
      winFactors: ["show process", "3 tiers"],
    },
    presentation: {
      tone: "confident, editorial",
      keyPoints: items.slice(0, 5).map((i) => i.insight),
      avoid: [],
    },
  };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return (fallback[input.tool] ?? {}) as Record<string, unknown>;
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: AGENTS.chat.model,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Structure intelligence for the "${input.tool}" tool. Return ONLY valid JSON.

Project brief: ${input.projectBrief ?? "N/A"}
Client: ${input.clientName ?? "N/A"}
Project type: ${input.projectType ?? "N/A"}

Intelligence:
${items.map((i) => `[${i.category}] ${i.insight}`).join("\n")}

Expected shapes:
- moodboard: { styleDirection[], clientContext[], avoid[], moodKeywords[] }
- ia: { userPatterns[], clientExpectations[], projectComplexity, suggestedStructure[] }
- proposal: { clientDecisionStyle, pricingSensitivity, valueDrivers[], riskFactors[], winFactors[] }
- presentation: { tone, keyPoints[], avoid[] }`,
        },
      ],
    });

    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") {
      return (fallback[input.tool] ?? {}) as Record<string, unknown>;
    }

    const clean = block.text.replace(/```json|```/g, "").trim();
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]) as Record<string, unknown>;
    }
  } catch {
    // fall through
  }

  return (fallback[input.tool] ?? {}) as Record<string, unknown>;
}
