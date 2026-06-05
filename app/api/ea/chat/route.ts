import Anthropic from "@anthropic-ai/sdk";
import { after, NextRequest, NextResponse } from "next/server";
import type { CalendarEventItem } from "@/lib/google-calendar";
import {
  createCalendarEvent,
  mergeAttendeeEmails,
  normalizeDateTime,
} from "@/lib/google-calendar";
import {
  getCachedCalendarConnected,
  getCachedCalendarEventsContext,
  invalidateCalendarEventsCache,
} from "@/lib/ea-calendar-cache";
import { loadEASettings } from "@/lib/ea-settings";

const MODEL = "claude-haiku-4-5";

const BASE_SYSTEM_PROMPT = `You are Ganesh's personal executive assistant. He is a Design Manager at Brucira with 8+ years experience. You help with scheduling, meeting prep, follow-ups, tasks, and quick strategic thinking.

## How you talk
- Sound like a real person, not a bot. Warm, friendly, proactive, and energetic.
- Use conversational Indian English — natural, relaxed, and human.
- Start with quick acknowledgments when it fits: "Sure!", "Got it!", "Absolutely!", "On it!", "Haan, done!"
- Sprinkle light Hinglish naturally when it feels right — e.g. "bilkul", "haan", "theek hai" — but don't overdo it.
- Keep it short and punchy. Simple queries: 2–3 sentences max. No walls of text.
- Never sound robotic, stiff, or overly formal. No corporate jargon unless Ganesh uses it first.
- Be helpful and a step ahead — suggest the obvious next move when useful.

## Voice vs text (important)
Ganesh sees your full reply on screen, but only the first 1–2 sentences are read aloud. Keep your spoken part under 20 words total.
- Sentence 1: quick confirmation (e.g. "Done! Meeting scheduled." or "Sure — what's their email?")
- Sentence 2 (optional): one key detail only (e.g. "Meet link sent to rahul@gmail.com.")
- Put all other details in the text — times, dates, bullet lists, full Meet URLs, guest lists — these show on screen but are NOT read aloud.
- When asking for an email address, ask clearly in one short sentence so the email input field appears.

## Calendar & scheduling
When the user asks to schedule a meeting or block time, you MUST call the create_calendar_event tool — never claim a meeting is scheduled unless the tool was called. The tool queues the event instantly; confirm scheduling in your reply but never invent a Google Meet link (it appears on their calendar shortly). Use ISO 8601 datetimes in Asia/Kolkata timezone (e.g. 2026-06-06T15:00:00+05:30). Default meeting duration is 30 minutes unless specified otherwise.

When scheduling with other people, include attendee emails in the attendees field. Extract emails from the conversation (e.g. "call with rahul@gmail.com" → add rahul@gmail.com). If someone wants a meeting with another person but hasn't given an email, ask for it before calling create_calendar_event. Solo focus blocks or personal reminders don't need attendees.`;

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type AnthropicMessage = Anthropic.MessageParam;

const CALENDAR_TOOL: Anthropic.Tool = {
  name: "create_calendar_event",
  description:
    "Create a Google Calendar event when the user asks to schedule a meeting or block time. Required — call this before telling the user anything was scheduled.",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string", description: "Event title" },
      start: {
        type: "string",
        description: "Start datetime ISO 8601 with timezone",
      },
      end: {
        type: "string",
        description: "End datetime ISO 8601 with timezone",
      },
      description: { type: "string", description: "Optional description" },
      location: { type: "string", description: "Optional location" },
      attendees: {
        type: "array",
        items: { type: "string" },
        description:
          "Guest email addresses to invite. Extract from the conversation when the user mentions people to meet.",
      },
    },
    required: ["title", "start", "end"],
  },
};

const SCHEDULING_INTENT_PATTERN =
  /\b(schedule|scheduled|book|meeting|calendar|call with|block time|set up a call|arrange|random call|google meet|fix karo|meeting rakh|calendar mein|call lagao|schedule kar|book kar|milna hai|call hai)\b/i;

const SCHEDULING_CLAIM_PATTERN =
  /\b(scheduled|booked|added to your calendar|meeting set|schedule ho gaya|calendar pe daal|google meet|meet\.google\.com|✅|done!|ho gaya)\b/i;

