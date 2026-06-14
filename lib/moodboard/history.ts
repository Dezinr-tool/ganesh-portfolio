import type { MoodboardHistoryEntry } from "./types";

const STORAGE_KEY = "moodboard-history-v1";

export function loadMoodboardHistory(): MoodboardHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MoodboardHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMoodboardHistory(entry: MoodboardHistoryEntry): void {
  if (typeof window === "undefined") return;
  const existing = loadMoodboardHistory();
  const next = [entry, ...existing.filter((e) => e.id !== entry.id)].slice(0, 20);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function directionToText(
  direction: MoodboardHistoryEntry["directions"][0],
): string {
  return [
    `# ${direction.name}`,
    "",
    direction.concept,
    "",
    "## Colors",
    ...direction.colors.map((c) => `- ${c.name}: ${c.hex}`),
    "",
    "## Typography",
    `Heading: ${direction.typography.heading}`,
    `Body: ${direction.typography.body}`,
    "",
    "## Imagery",
    direction.imagery,
    "",
    "## Mood",
    direction.mood.join(", "),
    "",
    "## Visual references",
    direction.visual_references,
  ].join("\n");
}
