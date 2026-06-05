import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { loadEASettings } from "@/lib/ea-settings";

const MODEL = "claude-sonnet-4-5";

function buildSystemPrompt(eaName: string): string {
  return `You are ${eaName}, an executive assistant for Ganesh, a Design Manager. Extract from meeting notes: 1) Brief summary 2) Action items with owners 3) Key decisions made.

Respond ONLY with valid JSON in this exact format:
{
  "summary": "brief summary string",
  "actionItems": ["action item with owner", ...],
  "decisions": ["key decision", ...]
}`;
}

export async function POST(request: NextRequest) {
  try {
    const { title, attendees, notes } = await request.json();

    if (!notes?.trim()) {
      return NextResponse.json(
        { error: "Meeting notes are required." },
        { status: 400 },
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Anthropic API key not configured." },
        { status: 500 },
      );
    }

    const anthropic = new Anthropic({ apiKey });
    const { eaName } = await loadEASettings();

    const userContent = [
      title ? `Meeting: ${title}` : null,
      attendees ? `Attendees: ${attendees}` : null,
      `Notes:\n${notes.trim()}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: buildSystemPrompt(eaName),
      messages: [{ role: "user", content: userContent }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No response from AI." },
        { status: 500 },
      );
    }

    const raw = textBlock.text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch?.[0] ?? raw) as {
      summary?: string;
      actionItems?: string[];
      decisions?: string[];
    };

    return NextResponse.json({
      summary: parsed.summary ?? "",
      actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
    });
  } catch (error) {
    console.error("process-meeting error:", error);
    return NextResponse.json(
      { error: "Failed to process meeting." },
      { status: 500 },
    );
  }
}
