import Anthropic from "@anthropic-ai/sdk";
import { AGENTS } from "@/lib/agents/router";
import { classifyActionItems } from "@/lib/action-item-classifier";
import { buildMeetingAnalysisSystemPrompt } from "@/lib/meeting-analysis-prompt";
import {
  replaceActionItemsForMeeting,
  updateMeeting,
  type EAMeeting,
} from "@/lib/meetings-store";
import { loadEASettings } from "@/lib/ea-settings";
import { getEffectiveUserProfile } from "@/src/lib/ea/userProfile";

export type ProcessedMeetingResult = {
  summary: string;
  actionItems: string[];
  decisions: string[];
  attendees: string[];
};

function parseProcessedResponse(raw: string): {
  summary: string;
  actionItems: unknown[];
  decisions: string[];
  attendees: string[];
} {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(jsonMatch?.[0] ?? raw) as {
    summary?: string;
    actionItems?: unknown[];
    decisions?: string[];
    attendees?: string[];
  };

  return {
    summary: parsed.summary ?? "",
    actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
    decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
    attendees: Array.isArray(parsed.attendees) ? parsed.attendees : [],
  };
}

/**
 * Summarize transcript and persist action items. Intelligence extraction lives in
 * `lib/meeting-pipeline.ts` to avoid duplicate memory writes.
 */
export async function processMeetingTranscript(
  meeting: EAMeeting,
  transcript: string,
  sessionId: string,
): Promise<ProcessedMeetingResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Anthropic API key not configured.");
  }

  const agent = AGENTS.meeting_analysis;
  const { eaName } = await loadEASettings();
  const profile = await getEffectiveUserProfile(sessionId);
  const userName = profile.name.trim() || "Ganesh";
  const anthropic = new Anthropic({ apiKey });

  const userContent = [
    meeting.title ? `Meeting: ${meeting.title}` : null,
    meeting.scheduledAt ? `Scheduled: ${meeting.scheduledAt}` : null,
    `Primary user: ${userName}`,
    `Transcript:\n${transcript.trim()}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const response = await anthropic.messages.create({
    model: agent.model,
    max_tokens: 2048,
    system: buildMeetingAnalysisSystemPrompt(eaName, userName),
    messages: [{ role: "user", content: userContent }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No response from AI.");
  }

  const parsed = parseProcessedResponse(textBlock.text.trim());
  const classified = classifyActionItems(parsed.actionItems, userName);

  const actionItemTitles = classified.map((item) => {
    if (item.taskType === "assigned_task" && item.assignedTo) {
      return `${item.assignedTo}: ${item.title}`;
    }
    return item.title;
  });

  await updateMeeting(meeting.id, sessionId, {
    status: "done",
    processedSummary: parsed.summary,
    actionItems: actionItemTitles,
    attendees: parsed.attendees,
  });

  await replaceActionItemsForMeeting(
    sessionId,
    meeting.id,
    classified.map((item) => ({
      title: item.title,
      assignee: item.assignee ?? undefined,
      dueDate: item.dueDate ?? undefined,
      taskType: item.taskType,
      assignedTo: item.assignedTo,
    })),
  );

  return {
    summary: parsed.summary,
    actionItems: actionItemTitles,
    decisions: parsed.decisions,
    attendees: parsed.attendees,
  };
}
