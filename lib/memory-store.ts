import { sql } from "@/lib/db";
import { randomUUID } from "crypto";
import {
  getEaMemoriesSchema,
  hasIntelligenceColumns,
} from "@/lib/ea-memories-schema";

/** Legacy chat-extracted categories */
export type LegacyMemoryCategory =
  | "preference"
  | "fact"
  | "instruction"
  | "context"
  | "meeting";

/** Professional intelligence categories from meeting observation */
export type InsightCategory =
  | "design"
  | "business"
  | "client"
  | "leadership"
  | "emotional"
  | "learning";

export type MemoryCategory = LegacyMemoryCategory | InsightCategory;

export const INSIGHT_CATEGORIES: InsightCategory[] = [
  "design",
  "business",
  "client",
  "leadership",
  "emotional",
  "learning",
];

export type MemorySource = "conversation" | "meeting" | "manual";

export type Memory = {
  id: string;
  sessionId: string;
  content: string;
  category: MemoryCategory;
  source: MemorySource;
  importance: number;
  clientName: string | null;
  projectName: string | null;
  sentimentScore: number | null;
  createdAt: string;
};

export type MemoryMetadata = {
  clientName?: string | null;
  projectName?: string | null;
  sentimentScore?: number | null;
};

type MemoryRow = {
  id: string;
  session_id: string;
  content: string;
  category: string;
  source: string;
  importance: number;
  client_name?: string | null;
  project_name?: string | null;
  sentiment_score?: number | null;
  created_at: Date | string;
};

function rowToMemory(row: MemoryRow): Memory {
  return {
    id: row.id,
    sessionId: row.session_id,
    content: row.content,
    category: row.category as MemoryCategory,
    source: row.source as MemorySource,
    importance: row.importance,
    clientName: row.client_name ?? null,
    projectName: row.project_name ?? null,
    sentimentScore:
      row.sentiment_score !== null && row.sentiment_score !== undefined
        ? Number(row.sentiment_score)
        : null,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  };
}

async function findExistingMemoryId(
  sessionId: string,
  content: string,
): Promise<string | null> {
  const { rows } = await sql<{ id: string }>`
    SELECT id
    FROM ea_memories
    WHERE session_id = ${sessionId} AND content = ${content}
    LIMIT 1
  `;
  return rows[0]?.id ?? null;
}

export async function saveMemory(
  sessionId: string,
  content: string,
  category: MemoryCategory = "context",
  source: MemorySource = "conversation",
  importance: number = 5,
  metadata?: MemoryMetadata,
): Promise<string> {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error("Memory content is required.");
  }

  const existingId = await findExistingMemoryId(sessionId, trimmed);
  if (existingId) return existingId;

  const id = randomUUID();
  const schema = await getEaMemoriesSchema();
  const useIntelligence = hasIntelligenceColumns(schema);

  if (useIntelligence) {
    const clientName = metadata?.clientName ?? null;
    const projectName = metadata?.projectName ?? null;
    const sentimentScore = metadata?.sentimentScore ?? null;

    await sql`
      INSERT INTO ea_memories (
        id, session_id, content, category, source, importance,
        client_name, project_name, sentiment_score
      )
      VALUES (
        ${id}, ${sessionId}, ${trimmed}, ${category}, ${source}, ${importance},
        ${clientName}, ${projectName}, ${sentimentScore}
      )
    `;
  } else {
    await sql`
      INSERT INTO ea_memories (
        id, session_id, content, category, source, importance
      )
      VALUES (
        ${id}, ${sessionId}, ${trimmed}, ${category}, ${source}, ${importance}
      )
    `;
  }

  return id;
}

