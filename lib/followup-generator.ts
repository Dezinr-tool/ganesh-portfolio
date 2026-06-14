import Anthropic from "@anthropic-ai/sdk";
import { AGENTS } from "@/lib/agents/router";
import type { EAMeeting } from "@/lib/meetings-store";

export type FollowUpAttendee = {
  email: string;
  name?: string | null;
};

export type FollowUpDraft = {
  subject: string;
  body: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseAttendee(raw: string): FollowUpAttendee | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const angleMatch = trimmed.match(/^(.+?)\s*<([^>]+)>$/);
  if (angleMatch) {
    const email = angleMatch[2].trim();
    if (EMAIL_PATTERN.test(email)) {
      return { name: angleMatch[1].trim(), email };
    }
  }

  if (EMAIL_PATTERN.test(trimmed)) {
    return { email: trimmed, name: trimmed.split("@")[0] };
  }

  return null;
}

export function parseAttendeesFromMeeting(
  meeting: EAMeeting,
  extraAttendees: string[] = [],
): FollowUpAttendee[] {
  const sources = [...(meeting.attendees ?? []), ...extraAttendees];
  const seen = new Set<string>();
  const results: FollowUpAttendee[] = [];

  for (const raw of sources) {
    const parsed = parseAttendee(raw);
    if (!parsed) continue;
    const key = parsed.email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(parsed);
  }

  return results;
}

export async function generateFollowUpDraft(
  meeting: EAMeeting,
  attendee: FollowUpAttendee,
  context: {
    transcript: string;
    summary: string;
    actionItems: string[];
    senderName?: string;
  },
): Promise<FollowUpDraft> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Anthropic API key not configured.");
  }

  const anthropic = new Anthropic({ apiKey });
  const meetingTitle = meeting.title?.trim() || "Our meeting";
  const actionList =
    context.actionItems.length > 0
      ? context.actionItems.map((item) => `- ${item}`).join("\n")
      : "- None captured";

  const prompt = `Write a professional follow-up email after a meeting.

Meeting: ${meetingTitle}
Recipient: ${attendee.name ?? attendee.email} (${attendee.email})
From: ${context.senderName ?? "the meeting host"}

Summary:
${context.summary.trim() || "No summary available."}

Action items from the meeting:
${actionList}

Transcript excerpt (for tone and specifics):
${context.transcript.trim().slice(0, 4000)}

Return ONLY valid JSON:
{
  "subject": "clear subject line",
  "body": "email body in plain text, 2-4 short paragraphs, mention relevant action items for this recipient if any"
}`;

  const response = await anthropic.messages.create({
    model: AGENTS.chat.model,
    max_tokens: 800,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No response from AI.");
  }

  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(jsonMatch?.[0] ?? textBlock.text) as {
    subject?: string;
    body?: string;
  };

  return {
    subject: parsed.subject?.trim() || `Follow-up: ${meetingTitle}`,
    body:
      parsed.body?.trim() ||
      `Thanks for meeting today. Here is a quick recap:\n\n${context.summary.trim() || "We covered the topics discussed in our session."}`,
  };
}
