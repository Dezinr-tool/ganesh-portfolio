import Anthropic from "@anthropic-ai/sdk";
import { after, NextRequest, NextResponse } from "next/server";
import type { CalendarEventItem } from "@/lib/google-calendar";
import {
  createCalendarEvent,
  findConflictingEvents,
  formatEventTime,
  getDailyBriefing,
  mergeAttendeeEmails,
  normalizeDateTime,
} from "@/lib/google-calendar";
import {
  getCachedCalendarConnected,
  getCachedCalendarEventsContext,
  invalidateCalendarEventsCache,
} from "@/lib/ea-calendar-cache";
import { loadEASettings } from "@/lib/ea-settings";
import { AGENTS, routeMessage, type AgentKey } from "@/lib/agents/router";
import { getSystemPrompt, isCoachModeQuery, type ChatAgentKey } from "@/src/lib/ea/personality";
import {
  getEffectiveUserProfile,
  logMessageSentiment,
} from "@/src/lib/ea/userProfile";
import { resolveEaSessionId } from "@/lib/ea-api-auth";
import { saveConversationMessage } from "@/lib/ea-conversations-store";
import { extractMemoriesFromMessage } from "@/lib/memory-extractor";
import { extractIntelligenceFromChat } from "@/lib/intelligence-extractor";
import { saveIntelligence } from "@/lib/intelligence-store";
import { getRecentMemories, saveMemory } from "@/lib/memory-store";
import {
  generateWeeklyInsights,
  formatGeneratedWeeklyForPrompt,
} from "@/lib/insights-generator";
import {
  loadGaneshContextForPrompt,
} from "@/lib/ganesh-context-loader";
import {
  loadAndFormatContext,
  extractClientFromMessage,
} from "@/lib/context-loader";
import {
  isGreetingMessage,
  hasSchedulingIntent,
  hasCalendarContextIntent,
  shouldShowGuestEmailInput,
  type ChatTurn,
} from "@/lib/ea-scheduling-ui";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type AnthropicMessage = Anthropic.MessageParam;

const HISTORY_LIMIT = 10;

const AGENT_MAX_TOKENS: Record<AgentKey, number> = {
  chat: 300,
  calendar: 300,
  meeting_analysis: 1024,
};

function getAgentMaxTokens(agentKey: AgentKey): number {
  return AGENT_MAX_TOKENS[agentKey];
}

function shouldEnableCalendarTools(
  agentKey: AgentKey,
  calendarConnected: boolean,
  schedulingContext: boolean,
): boolean {
  if (!calendarConnected) return false;
  if (agentKey === "calendar") return true;
  if (agentKey === "chat" && schedulingContext) return true;
  return false;
}

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

const SCHEDULING_CLAIM_PATTERN =
  /\b(scheduled|booked|added to your calendar|meeting set|schedule ho gaya|calendar pe daal|meet\.google\.com\/)\b/i;

