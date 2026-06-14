import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { buildMeetingAnalysisSystemPrompt } from "@/lib/meeting-analysis-prompt";
import { AGENTS } from "@/lib/agents/router";
import { loadEASettings } from "@/lib/ea-settings";

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
    const agent = AGENTS.meeting_analysis;

    const userContent = [
      title ? `Meeting: ${title}` : null,
      attendees ? `Attendees: ${attendees}` : null,
      `Notes:\n${notes.trim()}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const response = await anthropic.messages.create({
      model: agent.model,
      max_tokens: 2048,
      system: buildMeetingAnalysisSystemPrompt(eaName),
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
      agent: "meeting_analysis",
      model: agent.model,
    });
  } catch (error) {
    console.error("process-meeting error:", error);
    return NextResponse.json(
      { error: "Failed to process meeting." },
      { status: 500 },
    );
  }
}
