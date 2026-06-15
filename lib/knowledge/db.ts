import fs from "fs/promises";
import path from "path";
import { sql } from "@/lib/db";
import {
  KNOWLEDGE_REGISTRY,
  knowledgeFilePath,
  type KnowledgeCategory,
  type KnowledgeEntryMeta,
} from "@/lib/knowledge/registry";

export type KnowledgeBaseRow = {
  id: string;
  category: KnowledgeCategory;
  file_name: string;
  title: string;
  content: string;
  version: number;
  sources: Array<{ title?: string; url: string }>;
  last_researched_at: string | null;
  last_updated_at: string;
  next_update_at: string | null;
  update_frequency: string;
  is_active: boolean;
  created_at: string;
};

export type KnowledgeUpdateRow = {
  id: string;
  knowledge_id: string;
  file_name: string;
  previous_version: number | null;
  new_version: number;
  changes_summary: string | null;
  new_content: string | null;
  updated_at: string;
  update_source: "auto" | "manual";
};

function rowToKnowledge(row: Record<string, unknown>): KnowledgeBaseRow {
  const sourcesRaw = row.sources;
  let sources: Array<{ title?: string; url: string }> = [];
  if (Array.isArray(sourcesRaw)) {
    sources = sourcesRaw.map((s) => {
      const item = s as Record<string, string>;
      return { title: item.title, url: String(item.url ?? "") };
    });
  } else if (typeof sourcesRaw === "string") {
    try {
      sources = JSON.parse(sourcesRaw);
    } catch {
      sources = [];
    }
  }

  return {
    id: String(row.id),
    category: row.category as KnowledgeCategory,
    file_name: String(row.file_name),
    title: String(row.title),
    content: String(row.content ?? ""),
    version: Number(row.version ?? 1),
    sources,
    last_researched_at: row.last_researched_at
      ? String(row.last_researched_at)
      : null,
    last_updated_at: String(row.last_updated_at ?? row.created_at),
    next_update_at: row.next_update_at ? String(row.next_update_at) : null,
    update_frequency: String(row.update_frequency ?? "weekly"),
    is_active: row.is_active !== false,
    created_at: String(row.created_at),
  };
}

function rowToUpdate(row: Record<string, unknown>): KnowledgeUpdateRow {
  return {
    id: String(row.id),
    knowledge_id: String(row.knowledge_id),
    file_name: String(row.file_name),
    previous_version:
      row.previous_version === null || row.previous_version === undefined
        ? null
        : Number(row.previous_version),
    new_version: Number(row.new_version),
    changes_summary: row.changes_summary ? String(row.changes_summary) : null,
    new_content: row.new_content ? String(row.new_content) : null,
    updated_at: String(row.updated_at),
    update_source: (row.update_source as "auto" | "manual") ?? "auto",
  };
}

export async function readKnowledgeFile(entry: KnowledgeEntryMeta): Promise<string> {
  const filePath = knowledgeFilePath(entry);
  return fs.readFile(filePath, "utf8");
}

