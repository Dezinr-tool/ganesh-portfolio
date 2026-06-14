import { loadGaneshContextForPrompt } from "@/lib/ganesh-context-loader";
import { getDesignContext } from "@/lib/design-memory";

export type MoodboardContext = {
  brandName: string | null;
  projectName: string | null;
  ganeshProfile: string;
  designObservations: Array<{
    content: string;
    projectName: string | null;
    importance: number;
    createdAt: string;
  }>;
  visualPreferences: string[];
  processNotes: string[];
  summary: string;
};

const VISUAL_KEYWORDS =
  /\b(minimal|clean|premium|bold|expressive|dark mode|light mode|typography|spacing|palette|color|motion|glass|flat|brutalist|warm|clinical)\b/i;

const PROCESS_KEYWORDS =
  /\b(figma|handoff|design system|component|prototype|iteration|review|walkthrough|token|accessibility)\b/i;

function extractPreferenceLines(
  memories: Array<{ content: string }>,
  pattern: RegExp,
  limit: number,
): string[] {
  const seen = new Set<string>();
  const results: string[] = [];

  for (const memory of memories) {
    if (!pattern.test(memory.content)) continue;
    const line = memory.content.slice(0, 160);
    const key = line.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(line);
    if (results.length >= limit) break;
  }

  return results;
}

export async function getMoodboardContext(
  sessionId: string,
  options: { brandName?: string; projectName?: string } = {},
): Promise<MoodboardContext> {
  const [ganeshProfile, design] = await Promise.all([
    loadGaneshContextForPrompt(),
    getDesignContext(sessionId),
  ]);

  const visualPreferences = extractPreferenceLines(
    design.memories,
    VISUAL_KEYWORDS,
    6,
  );
  const processNotes = extractPreferenceLines(
    design.memories,
    PROCESS_KEYWORDS,
    6,
  );

  const brandName = options.brandName?.trim() || null;
  const projectName = options.projectName?.trim() || null;

  const summaryParts = [
    brandName ? `Brand: ${brandName}.` : null,
    projectName ? `Project: ${projectName}.` : null,
    design.summary,
    visualPreferences.length > 0
      ? `Visual lean: ${visualPreferences.slice(0, 2).join("; ")}`
      : null,
  ].filter(Boolean);

  return {
    brandName,
    projectName,
    ganeshProfile,
    designObservations: design.memories.slice(0, 10).map((m) => ({
      content: m.content,
      projectName: m.projectName,
      importance: m.importance,
      createdAt: m.createdAt,
    })),
    visualPreferences,
    processNotes,
    summary: summaryParts.join(" "),
  };
}
