"use client";

import { useCallback } from "react";
import type { MoodboardQuestion } from "@/lib/moodboard/db-types";
import { MoodboardInlineOptions } from "./active-question-card";

export type HistoryMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M8 5v14l11-7L8 5z" fill="currentColor" />
    </svg>
  );
}

function ThumbsUpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 10v10M7 10l4-6a2 2 0 012 2v4h5l-1 8H7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ThumbsDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M17 14V4M17 14l-4 6a2 2 0 01-2-2v-4H6l1-8h10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 12a8 8 0 0113.66-5.66M20 12a8 8 0 01-13.66 5.66M20 4v4h-4M4 20v-4h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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
      <button type="button" aria-label="Read aloud" tabIndex={-1}>
        <PlayIcon />
      </button>
      <button type="button" aria-label="Good response" tabIndex={-1}>
        <ThumbsUpIcon />
      </button>
      <button type="button" aria-label="Bad response" tabIndex={-1}>
        <ThumbsDownIcon />
      </button>
      <button type="button" aria-label="Retry" tabIndex={-1}>
        <RefreshIcon />
      </button>
    </div>
  );
}

export function MoodboardChatHistory({
  messages,
  thinking,
  generating,
  genStatus,
  currentQuestion,
  questionDisabled,
  pendingFiles,
  onChip,
  onMultiChipSubmit,
  onSectionSubmit,
  onUploadContinue,
}: {
  messages: HistoryMessage[];
  thinking?: boolean;
  generating?: boolean;
  genStatus?: string;
  currentQuestion?: MoodboardQuestion | null;
  questionDisabled?: boolean;
  pendingFiles?: File[];
  onChip?: (value: string) => void;
  onMultiChipSubmit?: (values: string[]) => void;
  onSectionSubmit?: (keys: string[]) => void;
  onUploadContinue?: () => void;
}) {
  const showInlineOptions =
    currentQuestion &&
    !thinking &&
    !generating &&
    (currentQuestion.question_type === "chips" ||
      currentQuestion.question_type === "multi_section_select" ||
      currentQuestion.question_type === "upload" ||
      currentQuestion.key === "q4b");

  return (
    <div className="moodboard-chat-messages">
      {messages.map((msg) =>
        msg.role === "assistant" ? (
          <div key={msg.id}>
            <p className="moodboard-assistant-message whitespace-pre-wrap">{msg.text}</p>
            <AssistantActions text={msg.text} />
          </div>
        ) : (
          <div key={msg.id} className="moodboard-user-message">
            <span className="moodboard-user-bubble whitespace-pre-wrap">{msg.text}</span>
          </div>
        ),
      )}

      {showInlineOptions && currentQuestion && onChip && onMultiChipSubmit && onSectionSubmit ? (
        <div className="moodboard-card-enter">
          <MoodboardInlineOptions
            question={currentQuestion}
            disabled={questionDisabled}
            pendingFiles={pendingFiles}
            onChip={onChip}
            onMultiChipSubmit={onMultiChipSubmit}
            onSectionSubmit={onSectionSubmit}
            onUploadContinue={onUploadContinue}
            variant="chat"
          />
        </div>
      ) : null}

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
