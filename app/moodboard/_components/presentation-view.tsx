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
}: {
  directions: MoodboardPresentationDirection[];
  brandName: string;
  selectedOutputSections?: string[];
  sessionId?: string | null;
  onRefine?: (directionId: string, note: string) => Promise<void>;
}) {
  const [copyMsg, setCopyMsg] = useState("");
  const [refineId, setRefineId] = useState<string | null>(null);
  const [refineNote, setRefineNote] = useState("");
  const [refining, setRefining] = useState(false);

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
    <div className="presentation-deck bg-white text-black">
      <div className="sticky top-0 z-20 border-b border-neutral-100 bg-white/90 px-5 py-3 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-[1824px] flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-neutral-500">
            {directions.length} direction{directions.length > 1 ? "s" : ""}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 transition hover:bg-neutral-50"
            >
              Copy markdown
            </button>
            {copyMsg ? <span className="text-xs text-green-600">{copyMsg}</span> : null}
            {directions.map((dir) => (
              <button
                key={dir.id}
                type="button"
                onClick={() => handlePdf(dir)}
                className="rounded-md bg-black px-3 py-1.5 text-xs text-white transition hover:bg-neutral-800"
              >
                PDF — {dir.directionName}
              </button>
            ))}
            {onRefine && directions.length === 1 ? (
              <button
                type="button"
                onClick={() => setRefineId(directions[0]!.id)}
                className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 transition hover:bg-neutral-50"
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
          {onRefine && directions.length > 1 ? (
            <div className="border-b border-neutral-100 px-5 py-4 sm:px-8">
              <div className="mx-auto flex max-w-[1824px] justify-end">
                <button
                  type="button"
                  onClick={() => setRefineId(dir.id)}
                  className="rounded-md border border-neutral-200 px-4 py-2 text-sm text-neutral-700 transition hover:bg-neutral-50"
                >
                  Refine — {dir.directionName}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ))}

      {refineId && onRefine ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-medium">Refine direction</h3>
            <textarea
              value={refineNote}
              onChange={(e) => setRefineNote(e.target.value)}
              rows={4}
              placeholder="What should change?"
              className="mt-3 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRefineId(null)}
                className="rounded-md px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={refining || !refineNote.trim()}
                onClick={handleRefine}
                className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
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
