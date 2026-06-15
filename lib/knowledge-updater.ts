import Anthropic from "@anthropic-ai/sdk";
import {
  getKnowledgeByFileName,
  logKnowledgeUpdate,
  readKnowledgeFile,
  upsertKnowledgeEntry,
  writeKnowledgeFile,
  type KnowledgeBaseRow,
} from "@/lib/knowledge/db";
import {
  getRegistryEntry,
  KNOWLEDGE_REGISTRY,
} from "@/lib/knowledge/registry";

export type KnowledgeUpdateResult = {
  fileName: string;
  status: "updated" | "unchanged" | "error" | "skipped";
  message: string;
  previousVersion?: number;
  newVersion?: number;
};

function extractTextFromResponse(response: Anthropic.Message): string {
  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

function extractSourcesFromResponse(
  response: Anthropic.Message,
): Array<{ title?: string; url: string }> {
  const sources: Array<{ title?: string; url: string }> = [];
  for (const block of response.content) {
    if (block.type !== "web_search_tool_result") continue;
    const results = (block as { content?: unknown }).content;
    if (!Array.isArray(results)) continue;
    for (const result of results) {
      const item = result as { type?: string; title?: string; url?: string };
      if (item.type === "web_search_result" && item.url) {
        sources.push({ title: item.title, url: item.url });
      }
    }
  }
  return sources;
}

function buildResearchPrompt(
  entry: (typeof KNOWLEDGE_REGISTRY)[number],
  currentContent: string,
): string {
  return `Research the latest authoritative information about ${entry.topic} from UX industry sources including Nielsen Norman Group, Baymard Institute, Google Material Design, Apple HIG, Smashing Magazine, UX Collective, and recent academic research from 2024-2025.

Current content version for ${entry.fileName}:
---
${currentContent.slice(0, 12000)}
---

Task:
1. Identify what has changed or been updated recently
2. Find new research or guidelines not in current content
3. Update the content to reflect latest standards
4. Maintain the existing structure and format (markdown headings, lists, tables)
5. Add a "## Sources" section at the end with URLs for all key claims

Return the complete updated markdown file.
If nothing significant has changed, return exactly: NO_UPDATE`;
}

async function callClaudeWithWebSearch(prompt: string): Promise<{
  text: string;
  sources: Array<{ title?: string; url: string }>;
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 16000,
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 5,
      },
    ],
    messages: [{ role: "user", content: prompt }],
  });

  return {
    text: extractTextFromResponse(response),
    sources: extractSourcesFromResponse(response),
  };
}

function summarizeChanges(oldContent: string, newContent: string): string {
  const oldLen = oldContent.length;
  const newLen = newContent.length;
  const delta = newLen - oldLen;
  const sign = delta >= 0 ? "+" : "";
  return `Content refreshed (${sign}${delta} chars, ${oldLen} → ${newLen}).`;
}

export async function researchAndUpdateKnowledge(
  fileName: string,
  options?: { force?: boolean; updateSource?: "auto" | "manual" },
): Promise<KnowledgeUpdateResult> {
  const entry = getRegistryEntry(fileName);
  if (!entry) {
    return { fileName, status: "error", message: "Unknown file name" };
  }

  try {
    let currentContent = "";
    const dbEntry = await getKnowledgeByFileName(fileName);

    if (dbEntry?.content) {
      currentContent = dbEntry.content;
    } else {
      try {
        currentContent = await readKnowledgeFile(entry);
      } catch {
        currentContent = `# ${entry.title}\n\n(Initial seed pending)`;
      }
    }

    const prompt = buildResearchPrompt(entry, currentContent);
    const { text, sources } = await callClaudeWithWebSearch(prompt);

    if (!text || text.trim() === "NO_UPDATE") {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      if (dbEntry) {
        await upsertKnowledgeEntry({
          entry,
          content: currentContent,
          version: dbEntry.version,
          sources: dbEntry.sources,
          researched: true,
        });
      }
      return {
        fileName,
        status: "unchanged",
        message: "No significant updates found",
        previousVersion: dbEntry?.version,
        newVersion: dbEntry?.version,
      };
    }

    if (!options?.force && text.trim() === currentContent.trim()) {
      return {
        fileName,
        status: "unchanged",
        message: "Content unchanged after research",
        previousVersion: dbEntry?.version,
        newVersion: dbEntry?.version,
      };
    }

    const previousVersion = dbEntry?.version ?? 0;
    const newVersion = previousVersion + 1;

    await writeKnowledgeFile(entry, text);
    const updated = await upsertKnowledgeEntry({
      entry,
      content: text,
      sources: sources.length ? sources : dbEntry?.sources,
      version: newVersion,
      researched: true,
    });

    await logKnowledgeUpdate({
      knowledgeId: updated.id,
      fileName,
      previousVersion: previousVersion || null,
      newVersion,
      changesSummary: summarizeChanges(currentContent, text),
      newContent: text,
      updateSource: options?.updateSource ?? "auto",
    });

    return {
      fileName,
      status: "updated",
      message: "Knowledge base updated",
      previousVersion,
      newVersion,
    };
  } catch (error) {
    return {
      fileName,
      status: "error",
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function runWeeklyUpdate(): Promise<{
  results: KnowledgeUpdateResult[];
  updated: number;
  unchanged: number;
  errors: number;
}> {
  const { getDueKnowledgeUpdates } = await import("@/lib/knowledge/db");
  const due = await getDueKnowledgeUpdates();

  const targets =
    due.length > 0
      ? due.map((row: KnowledgeBaseRow) => row.file_name)
      : KNOWLEDGE_REGISTRY.map((e) => e.fileName);

  const results: KnowledgeUpdateResult[] = [];
  for (const fileName of targets) {
    const result = await researchAndUpdateKnowledge(fileName, {
      updateSource: "auto",
    });
    results.push(result);
  }

  return {
    results,
    updated: results.filter((r) => r.status === "updated").length,
    unchanged: results.filter((r) => r.status === "unchanged").length,
    errors: results.filter((r) => r.status === "error").length,
  };
}

export async function updateAllKnowledge(
  updateSource: "auto" | "manual" = "manual",
): Promise<{
  results: KnowledgeUpdateResult[];
  updated: number;
  unchanged: number;
  errors: number;
}> {
  const results: KnowledgeUpdateResult[] = [];
  for (const entry of KNOWLEDGE_REGISTRY) {
    const result = await researchAndUpdateKnowledge(entry.fileName, {
      force: true,
      updateSource,
    });
    results.push(result);
  }

  return {
    results,
    updated: results.filter((r) => r.status === "updated").length,
    unchanged: results.filter((r) => r.status === "unchanged").length,
    errors: results.filter((r) => r.status === "error").length,
  };
}
