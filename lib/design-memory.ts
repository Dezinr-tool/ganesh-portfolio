import { getMemoriesSince, type Memory } from "@/lib/memory-store";

export type DesignContext = {
  memories: Memory[];
  summary: string;
  observationCount: number;
};

function buildDesignSummary(memories: Memory[]): string {
  if (memories.length === 0) {
    return "No design memories recorded yet from meetings or chat.";
  }

  const snippets = memories
    .slice(0, 5)
    .map((m) => m.content.slice(0, 100))
    .join("; ");

  return `Recent design observations (${memories.length}): ${snippets}`;
}

/** Design-category memories for prompt injection and moodboard tooling. */
export async function getDesignContext(
  sessionId: string,
  days: number = 30,
): Promise<DesignContext> {
  const memories = await getMemoriesSince(sessionId, days, "design");

  return {
    memories,
    summary: buildDesignSummary(memories),
    observationCount: memories.length,
  };
}
