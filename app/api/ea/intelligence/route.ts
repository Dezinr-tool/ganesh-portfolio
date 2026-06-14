import { NextRequest, NextResponse } from "next/server";
import { requireEaSession } from "@/lib/ea-api-auth";
import type { IntelligenceItem } from "@/lib/intelligence-extractor";
import {
  getIntelligence,
  getIntelligenceCategories,
  getIntelligenceCount,
  saveIntelligence,
} from "@/lib/intelligence-store";

export async function GET(request: NextRequest) {
  const auth = await requireEaSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") ?? undefined;
    const client = searchParams.get("client") ?? undefined;
    const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);
    const minImportance = Number(searchParams.get("minImportance") ?? 1);

    const items = await getIntelligence(auth.sessionId, {
      category,
      clientName: client,
      limit,
      minImportance,
    });

    const total = await getIntelligenceCount(auth.sessionId);
    const categories = await getIntelligenceCategories(auth.sessionId);

    return NextResponse.json({ items, total, categories });
  } catch (error) {
    console.error("[ea/intelligence GET] error:", error);
    return NextResponse.json(
      { error: "Failed to load intelligence." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireEaSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const insight = body.insight?.trim();
    const category = body.category?.trim();

    if (!insight || !category) {
      return NextResponse.json(
        { error: "category and insight are required." },
        { status: 400 },
      );
    }

    const item: IntelligenceItem = {
      category: category as IntelligenceItem["category"],
      insight,
      clientName: body.clientName?.trim(),
      projectName: body.projectName?.trim(),
      sentiment: typeof body.sentiment === "number" ? body.sentiment : 0,
      confidence: 0.8,
      importance: typeof body.importance === "number" ? body.importance : 6,
      tags: Array.isArray(body.tags) ? body.tags : [],
    };

    const saved = await saveIntelligence(
      auth.sessionId,
      [item],
      "manual",
    );

    return NextResponse.json({ saved: saved > 0 }, { status: 201 });
  } catch (error) {
    console.error("[ea/intelligence POST] error:", error);
    return NextResponse.json(
      { error: "Failed to save intelligence." },
      { status: 500 },
    );
  }
}
