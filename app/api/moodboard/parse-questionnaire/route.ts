import { NextRequest, NextResponse } from "next/server";
import { parseQuestionnaire } from "@/lib/moodboard/generator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!text) {
      return NextResponse.json({ error: "Text is required." }, { status: 400 });
    }

    const parsed = await parseQuestionnaire(text);
    return NextResponse.json({ parsed });
  } catch (error) {
    console.error("[moodboard/parse-questionnaire] error:", error);
    return NextResponse.json(
      { error: "Failed to parse questionnaire." },
      { status: 500 },
    );
  }
}
