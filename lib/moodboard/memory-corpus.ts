import { sql } from "@/lib/db";
import type { MoodboardEventRow } from "./analytics";

export type MemoryCorpusCategory =
  | "prompt"
  | "intake"
  | "generation"
  | "refinement"
  | "chip"
  | "other";

export type MemoryCorpusEntry = {
  id: string;
  sessionId: string;
  eventType: string;
  category: MemoryCorpusCategory;
  label: string;
  preview: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type MemoryCorpusStats = {
  total: number;
  prompts: number;
  intake: number;
  generations: number;
  refinements: number;
  chips: number;
  sessions: number;
};

function rowToEvent(row: Record<string, unknown>): MoodboardEventRow {
  return {
    id: String(row.id),
    session_id: String(row.session_id),
    event_type: String(row.event_type),
    question_key: row.question_key ? String(row.question_key) : null,
    payload: (row.payload as Record<string, unknown>) ?? {},
    duration_ms: row.duration_ms != null ? Number(row.duration_ms) : null,
    created_at: String(row.created_at),
  };
}

function categorize(eventType: string): MemoryCorpusCategory {
  if (eventType === "training_user_prompt" || eventType === "session_started") {
    return "prompt";
  }
  if (eventType === "training_intake") return "intake";
  if (eventType === "training_generation") return "generation";
  if (eventType === "training_refinement") return "refinement";
  if (eventType === "training_chip_answer" || eventType === "chip_answer") {
    return "chip";
  }
  return "other";
}

function eventLabel(eventType: string): string {
  const map: Record<string, string> = {
    training_user_prompt: "User prompt",
    session_started: "Opening prompt",
    training_intake: "Intake snapshot",
    training_generation: "Generation output",
    training_refinement: "Refinement",
    training_chip_answer: "Chip answer",
    chip_answer: "Chip answer",
  };
  return map[eventType] ?? eventType;
}

function extractPreview(eventType: string, payload: Record<string, unknown>): string {
  if (typeof payload.text === "string" && payload.text.trim()) {
    return payload.text.trim();
  }
  if (typeof payload.openingMessage === "string" && payload.openingMessage.trim()) {
    return payload.openingMessage.trim();
  }
  if (typeof payload.refineNote === "string" && payload.refineNote.trim()) {
    return payload.refineNote.trim();
  }
  if (payload.value != null) {
    return Array.isArray(payload.value)
      ? payload.value.join(", ")
      : String(payload.value);
  }
  if (eventType === "training_generation" && Array.isArray(payload.directionSummaries)) {
    const names = (payload.directionSummaries as Array<{ name?: string }>)
      .map((d) => d.name)
      .filter(Boolean);
    return names.length ? `Directions: ${names.join(" · ")}` : "Generation captured";
  }
  if (eventType === "training_intake" && Array.isArray(payload.messages)) {
    const lastUser = [...(payload.messages as Array<{ role?: string; text?: string }>)]
      .reverse()
      .find((m) => m.role === "user" && m.text?.trim());
    if (lastUser?.text) return lastUser.text.trim();
  }
  return "—";
}

function toEntry(event: MoodboardEventRow): MemoryCorpusEntry {
  return {
    id: event.id,
    sessionId: event.session_id,
    eventType: event.event_type,
    category: categorize(event.event_type),
    label: eventLabel(event.event_type),
    preview: extractPreview(event.event_type, event.payload),
    payload: event.payload,
    createdAt: event.created_at,
  };
}

export async function getTrainingEvents(limit = 1000): Promise<MoodboardEventRow[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 5000);
  const result = await sql`
    SELECT * FROM moodboard_events
    WHERE event_type LIKE 'training_%'
       OR event_type = 'session_started'
    ORDER BY created_at DESC
    LIMIT ${safeLimit}
  `;
  return result.rows.map((row) => rowToEvent(row as Record<string, unknown>));
}

export async function getMemoryCorpus(limit = 1000): Promise<{
  entries: MemoryCorpusEntry[];
  stats: MemoryCorpusStats;
}> {
  const events = await getTrainingEvents(limit);
  const entries = events.map(toEntry);

  const sessionIds = new Set(entries.map((e) => e.sessionId));
  const stats: MemoryCorpusStats = {
    total: entries.length,
    prompts: entries.filter((e) => e.category === "prompt").length,
    intake: entries.filter((e) => e.category === "intake").length,
    generations: entries.filter((e) => e.category === "generation").length,
    refinements: entries.filter((e) => e.category === "refinement").length,
    chips: entries.filter((e) => e.category === "chip").length,
    sessions: sessionIds.size,
  };

  return { entries, stats };
}
