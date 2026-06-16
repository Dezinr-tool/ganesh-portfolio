import { NextRequest, NextResponse } from "next/server";
import {
  analyzeCompetitorScreenshots,
  formatCompetitorAnalysisMessage,
} from "@/lib/ia/competitor-analyzer";
import { updateIaSessionExtended } from "@/lib/ia/db-store";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const sessionId = formData.get("sessionId") as string;
    const productContext = (formData.get("productContext") as string) ?? "";
    const differentiateFrom = (formData.get("differentiateFrom") as string) ?? "";

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required." }, { status: 400 });
    }

    const files: File[] = [];
    for (const entry of formData.getAll("files")) {
      if (entry instanceof File && entry.size > 0) files.push(entry);
    }

    if (!files.length) {
      return NextResponse.json({ error: "No image files provided." }, { status: 400 });
    }

    const analysis = await analyzeCompetitorScreenshots({
      files: files.slice(0, 10),
      productContext,
      differentiateFrom,
    });

    const screenshotNames = files.slice(0, 10).map((f) => f.name);

    await updateIaSessionExtended(sessionId, {
      competitor_analysis: analysis,
      competitor_screenshots: screenshotNames,
    });

    const message = formatCompetitorAnalysisMessage(analysis, files.length);

    return NextResponse.json({ analysis, message });
  } catch (error) {
    console.error("[ia/analyze-competitors] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed." },
      { status: 500 },
    );
  }
}
