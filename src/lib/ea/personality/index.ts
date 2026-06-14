import type { UserProfile } from "../userProfile";
import { CORE_TONE } from "./core-tone";
import { CONVERSATION_EXAMPLES } from "./conversation-examples";
import { INTENT_RULES } from "./intent-rules";
import { getAgentModePrompt } from "./agent-modes";
import { COACH_MODE } from "./coach-mode";

export type ChatAgentKey = "chat" | "calendar";

export type SystemPromptContext = {
  eaName: string;
  language?: string;
  agentKey: ChatAgentKey;
  calendarConnected?: boolean;
  calendarContext?: string | null;
  briefingContext?: string | null;
  memoryLines?: string[];
  ganeshContext?: string | null;
  coachingContext?: string | null;
  coachMode?: boolean;
  wantsCalendarHelp?: boolean;
  isGreeting?: boolean;
};

const STYLE_HINTS: Record<UserProfile["communicationStyle"], string> = {
  direct:
    "Be direct and to the point. Skip filler. Lead with the answer, then context if needed.",
  collaborative:
    "Be warm and inclusive. Offer options, ask clarifying questions when useful, and sound like a teammate.",
  analytical:
    "Be structured and precise. Use clear reasoning, trade-offs, and numbered steps when helpful.",
  casual:
    "Be relaxed and conversational — like a trusted colleague on Slack, not a formal assistant.",
};

function formatMemorySection(
  eaName: string,
  userName: string,
  lines: string[] | undefined,
): string {
  if (!lines?.length) return "";
  const body = lines
    .slice(0, 5)
    .map((line) => `- ${line.slice(0, 120)}`)
    .join("\n");
  const section = `## What ${eaName} remembers about ${userName}:\n${body}`;
  return section.length > 800 ? section.slice(0, 800) : section;
}

/**
 * Builds the complete EA chat system prompt — single source of truth.
 * All personality, intent, session context, and mode rules are assembled here.
 */
export function getSystemPrompt(
  userProfile: UserProfile,
  context: SystemPromptContext,
): string {
  const tz = userProfile.timezone || "Asia/Kolkata";
  const now = new Date();
  const dateContext = `Today's date is ${now.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: tz,
  })}. Current time is ${now.toLocaleTimeString("en-IN", {
    timeZone: tz,
  })} (${tz}).`;

  const userName = userProfile.name.trim() || "the user";
  const identity = `Your name is ${context.eaName}. Respond as ${context.eaName}. You assist ${userName}, ${userProfile.role || "a professional"}${userProfile.industry ? ` in ${userProfile.industry}` : ""}.`;

  const profileStyle = `## User communication preference
- ${STYLE_HINTS[userProfile.communicationStyle]}
- Match ${userName}'s energy and language. If they write in Hindi/Hinglish, mirror it naturally.
- Voice note: only the first 1–2 short sentences may be spoken aloud — put details (times, URLs, lists) in text after that.
${userProfile.workStyle ? `- Work style note: ${userProfile.workStyle}` : ""}`;

  const greetingRules = context.isGreeting
    ? `## Greeting mode (active)
The user just said hi — this is a warm check-in, not a task request.
- Greet back naturally and warmly. Ask how their day is going.
- Do NOT mention meetings, calendar, or schedule unless they asked.
- Do NOT jump to tasks, assume problems, reference calendar saves/failures, or mention anything that did not happen in this chat.`
    : "";

  const langHint =
    context.language === "hi"
      ? "Respond primarily in Hindi (Devanagari). Keep the same warm, conversational tone."
      : context.language === "en"
        ? "Respond in conversational Indian English. Warm, punchy, and natural."
        : `Match ${userName}'s language. Default to conversational Indian English with light Hinglish when it feels natural.`;

  const wantsCalendar = context.wantsCalendarHelp ?? false;
  const calendarTools = wantsCalendar
    ? context.calendarConnected
      ? `Google Calendar is connected. Use create_calendar_event when the user asks to schedule. Datetimes in ${tz}, ISO 8601. Default duration 30 minutes. Never claim a meeting is scheduled unless the tool succeeded.`
      : `Google Calendar is NOT connected. If asked to schedule, tell ${userName} to connect calendar from the dashboard.`
    : "";

  const sections: string[] = [
    dateContext,
    identity,
    CORE_TONE.trim(),
    profileStyle,
    INTENT_RULES.trim(),
    CONVERSATION_EXAMPLES.trim(),
    getAgentModePrompt(context.agentKey),
    langHint,
  ];

  if (greetingRules) sections.push(greetingRules);
  if (context.coachMode) sections.push(COACH_MODE.trim());
  if (calendarTools) sections.push(calendarTools);

  const memorySection = formatMemorySection(
    context.eaName,
    userName,
    context.memoryLines,
  );
  if (memorySection) sections.push(memorySection);

  if (context.ganeshContext?.trim()) {
    sections.push(`## Professional context\n${context.ganeshContext.trim()}`);
  }

  if (context.calendarContext?.trim() && wantsCalendar) {
    sections.push(`## Calendar context\n${context.calendarContext.trim()}`);
  }

  if (context.briefingContext?.trim()) {
    sections.push(`## Daily briefing\n${context.briefingContext.trim()}`);
  }

  if (context.coachingContext?.trim()) {
    sections.push(
      `## Coaching data (use honestly — from insights API)\n${context.coachingContext.trim()}`,
    );
  }

  return sections.filter(Boolean).join("\n\n");
}

export { CORE_TONE } from "./core-tone";
export { CONVERSATION_EXAMPLES } from "./conversation-examples";
export { INTENT_RULES } from "./intent-rules";
export { COACH_MODE, COACH_MODE_TRIGGERS, isCoachModeQuery } from "./coach-mode";
export { CALENDAR_MODE, CHAT_MODE, getAgentModePrompt } from "./agent-modes";
