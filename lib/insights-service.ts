import {
  getMemoriesSince,
  INSIGHT_CATEGORIES,
  type InsightCategory,
  type Memory,
} from "@/lib/memory-store";
import {
  hasPricingPushback,
  isMorningHour,
} from "@/lib/memory-extractor";

export type WeeklyInsights = {
  periodDays: number;
  weekDays: number;
  summary: string;
  stats: {
    totalObservations: number;
    byCategory: Record<InsightCategory, number>;
    clientCalls: number;
    pricingPushbackCount: number;
    avgSentiment: number | null;
    morningMeetingCount: number;
    afternoonMeetingCount: number;
  };
  highlights: string[];
  poweredByMemories: number;
};

export type CategoryInsights = {
  category: InsightCategory;
  periodDays: number;
  observationCount: number;
  weekCount: number;
  priorWeekCount: number;
  trend: "up" | "down" | "stable";
  avgSentiment: number | null;
  patterns: string[];
  clients: string[];
  projects: string[];
  suggestions: string[];
  recentMemories: Array<{
    content: string;
    clientName: string | null;
    projectName: string | null;
    sentimentScore: number | null;
    importance: number;
    createdAt: string;
  }>;
};

const INSIGHT_CATEGORY_SET = new Set<string>(INSIGHT_CATEGORIES);

function isInsightMemory(m: Memory): boolean {
  return INSIGHT_CATEGORY_SET.has(m.category);
}

function filterInsightMemories(memories: Memory[]): Memory[] {
  return memories.filter(isInsightMemory);
}

function countByCategory(memories: Memory[]): Record<InsightCategory, number> {
  const counts: Record<InsightCategory, number> = {
    design: 0,
    business: 0,
    client: 0,
    leadership: 0,
    emotional: 0,
    learning: 0,
  };
  for (const m of memories) {
    if (isInsightMemory(m)) {
      counts[m.category as InsightCategory] += 1;
    }
  }
  return counts;
}

function avgSentiment(memories: Memory[]): number | null {
  const scored = memories.filter((m) => m.sentimentScore !== null);
  if (scored.length === 0) return null;
  const sum = scored.reduce((acc, m) => acc + (m.sentimentScore ?? 0), 0);
  return Math.round((sum / scored.length) * 100) / 100;
}

function uniqueClients(memories: Memory[]): string[] {
  const set = new Set<string>();
  for (const m of memories) {
    if (m.clientName?.trim()) set.add(m.clientName.trim());
    if (m.category === "client" && m.content) {
      const match = m.content.match(/\bclient\s+([A-Z][a-zA-Z0-9]+)/i);
      if (match?.[1]) set.add(match[1]);
    }
  }
  return [...set];
}

function buildWeeklySummary(
  weekMemories: Memory[],
  stats: WeeklyInsights["stats"],
): string {
  if (weekMemories.length === 0) {
    return "No meeting observations stored this week yet. Process a meeting transcript and I'll start building your coaching insights.";
  }

  const parts: string[] = [];
  const clientCalls = stats.clientCalls;
  parts.push(
    `This week you had ${clientCalls} client-related observation${clientCalls === 1 ? "" : "s"} across ${stats.totalObservations} total insights.`,
  );

  if (stats.pricingPushbackCount > 0) {
    parts.push(
      `Pushback happened ${stats.pricingPushbackCount} time${stats.pricingPushbackCount === 1 ? "" : "s"} on pricing or budget.`,
    );
  } else if (stats.byCategory.business > 0) {
    parts.push("No major pricing pushback detected in business conversations.");
  }

  if (stats.morningMeetingCount > 0 || stats.afternoonMeetingCount > 0) {
    if (stats.morningMeetingCount > stats.afternoonMeetingCount) {
      parts.push("Your energy signals were strongest in morning meetings.");
    } else if (stats.afternoonMeetingCount > stats.morningMeetingCount) {
      parts.push("More observations came from afternoon meetings this week.");
    } else {
      parts.push("Meeting observations were evenly split between morning and afternoon.");
    }
  }

  if (stats.avgSentiment !== null) {
    if (stats.avgSentiment >= 0.3) {
      parts.push("Overall client sentiment trended positive.");
    } else if (stats.avgSentiment <= -0.2) {
      parts.push("Watch for friction — average sentiment dipped below neutral.");
    }
  }

  const topCategory = INSIGHT_CATEGORIES.reduce((best, cat) =>
    stats.byCategory[cat] > stats.byCategory[best] ? cat : best,
  );
  if (stats.byCategory[topCategory] > 0) {
    parts.push(`Most activity was in ${topCategory} (${stats.byCategory[topCategory]} observations).`);
  }

  return parts.join(" ");
}

function buildHighlights(weekMemories: Memory[]): string[] {
  return weekMemories
    .filter((m) => m.importance >= 7)
    .slice(0, 5)
    .map((m) => {
      const prefix = m.clientName ? `[${m.clientName}] ` : "";
      return `${prefix}${m.content.slice(0, 120)}`;
    });
}

