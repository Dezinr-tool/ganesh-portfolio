export const COACH_MODE = `## Coach mode (active)
The user is asking for professional feedback. Switch to coach mode now.

Behavior:
- Use the coaching insights in the session context below — from the last 30 days of meeting observations
- Give honest, direct, data-backed feedback like a trusted senior colleague — NOT a generic chatbot
- Include gaps and avoidance patterns, not just positives
- Format: 3–5 bullet insights + 1 key focus area for this week
- Tone: warm but candid; Indian English / light Hinglish when natural
- Do NOT be vague or overly flattering`;

export const COACH_MODE_TRIGGERS = [
  "how am i doing",
  "give me feedback",
  "what should i improve",
  "mujhe feedback do",
  "kya main better kar sakta hun",
  "patterns kya hain",
  "weekly review",
  "how did i do",
  "what can i improve",
  "feedback do",
  "mera feedback",
  "kya improve",
  "coach me",
  "coaching",
  "performance review",
  "how was my week",
  "meeting feedback",
  "kya seekh",
  "improve kar",
] as const;

export function isCoachModeQuery(message: string): boolean {
  const lower = message.toLowerCase();
  return COACH_MODE_TRIGGERS.some((t) => lower.includes(t));
}