async function queryMemories(
  sessionId: string,
  limit: number,
  options?: {
    category?: MemoryCategory;
    sinceIso?: string;
    searchPattern?: string;
  },
): Promise<Memory[]> {
  const schema = await getEaMemoriesSchema();
  const useIntelligence = hasIntelligenceColumns(schema);

  if (useIntelligence) {
    if (options?.searchPattern) {
      const { rows } = await sql<MemoryRow>`
        SELECT id, session_id, content, category, source, importance,
               client_name, project_name, sentiment_score, created_at
        FROM ea_memories
        WHERE session_id = ${sessionId}
          AND content ILIKE ${options.searchPattern}
        ORDER BY importance DESC, created_at DESC
        LIMIT ${limit}
      `;
      return rows.map(rowToMemory);
    }

    if (options?.sinceIso && options?.category) {
      const { rows } = await sql<MemoryRow>`
        SELECT id, session_id, content, category, source, importance,
               client_name, project_name, sentiment_score, created_at
        FROM ea_memories
        WHERE session_id = ${sessionId}
          AND category = ${options.category}
          AND created_at >= ${options.sinceIso}
        ORDER BY importance DESC, created_at DESC
      `;
      return rows.map(rowToMemory);
    }

    if (options?.sinceIso) {
      const { rows } = await sql<MemoryRow>`
        SELECT id, session_id, content, category, source, importance,
               client_name, project_name, sentiment_score, created_at
        FROM ea_memories
        WHERE session_id = ${sessionId}
          AND created_at >= ${options.sinceIso}
        ORDER BY importance DESC, created_at DESC
      `;
      return rows.map(rowToMemory);
    }

    if (options?.category) {
      const { rows } = await sql<MemoryRow>`
        SELECT id, session_id, content, category, source, importance,
               client_name, project_name, sentiment_score, created_at
        FROM ea_memories
        WHERE session_id = ${sessionId} AND category = ${options.category}
        ORDER BY importance DESC, created_at DESC
        LIMIT ${limit}
      `;
      return rows.map(rowToMemory);
    }

    const { rows } = await sql<MemoryRow>`
      SELECT id, session_id, content, category, source, importance,
             client_name, project_name, sentiment_score, created_at
      FROM ea_memories
      WHERE session_id = ${sessionId}
      ORDER BY importance DESC, created_at DESC
      LIMIT ${limit}
    `;
    return rows.map(rowToMemory);
  }

  if (options?.searchPattern) {
    const { rows } = await sql<MemoryRow>`
      SELECT id, session_id, content, category, source, importance, created_at
      FROM ea_memories
      WHERE session_id = ${sessionId}
        AND content ILIKE ${options.searchPattern}
      ORDER BY importance DESC, created_at DESC
      LIMIT ${limit}
    `;
    return rows.map(rowToMemory);
  }

  if (options?.sinceIso && options?.category) {
    const { rows } = await sql<MemoryRow>`
      SELECT id, session_id, content, category, source, importance, created_at
      FROM ea_memories
      WHERE session_id = ${sessionId}
        AND category = ${options.category}
        AND created_at >= ${options.sinceIso}
      ORDER BY importance DESC, created_at DESC
    `;
    return rows.map(rowToMemory);
  }

  if (options?.sinceIso) {
    const { rows } = await sql<MemoryRow>`
      SELECT id, session_id, content, category, source, importance, created_at
      FROM ea_memories
      WHERE session_id = ${sessionId}
        AND created_at >= ${options.sinceIso}
      ORDER BY importance DESC, created_at DESC
    `;
    return rows.map(rowToMemory);
  }

  if (options?.category) {
    const { rows } = await sql<MemoryRow>`
      SELECT id, session_id, content, category, source, importance, created_at
      FROM ea_memories
      WHERE session_id = ${sessionId} AND category = ${options.category}
      ORDER BY importance DESC, created_at DESC
      LIMIT ${limit}
    `;
    return rows.map(rowToMemory);
  }

  const { rows } = await sql<MemoryRow>`
    SELECT id, session_id, content, category, source, importance, created_at
    FROM ea_memories
    WHERE session_id = ${sessionId}
    ORDER BY importance DESC, created_at DESC
    LIMIT ${limit}
  `;
  return rows.map(rowToMemory);
}

export async function getRecentMemories(
  sessionId: string,
  limit: number = 10,
  category?: MemoryCategory,
): Promise<Memory[]> {
  return queryMemories(sessionId, limit, { category });
}

export async function getMemoriesSince(
  sessionId: string,
  days: number,
  category?: InsightCategory,
): Promise<Memory[]> {
  const safeDays = Math.min(Math.max(days, 1), 365);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - safeDays);
  const cutoffIso = cutoff.toISOString();

  return queryMemories(sessionId, 1000, { category, sinceIso: cutoffIso });
}

export async function searchMemories(
  sessionId: string,
  query: string,
  limit: number = 5,
): Promise<Memory[]> {
  const pattern = `%${query}%`;
  return queryMemories(sessionId, limit, { searchPattern: pattern });
}

export async function deleteMemory(
  id: string,
  sessionId: string,
): Promise<boolean> {
  const { rowCount } = await sql`
    DELETE FROM ea_memories
    WHERE id = ${id} AND session_id = ${sessionId}
  `;
  return (rowCount ?? 0) > 0;
}

export async function clearMemories(sessionId: string): Promise<number> {
  const { rows } = await sql<{ id: string }>`
    DELETE FROM ea_memories
    WHERE session_id = ${sessionId}
    RETURNING id
  `;
  return rows.length;
}

export async function getMemoryCount(sessionId: string): Promise<number> {
  const { rows } = await sql<{ count: string }>`
    SELECT COUNT(*)::text AS count
    FROM ea_memories
    WHERE session_id = ${sessionId}
  `;
  return Number(rows[0]?.count ?? 0);
}
