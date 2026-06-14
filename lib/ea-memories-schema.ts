import { sql } from "@/lib/db";

export type EaMemoriesSchema = {
  columns: Set<string>;
};

let cachedSchema: EaMemoriesSchema | null = null;

const BASE_COLUMNS = [
  "id",
  "session_id",
  "content",
  "category",
  "source",
  "importance",
  "created_at",
] as const;

const INTELLIGENCE_COLUMNS = [
  "client_name",
  "project_name",
  "sentiment_score",
] as const;

/** Loads and caches `ea_memories` column names from information_schema. */
export async function getEaMemoriesSchema(): Promise<EaMemoriesSchema> {
  if (cachedSchema) return cachedSchema;

  try {
    const { rows } = await sql<{ column_name: string }>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'ea_memories'
      ORDER BY ordinal_position
    `;

    cachedSchema = {
      columns: new Set(rows.map((row) => row.column_name)),
    };
  } catch (err) {
    console.error("[ea-memories-schema] introspection failed:", err);
    cachedSchema = { columns: new Set(BASE_COLUMNS) };
  }

  return cachedSchema;
}

export function hasEaMemoryColumn(
  schema: EaMemoriesSchema,
  column: string,
): boolean {
  return schema.columns.has(column);
}

export function hasIntelligenceColumns(schema: EaMemoriesSchema): boolean {
  return INTELLIGENCE_COLUMNS.every((col) => schema.columns.has(col));
}

export function listEaMemoryColumns(schema: EaMemoriesSchema): string[] {
  return [...schema.columns].sort();
}

export function resetEaMemoriesSchemaCache(): void {
  cachedSchema = null;
}
