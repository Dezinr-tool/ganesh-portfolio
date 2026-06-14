import { NextRequest, NextResponse } from "next/server";
import { requireEaSession } from "@/lib/ea-api-auth";
import { getAllClientProfiles } from "@/lib/intelligence-store";

export async function GET(request: NextRequest) {
  const auth = await requireEaSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const rows = await getAllClientProfiles(auth.sessionId);
    const clients = rows.map((row) => ({
      id: row.id,
      clientName: row.client_name,
      company: row.company,
      communicationStyle: row.communication_style,
      decisionStyle: row.decision_style,
      interactionCount: row.interaction_count,
      lastInteractionAt: row.last_interaction_at
        ? row.last_interaction_at instanceof Date
          ? row.last_interaction_at.toISOString()
          : String(row.last_interaction_at)
        : null,
      preferences: Array.isArray(row.preferences) ? row.preferences : [],
      redFlags: Array.isArray(row.red_flags) ? row.red_flags : [],
    }));

    return NextResponse.json({ clients });
  } catch (error) {
    console.error("[ea/intelligence/clients GET] error:", error);
    return NextResponse.json(
      { error: "Failed to load client profiles." },
      { status: 500 },
    );
  }
}