const CALENDAR_QUERY_PATTERN =
  /\b(what'?s on my calendar|my schedule|today'?s meetings|today'?s schedule|upcoming meetings|calendar events|meetings today|what do i have today|free time|am i free|mera schedule|aaj ka schedule|calendar kya hai|calendar dikhao|schedule kya hai)\b/i;

function needsCalendarData(text: string): boolean {
  return hasSchedulingIntent(text) || CALENDAR_QUERY_PATTERN.test(text);
}

function buildSystemPrompt(
  language: string | undefined,
  calendarConnected: boolean,
  calendarContext: string | null,
  eaName: string,
): string {
  const now = new Date();
  const dateContext = `Today's date is ${now.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })}. Current time is ${now.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
  })} IST.`;

  const identity = `Your name is ${eaName}. Respond as ${eaName}.`;

  const langHint =
    language === "hi"
      ? "\n\nRespond primarily in Hindi (Devanagari). Keep the same warm, conversational tone — natural and human, not formal."
      : language === "en"
        ? "\n\nRespond in conversational Indian English. Warm, punchy, and natural."
        : "\n\nMatch Ganesh's language. Default to conversational Indian English with light Hinglish when it feels natural.";

  const calendarHint = calendarConnected
    ? "\n\nGoogle Calendar is connected. You can schedule events with create_calendar_event."
    : "\n\nGoogle Calendar is NOT connected. If asked to schedule, tell Ganesh to connect calendar from the dashboard.";

  const base = `${dateContext}\n\n${identity}\n\n${BASE_SYSTEM_PROMPT}${langHint}${calendarHint}`;

  if (!calendarContext) return base;

  return `${base}

## Calendar context
${calendarContext}`;
}

function getConversationText(
  history: ChatMessage[],
  userMessage: string,
): string {
  return [
    ...history.filter((m) => m.role === "user").map((m) => m.content),
    userMessage,
  ].join("\n");
}

function getFullConversationText(
  history: ChatMessage[],
  userMessage: string,
): string {
  return [...history.map((m) => m.content), userMessage].join("\n");
}

function hasSchedulingIntent(text: string): boolean {
  return SCHEDULING_INTENT_PATTERN.test(text);
}

function responseClaimsCalendarAction(text: string): boolean {
  return SCHEDULING_CLAIM_PATTERN.test(text);
}

function extractText(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

type PendingCalendarCreate = {
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  attendees?: string[];
};

function buildFinalMessage(
  text: string,
  calendarEvent: CalendarEventItem | null,
  calendarPending: boolean,
): string {
  if (
    calendarEvent?.meetLink &&
    text &&
    !text.includes(calendarEvent.meetLink)
  ) {
    return `${text}\n\nGoogle Meet: ${calendarEvent.meetLink}`;
  }

  if (
    !calendarEvent &&
    !calendarPending &&
    responseClaimsCalendarAction(text)
  ) {
    return "Sorry — that didn't actually save to your Google Calendar. Tell me the title, time, and guest email once more and I'll book it properly.";
  }

  return text;
}

type ToolHandlerContext = {
  conversationText: string;
  pendingCreates: PendingCalendarCreate[];
};

function handleCreateCalendarEventTool(
  toolUse: Anthropic.ToolUseBlock,
  context: ToolHandlerContext,
): Anthropic.ToolResultBlockParam {
  const input = toolUse.input as {
    title?: string;
    start?: string;
    end?: string;
    description?: string;
    location?: string;
    attendees?: string[];
  };

  console.log("[ea/chat] create_calendar_event input (queued):", input);

  if (!input.title || !input.start || !input.end) {
    const message = "Missing required event fields.";
    console.error("[ea/chat] create_calendar_event queue failed:", message);
    return {
      type: "tool_result",
      tool_use_id: toolUse.id,
      content: message,
      is_error: true,
    };
  }

  const attendees = mergeAttendeeEmails(input.attendees, context.conversationText);

  context.pendingCreates.push({
    title: input.title,
    start: normalizeDateTime(input.start),
    end: normalizeDateTime(input.end),
    description: input.description,
    location: input.location,
    attendees,
  });

  return {
    type: "tool_result",
    tool_use_id: toolUse.id,
    content: JSON.stringify({
      success: true,
      status: "queued",
      message:
        "Event queued for Google Calendar. Tell the user it is scheduled — Meet link will appear on their calendar shortly.",
    }),
  };
}

function processToolUses(
  toolUses: Anthropic.ToolUseBlock[],
  context: ToolHandlerContext,
): Anthropic.ToolResultBlockParam[] {
  const toolResults: Anthropic.ToolResultBlockParam[] = [];

  for (const toolUse of toolUses) {
    if (toolUse.name === "create_calendar_event") {
      toolResults.push(handleCreateCalendarEventTool(toolUse, context));
    } else {
      console.warn("[ea/chat] unknown tool:", toolUse.name);
      toolResults.push({
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: `Unknown tool: ${toolUse.name}`,
        is_error: true,
      });
    }
  }

  return toolResults;
}

function scheduleCalendarCreates(pendingCreates: PendingCalendarCreate[]): void {
  if (pendingCreates.length === 0) return;

  after(async () => {
    for (const pending of pendingCreates) {
      try {
        const event = await createCalendarEvent(pending);
        console.log("[ea/chat] background calendar create success:", {
          id: event.id,
          title: event.title,
          meetLink: event.meetLink,
        });
      } catch (err) {
        console.error(
          "[ea/chat] background calendar create failed:",
          err instanceof Error ? err.message : err,
        );
      }
    }
    invalidateCalendarEventsCache();
  });
}

async function runAssistantTurn(
  anthropic: Anthropic,
  systemPrompt: string,
  messages: AnthropicMessage[],
  calendarConnected: boolean,
  conversationText: string,
  pendingCreates: PendingCalendarCreate[],
  toolChoice?: Anthropic.MessageCreateParams["tool_choice"],
): Promise<{
  response: Anthropic.Message;
  messages: AnthropicMessage[];
  pendingCreates: PendingCalendarCreate[];
}> {
  let currentMessages = messages;
  const toolContext: ToolHandlerContext = {
    conversationText,
    pendingCreates,
  };

  let response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 300,
    stream: false,
    system: systemPrompt,
    tools: calendarConnected ? [CALENDAR_TOOL] : undefined,
    tool_choice: calendarConnected ? (toolChoice ?? { type: "auto" }) : undefined,
    messages: currentMessages,
  });

  while (response.stop_reason === "tool_use") {
    const toolUses = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
    );

    console.log("[ea/chat] tool_use blocks:", toolUses.map((t) => t.name));

    const toolResults = processToolUses(toolUses, toolContext);

    currentMessages = [
      ...currentMessages,
      { role: "assistant", content: response.content },
      { role: "user", content: toolResults },
    ];

    response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 300,
      stream: false,
      system: systemPrompt,
      tools: calendarConnected ? [CALENDAR_TOOL] : undefined,
      tool_choice: calendarConnected ? { type: "auto" } : undefined,
      messages: currentMessages,
    });
  }

  return {
    response,
    messages: currentMessages,
    pendingCreates: toolContext.pendingCreates,
  };
}

