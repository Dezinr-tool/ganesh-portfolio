import { NextRequest, NextResponse } from "next/server";
import { scrapeWebsite } from "@/lib/moodboard/scraper";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = typeof body.url === "string" ? body.url.trim() : "";
    if (!url) {
      return NextResponse.json({ error: "URL is required." }, { status: 400 });
    }

    const analysis = await scrapeWebsite(url);
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("[moodboard/scrape] error:", error);
    return NextResponse.json(
      { error: "Failed to analyze website." },
      { status: 500 },
    );
  }
}
