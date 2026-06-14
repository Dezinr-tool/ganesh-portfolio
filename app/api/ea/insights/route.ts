import { NextRequest, NextResponse } from "next/server";
import { requireEaSession } from "@/lib/ea-api-auth";
import { generateWeeklyInsights } from "@/lib/insights-generator";

export async function GET(request: NextRequest) {
  const auth = await requireEaSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const insights = await generateWeeklyInsights(auth.sessionId);
    return NextResponse.json(insights);
  } catch (error) {
    console.error("[ea/insights GET] error:", error);
    return NextResponse.json(
      { error: "Failed to load insights." },
      { status: 500 },
    );
  }
}
