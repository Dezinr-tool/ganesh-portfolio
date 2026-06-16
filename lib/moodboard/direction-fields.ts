import type { MoodboardPresentationDirection } from "./db-types";

export function extractConceptFromDirection(dir: MoodboardPresentationDirection): string {
  const parts = [
    dir.uiSection?.description,
    dir.persona?.brandStrategy,
    dir.componentStyle?.description,
    dir.brandVoice?.toneDescription,
  ].filter(Boolean);
  return parts.join(" ").trim();
}

export function extractImageryStyleFromDirection(
  dir: MoodboardPresentationDirection,
): string {
  const parts = [
    dir.photography?.styleDescription,
    dir.illustrations?.styleDescription,
    dir.productImages?.styleDescription,
    dir.uiSection?.principles?.join(". "),
  ].filter(Boolean);
  return parts.join(" · ").trim();
}

export function extractTypographyJson(dir: MoodboardPresentationDirection): Record<string, unknown> | null {
  if (!dir.typography) return null;
  return {
    heading: dir.typography.heading,
    body: dir.typography.body,
    rationale: `${dir.typography.heading.rationale} ${dir.typography.body.rationale}`.trim(),
  };
}
