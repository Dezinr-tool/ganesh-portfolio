"use client";

import { useState } from "react";
import type { MoodboardPresentationDirection } from "@/lib/moodboard/db-types";
import type { HistoryMessage } from "./moodboard-chat-history";
import { MoodboardChatHistory } from "./moodboard-chat-history";
import { PresentationView } from "./presentation-view";

export function MoodboardOutputShell({
  messages,
  brandName,
  directions,
  selectedOutputSections = [],
  sessionId,
  generating,
  genStatus,
  onSelectDirection,
  onRefine,
}: {
  messages: HistoryMessage[];
  brandName: string;
  directions: MoodboardPresentationDirection[];
  selectedOutputSections?: string[];
  sessionId?: string | null;
  generating?: boolean;
  genStatus?: string;
  onSelectDirection?: (direction: MoodboardPresentationDirection) => Promise<void>;
  onRefine?: (directionId: string, note: string) => Promise<void>;
}) {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="moodboard-output-shell min-h-screen bg-white">
      <div className="border-b border-neutral-100 px-5 py-3 sm:px-8">
        <div className="mx-auto flex max-w-[1824px] flex-wrap items-center justify-between gap-3">
          {!chatOpen ? (
            <button
              type="button"
              onClick={() => setChatOpen(true)}
              className="text-sm text-neutral-500 transition hover:text-neutral-900"
            >
              View conversation ({messages.length} message{messages.length === 1 ? "" : "s"})
            </button>
          ) : (
            <div className="w-full">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Conversation
                </p>
                <button
                  type="button"
                  onClick={() => setChatOpen(false)}
                  className="text-xs text-neutral-500 hover:text-neutral-900"
                >
                  Hide
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <MoodboardChatHistory messages={messages} />
              </div>
            </div>
          )}

          {generating && directions.length < 3 ? (
            <p className="text-sm text-neutral-500">{genStatus ?? "Generating directions…"}</p>
          ) : null}
        </div>
      </div>

      <PresentationView
        directions={directions}
        brandName={brandName}
        selectedOutputSections={selectedOutputSections}
        sessionId={sessionId}
        onSelectDirection={onSelectDirection}
        onRefine={onRefine}
      />
    </div>
  );
}
