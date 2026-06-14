import { NextRequest, NextResponse } from "next/server";
import { fetchFigmaAuditInput } from "@/lib/design-audit/figma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = typeof body.url === "string" ? body.url.trim() : "";
    if (!url) {
      return NextResponse.json({ error: "Figma URL is required." }, { status: 400 });
    }

    const result = await fetchFigmaAuditInput(url);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[design-audit/figma] error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch Figma data.",
      },
      { status: 500 },
    );
  }
}
