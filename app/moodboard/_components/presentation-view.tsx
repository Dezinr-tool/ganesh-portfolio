"use client";

import { useState } from "react";
import type { MoodboardPresentationDirection } from "@/lib/moodboard/db-types";
import { presentationToMarkdown } from "@/lib/moodboard/presentation-markdown";
import { trackMoodboardEvent } from "@/lib/moodboard/track-event";
import {
  CoverSlide,
  DirectionDeck,
} from "./presentation-slides";
import "../presentation.css";

export function PresentationView({
  directions,
  brandName,
  selectedOutputSections = [],
  sessionId,
  onRefine,
  onSelectDirection,
}: {
  directions: MoodboardPresentationDirection[];
  brandName: string;
  selectedOutputSections?: string[];
  sessionId?: string | null;
  onRefine?: (directionId: string, note: string) => Promise<void>;
  onSelectDirection?: (direction: MoodboardPresentationDirection) => Promise<void>;
}) {
  const [copyMsg, setCopyMsg] = useState("");
  const [refineId, setRefineId] = useState<string | null>(null);
  const [refineNote, setRefineNote] = useState("");
  const [refining, setRefining] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectingId, setSelectingId] = useState<string | null>(null);

  const handleCopy = async () => {
    const md = presentationToMarkdown(directions, brandName, selectedOutputSections);
    await navigator.clipboard.writeText(md);
    setCopyMsg("Copied");
    void trackMoodboardEvent(sessionId, "export_markdown", {
      brandName,
      directionCount: directions.length,
    });
    setTimeout(() => setCopyMsg(""), 2000);
  };

  const handlePdf = async (direction: MoodboardPresentationDirection) => {
    const res = await fetch("/api/moodboard/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction, tab: "moodboard", presentation: true }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${direction.directionName.replace(/\s+/g, "-").toLowerCase()}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    void trackMoodboardEvent(sessionId, "export_pdf", {
      directionId: direction.id,
      directionName: direction.directionName,
    });
  };

  const handleSelect = async (direction: MoodboardPresentationDirection) => {
    if (!onSelectDirection || selectingId) return;
    setSelectingId(direction.id);
    try {
      await onSelectDirection(direction);
      setSelectedId(direction.id);
    } finally {
      setSelectingId(null);
    }
  };

  const handleRefine = async () => {
    if (!refineId || !refineNote.trim() || !onRefine) return;
    setRefining(true);
    try {
      await onRefine(refineId, refineNote.trim());
      setRefineId(null);
      setRefineNote("");
    } finally {
      setRefining(false);
    }
  };

  return (
    <div className="presentation-deck bg-[var(--color-bg)] text-[var(--color-text)]">
      <div className="sticky top-0 z-20 border-b border-[var(--color-text)] bg-[var(--color-bg)]/90 px-5 py-3 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-[1824px] flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[var(--color-text)]">
            {directions.length} direction{directions.length > 1 ? "s" : ""}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-md border border-[var(--color-text)] px-3 py-1.5 text-xs text-[var(--color-text)] transition hover:bg-[var(--color-bg)]"
            >
              Copy markdown
            </button>
            {copyMsg ? <span className="text-xs text-[var(--color-accent)]">{copyMsg}</span> : null}
            {directions.map((dir) => (
              <button
                key={dir.id}
                type="button"
                onClick={() => handlePdf(dir)}
                className="rounded-md bg-[var(--color-text)] px-3 py-1.5 text-xs text-[var(--color-bg)] transition hover:bg-[var(--color-bg)]"
              >
                PDF — {dir.directionName}
              </button>
            ))}
            {onRefine && directions.length === 1 ? (
              <button
                type="button"
                onClick={() => setRefineId(directions[0]!.id)}
                className="rounded-md border border-[var(--color-text)] px-3 py-1.5 text-xs text-[var(--color-text)] transition hover:bg-[var(--color-bg)]"
              >
                Refine
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <CoverSlide brandName={brandName} />

      {directions.map((dir) => (
        <div key={dir.id}>
          <DirectionDeck direction={dir} selectedSections={selectedOutputSections} />
          <div className="border-b border-[var(--color-text)] px-5 py-4 sm:px-8">
            <div className="mx-auto flex max-w-[1824px] flex-wrap justify-end gap-2">
              {onSelectDirection ? (
                <button
                  type="button"
                  disabled={selectingId === dir.id || selectedId === dir.id}
                  onClick={() => void handleSelect(dir)}
                  className={`rounded-md px-4 py-2 text-sm transition ${
                    selectedId === dir.id
                      ? "border border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent)]"
                      : "border border-[var(--color-text)] text-[var(--color-text)] hover:bg-[var(--color-bg)]"
                  } disabled:opacity-50`}
                >
                  {selectedId === dir.id
                    ? "✓ Selected"
                    : selectingId === dir.id
                      ? "Saving…"
                      : "Select this direction"}
                </button>
              ) : null}
              {onRefine && directions.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setRefineId(dir.id)}
                  className="rounded-md border border-[var(--color-text)] px-4 py-2 text-sm text-[var(--color-text)] transition hover:bg-[var(--color-bg)]"
                >
                  Refine — {dir.directionName}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ))}

      {refineId && onRefine ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--color-text)]/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-xl bg-[var(--color-bg)] p-6 shadow-xl">
            <h3 className="text-lg font-medium">Refine direction</h3>
            <textarea
              value={refineNote}
              onChange={(e) => setRefineNote(e.target.value)}
              rows={4}
              placeholder="What should change?"
              className="mt-3 w-full rounded-md border border-[var(--color-text)] px-3 py-2 text-sm outline-none focus:border-[var(--color-text)]"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRefineId(null)}
                className="rounded-md px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={refining || !refineNote.trim()}
                onClick={handleRefine}
                className="rounded-md bg-[var(--color-text)] px-4 py-2 text-sm text-[var(--color-bg)] disabled:opacity-50"
              >
                {refining ? "Refining…" : "Refine"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