export async function writeKnowledgeFile(
  entry: KnowledgeEntryMeta,
  content: string,
): Promise<void> {
  const filePath = knowledgeFilePath(entry);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

export async function listKnowledgeEntries(
  activeOnly = true,
): Promise<KnowledgeBaseRow[]> {
  const result = activeOnly
    ? await sql`
        SELECT * FROM ux_knowledge_base
        WHERE is_active = true
        ORDER BY category ASC, file_name ASC
      `
    : await sql`
        SELECT * FROM ux_knowledge_base
        ORDER BY category ASC, file_name ASC
      `;
  return result.rows.map((r) => rowToKnowledge(r as Record<string, unknown>));
}

export async function getKnowledgeByFileName(
  fileName: string,
): Promise<KnowledgeBaseRow | null> {
  const result = await sql`
    SELECT * FROM ux_knowledge_base WHERE file_name = ${fileName} LIMIT 1
  `;
  const row = result.rows[0];
  return row ? rowToKnowledge(row as Record<string, unknown>) : null;
}

export async function getKnowledgeById(id: string): Promise<KnowledgeBaseRow | null> {
  const result = await sql`
    SELECT * FROM ux_knowledge_base WHERE id = ${id} LIMIT 1
  `;
  const row = result.rows[0];
  return row ? rowToKnowledge(row as Record<string, unknown>) : null;
}

export async function getDueKnowledgeUpdates(): Promise<KnowledgeBaseRow[]> {
  const result = await sql`
    SELECT * FROM ux_knowledge_base
    WHERE is_active = true
      AND (next_update_at IS NULL OR next_update_at <= NOW())
    ORDER BY next_update_at ASC NULLS FIRST
  `;
  return result.rows.map((r) => rowToKnowledge(r as Record<string, unknown>));
}

export async function upsertKnowledgeEntry(input: {
  entry: KnowledgeEntryMeta;
  content: string;
  sources?: Array<{ title?: string; url: string }>;
  version?: number;
  researched?: boolean;
}): Promise<KnowledgeBaseRow> {
  const existing = await getKnowledgeByFileName(input.entry.fileName);
  const version = input.version ?? (existing ? existing.version + 1 : 1);
  const nextUpdate = new Date();
  nextUpdate.setDate(nextUpdate.getDate() + 7);

  if (!existing) {
    const result = input.researched
      ? await sql`
          INSERT INTO ux_knowledge_base (
            category, file_name, title, content, version, sources,
            last_researched_at, next_update_at
          ) VALUES (
            ${input.entry.category},
            ${input.entry.fileName},
            ${input.entry.title},
            ${input.content},
            ${version},
            ${JSON.stringify(input.sources ?? [])},
            NOW(),
            ${nextUpdate.toISOString()}
          )
          RETURNING *
        `
      : await sql`
          INSERT INTO ux_knowledge_base (
            category, file_name, title, content, version, sources,
            next_update_at
          ) VALUES (
            ${input.entry.category},
            ${input.entry.fileName},
            ${input.entry.title},
            ${input.content},
            ${version},
            ${JSON.stringify(input.sources ?? [])},
            ${nextUpdate.toISOString()}
          )
          RETURNING *
        `;
    return rowToKnowledge(result.rows[0] as Record<string, unknown>);
  }

  const result = input.researched
    ? await sql`
        UPDATE ux_knowledge_base SET
          title = ${input.entry.title},
          content = ${input.content},
          version = ${version},
          sources = ${JSON.stringify(input.sources ?? existing.sources)},
          last_researched_at = NOW(),
          last_updated_at = NOW(),
          next_update_at = ${nextUpdate.toISOString()}
        WHERE file_name = ${input.entry.fileName}
        RETURNING *
      `
    : await sql`
        UPDATE ux_knowledge_base SET
          title = ${input.entry.title},
          content = ${input.content},
          version = ${version},
          sources = ${JSON.stringify(input.sources ?? existing.sources)},
          last_updated_at = NOW(),
          next_update_at = ${nextUpdate.toISOString()}
        WHERE file_name = ${input.entry.fileName}
        RETURNING *
      `;
  return rowToKnowledge(result.rows[0] as Record<string, unknown>);
}

export async function saveKnowledgeManualEdit(
  fileName: string,
  content: string,
  sources?: Array<{ title?: string; url: string }>,
): Promise<KnowledgeBaseRow> {
  const entry = KNOWLEDGE_REGISTRY.find((e) => e.fileName === fileName);
  if (!entry) throw new Error(`Unknown knowledge file: ${fileName}`);

  const existing = await getKnowledgeByFileName(fileName);
  const newVersion = (existing?.version ?? 0) + 1;

  await writeKnowledgeFile(entry, content);

  const updated = await upsertKnowledgeEntry({
    entry,
    content,
    sources: sources ?? existing?.sources,
    version: newVersion,
  });

  if (existing) {
    await logKnowledgeUpdate({
      knowledgeId: updated.id,
      fileName,
      previousVersion: existing.version,
      newVersion,
      changesSummary: "Manual edit from knowledge admin",
      newContent: content,
      updateSource: "manual",
    });
  }

  return updated;
}

export async function logKnowledgeUpdate(input: {
  knowledgeId: string;
  fileName: string;
  previousVersion: number | null;
  newVersion: number;
  changesSummary: string;
  newContent: string;
  updateSource?: "auto" | "manual";
}): Promise<void> {
  await sql`
    INSERT INTO ux_knowledge_updates (
      knowledge_id, file_name, previous_version, new_version,
      changes_summary, new_content, update_source
    ) VALUES (
      ${input.knowledgeId},
      ${input.fileName},
      ${input.previousVersion},
      ${input.newVersion},
      ${input.changesSummary},
      ${input.newContent},
      ${input.updateSource ?? "auto"}
    )
  `;
}

export async function listKnowledgeUpdates(
  limit = 50,
): Promise<KnowledgeUpdateRow[]> {
  const result = await sql`
    SELECT * FROM ux_knowledge_updates
    ORDER BY updated_at DESC
    LIMIT ${limit}
  `;
  return result.rows.map((r) => rowToUpdate(r as Record<string, unknown>));
}

export async function seedKnowledgeBaseFromFiles(): Promise<{
  inserted: number;
  updated: number;
  skipped: number;
}> {
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const entry of KNOWLEDGE_REGISTRY) {
    let content: string;
    try {
      content = await readKnowledgeFile(entry);
    } catch {
      skipped++;
      continue;
    }

    if (!content.trim() || content.length < 100) {
      skipped++;
      continue;
    }

    const existing = await getKnowledgeByFileName(entry.fileName);
    if (!existing) {
      await upsertKnowledgeEntry({ entry, content, version: 1 });
      inserted++;
      continue;
    }

    if (existing.content.trim() !== content.trim()) {
      await upsertKnowledgeEntry({
        entry,
        content,
        version: existing.version,
      });
      updated++;
    } else {
      skipped++;
    }
  }

  return { inserted, updated, skipped };
}

export async function getKnowledgeContentByFiles(
  fileNames: string[],
): Promise<KnowledgeBaseRow[]> {
  if (!fileNames.length) return [];

  const placeholders = fileNames.map((_, i) => `$${i + 1}`).join(", ");
  const result = await sql.query(
    `SELECT * FROM ux_knowledge_base
     WHERE file_name IN (${placeholders}) AND is_active = true
     ORDER BY file_name ASC`,
    fileNames,
  );
  return result.rows.map((r) => rowToKnowledge(r as Record<string, unknown>));
}