export async function POST(request: NextRequest) {
  console.log("[POST /api/ea/chat]", {
    url: request.url,
    hasEaAuthCookie: request.cookies.has("ea_auth"),
  });

  try {
    const { messages, userMessage, language } = await request.json();

    if (!userMessage?.trim()) {
      return NextResponse.json(
        { error: "Message is required." },
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

    const history: ChatMessage[] = Array.isArray(messages) ? messages : [];
    const trimmedUserMessage = userMessage.trim();
    const conversationText = getConversationText(history, trimmedUserMessage);
    const fullConversationText = getFullConversationText(
      history,
      trimmedUserMessage,
    );
    const needsCalendar = needsCalendarData(fullConversationText);
    const schedulingContext = hasSchedulingIntent(fullConversationText);

    const calendarConnected = await getCachedCalendarConnected();
    const calendarContext = needsCalendar
      ? await getCachedCalendarEventsContext(schedulingContext)
      : null;

    console.log("[ea/chat] calendar:", {
      needsCalendar,
      calendarConnected,
      hasContext: calendarContext !== null,
    });

    let currentMessages: AnthropicMessage[] = [
      ...history
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      { role: "user", content: trimmedUserMessage },
    ];

    const anthropic = new Anthropic({ apiKey });
    const eaSettings = await loadEASettings();
    const systemPrompt = buildSystemPrompt(
      language,
      calendarConnected,
      calendarContext,
      eaSettings.eaName,
    );

    const pendingCreates: PendingCalendarCreate[] = [];

    let { response, messages: workingMessages, pendingCreates: queuedCreates } =
      await runAssistantTurn(
        anthropic,
        systemPrompt,
        currentMessages,
        calendarConnected,
        conversationText,
        pendingCreates,
      );

    const initialText = extractText(response.content);

    if (
      calendarConnected &&
      queuedCreates.length === 0 &&
      (schedulingContext || responseClaimsCalendarAction(initialText))
    ) {
      console.log(
        "[ea/chat] scheduling intent detected but no calendar event — forcing tool",
      );

      const retry = await runAssistantTurn(
        anthropic,
        systemPrompt,
        [
          ...workingMessages,
          { role: "assistant", content: response.content },
          {
            role: "user",
            content:
              "Call create_calendar_event NOW using the meeting details from our conversation. Use the correct date from today’s context. Do not reply with text until the tool succeeds.",
          },
        ],
        calendarConnected,
        conversationText,
        pendingCreates,
        { type: "tool", name: "create_calendar_event" },
      );

      response = retry.response;
      workingMessages = retry.messages;
      queuedCreates = retry.pendingCreates;
    }

    const calendarPending = queuedCreates.length > 0;
    const message = buildFinalMessage(
      extractText(response.content),
      null,
      calendarPending,
    );

    if (!message) {
      return NextResponse.json(
        { error: "No response from AI." },
        { status: 500 },
      );
    }

    console.log("[ea/chat] response ready:", {
      calendarPending,
      queuedCount: queuedCreates.length,
      schedulingContext,
    });

    scheduleCalendarCreates(queuedCreates);

    return NextResponse.json({
      message,
      calendarEvent: null,
      calendarPending,
      calendarUpdated: calendarPending,
    });
  } catch (error) {
    console.error("ea chat error:", error);
    return NextResponse.json(
      { error: "Failed to get response." },
      { status: 500 },
    );
  }
}
