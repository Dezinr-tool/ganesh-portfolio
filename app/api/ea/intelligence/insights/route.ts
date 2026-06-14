import { NextRequest, NextResponse } from "next/server";
import { requireEaSession } from "@/lib/ea-api-auth";
import { buildIntelligenceNarrative } from "@/lib/intelligence-insights";

export async function GET(request: NextRequest) {
  const auth = await requireEaSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const summary = await buildIntelligenceNarrative(auth.sessionId);
    return NextResponse.json(summary);
  } catch (error) {
    console.error("[ea/intelligence/insights GET] error:", error);
    return NextResponse.json(
      { error: "Failed to load intelligence insights." },
      { status: 500 },
    );
  }
}
