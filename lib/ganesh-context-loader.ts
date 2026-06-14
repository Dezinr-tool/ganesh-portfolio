import fs from "fs/promises";
import path from "path";

const CONTEXT_PATH = path.join(process.cwd(), "data", "ganesh-context.md");
/** ~600 tokens at ~4 chars/token */
const MAX_PROMPT_CHARS = 2400;

let cachedFull: string | null = null;
let cachedPrompt: string | null = null;

async function readContextFile(): Promise<string> {
  if (cachedFull) return cachedFull;
  cachedFull = await fs.readFile(CONTEXT_PATH, "utf8");
  return cachedFull;
}

function summarizeForPrompt(full: string): string {
  if (full.length <= MAX_PROMPT_CHARS) return full.trim();

  const lines = full.split("\n");
  const out: string[] = [];
  let sectionLines = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("---")) continue;
    if (trimmed.startsWith("|")) continue;

    if (trimmed.startsWith("#")) {
      sectionLines = 0;
      out.push(trimmed.replace(/^#+\s*/, ""));
      continue;
    }

    if (trimmed.startsWith("- ")) {
      if (sectionLines < 2) {
        out.push(trimmed.replace(/\*\*/g, ""));
        sectionLines += 1;
      }
      continue;
    }

    if (sectionLines === 0 && trimmed.length < 100) {
      out.push(trimmed.replace(/\*\*/g, ""));
    }
  }

  let summary = out.join("\n").trim();
  if (summary.length > MAX_PROMPT_CHARS) {
    summary = `${summary.slice(0, MAX_PROMPT_CHARS - 3).trim()}...`;
  }
  return summary;
}

/** Full markdown from data/ganesh-context.md */
export async function loadGaneshContext(): Promise<string> {
  return readContextFile();
}

/** Condensed context for system prompt injection (≤ ~600 tokens) */
export async function loadGaneshContextForPrompt(): Promise<string> {
  if (cachedPrompt) return cachedPrompt;
  const full = await readContextFile();
  cachedPrompt = summarizeForPrompt(full);
  return cachedPrompt;
}

export function formatGaneshContextSection(context: string): string {
  return `## Ganesh professional context\n${context}`;
}
