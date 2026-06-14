import { NextRequest, NextResponse } from "next/server";
import { requireEaSession } from "@/lib/ea-api-auth";
import { getClientProfile, getIntelligence } from "@/lib/intelligence-store";

type RouteContext = { params: Promise<{ name: string }> };

function sentimentTrend(history: unknown): Array<{ date: string; score: number }> {
  if (!Array.isArray(history)) return [];
  return history
    .filter(
      (entry): entry is { date: string; score: number } =>
        typeof entry === "object" &&
        entry !== null &&
        "score" in entry,
    )
    .slice(-10)
    .map((entry) => ({
      date: String((entry as { date?: string }).date ?? ""),
      score: Number((entry as { score?: number }).score ?? 0),
    }));
}

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireEaSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { name } = await context.params;
    const clientName = decodeURIComponent(name);

    const profile = await getClientProfile(auth.sessionId, clientName);
    if (!profile) {
      return NextResponse.json(
        { error: "Client profile not found." },
        { status: 404 },
      );
    }

    const recentIntelligence = await getIntelligence(auth.sessionId, {
      clientName: profile.client_name,
      limit: 15,
    });

    const trend = sentimentTrend(profile.sentiment_history);
    const latestScore =
      trend.length > 0 ? trend[trend.length - 1].score : null;

    const suggestions: string[] = [];
    if (latestScore !== null && latestScore < -0.2) {
      suggestions.push("Sentiment trending negative — proactive check-in recommended.");
    }
    if (Array.isArray(profile.red_flags) && profile.red_flags.length > 0) {
      suggestions.push(`Watch for: ${(profile.red_flags as string[]).slice(0, 2).join(", ")}`);
    }
    if (suggestions.length === 0) {
      suggestions.push("Log post-call notes while client dynamics are fresh.");
    }

    return NextResponse.json({
      profile: {
        clientName: profile.client_name,
        company: profile.company,
        communicationStyle: profile.communication_style,
        decisionStyle: profile.decision_style,
        interactionCount: profile.interaction_count,
        preferences: profile.preferences,
        redFlags: profile.red_flags,
        lastInteractionAt: profile.last_interaction_at,
      },
      recentIntelligence,
      sentimentTrend: trend,
      suggestions,
    });
  } catch (error) {
    console.error("[ea/intelligence/clients/[name] GET] error:", error);
    return NextResponse.json(
      { error: "Failed to load client profile." },
      { status: 500 },
    );
  }
}