const BRIEFING_PATTERN =
  /\b(aaj kya hai|brief karo|daily briefing|aaj ka schedule|today'?s briefing|morning brief)\b/i;

function wantsCoachingInsights(text: string): boolean {
  return isCoachModeQuery(text);
}

function buildCachedSystem(
  systemPrompt: string,
): Anthropic.MessageCreateParams["system"] {
  return [
    {
      type: "text",
      text: systemPrompt,
      cache_control: { type: "ephemeral" },
    },
  ];
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

function responseClaimsCalendarAction(text: string): boolean {
  return SCHEDULING_CLAIM_PATTERN.test(text);
}

function wantsBriefing(text: string): boolean {
  return BRIEFING_PATTERN.test(text);
}

function extractText(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

function sliceHistory(messages: ChatMessage[]): ChatMessage[] {
  return messages.slice(-HISTORY_LIMIT);
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
): string {
  if (
    calendarEvent?.meetLink &&
    text &&
    !text.includes(calendarEvent.meetLink)
  ) {
    return `${text}\n\nGoogle Meet: ${calendarEvent.meetLink}`;
  }

  return text;
}

type ToolHandlerContext = {
  sessionId: string;
  conversationText: string;
  pendingCreates: PendingCalendarCreate[];
};

async function handleCreateCalendarEventTool(
  toolUse: Anthropic.ToolUseBlock,
  context: ToolHandlerContext,
): Promise<Anthropic.ToolResultBlockParam> {
  const input = toolUse.input as {
    title?: string;
    start?: string;
    end?: string;
    description?: string;
    location?: string;
    attendees?: string[];
  };

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

  const start = normalizeDateTime(input.start);
  const end = normalizeDateTime(input.end);

  const conflicts = await findConflictingEvents(
    context.sessionId,
    start,
    end,
  );
  if (conflicts.length > 0) {
    const conflictList = conflicts
      .map((c) => `${c.title} (${formatEventTime(c)})`)
      .join(", ");
    return {
      type: "tool_result",
      tool_use_id: toolUse.id,
      content: JSON.stringify({
        success: false,
        conflict: true,
        message: `Time slot conflicts with: ${conflictList}. Suggest an alternative time to the user.`,
        conflictingEvents: conflicts.map((c) => ({
          title: c.title,
          start: c.start,
          end: c.end,
        })),
      }),
      is_error: true,
    };
  }

  const attendees = mergeAttendeeEmails(input.attendees, context.conversationText);

  context.pendingCreates.push({
    title: input.title,
    start,
    end,
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

async function processToolUses(
  toolUses: Anthropic.ToolUseBlock[],
  context: ToolHandlerContext,
): Promise<Anthropic.ToolResultBlockParam[]> {
  const toolResults: Anthropic.ToolResultBlockParam[] = [];

  for (const toolUse of toolUses) {
    if (toolUse.name === "create_calendar_event") {
      toolResults.push(await handleCreateCalendarEventTool(toolUse, context));
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

function scheduleCalendarCreates(
  sessionId: string,
  pendingCreates: PendingCalendarCreate[],
): void {
  if (pendingCreates.length === 0) return;

  after(async () => {
    for (const pending of pendingCreates) {
      try {
        await createCalendarEvent(sessionId, pending);
      } catch (err) {
        console.error(
          "[ea/chat] background calendar create failed:",
          err instanceof Error ? err.message : err,
        );
      }
    }
    invalidateCalendarEventsCache(sessionId);
  });
}

function persistConversation(
  sessionId: string,
  userMessage: string,
  assistantMessage: string,
): void {
  after(async () => {
    try {
      await saveConversationMessage(sessionId, "user", userMessage);
      await saveConversationMessage(sessionId, "assistant", assistantMessage);
      await logMessageSentiment(sessionId, "user", userMessage);
      await logMessageSentiment(sessionId, "assistant", assistantMessage);
    } catch (err) {
      console.error("[ea/chat] failed to persist conversation:", err);
    }
  });
}

function persistExtractedMemories(
  sessionId: string,
  userMessage: string,
  assistantMessage: string,
): void {
  after(async () => {
    try {
      const extracted = extractMemoriesFromMessage(userMessage, assistantMessage);
      for (const memory of extracted) {
        await saveMemory(
          sessionId,
          memory.content,
          memory.category,
          "conversation",
          memory.importance,
        );
      }
    } catch (err) {
      console.error("[ea/chat] failed to persist memories:", err);
    }
  });
}

function persistChatIntelligence(
  sessionId: string,
  userMessage: string,
  assistantMessage: string,
): void {
  after(async () => {
    try {
      const items = await extractIntelligenceFromChat(
        userMessage,
        assistantMessage,
      );
      if (items.length > 0) {
        await saveIntelligence(sessionId, items, "conversation");
      }
    } catch (err) {
      console.error("[ea/chat] failed to persist intelligence:", err);
    }
  });
}

async function runAssistantTurn(
  anthropic: Anthropic,
  systemPrompt: string,
  model: string,
  maxTokens: number,
  messages: AnthropicMessage[],
  calendarToolsEnabled: boolean,
  sessionId: string,
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
    sessionId,
    conversationText,
    pendingCreates,
  };

  const cachedSystem = buildCachedSystem(systemPrompt);

  let response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    stream: false,
    system: cachedSystem,
    tools: calendarToolsEnabled ? [CALENDAR_TOOL] : undefined,
    tool_choice: calendarToolsEnabled
      ? (toolChoice ?? { type: "auto" })
      : undefined,
    messages: currentMessages,
  });

  while (response.stop_reason === "tool_use") {
    const toolUses = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
    );

    const toolResults = await processToolUses(toolUses, toolContext);

    currentMessages = [
      ...currentMessages,
      { role: "assistant", content: response.content },
      { role: "user", content: toolResults },
    ];

    response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      stream: false,
      system: cachedSystem,
      tools: calendarToolsEnabled ? [CALENDAR_TOOL] : undefined,
      tool_choice: calendarToolsEnabled ? { type: "auto" } : undefined,
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
  try {
    // Billing disabled — daily message limit enforcement commented out:
    // const eaToken = request.cookies.get(EA_TOKEN_COOKIE)?.value;
    // if (eaToken) {
    //   const user = await getSessionUser(eaToken);
    //   if (user) {
    //     const usage = await getDailyUsage(user.id);
    //     const plan = normalizePlan(user.plan);
    //     const limitCheck = checkLimit(plan, "messagesPerDay", usage);
    //     if (!limitCheck.allowed) {
    //       return NextResponse.json(
    //         {
    //           error:
    //             "Daily limit reached. Upgrade your plan for more messages.",
    //           upgrade: true,
    //         },
    //         { status: 429 },
    //       );
    //     }
    //     await trackMessage(user.id);
    //   }
    // }

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

    const rawHistory: ChatMessage[] = Array.isArray(messages) ? messages : [];
    const history = sliceHistory(rawHistory);
    const trimmedUserMessage = userMessage.trim();
    const conversationText = getConversationText(history, trimmedUserMessage);
    const fullConversationText = getFullConversationText(
      history,
      trimmedUserMessage,
    );

    const agentKey = isGreetingMessage(trimmedUserMessage)
      ? "chat"
      : routeMessage(fullConversationText);
    const chatAgentKey: ChatAgentKey =
      agentKey === "calendar" ? "calendar" : "chat";
    const agent = AGENTS[chatAgentKey];
    const model = agent.model;
    const maxTokens = getAgentMaxTokens(chatAgentKey);

    const sessionId = await resolveEaSessionId(request);

    const isGreeting = isGreetingMessage(trimmedUserMessage);
    const schedulingContext =
      !isGreeting && hasSchedulingIntent(trimmedUserMessage);
    const briefingRequested =
      !isGreeting && wantsBriefing(trimmedUserMessage);
    const coachingRequested =
      !isGreetingMessage(trimmedUserMessage) &&
      wantsCoachingInsights(fullConversationText);
    const coachMode = coachingRequested;

    const calendarContextRequested =
      !isGreeting &&
      (hasCalendarContextIntent(trimmedUserMessage) ||
        schedulingContext ||
        briefingRequested);

    const calendarConnected =
      calendarContextRequested && sessionId
        ? await getCachedCalendarConnected(sessionId)
        : false;

    const calendarToolsEnabled = shouldEnableCalendarTools(
      chatAgentKey,
      calendarConnected,
      schedulingContext,
    );

    const calendarContext =
      calendarContextRequested && calendarConnected && sessionId
        ? await getCachedCalendarEventsContext(sessionId, schedulingContext)
        : null;

    let briefingContext: string | null = null;
    if (briefingRequested && calendarConnected && sessionId) {
      const briefing = await getDailyBriefing(sessionId);
      if (briefing) {
        briefingContext = briefing.summary;
        if (briefing.conflicts.length > 0) {
          briefingContext += `\nConflicts: ${briefing.conflicts.map((c) => `${c.eventA} overlaps ${c.eventB} at ${c.time}`).join("; ")}`;
        }
      }
    }

    let coachingContext: string | null = null;
    if (coachingRequested) {
      const sessionIdForInsights = await resolveEaSessionId(request);
      if (sessionIdForInsights) {
        try {
          const insights = await generateWeeklyInsights(sessionIdForInsights);
          coachingContext = formatGeneratedWeeklyForPrompt(insights);
        } catch (err) {
          console.error("[ea/chat] failed to load coaching insights:", err);
        }
      }
    }

    const currentMessages: AnthropicMessage[] = [
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

    const userProfile = sessionId
      ? await getEffectiveUserProfile(sessionId)
      : null;

    const recentMemories = sessionId
      ? await getRecentMemories(sessionId, 5)
      : [];

    let ganeshContext: string | null = null;
    try {
      const profile = await loadGaneshContextForPrompt();
      if (profile.trim()) {
        ganeshContext = profile.trim();
      }
    } catch (err) {
      console.error("[ea/chat] failed to load ganesh context:", err);
    }

    const wantsCalendarHelp =
      calendarContextRequested &&
      (chatAgentKey === "calendar" ||
        (chatAgentKey === "chat" && schedulingContext));

    const systemPrompt = getSystemPrompt(
      userProfile ?? {
        sessionId: "anonymous",
        name: "Ganesh",
        role: "Design Manager",
        industry: "Design / Technology",
        communicationStyle: "casual",
        timezone: "Asia/Kolkata",
        workStyle: null,
        onboardingCompleted: true,
      },
      {
        eaName: eaSettings.eaName,
        agentKey: chatAgentKey,
        language,
        calendarConnected,
        calendarContext,
        briefingContext: briefingRequested ? briefingContext : null,
        memoryLines: recentMemories.map((m) => m.content),
        ganeshContext,
        coachingContext,
        coachMode,
        wantsCalendarHelp,
        isGreeting,
      },
    );

    let finalSystemPrompt = systemPrompt;
    const extractedClient =
      extractClientFromMessage(trimmedUserMessage) ?? undefined;
    try {
      const { block: contextBlock } = await loadAndFormatContext({
        tool: "ea_chat",
        client_name: extractedClient,
        user_message: trimmedUserMessage,
      });
      if (contextBlock) {
        finalSystemPrompt = `${contextBlock}\n\n${systemPrompt}`;
      }
    } catch (err) {
      console.error("[ea/chat] failed to load unified context:", err);
    }

    const pendingCreates: PendingCalendarCreate[] = [];

    let { response, messages: workingMessages, pendingCreates: queuedCreates } =
      await runAssistantTurn(
        anthropic,
        finalSystemPrompt,
        model,
        maxTokens,
        currentMessages,
        calendarToolsEnabled,
        sessionId ?? "anonymous",
        conversationText,
        pendingCreates,
      );

    const initialText = extractText(response.content);

    if (
      calendarToolsEnabled &&
      queuedCreates.length === 0 &&
      schedulingContext &&
      responseClaimsCalendarAction(initialText)
    ) {
      const retry = await runAssistantTurn(
        anthropic,
        finalSystemPrompt,
        model,
        maxTokens,
        [
          ...workingMessages,
          { role: "assistant", content: response.content },
          {
            role: "user",
            content:
              "Call create_calendar_event NOW using the meeting details from our conversation. Use the correct date from today's context. Do not reply with text until the tool succeeds.",
          },
        ],
        calendarToolsEnabled,
        sessionId ?? "anonymous",
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
    );

    if (!message) {
      return NextResponse.json(
        { error: "No response from AI." },
        { status: 500 },
      );
    }

    const chatHistory: ChatTurn[] = history.filter(
      (m): m is ChatTurn =>
        m.role === "user" || m.role === "assistant",
    );
    const needsGuestEmail = shouldShowGuestEmailInput(
      chatHistory,
      trimmedUserMessage,
      message,
    );

    if (sessionId) {
      scheduleCalendarCreates(sessionId, queuedCreates);
    }

    if (sessionId) {
      persistConversation(sessionId, trimmedUserMessage, message);
      persistExtractedMemories(sessionId, trimmedUserMessage, message);
      persistChatIntelligence(sessionId, trimmedUserMessage, message);
    }

    return NextResponse.json({
      message,
      agent: agentKey,
      model,
      calendarEvent: null,
      calendarPending,
      calendarUpdated: calendarPending,
      needsGuestEmail,
    });
  } catch (error) {
    console.error("ea chat error:", error);
    return NextResponse.json(
      { error: "Failed to get response." },
      { status: 500 },
    );
  }
}
