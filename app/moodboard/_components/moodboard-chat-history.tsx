"use client";

import { useCallback } from "react";

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderAssistantMarkdown(text: string): string {
  const escaped = escapeHtml(text);
  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function AssistantActions({ text }: { text: string }) {
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  }, [text]);

  return (
    <div className="moodboard-assistant-actions">
      <button type="button" onClick={handleCopy} aria-label="Copy">
        <CopyIcon />
      </button>
    </div>
  );
}

export type HistoryMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

export function MoodboardChatHistory({
  messages,
  thinking,
  generating,
  genStatus,
}: {
  messages: HistoryMessage[];
  thinking?: boolean;
  generating?: boolean;
  genStatus?: string;
}) {
  return (
    <div className="moodboard-chat-messages">
      {messages.map((msg) => {
        if (msg.role === "assistant" && !msg.text.trim()) {
          return null;
        }
        return msg.role === "assistant" ? (
          <div key={msg.id}>
            <p
              className="moodboard-assistant-message whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: renderAssistantMarkdown(msg.text) }}
            />
            <AssistantActions text={msg.text} />
          </div>
        ) : (
          <div key={msg.id} className="moodboard-user-message">
            <span className="moodboard-user-bubble whitespace-pre-wrap">{msg.text}</span>
          </div>
        );
      })}

      {thinking ? (
        <div className="moodboard-thinking-dots flex items-center gap-1.5 py-1">
          <span />
          <span />
          <span />
        </div>
      ) : null}

      {generating ? (
        <div className="space-y-2">
          <div className="moodboard-thinking-dots flex items-center gap-1.5 py-1">
            <span />
            <span />
            <span />
          </div>
          {genStatus ? (
            <p className="text-sm text-[#888]">{genStatus}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
