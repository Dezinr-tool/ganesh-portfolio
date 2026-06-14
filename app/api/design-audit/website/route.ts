import { NextRequest, NextResponse } from "next/server";
import { fetchWebsiteAuditInput } from "@/lib/design-audit/website";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = typeof body.url === "string" ? body.url.trim() : "";
    if (!url) {
      return NextResponse.json({ error: "URL is required." }, { status: 400 });
    }

    const result = await fetchWebsiteAuditInput(url);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[design-audit/website] error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to capture website.",
      },
      { status: 500 },
    );
  }
}
