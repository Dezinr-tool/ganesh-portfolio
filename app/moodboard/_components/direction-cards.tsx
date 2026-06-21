"use client";

import type { MoodboardDirection } from "@/lib/moodboard/types";
import {
  EA_BTN_PRIMARY,
  EA_BTN_SECONDARY,
  EA_CARD,
  EA_CARD_PADDED,
} from "@/app/ea/_components/ea-ui";

function ColorSwatches({ colors }: { colors: MoodboardDirection["colors"] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((color) => (
        <div key={color.hex} className="flex flex-col items-center gap-1">
          <div
            className="h-10 w-10 rounded-lg border border-[var(--color-text)] shadow-inner"
            style={{ backgroundColor: color.hex }}
            title={`${color.name} ${color.hex}`}
          />
          <span className="max-w-[56px] truncate text-[10px] text-[var(--color-text)]">
            {color.name}
          </span>
        </div>
      ))}
    </div>
  );
}

export function DirectionCard({
  direction,
  chosen,
  onSelect,
  onRefine,
  onReject,
  onExpand,
}: {
  direction: MoodboardDirection;
  chosen: boolean;
  onSelect: () => void;
  onRefine: () => void;
  onReject: () => void;
  onExpand: () => void;
}) {
  return (
    <article
      className={`flex flex-col rounded-xl border bg-[var(--color-bg)]/50 transition-all ${
        chosen
          ? "border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]"
          : "border-[var(--color-text)] hover:border-[var(--color-text)]"
      }`}
    >
      <button
        type="button"
        onClick={onExpand}
        className="flex flex-1 flex-col p-5 text-left"
      >
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text)]">
          Direction
        </p>
        <h3 className="mt-2 text-lg font-medium text-[var(--color-bg)]">{direction.name}</h3>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[var(--color-text)]">
          {direction.concept}
        </p>
        <div className="mt-4">
          <ColorSwatches colors={direction.colors} />
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {direction.mood.slice(0, 4).map((word) => (
            <span
              key={word}
              className="rounded-full border border-[var(--color-text)] bg-[var(--color-bg)]/80 px-2 py-0.5 text-[10px] text-[var(--color-text)]"
            >
              {word}
            </span>
          ))}
        </div>
      </button>

      <div className="flex flex-wrap gap-2 border-t border-[var(--color-text)] p-4">
        <button
          type="button"
          onClick={onSelect}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            chosen
              ? "bg-[var(--color-accent)] text-[var(--color-accent)]"
              : EA_BTN_PRIMARY
          }`}
        >
          {chosen ? "Selected ✓" : "✓ Select this"}
        </button>
        <button
          type="button"
          onClick={onRefine}
          className={`px-3 py-1.5 text-xs ${EA_BTN_SECONDARY}`}
        >
          ↻ Refine
        </button>
        <button
          type="button"
          onClick={onReject}
          className="rounded-lg px-3 py-1.5 text-xs text-[var(--color-text)] hover:text-[var(--color-text)]"
        >
          ✗ Not this
        </button>
      </div>
    </article>
  );
}

export function DirectionDetailModal({
  direction,
  onClose,
}: {
  direction: MoodboardDirection;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--color-text)]/80 p-4 sm:items-center">
      <div className={`max-h-[90vh] w-full max-w-2xl overflow-y-auto shadow-2xl ${EA_CARD_PADDED}`}>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text)]">
              Full direction
            </p>
            <h2 className="mt-1 text-2xl font-light text-[var(--color-bg)]">{direction.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--color-text)] hover:text-[var(--color-bg)]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6 text-sm">
          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-text)]">
              Concept
            </h3>
            <p className="leading-relaxed text-[var(--color-text)]">{direction.concept}</p>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-text)]">
              Color palette
            </h3>
            <ColorSwatches colors={direction.colors} />
          </section>

          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-text)]">
              Typography
            </h3>
            <p className="text-[var(--color-text)]">
              Heading: {direction.typography.heading}
            </p>
            <p className="text-[var(--color-text)]">Body: {direction.typography.body}</p>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-text)]">
              Imagery
            </h3>
            <p className="leading-relaxed text-[var(--color-text)]">{direction.imagery}</p>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-text)]">
              Mood
            </h3>
            <div className="flex flex-wrap gap-2">
              {direction.mood.map((word) => (
                <span
                  key={word}
                  className="rounded-full border border-[var(--color-text)] bg-[var(--color-bg)]/80 px-2.5 py-1 text-xs text-[var(--color-text)]"
                >
                  {word}
                </span>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-text)]">
              Visual references
            </h3>
            <p className="leading-relaxed text-[var(--color-text)]">
              {direction.visual_references}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export function ExportPanel({
  direction,
  onCopy,
  onDownloadPdf,
  onSaveHistory,
}: {
  direction: MoodboardDirection;
  onCopy: () => void;
  onDownloadPdf: () => void;
  onSaveHistory: () => void;
}) {
  return (
    <div className={`${EA_CARD} border-[var(--color-accent)] bg-[var(--color-accent)] p-5`}>
      <p className="text-sm font-medium text-[var(--color-accent)]">
        Selected: {direction.name}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onCopy}
          className={`text-xs ${EA_BTN_SECONDARY}`}
        >
          Copy as markdown
        </button>
        <button
          type="button"
          onClick={onDownloadPdf}
          className={`text-xs ${EA_BTN_SECONDARY}`}
        >
          Download PDF
        </button>
        <button
          type="button"
          onClick={onSaveHistory}
          className={`text-xs ${EA_BTN_PRIMARY}`}
        >
          Save to history
        </button>
      </div>
    </div>
  );
}
