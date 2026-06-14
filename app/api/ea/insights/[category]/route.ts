import { NextRequest, NextResponse } from "next/server";
import { requireEaSession } from "@/lib/ea-api-auth";
import { isInsightCategory } from "@/lib/memory-extractor";
import { generateCategoryInsights } from "@/lib/insights-generator";

type RouteContext = { params: Promise<{ category: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireEaSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { category } = await context.params;

    if (!isInsightCategory(category)) {
      return NextResponse.json(
        {
          error:
            "Invalid category. Use: design, business, client, leadership, emotional, learning.",
        },
        { status: 400 },
      );
    }

    const insights = await generateCategoryInsights(auth.sessionId, category);
    return NextResponse.json(insights);
  } catch (error) {
    console.error("[ea/insights/[category] GET] error:", error);
    return NextResponse.json(
      { error: "Failed to load category insights." },
      { status: 500 },
    );
  }
}
