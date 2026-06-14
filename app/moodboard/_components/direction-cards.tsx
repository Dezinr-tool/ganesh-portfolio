"use client";

import type { MoodboardDirection } from "@/lib/moodboard/types";

function ColorSwatches({ colors }: { colors: MoodboardDirection["colors"] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((color) => (
        <div key={color.hex} className="flex flex-col items-center gap-1">
          <div
            className="h-10 w-10 rounded-lg border border-white/10 shadow-inner"
            style={{ backgroundColor: color.hex }}
            title={`${color.name} ${color.hex}`}
          />
          <span className="max-w-[56px] truncate text-[10px] text-zinc-500">
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
      className={`flex flex-col rounded-2xl border bg-[#12121a] transition-all duration-300 ${
        chosen
          ? "border-emerald-500/50 ring-1 ring-emerald-500/30"
          : "border-white/8 hover:border-white/15"
      }`}
    >
      <button
        type="button"
        onClick={onExpand}
        className="flex flex-1 flex-col p-5 text-left"
      >
        <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
          Direction
        </p>
        <h3 className="mt-2 font-[family-name:var(--font-syne)] text-xl font-bold tracking-tight text-white">
          {direction.name}
        </h3>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-zinc-400">
          {direction.concept}
        </p>
        <div className="mt-4">
          <ColorSwatches colors={direction.colors} />
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {direction.mood.slice(0, 4).map((word) => (
            <span
              key={word}
              className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-zinc-400"
            >
              {word}
            </span>
          ))}
        </div>
      </button>

      <div className="flex flex-wrap gap-2 border-t border-white/8 p-4">
        <button
          type="button"
          onClick={onSelect}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            chosen
              ? "bg-emerald-500/20 text-emerald-300"
              : "bg-white text-black hover:bg-zinc-200"
          }`}
        >
          {chosen ? "Selected ✓" : "Select this"}
        </button>
        <button
          type="button"
          onClick={onRefine}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
        >
          Refine
        </button>
        <button
          type="button"
          onClick={onReject}
          className="rounded-lg px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-300"
        >
          Not this
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#12121a] p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
              Full direction
            </p>
            <h2 className="mt-1 text-2xl font-bold text-white">{direction.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6 text-sm">
          <section>
            <h3 className="mb-2 text-xs uppercase tracking-wider text-zinc-500">
              Concept
            </h3>
            <p className="leading-relaxed text-zinc-300">{direction.concept}</p>
          </section>

          <section>
            <h3 className="mb-2 text-xs uppercase tracking-wider text-zinc-500">
              Color palette
            </h3>
            <ColorSwatches colors={direction.colors} />
          </section>

          <section>
            <h3 className="mb-2 text-xs uppercase tracking-wider text-zinc-500">
              Typography
            </h3>
            <p className="text-zinc-300">
              Heading: {direction.typography.heading}
            </p>
            <p className="text-zinc-300">Body: {direction.typography.body}</p>
          </section>

          <section>
            <h3 className="mb-2 text-xs uppercase tracking-wider text-zinc-500">
              Imagery
            </h3>
            <p className="leading-relaxed text-zinc-300">{direction.imagery}</p>
          </section>

          <section>
            <h3 className="mb-2 text-xs uppercase tracking-wider text-zinc-500">
              Mood
            </h3>
            <div className="flex flex-wrap gap-2">
              {direction.mood.map((word) => (
                <span
                  key={word}
                  className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-zinc-300"
                >
                  {word}
                </span>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs uppercase tracking-wider text-zinc-500">
              Visual references
            </h3>
            <p className="leading-relaxed text-zinc-300">
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
  tab,
  onCopy,
  onDownloadPdf,
  onSaveHistory,
}: {
  direction: MoodboardDirection;
  tab: string;
  onCopy: () => void;
  onDownloadPdf: () => void;
  onSaveHistory: () => void;
}) {
  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
      <p className="text-sm font-medium text-emerald-300">
        Selected: {direction.name}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onCopy}
          className="rounded-lg border border-white/10 px-4 py-2 text-xs text-white hover:bg-white/5"
        >
          Copy as markdown
        </button>
        <button
          type="button"
          onClick={onDownloadPdf}
          className="rounded-lg border border-white/10 px-4 py-2 text-xs text-white hover:bg-white/5"
        >
          Download PDF
        </button>
        <button
          type="button"
          onClick={onSaveHistory}
          className="rounded-lg bg-white px-4 py-2 text-xs font-medium text-black hover:bg-zinc-200"
        >
          Save to history
        </button>
      </div>
    </div>
  );
}
