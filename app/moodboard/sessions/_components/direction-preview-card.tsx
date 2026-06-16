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
      className={`rounded-xl border bg-zinc-950/50 p-5 ${
        isSelected
          ? "border-green-500/60 ring-1 ring-green-500/30"
          : "border-zinc-800"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-medium text-white">
            Direction {index}: {name}
          </h3>
          {content.tagline ? (
            <p className="mt-1 text-sm italic text-zinc-400">{content.tagline}</p>
          ) : null}
        </div>
        {isSelected ? (
          <span className="rounded-full bg-green-500/15 px-3 py-1 text-xs font-medium text-green-400">
            User selected this
          </span>
        ) : null}
      </div>

      {concept ? (
        <div className="mt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Concept</p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-200">{concept}</p>
        </div>
      ) : null}

      {colors.length > 0 ? (
        <div className="mt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Color palette
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {colors.map((color) => (
              <div key={`${color.role}-${color.hex}`} className="flex items-center gap-2">
                <span
                  className="h-10 w-10 shrink-0 rounded-lg border border-zinc-700"
                  style={{ backgroundColor: color.hex }}
                  title={`${color.name} (${color.hex})`}
                />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-zinc-300">{color.role}</p>
                  <p className="truncate text-xs text-zinc-500">{color.name}</p>
                  <p className="font-mono text-[10px] text-zinc-600">{color.hex}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {typography ? (
        <div className="mt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Typography
          </p>
          <p className="mt-2 text-sm text-zinc-200">{typography}</p>
          {content.typography ? (
            <p className="mt-1 text-xs text-zinc-500">{content.typography.heading.rationale}</p>
          ) : null}
        </div>
      ) : null}

      {imagery ? (
        <div className="mt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Imagery</p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-200">{imagery}</p>
        </div>
      ) : null}

      {mood.length > 0 ? (
        <div className="mt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Mood</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {mood.map((keyword) => (
              <span
                key={keyword}
                className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {direction.refinedCount > 0 || direction.refinementNotes ? (
        <div className="mt-5 border-t border-zinc-800 pt-4">
          {direction.refinedCount > 0 ? (
            <p className="text-xs text-amber-400">Refined ×{direction.refinedCount}</p>
          ) : null}
          {direction.refinementNotes ? (
            <p className="mt-1 text-sm text-zinc-400">{direction.refinementNotes}</p>
          ) : null}
        </div>
      ) : null}

      {isSelected ? (
        <p className="mt-5 text-xs font-medium uppercase tracking-wide text-green-400">
          ✓ Selected
        </p>
      ) : null}
    </article>
  );
}
