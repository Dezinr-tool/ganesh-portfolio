import {
  COACH_MODE_TRIGGERS,
  isCoachModeQuery,
} from "@/src/lib/ea/personality/coach-mode";

export { COACH_MODE_TRIGGERS, isCoachModeQuery };

export const AGENTS = {
  calendar: {
    model: "claude-haiku-4-5-20251001",
    triggers: [
      "schedule",
      "meeting",
      "event",
      "call",
      "cancel",
      "reschedule",
      "tomorrow",
      "today",
      "next week",
      "calendar",
      "free time",
      "aaj kya",
      "brief karo",
      "कल",
      "मीटिंग",
      "शेड्यूल",
      "आज",
    ],
  },
  chat: {
    model: "claude-haiku-4-5-20251001",
    triggers: ["default"],
  },
  meeting_analysis: {
    model: "claude-sonnet-4-6",
    triggers: [
      "summarize",
      "transcript",
      "action items",
      "notes",
      "meeting notes",
      "process meeting",
    ],
  },
} as const;

export type AgentKey = keyof typeof AGENTS;

export function routeMessage(message: string): AgentKey {
  const lower = message.toLowerCase();
  for (const [agent, config] of Object.entries(AGENTS)) {
    if (agent === "chat") continue;
    if (config.triggers.some((t) => lower.includes(t))) {
      return agent as AgentKey;
    }
  }
  return "chat";
}

export const CALENDAR_TRIGGERS = [
  "schedule",
  "meeting",
  "call",
  "event",
  "cancel",
  "reschedule",
  "tomorrow",
  "today",
  "next week",
  "calendar",
  "aaj kya",
  "brief karo",
  "कल",
  "आज",
  "मीटिंग",
  "शेड्यूल",
] as const;

export function needsCalendarData(message: string): boolean {
  const lower = message.toLowerCase();
  return CALENDAR_TRIGGERS.some((t) => lower.includes(t));
}
