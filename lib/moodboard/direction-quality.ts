import type { MoodboardPresentationDirection } from "./db-types";
import type { IntentSummary } from "./build-intent-summary";

const GENERIC_NAMES = new Set([
  "modern style",
  "clean minimal",
  "bold vision",
  "fresh start",
  "classic elegance",
  "contemporary look",
  "minimal design",
  "bold design",
  "modern design",
  "clean design",
  "direction 1",
  "direction 2",
  "direction 3",
]);

export type QualityCheckResult = {
  ok: boolean;
  reasons: string[];
};

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function nameOverlap(a: string, b: string): boolean {
  const wordsA = new Set(normalizeName(a).split(/\s+/));
  const wordsB = normalizeName(b).split(/\s+/);
  let overlap = 0;
  for (const w of wordsB) {
    if (wordsA.has(w) && w.length > 3) overlap++;
  }
  return overlap >= 2;
}

function paletteSimilarity(
  a: MoodboardPresentationDirection,
  b: MoodboardPresentationDirection,
): boolean {
  const hexA = (a.colorPalette ?? []).map((c) => c.hex.toLowerCase());
  const hexB = (b.colorPalette ?? []).map((c) => c.hex.toLowerCase());
  if (!hexA.length || !hexB.length) return false;
  const shared = hexA.filter((h) => hexB.includes(h)).length;
  return shared >= 3;
}

export function validateDirectionQuality(
  intent: IntentSummary,
  direction: MoodboardPresentationDirection,
  existing: MoodboardPresentationDirection[],
): QualityCheckResult {
  const reasons: string[] = [];
  const name = direction.directionName?.trim() ?? "";

  if (!name || name.length < 4) {
    reasons.push("Direction name too short");
  }
  if (GENERIC_NAMES.has(normalizeName(name))) {
    reasons.push("Direction name is generic");
  }
  if (name.split(/\s+/).length <= 2 && !intent.brand_name) {
    reasons.push("Direction name lacks specificity");
  }

  const brandLower = intent.brand_name.toLowerCase();
  const userText = intent.what_they_said.join(" ").toLowerCase();
  const directionText = [
    direction.tagline,
    direction.uiSection?.description,
    ...(direction.moodKeywords ?? []),
  ]
    .join(" ")
    .toLowerCase();

  const hasUserSignal =
    intent.emotional_signals.some((s) => directionText.includes(s)) ||
    intent.explicit_requests.some((r) =>
      directionText.includes(r.slice(0, 20).toLowerCase()),
    ) ||
    (brandLower !== "your brand" && directionText.includes(brandLower.split(" ")[0] ?? ""));

  if (!hasUserSignal && userText.length > 40) {
    reasons.push("Direction does not reflect user intent");
  }

  for (const prev of existing) {
    if (nameOverlap(name, prev.directionName)) {
      reasons.push("Too similar to another direction name");
    }
    if (paletteSimilarity(direction, prev)) {
      reasons.push("Color palette too similar to another direction");
    }
  }

  if ((direction.moodKeywords?.length ?? 0) < 3) {
    reasons.push("Insufficient mood keywords");
  }

  return { ok: reasons.length === 0, reasons };
}

export function buildQualityRetryPrompt(reasons: string[]): string {
  return `Quality check failed: ${reasons.join("; ")}.
Regenerate this direction with a more brand-specific name, distinct palette, and clearer connection to the user's brief.`;
}
