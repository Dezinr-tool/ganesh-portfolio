import type { MoodboardPresentationDirection } from "@/lib/moodboard/db-types";
import type { ResolvedSessionDirection } from "@/lib/moodboard/resolve-session-directions";

function getConceptText(content: MoodboardPresentationDirection): string | null {
  const parts = [
    content.uiSection?.description,
    content.persona?.brandStrategy,
    content.componentStyle?.description,
    content.brandVoice?.toneDescription,
  ].filter(Boolean);
  return parts[0] ? String(parts[0]) : null;
}

function getImageryText(content: MoodboardPresentationDirection): string | null {
  const parts = [
    content.photography?.styleDescription,
    content.illustrations?.styleDescription,
    content.productImages?.styleDescription,
    content.uiSection?.principles?.length
      ? content.uiSection.principles.join(". ")
      : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

function getTypographyText(content: MoodboardPresentationDirection): string | null {
  if (!content.typography) return null;
  const { heading, body } = content.typography;
  return `${heading.font} (headings) · ${body.font} (body)`;
}

export function DirectionPreviewCard({ direction }: { direction: ResolvedSessionDirection }) {
  const { content, isSelected, index, name } = direction;
  const concept = getConceptText(content);
  const imagery = getImageryText(content);
  const typography = getTypographyText(content);
  const colors = content.colorPalette ?? [];
  const mood = content.moodKeywords ?? [];

  return (
    <article
      className={`rounded-xl border bg-[var(--color-bg)]/50 p-5 ${
        isSelected
          ? "border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]"
          : "border-[var(--color-text)]"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-medium text-[var(--color-bg)]">
            Direction {index}: {name}
          </h3>
          {content.tagline ? (
            <p className="mt-1 text-sm italic text-[var(--color-text)]">{content.tagline}</p>
          ) : null}
        </div>
        {isSelected ? (
          <span className="rounded-full bg-[var(--color-accent)] px-3 py-1 text-xs font-medium text-[var(--color-accent)]">
            User selected this
          </span>
        ) : null}
      </div>

      {concept ? (
        <div className="mt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text)]">Concept</p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-text)]">{concept}</p>
        </div>
      ) : null}

      {colors.length > 0 ? (
        <div className="mt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text)]">
            Color palette
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {colors.map((color) => (
              <div key={`${color.role}-${color.hex}`} className="flex items-center gap-2">
                <span
                  className="h-10 w-10 shrink-0 rounded-lg border border-[var(--color-text)]"
                  style={{ backgroundColor: color.hex }}
                  title={`${color.name} (${color.hex})`}
                />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[var(--color-text)]">{color.role}</p>
                  <p className="truncate text-xs text-[var(--color-text)]">{color.name}</p>
                  <p className="font-mono text-[10px] text-[var(--color-text)]">{color.hex}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {typography ? (
        <div className="mt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text)]">
            Typography
          </p>
          <p className="mt-2 text-sm text-[var(--color-text)]">{typography}</p>
          {content.typography ? (
            <p className="mt-1 text-xs text-[var(--color-text)]">{content.typography.heading.rationale}</p>
          ) : null}
        </div>
      ) : null}

      {imagery ? (
        <div className="mt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text)]">Imagery</p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-text)]">{imagery}</p>
        </div>
      ) : null}

      {mood.length > 0 ? (
        <div className="mt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text)]">Mood</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {mood.map((keyword) => (
              <span
                key={keyword}
                className="rounded-full bg-[var(--color-bg)] px-2.5 py-1 text-xs text-[var(--color-text)]"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {direction.refinedCount > 0 || direction.refinementNotes ? (
        <div className="mt-5 border-t border-[var(--color-text)] pt-4">
          {direction.refinedCount > 0 ? (
            <p className="text-xs text-[var(--color-accent)]">Refined ×{direction.refinedCount}</p>
          ) : null}
          {direction.refinementNotes ? (
            <p className="mt-1 text-sm text-[var(--color-text)]">{direction.refinementNotes}</p>
          ) : null}
        </div>
      ) : null}

      {isSelected ? (
        <p className="mt-5 text-xs font-medium uppercase tracking-wide text-[var(--color-accent)]">
          ✓ Selected
        </p>
      ) : null}
    </article>
  );
}
