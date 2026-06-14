export const SCHEDULING_INTENT_PATTERN =
  /\b(schedule|scheduled|book|meeting|calendar|call with|block time|set up a call|arrange|random call|google meet|fix karo|meeting rakh|calendar mein|call lagao|schedule kar|book kar|milna hai|call hai|शेड्यूल|मीटिंग)\b/i;

/** User explicitly asked about meetings/calendar — gates context injection in chat API. */
export const CALENDAR_CONTEXT_INTENT_PATTERN =
  /\b(meetings?|schedule|scheduled|scheduling|calendar|calls?|appointment|appointments|book(?:ing)?)\b/i;

const GREETING_PATTERN =
  /^(hi+|hello+|hey+|hiya|howdy|namaste|good\s+(morning|afternoon|evening)|sup|yo|kya\s+haal|kaise\s+ho|kaisa\s+hai|sab\s+(?:theek|thik)|what'?s\s+up)\b[\s,!.-]*$/i;

const GUEST_EMAIL_REQUEST_PATTERN =
  /\b(what(?:'s| is)(?: the| their)? (?:guest|attendee|invitee?)(?:'s)? email|guest email|attendee email(?: address)?|their email address|email (?:address )?(?:for|of|to invite)(?: the)? (?:guest|attendee|them)|share (?:their|the) email|enter (?:the|their|guest) email|email id (?:do|dedo|bhej|share|batao)|invite (?:them|him|her) — (?:what|need) email)\b/i;

const TIME_OR_DATE_PATTERN =
  /\b(\d{1,2}(:\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)?|\d{1,2}\s*baje|at\s+\d{1,2}(?::\d{2})?|(?:today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)|next\s+week|\d{4}-\d{2}-\d{2}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2})\b/i;

const MEETING_SUBJECT_PATTERN =
  /\b(meeting with|call with|sync with|standup|1:1|one on one|review with|catch[\s-]?up with|discussion (?:on|about))\b/i;

export type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

export function isGreetingMessage(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 80) return false;
  if (SCHEDULING_INTENT_PATTERN.test(trimmed)) return false;
  if (GREETING_PATTERN.test(trimmed)) return true;
  return /^(hi+|hello+|hey+)\b[\s,!.-]+(there|ganesh|boss|bhai)?[!.?\s]*$/i.test(
    trimmed,
  );
}

export function hasSchedulingIntent(text: string): boolean {
  return SCHEDULING_INTENT_PATTERN.test(text);
}

export function hasCalendarContextIntent(text: string): boolean {
  return CALENDAR_CONTEXT_INTENT_PATTERN.test(text);
}

function conversationText(history: ChatTurn[], latestUser?: string): string {
  const parts = history.map((m) => m.content);
  if (latestUser) parts.push(latestUser);
  return parts.join("\n");
}

export function isExplicitGuestEmailRequest(assistantText: string): boolean {
  const normalized = assistantText.trim().toLowerCase();
  if (!normalized) return false;
  return GUEST_EMAIL_REQUEST_PATTERN.test(normalized);
}

export function hasMeetingTimeInConversation(conversation: string): boolean {
  return TIME_OR_DATE_PATTERN.test(conversation);
}

export function hasMeetingSubjectInConversation(conversation: string): boolean {
  if (MEETING_SUBJECT_PATTERN.test(conversation)) return true;
  return /\b(schedule|book|set up)\b[\s\S]{0,60}\b(meeting|call|sync)\b/i.test(
    conversation,
  );
}

const EMAIL_IN_TEXT_PATTERN =
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;

function recentSchedulingTurns(
  history: ChatTurn[],
  userMessage: string,
  limit = 6,
): ChatTurn[] {
  const recent = history.slice(-limit);
  return [...recent, { role: "user" as const, content: userMessage }];
}

/** Guest email field — only in a confirmed scheduling flow when EA explicitly asks. */
export function shouldShowGuestEmailInput(
  history: ChatTurn[],
  userMessage: string,
  assistantReply: string,
): boolean {
  if (isGreetingMessage(userMessage)) return false;
  if (!isExplicitGuestEmailRequest(assistantReply)) return false;

  const recent = recentSchedulingTurns(history, userMessage);
  const recentText = recent.map((turn) => turn.content).join("\n");
  if (!hasSchedulingIntent(recentText)) return false;

  const fullConversation = conversationText(history, userMessage);
  if (!hasMeetingTimeInConversation(fullConversation)) return false;
  if (!hasMeetingSubjectInConversation(fullConversation)) return false;

  if (EMAIL_IN_TEXT_PATTERN.test(fullConversation)) return false;

  return true;
}
