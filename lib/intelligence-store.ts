import { sql } from "@/lib/db";
import { randomUUID } from "crypto";
import type { ClientProfile, IntelligenceItem } from "@/lib/intelligence-extractor";

export type IntelligenceRow = {
  id: string;
  session_id: string;
  source_type: string;
  source_id: string | null;
  category: string;
  subcategory: string | null;
  insight: string;
  raw_context: string | null;
  client_name: string | null;
  project_name: string | null;
  sentiment: number | null;
  confidence: number | null;
  importance: number;
  tags: unknown;
  created_at: Date | string;
  updated_at: Date | string;
};

export type ClientProfileRow = {
  id: string;
  session_id: string;
  client_name: string;
  company: string | null;
  communication_style: string | null;
  decision_style: string | null;
  sentiment_history: unknown;
  interaction_count: number;
  last_interaction_at: Date | string | null;
  preferences: unknown;
  red_flags: unknown;
  notes: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

export type PatternRow = {
  id: string;
  session_id: string;
  pattern_type: string;
  description: string;
  evidence_count: number;
  confidence: number;
  last_seen_at: Date | string;
  first_seen_at: Date | string;
  client_name: string | null;
  project_type: string | null;
  metadata: unknown;
  created_at: Date | string;
};

function rowToIntelligence(row: IntelligenceRow) {
  return {
    id: row.id,
    sessionId: row.session_id,
    sourceType: row.source_type,
    sourceId: row.source_id,
    category: row.category,
    subcategory: row.subcategory,
    insight: row.insight,
    rawContext: row.raw_context,
    clientName: row.client_name,
    projectName: row.project_name,
    sentiment: row.sentiment !== null ? Number(row.sentiment) : null,
    confidence: row.confidence !== null ? Number(row.confidence) : null,
    importance: row.importance,
    tags: Array.isArray(row.tags) ? row.tags : [],
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  };
}

export async function saveIntelligence(
  sessionId: string,
  items: IntelligenceItem[],
  sourceType: string,
  sourceId?: string,
): Promise<number> {
  if (items.length === 0) return 0;

  await Promise.all(
    items.map((item) => {
      const id = randomUUID();
      return sql`
        INSERT INTO ea_intelligence (
          id, session_id, source_type, source_id, category, subcategory,
          insight, raw_context, client_name, project_name,
          sentiment, confidence, importance, tags
        ) VALUES (
          ${id}, ${sessionId}, ${sourceType}, ${sourceId ?? null},
          ${item.category}, ${item.subcategory ?? null},
          ${item.insight}, ${item.rawContext ?? null},
          ${item.clientName ?? null}, ${item.projectName ?? null},
          ${item.sentiment}, ${item.confidence}, ${item.importance},
          ${JSON.stringify(item.tags)}::jsonb
        )
      `;
    }),
  );

  return items.length;
}

export async function upsertClientProfile(
  sessionId: string,
  profile: ClientProfile,
): Promise<void> {
  const sentimentEntry = JSON.stringify([
    { date: new Date().toISOString(), score: profile.sentiment },
  ]);
  const preferences = JSON.stringify(profile.preferences);
  const redFlags = JSON.stringify(profile.redFlags);

  await sql`
    INSERT INTO ea_client_profiles (
      session_id, client_name, company, communication_style,
      decision_style, sentiment_history, preferences, red_flags,
      interaction_count, last_interaction_at
    ) VALUES (
      ${sessionId}, ${profile.clientName}, ${profile.company ?? null},
      ${profile.communicationStyle ?? null}, ${profile.decisionStyle ?? null},
      ${sentimentEntry}::jsonb,
      ${preferences}::jsonb,
      ${redFlags}::jsonb,
      1, NOW()
    )
    ON CONFLICT (session_id, client_name) DO UPDATE SET
      company = COALESCE(EXCLUDED.company, ea_client_profiles.company),
      communication_style = COALESCE(EXCLUDED.communication_style, ea_client_profiles.communication_style),
      decision_style = COALESCE(EXCLUDED.decision_style, ea_client_profiles.decision_style),
      sentiment_history = ea_client_profiles.sentiment_history || EXCLUDED.sentiment_history,
      preferences = ea_client_profiles.preferences || EXCLUDED.preferences,
      red_flags = ea_client_profiles.red_flags || EXCLUDED.red_flags,
      interaction_count = ea_client_profiles.interaction_count + 1,
      last_interaction_at = NOW(),
      updated_at = NOW()
  `;
}

export async function upsertPatterns(
  sessionId: string,
  patterns: string[],
  patternType: string = "outcome",
): Promise<void> {
  for (const description of patterns) {
    const trimmed = description.trim();
    if (!trimmed) continue;

    const { rows } = await sql<PatternRow>`
      SELECT id, evidence_count FROM ea_patterns
      WHERE session_id = ${sessionId}
        AND description = ${trimmed}
      LIMIT 1
    `;

    if (rows[0]) {
      await sql`
        UPDATE ea_patterns
        SET evidence_count = evidence_count + 1,
            last_seen_at = NOW(),
            confidence = LEAST(1.0, confidence + 0.05)
        WHERE id = ${rows[0].id}
      `;
    } else {
      const id = randomUUID();
      await sql`
        INSERT INTO ea_patterns (
          id, session_id, pattern_type, description, evidence_count, confidence
        ) VALUES (
          ${id}, ${sessionId}, ${patternType}, ${trimmed}, 1, 0.5
        )
      `;
    }
  }
}

export async function getIntelligence(
  sessionId: string,
  options?: {
    category?: string;
    clientName?: string;
    limit?: number;
    minImportance?: number;
  },
): Promise<ReturnType<typeof rowToIntelligence>[]> {
  const limit = Math.min(options?.limit ?? 20, 100);
  const minImportance = options?.minImportance ?? 1;

  if (options?.category && options?.clientName) {
    const pattern = `%${options.clientName}%`;
    const { rows } = await sql<IntelligenceRow>`
      SELECT * FROM ea_intelligence
      WHERE session_id = ${sessionId}
        AND category = ${options.category}
        AND client_name ILIKE ${pattern}
        AND importance >= ${minImportance}
      ORDER BY importance DESC, created_at DESC
      LIMIT ${limit}
    `;
    return rows.map(rowToIntelligence);
  }

  if (options?.category) {
    const { rows } = await sql<IntelligenceRow>`
      SELECT * FROM ea_intelligence
      WHERE session_id = ${sessionId}
        AND category = ${options.category}
        AND importance >= ${minImportance}
      ORDER BY importance DESC, created_at DESC
      LIMIT ${limit}
    `;
    return rows.map(rowToIntelligence);
  }

  if (options?.clientName) {
    const pattern = `%${options.clientName}%`;
    const { rows } = await sql<IntelligenceRow>`
      SELECT * FROM ea_intelligence
      WHERE session_id = ${sessionId}
        AND client_name ILIKE ${pattern}
        AND importance >= ${minImportance}
      ORDER BY importance DESC, created_at DESC
      LIMIT ${limit}
    `;
    return rows.map(rowToIntelligence);
  }

  const { rows } = await sql<IntelligenceRow>`
    SELECT * FROM ea_intelligence
    WHERE session_id = ${sessionId}
      AND importance >= ${minImportance}
    ORDER BY importance DESC, created_at DESC
    LIMIT ${limit}
  `;
  return rows.map(rowToIntelligence);
}

export async function getIntelligenceCount(sessionId: string): Promise<number> {
  const { rows } = await sql<{ count: string }>`
    SELECT COUNT(*)::text AS count FROM ea_intelligence
    WHERE session_id = ${sessionId}
  `;
  return Number(rows[0]?.count ?? 0);
}

export async function getIntelligenceCategories(
  sessionId: string,
): Promise<Record<string, number>> {
  const { rows } = await sql<{ category: string; count: string }>`
    SELECT category, COUNT(*)::text AS count
    FROM ea_intelligence
    WHERE session_id = ${sessionId}
    GROUP BY category
  `;
  const result: Record<string, number> = {};
  for (const row of rows) {
    result[row.category] = Number(row.count);
  }
  return result;
}

export async function getClientProfile(
  sessionId: string,
  clientName: string,
): Promise<ClientProfileRow | null> {
  const pattern = `%${clientName}%`;
  const { rows } = await sql<ClientProfileRow>`
    SELECT * FROM ea_client_profiles
    WHERE session_id = ${sessionId}
      AND client_name ILIKE ${pattern}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function getAllClientProfiles(
  sessionId: string,
): Promise<ClientProfileRow[]> {
  const { rows } = await sql<ClientProfileRow>`
    SELECT * FROM ea_client_profiles
    WHERE session_id = ${sessionId}
    ORDER BY last_interaction_at DESC NULLS LAST
  `;
  return rows;
}

export async function getPatterns(
  sessionId: string,
  patternType?: string,
): Promise<PatternRow[]> {
  if (patternType) {
    const { rows } = await sql<PatternRow>`
      SELECT * FROM ea_patterns
      WHERE session_id = ${sessionId}
        AND pattern_type = ${patternType}
      ORDER BY evidence_count DESC
    `;
    return rows;
  }

  const { rows } = await sql<PatternRow>`
    SELECT * FROM ea_patterns
    WHERE session_id = ${sessionId}
    ORDER BY evidence_count DESC
    LIMIT 20
  `;
  return rows;
}

export async function getIntelligenceStats(sessionId: string): Promise<{
  totalInsights: number;
  clientCount: number;
  patternCount: number;
  avgSentiment: number | null;
  meetingSources: number;
}> {
  const { rows: insightRows } = await sql<{
    total: string;
    avg_sentiment: string | null;
    meetings: string;
  }>`
    SELECT
      COUNT(*)::text AS total,
      AVG(sentiment)::text AS avg_sentiment,
      COUNT(DISTINCT source_id) FILTER (WHERE source_type = 'meeting')::text AS meetings
    FROM ea_intelligence
    WHERE session_id = ${sessionId}
  `;

  const { rows: clientRows } = await sql<{ count: string }>`
    SELECT COUNT(*)::text AS count FROM ea_client_profiles
    WHERE session_id = ${sessionId}
  `;

  const { rows: patternRows } = await sql<{ count: string }>`
    SELECT COUNT(*)::text AS count FROM ea_patterns
    WHERE session_id = ${sessionId}
  `;

  return {
    totalInsights: Number(insightRows[0]?.total ?? 0),
    clientCount: Number(clientRows[0]?.count ?? 0),
    patternCount: Number(patternRows[0]?.count ?? 0),
    avgSentiment: insightRows[0]?.avg_sentiment
      ? Number(insightRows[0].avg_sentiment)
      : null,
    meetingSources: Number(insightRows[0]?.meetings ?? 0),
  };
}
