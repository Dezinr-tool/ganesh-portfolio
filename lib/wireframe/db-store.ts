import { sql } from "@/lib/db";
import type { WireframeScreen, WireframeScreenSpec, WireframeSession } from "./types";

function rowToSession(row: Record<string, unknown>): WireframeSession {
  return {
    id: String(row.id),
    session_id: String(row.session_id),
    ia_session_id: String(row.ia_session_id),
    client_name: row.client_name ? String(row.client_name) : null,
    project_name: row.project_name ? String(row.project_name) : null,
    selected_screens: (row.selected_screens as string[]) ?? [],
    screen_notes:
      typeof row.screen_notes === "object" && row.screen_notes !== null
        ? (row.screen_notes as Record<string, string>)
        : {},
    moodboard_session_id: row.moodboard_session_id
      ? String(row.moodboard_session_id)
      : null,
    audit_session_id: row.audit_session_id ? String(row.audit_session_id) : null,
    status: (row.status as WireframeSession["status"]) ?? "in_progress",
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function getIaSessionComplete(
  iaSessionId: string,
): Promise<{ complete: boolean }> {
  const result = await sql`
    SELECT status FROM ia_sessions WHERE session_id = ${iaSessionId} LIMIT 1
  `;
  const status = (result.rows[0] as Record<string, unknown> | undefined)?.status;
  return { complete: status === "complete" };
}

export async function createWireframeSession(input: {
  sessionId: string;
  iaSessionId: string;
  clientName?: string;
  projectName?: string;
}): Promise<WireframeSession> {
  await sql`
    INSERT INTO tool_sessions (session_id, tool_name, status)
    VALUES (${input.sessionId}, 'wireframe', 'active')
    ON CONFLICT (session_id) DO NOTHING
  `;

  const result = await sql`
    INSERT INTO wireframe_sessions (
      session_id, ia_session_id, client_name, project_name, status
    ) VALUES (
      ${input.sessionId},
      ${input.iaSessionId},
      ${input.clientName ?? null},
      ${input.projectName ?? null},
      'in_progress'
    )
    ON CONFLICT (session_id) DO UPDATE SET updated_at = NOW()
    RETURNING *
  `;
  return rowToSession(result.rows[0] as Record<string, unknown>);
}

export async function getWireframeSession(
  sessionId: string,
): Promise<WireframeSession | null> {
  const result = await sql`
    SELECT * FROM wireframe_sessions WHERE session_id = ${sessionId} LIMIT 1
  `;
  const row = result.rows[0];
  return row ? rowToSession(row as Record<string, unknown>) : null;
}

export async function getWireframeByIaSession(
  iaSessionId: string,
): Promise<WireframeSession | null> {
  const result = await sql`
    SELECT * FROM wireframe_sessions WHERE ia_session_id = ${iaSessionId}
    ORDER BY created_at DESC LIMIT 1
  `;
  const row = result.rows[0];
  return row ? rowToSession(row as Record<string, unknown>) : null;
}

export async function updateWireframeSession(
  sessionId: string,
  patch: Partial<{
    selected_screens: string[];
    screen_notes: Record<string, string>;
    status: WireframeSession["status"];
    moodboard_session_id: string;
    audit_session_id: string;
  }>,
): Promise<void> {
  const existing = await getWireframeSession(sessionId);
  if (!existing) return;

  await sql`
    UPDATE wireframe_sessions SET
      selected_screens = ${JSON.stringify(patch.selected_screens ?? existing.selected_screens)},
      screen_notes = ${JSON.stringify(patch.screen_notes ?? existing.screen_notes)}::jsonb,
      status = ${patch.status ?? existing.status},
      moodboard_session_id = ${patch.moodboard_session_id ?? existing.moodboard_session_id},
      audit_session_id = ${patch.audit_session_id ?? existing.audit_session_id},
      updated_at = NOW()
    WHERE session_id = ${sessionId}
  `;
}

export async function saveWireframeScreen(input: {
  sessionId: string;
  screenName: string;
  iaScreenId?: string;
  spec: WireframeScreenSpec;
  jsxCode: string;
  annotations: WireframeScreenSpec["annotations"];
  componentsUsed: string[];
}): Promise<WireframeScreen> {
  const existing = await sql`
    SELECT id, version FROM wireframe_screens
    WHERE session_id = ${input.sessionId} AND screen_name = ${input.screenName}
    LIMIT 1
  `;

  let version = 1;
  if (existing.rows[0]) {
    const prevId = String((existing.rows[0] as Record<string, unknown>).id);
    version = Number((existing.rows[0] as Record<string, unknown>).version ?? 1) + 1;

    await sql`
      INSERT INTO wireframe_versions (wireframe_screen_id, jsx_code, change_notes, version)
      SELECT id, jsx_code, 'Auto-version before update', version
      FROM wireframe_screens WHERE id = ${prevId}::uuid
    `;

    await sql`
      UPDATE wireframe_screens SET
        spec = ${JSON.stringify(input.spec)}::jsonb,
        jsx_code = ${input.jsxCode},
        annotations = ${JSON.stringify(input.annotations)}::jsonb,
        shadcn_components_used = ${JSON.stringify(input.componentsUsed)},
        version = ${version},
        updated_at = NOW()
      WHERE id = ${prevId}::uuid
      RETURNING *
    `;

    const updated = await sql`
      SELECT * FROM wireframe_screens WHERE id = ${prevId}::uuid LIMIT 1
    `;
    return mapScreenRow(updated.rows[0] as Record<string, unknown>);
  }

  const inserted = await sql`
    INSERT INTO wireframe_screens (
      session_id, screen_name, ia_screen_id, spec, jsx_code,
      annotations, shadcn_components_used, version
    ) VALUES (
      ${input.sessionId},
      ${input.screenName},
      ${input.iaScreenId ?? null},
      ${JSON.stringify(input.spec)}::jsonb,
      ${input.jsxCode},
      ${JSON.stringify(input.annotations)}::jsonb,
      ${JSON.stringify(input.componentsUsed)},
      1
    )
    RETURNING *
  `;
  return mapScreenRow(inserted.rows[0] as Record<string, unknown>);
}

function mapScreenRow(row: Record<string, unknown>): WireframeScreen {
  const spec =
    typeof row.spec === "string" ? JSON.parse(row.spec) : (row.spec as WireframeScreenSpec);
  return {
    id: String(row.id),
    session_id: String(row.session_id),
    screen_name: String(row.screen_name),
    ia_screen_id: row.ia_screen_id ? String(row.ia_screen_id) : null,
    spec,
    jsx_code: String(row.jsx_code),
    annotations: (typeof row.annotations === "string"
      ? JSON.parse(row.annotations)
      : row.annotations) as WireframeScreenSpec["annotations"],
    shadcn_components_used: (row.shadcn_components_used as string[]) ?? [],
    version: Number(row.version ?? 1),
  };
}

export async function getWireframeScreens(sessionId: string): Promise<WireframeScreen[]> {
  const result = await sql`
    SELECT * FROM wireframe_screens
    WHERE session_id = ${sessionId}
    ORDER BY screen_name ASC
  `;
  return result.rows.map((row) => mapScreenRow(row as Record<string, unknown>));
}

export async function saveWireframeIntelligence(input: {
  sessionId: string;
  clientName: string;
  screenName: string;
  pattern: string;
}): Promise<void> {
  await sql`
    INSERT INTO tool_intelligence (
      tool_session_id, tool_name, client_name, category, insight, source
    ) VALUES (
      ${input.sessionId},
      'wireframe',
      ${input.clientName},
      'wireframe_decision',
      ${`Wireframe decision: ${input.screenName} used ${input.pattern}`},
      'wireframe_tool'
    )
  `;
}
