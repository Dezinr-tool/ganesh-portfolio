"use client";

import { useEffect, useMemo, useState } from "react";
import type { MoodboardPresentationDirection } from "@/lib/moodboard/db-types";
import { trackMoodboardEvent } from "@/lib/moodboard/track-event";

function fontToGoogleParam(font: string): string {
  return font.trim().replace(/\s+/g, "+");
}

function useGoogleFonts(directions: MoodboardPresentationDirection[]) {
  useEffect(() => {
    const fonts = new Set<string>();
    for (const dir of directions) {
      if (dir.typography?.heading.font) fonts.add(dir.typography.heading.font);
      if (dir.typography?.body.font) fonts.add(dir.typography.body.font);
    }
    if (fonts.size === 0) return;

    const id = "moodboard-direction-fonts";
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    const families = [...fonts]
      .map((f) => `family=${fontToGoogleParam(f)}:wght@400;500;600;700`)
      .join("&");
    link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
  }, [directions]);
}

function getConcept(dir: MoodboardPresentationDirection): string {
  return (
    dir.uiSection?.description ??
    dir.persona?.brandStrategy ??
    dir.componentStyle?.description ??
    ""
  );
}

function getImagery(dir: MoodboardPresentationDirection): string {
  return (
    dir.photography?.styleDescription ??
    dir.illustrations?.styleDescription ??
    dir.productImages?.styleDescription ??
    ""
  );
}

export function DirectionCardsView({
  directions,
  brandName,
  sessionId,
  onSelectDirection,
  onRefine,
  onStartNew,
}: {
  directions: MoodboardPresentationDirection[];
  brandName: string;
  sessionId?: string | null;
  onSelectDirection?: (direction: MoodboardPresentationDirection) => Promise<void>;
  onRefine?: (directionId: string, note: string) => Promise<void>;
  onStartNew?: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [refineId, setRefineId] = useState<string | null>(null);
  const [refineNote, setRefineNote] = useState("");
  const [refining, setRefining] = useState(false);
  const [exportingId, setExportingId] = useState<string | null>(null);

  useGoogleFonts(directions);

  const selectedDirection = useMemo(
    () => directions.find((d) => d.id === selectedId) ?? null,
    [directions, selectedId],
  );

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

  const handlePdf = async (direction: MoodboardPresentationDirection) => {
    setExportingId(direction.id);
    try {
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
    } finally {
      setExportingId(null);
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
    <div className="moodboard-direction-cards">
      <header className="mb-10 text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-[var(--color-text)]">
          {brandName}
        </p>
        <h1 className="mt-2 text-2xl font-light text-[var(--color-text)] sm:text-3xl">
          Moodboard directions
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text)]">
          {directions.length} distinct direction{directions.length === 1 ? "" : "s"} — select one
          to continue
        </p>
      </header>

      {directions.map((dir) => {
        const isSelected = selectedId === dir.id;
        const concept = getConcept(dir);
        const imagery = getImagery(dir);
        const colors = dir.colorPalette ?? [];
        const mood = dir.moodKeywords ?? [];
        const headingFont = dir.typography?.heading.font ?? "Inter";
        const bodyFont = dir.typography?.body.font ?? "Inter";
        const typeStyle = dir.typography?.heading.rationale ?? "";

        return (
          <article
            key={dir.id}
            className={`moodboard-direction-card ${isSelected ? "moodboard-direction-card--selected" : ""}`}
          >
            <p className="moodboard-direction-card-index">
              {String(dir.directionIndex).padStart(2, "0")}
            </p>

            {isSelected ? (
              <span className="moodboard-direction-selected-badge">Selected ✓</span>
            ) : null}

            <h2 className="moodboard-direction-card-title">{dir.directionName}</h2>
            {dir.tagline ? (
              <p className="moodboard-direction-card-tagline">{dir.tagline}</p>
            ) : null}

            {concept ? <p className="moodboard-direction-card-concept">{concept}</p> : null}

            {colors.length > 0 ? (
              <div className="mt-8">
                <p className="moodboard-direction-card-label">Color palette</p>
                <div className="mt-4 flex flex-wrap gap-4">
                  {colors.map((color) => (
                    <div key={`${color.hex}-${color.name}`} className="text-center">
                      <div
                        className="moodboard-direction-swatch"
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      />
                      <p className="mt-2 text-xs text-[var(--color-text)]">{color.name}</p>
                      <p className="font-mono text-[10px] text-[var(--color-text)]">{color.hex}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {dir.typography ? (
              <div className="mt-8">
                <p className="moodboard-direction-card-label">Typography</p>
                <p
                  className="mt-3 text-xl text-[var(--color-text)]"
                  style={{ fontFamily: `"${headingFont}", serif` }}
                >
                  Heading: {headingFont}
                </p>
                <p
                  className="mt-2 text-base text-[var(--color-text)]"
                  style={{ fontFamily: `"${bodyFont}", sans-serif` }}
                >
                  Body: {bodyFont}
                </p>
                {typeStyle ? (
                  <p className="mt-2 text-sm text-[var(--color-text)]">{typeStyle}</p>
                ) : null}
              </div>
            ) : null}

            {imagery ? (
              <div className="mt-8">
                <p className="moodboard-direction-card-label">Imagery style</p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text)]">{imagery}</p>
              </div>
            ) : null}

            {mood.length > 0 ? (
              <div className="mt-8">
                <p className="moodboard-direction-card-label">Mood</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {mood.map((keyword) => (
                    <span key={keyword} className="moodboard-direction-mood-pill">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-10 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                disabled={selectingId === dir.id || isSelected}
                onClick={() => void handleSelect(dir)}
                className="moodboard-direction-select-btn"
              >
                {isSelected
                  ? "Selected ✓"
                  : selectingId === dir.id
                    ? "Saving…"
                    : "Select this direction →"}
              </button>
              {onRefine ? (
                <button
                  type="button"
                  onClick={() => setRefineId(dir.id)}
                  className="moodboard-direction-refine-btn"
                >
                  Refine this direction
                </button>
              ) : null}
            </div>
          </article>
        );
      })}

      {selectedDirection ? (
        <div className="moodboard-direction-next-steps">
          <p className="text-base font-medium text-[var(--color-text)]">
            Direction selected. What would you like to do next?
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={exportingId === selectedDirection.id}
              onClick={() => void handlePdf(selectedDirection)}
              className="moodboard-direction-action-btn moodboard-direction-action-btn--primary"
            >
              {exportingId === selectedDirection.id ? "Exporting…" : "Export PDF"}
            </button>
            {onRefine ? (
              <button
                type="button"
                onClick={() => setRefineId(selectedDirection.id)}
                className="moodboard-direction-action-btn"
              >
                Refine further
              </button>
            ) : null}
            {onStartNew ? (
              <button
                type="button"
                onClick={onStartNew}
                className="moodboard-direction-action-btn"
              >
                Start new
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {refineId && onRefine ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--color-text)]/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-xl bg-[var(--color-bg)] p-6 shadow-xl">
            <h3 className="text-lg font-medium text-[var(--color-text)]">Refine direction</h3>
            <textarea
              value={refineNote}
              onChange={(e) => setRefineNote(e.target.value)}
              rows={4}
              placeholder="What should change?"
              className="mt-3 w-full rounded-md border border-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-text)]"
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
                onClick={() => void handleRefine()}
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