export async function buildWeeklyInsights(
  sessionId: string,
): Promise<WeeklyInsights> {
  const periodDays = 30;
  const weekDays = 7;
  const allMemories = filterInsightMemories(
    await getMemoriesSince(sessionId, periodDays),
  );
  const weekCutoff = new Date();
  weekCutoff.setDate(weekCutoff.getDate() - weekDays);
  const weekMemories = allMemories.filter(
    (m) => new Date(m.createdAt) >= weekCutoff,
  );

  const byCategory = countByCategory(weekMemories);
  const clientCalls =
    byCategory.client +
    weekMemories.filter((m) => m.clientName !== null).length;
  const pricingPushbackCount = weekMemories.filter(
    (m) =>
      m.category === "business" &&
      (hasPricingPushback(m.content) ||
        /pushback|budget concern|too expensive/i.test(m.content)),
  ).length;

  let morningMeetingCount = 0;
  let afternoonMeetingCount = 0;
  for (const m of weekMemories) {
    if (isMorningHour(m.createdAt)) morningMeetingCount += 1;
    else afternoonMeetingCount += 1;
  }

  const stats: WeeklyInsights["stats"] = {
    totalObservations: weekMemories.length,
    byCategory,
    clientCalls,
    pricingPushbackCount,
    avgSentiment: avgSentiment(weekMemories),
    morningMeetingCount,
    afternoonMeetingCount,
  };

  return {
    periodDays,
    weekDays,
    summary: buildWeeklySummary(weekMemories, stats),
    stats,
    highlights: buildHighlights(weekMemories),
    poweredByMemories: allMemories.length,
  };
}

function categorySuggestions(
  category: InsightCategory,
  memories: Memory[],
  trend: CategoryInsights["trend"],
): string[] {
  const suggestions: string[] = [];

  switch (category) {
    case "design":
      if (memories.some((m) => /handoff|spec|redline/i.test(m.content))) {
        suggestions.push(
          "Handoff friction appeared in recent meetings — consider a tighter design-dev sync template.",
        );
      }
      if (trend === "up") {
        suggestions.push("Design topics are coming up more — good time to document your craft standards.");
      }
      break;
    case "business":
      if (memories.some((m) => hasPricingPushback(m.content))) {
        suggestions.push(
          "Pricing pushback detected — rehearse value framing before the next proposal call.",
        );
      }
      suggestions.push("Log win/loss reasons after each proposal to sharpen positioning.");
      break;
    case "client":
      if (memories.some((m) => (m.sentimentScore ?? 0) < -0.3)) {
        suggestions.push(
          "A client showed frustration recently — proactive check-in before the next deliverable.",
        );
      }
      suggestions.push("Update per-client notes after each call while details are fresh.");
      break;
    case "leadership":
      suggestions.push(
        "Review your last walkthrough — note one thing that landed and one to tighten.",
      );
      break;
    case "emotional":
      if (memories.some((m) => (m.sentimentScore ?? 0) < -0.2)) {
        suggestions.push("Schedule buffer time after high-friction calls to decompress.");
      }
      break;
    case "learning":
      if (memories.length >= 2) {
        suggestions.push(
          "Recurring uncertainty themes detected — pick one skill to deepen this month.",
        );
      }
      break;
  }

  if (suggestions.length === 0) {
    suggestions.push(`Keep observing ${category} signals in your next few meetings.`);
  }

  return suggestions;
}

export async function buildCategoryInsights(
  sessionId: string,
  category: InsightCategory,
): Promise<CategoryInsights> {
  const periodDays = 30;
  const weekDays = 7;
  const allCategory = await getMemoriesSince(sessionId, periodDays, category);

  const weekCutoff = new Date();
  weekCutoff.setDate(weekCutoff.getDate() - weekDays);
  const priorCutoff = new Date();
  priorCutoff.setDate(priorCutoff.getDate() - weekDays * 2);

  const weekMemories = allCategory.filter(
    (m) => new Date(m.createdAt) >= weekCutoff,
  );
  const priorWeekMemories = allCategory.filter((m) => {
    const d = new Date(m.createdAt);
    return d >= priorCutoff && d < weekCutoff;
  });

  let trend: CategoryInsights["trend"] = "stable";
  if (weekMemories.length > priorWeekMemories.length + 1) trend = "up";
  else if (weekMemories.length < priorWeekMemories.length - 1) trend = "down";

  const patterns = weekMemories
    .slice(0, 8)
    .map((m) => m.content.slice(0, 160));

  const clients = [
    ...new Set(
      weekMemories
        .map((m) => m.clientName)
        .filter((c): c is string => !!c?.trim()),
    ),
  ];

  const projects = [
    ...new Set(
      weekMemories
        .map((m) => m.projectName)
        .filter((p): p is string => !!p?.trim()),
    ),
  ];

  return {
    category,
    periodDays,
    observationCount: allCategory.length,
    weekCount: weekMemories.length,
    priorWeekCount: priorWeekMemories.length,
    trend,
    avgSentiment: avgSentiment(weekMemories),
    patterns,
    clients,
    projects,
    suggestions: categorySuggestions(category, weekMemories, trend),
    recentMemories: weekMemories.slice(0, 10).map((m) => ({
      content: m.content,
      clientName: m.clientName,
      projectName: m.projectName,
      sentimentScore: m.sentimentScore,
      importance: m.importance,
      createdAt: m.createdAt,
    })),
  };
}

export function formatWeeklyInsightsForPrompt(insights: WeeklyInsights): string {
  const lines = [
    insights.summary,
    "",
    "Highlights:",
    ...(insights.highlights.length > 0
      ? insights.highlights.map((h) => `- ${h}`)
      : ["- No high-importance observations yet"]),
    "",
    `Stats (last ${insights.weekDays} days): ${insights.stats.totalObservations} observations, avg sentiment ${insights.stats.avgSentiment ?? "n/a"}, pricing pushback ${insights.stats.pricingPushbackCount}x.`,
  ];
  return lines.join("\n");
}
