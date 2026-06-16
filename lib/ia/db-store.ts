import { sql } from "@/lib/db";
import type {
  IaOutput,
  IaSession,
  IaUserFlow,
  IaScreenNode,
  IaCompetitorAnalysis,
  IaUxControversyDecision,
} from "./types";

/** Vercel postgres sql tag typings omit string[]; arrays are valid at runtime. */
function sqlTextArray(values: string[]) {
  return values as unknown as string;
}

function parseJsonField<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "object") return value as T;
  try {
    return JSON.parse(String(value)) as T;
  } catch {
    return fallback;
  }
}

function rowToSession(row: Record<string, unknown>): IaSession {
  return {
    id: String(row.id),
    session_id: String(row.session_id),
    tool_session_id: row.tool_session_id ? String(row.tool_session_id) : null,
    client_name: row.client_name ? String(row.client_name) : null,
    project_name: row.project_name ? String(row.project_name) : null,
    product_type: row.product_type ? String(row.product_type) : null,
    answers:
      typeof row.answers === "object" && row.answers !== null
        ? (row.answers as Record<string, unknown>)
        : {},
    ia_output: row.ia_output
      ? (typeof row.ia_output === "string"
          ? JSON.parse(row.ia_output)
          : row.ia_output) as IaOutput
      : null,
    competitor_analysis: row.competitor_analysis
      ? parseJsonField<IaCompetitorAnalysis>(row.competitor_analysis, null as unknown as IaCompetitorAnalysis)
      : null,
    competitor_screenshots: Array.isArray(row.competitor_screenshots)
      ? (row.competitor_screenshots as string[])
      : [],
    ux_controversy_decisions: parseJsonField<Record<string, IaUxControversyDecision>>(
      row.ux_controversy_decisions,
      {},
    ),
    industry_pattern_used: row.industry_pattern_used
      ? String(row.industry_pattern_used)
      : null,
    status: (row.status as IaSession["status"]) ?? "in_progress",
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function createIaSession(sessionId: string): Promise<IaSession> {
  await sql`
    INSERT INTO tool_sessions (session_id, tool_name, status)
    VALUES (${sessionId}, 'ia', 'active')
    ON CONFLICT (session_id) DO NOTHING
  `;

  const result = await sql`
    INSERT INTO ia_sessions (session_id, tool_session_id, status)
    VALUES (${sessionId}, ${sessionId}, 'in_progress')
    ON CONFLICT (session_id) DO UPDATE SET updated_at = NOW()
    RETURNING *
  `;
  return rowToSession(result.rows[0] as Record<string, unknown>);
}

export async function getIaSession(sessionId: string): Promise<IaSession | null> {
  const result = await sql`
    SELECT * FROM ia_sessions WHERE session_id = ${sessionId} LIMIT 1
  `;
  const row = result.rows[0];
  return row ? rowToSession(row as Record<string, unknown>) : null;
}

export async function updateIaSession(
  sessionId: string,
  patch: Partial<{
    answers: Record<string, unknown>;
    ia_output: IaOutput;
    status: IaSession["status"];
    client_name: string;
    project_name: string;
    product_type: string;
    industry_pattern_used: string;
  }>,
): Promise<void> {
  const existing = await getIaSession(sessionId);
  if (!existing) return;

  const answers = patch.answers ?? existing.answers;
  const ia_output = patch.ia_output ?? existing.ia_output;
  const status = patch.status ?? existing.status;
  const client_name = patch.client_name ?? existing.client_name;
  const project_name = patch.project_name ?? existing.project_name;
  const product_type = patch.product_type ?? existing.product_type;
  const industry_pattern_used =
    patch.industry_pattern_used ?? existing.industry_pattern_used;

  await sql`
    UPDATE ia_sessions SET
      answers = ${JSON.stringify(answers)}::jsonb,
      ia_output = ${ia_output ? JSON.stringify(ia_output) : null}::jsonb,
      status = ${status},
      client_name = ${client_name},
      project_name = ${project_name},
      product_type = ${product_type},
      industry_pattern_used = ${industry_pattern_used},
      updated_at = NOW()
    WHERE session_id = ${sessionId}
  `;
}

export async function updateIaSessionExtended(
  sessionId: string,
  patch: Partial<{
    competitor_analysis: IaCompetitorAnalysis;
    competitor_screenshots: string[];
    ux_controversy_decisions: Record<string, IaUxControversyDecision>;
    industry_pattern_used: string;
  }>,
): Promise<void> {
  const existing = await getIaSession(sessionId);
  if (!existing) return;

  const competitor_analysis = patch.competitor_analysis ?? existing.competitor_analysis;
  const competitor_screenshots =
    patch.competitor_screenshots ?? existing.competitor_screenshots;
  const ux_controversy_decisions =
    patch.ux_controversy_decisions ?? existing.ux_controversy_decisions;
  const industry_pattern_used =
    patch.industry_pattern_used ?? existing.industry_pattern_used;

  await sql`
    UPDATE ia_sessions SET
      competitor_analysis = ${competitor_analysis ? JSON.stringify(competitor_analysis) : null}::jsonb,
      competitor_screenshots = ${sqlTextArray(competitor_screenshots)},
      ux_controversy_decisions = ${JSON.stringify(ux_controversy_decisions)}::jsonb,
      industry_pattern_used = ${industry_pattern_used},
      updated_at = NOW()
    WHERE session_id = ${sessionId}
  `;
}

function flattenScreens(
  nodes: IaScreenNode[],
  parentId: string | null = null,
  level = 0,
): Omit<IaScreenNode, "children">[] {
  const out: Omit<IaScreenNode, "children">[] = [];
  for (const node of nodes) {
    out.push({
      id: node.id,
      screen_name: node.screen_name,
      parent_id: parentId,
      level,
      priority: node.priority,
      user_access: node.user_access ?? [],
      primary_content: node.primary_content ?? [],
      key_actions: node.key_actions ?? [],
      notes: node.notes,
    });
    if (node.children?.length) {
      out.push(...flattenScreens(node.children, node.id, level + 1));
    }
  }
  return out;
}

export async function persistIaOutput(
  sessionId: string,
  output: IaOutput,
  screenMeta?: Record<string, { ux_rationale?: string; controversy_applied?: string }>,
): Promise<void> {
  await sql`DELETE FROM ia_user_flows WHERE session_id = ${sessionId}`;
  await sql`DELETE FROM ia_screen_inventory WHERE session_id = ${sessionId}`;

  const flat = flattenScreens(output.sitemap);

  for (const screen of flat) {
    const meta = screenMeta?.[screen.screen_name];
    await sql`
      INSERT INTO ia_screen_inventory (
        session_id, screen_name, parent_screen_id, level,
        priority, user_access, primary_content, key_actions, notes,
        ux_rationale, controversy_applied
      ) VALUES (
        ${sessionId},
        ${screen.screen_name},
        ${screen.parent_id},
        ${screen.level},
        ${screen.priority},
        ${sqlTextArray(screen.user_access)},
        ${sqlTextArray(screen.primary_content)},
        ${sqlTextArray(screen.key_actions)},
        ${screen.notes ?? null},
        ${meta?.ux_rationale ?? null},
        ${meta?.controversy_applied ?? null}
      )
    `;
  }

  for (const flow of output.user_flows) {
    await sql`
      INSERT INTO ia_user_flows (
        session_id, flow_name, flow_goal, steps, decision_points
      ) VALUES (
        ${sessionId},
        ${flow.flow_name},
        ${flow.flow_goal},
        ${JSON.stringify(flow.steps)}::jsonb,
        ${JSON.stringify(flow.decision_points)}::jsonb
      )
    `;
  }
}

export async function getIaScreens(sessionId: string) {
  const result = await sql`
    SELECT * FROM ia_screen_inventory
    WHERE session_id = ${sessionId}
    ORDER BY level ASC, screen_name ASC
  `;
  return result.rows.map((row) => ({
    id: String((row as Record<string, unknown>).id),
    screen_name: String((row as Record<string, unknown>).screen_name),
    priority: String((row as Record<string, unknown>).priority) as "P1" | "P2" | "P3",
    level: Number((row as Record<string, unknown>).level),
    user_access: (row as Record<string, unknown>).user_access as string[],
    primary_content: (row as Record<string, unknown>).primary_content as string[],
    key_actions: (row as Record<string, unknown>).key_actions as string[],
  }));
}

export async function getIaFlows(sessionId: string): Promise<IaUserFlow[]> {
  const result = await sql`
    SELECT * FROM ia_user_flows WHERE session_id = ${sessionId}
  `;
  return result.rows.map((row) => ({
    id: String((row as Record<string, unknown>).id),
    flow_name: String((row as Record<string, unknown>).flow_name),
    flow_goal: String((row as Record<string, unknown>).flow_goal),
    steps: (row as Record<string, unknown>).steps as IaUserFlow["steps"],
    decision_points: (row as Record<string, unknown>).decision_points as string[],
  }));
}

export function buildScreenTree(
  screens: { id: string; screen_name: string; parent_screen_id: string | null; level: number; priority: string; user_access: string[]; primary_content: string[]; key_actions: string[]; notes?: string | null }[],
): IaScreenNode[] {
  const byId = new Map<string, IaScreenNode>();
  for (const s of screens) {
    byId.set(s.id, {
      id: s.id,
      screen_name: s.screen_name,
      parent_id: s.parent_screen_id,
      level: s.level,
      priority: s.priority as IaScreenNode["priority"],
      user_access: s.user_access ?? [],
      primary_content: s.primary_content ?? [],
      key_actions: s.key_actions ?? [],
      notes: s.notes ?? undefined,
      children: [],
    });
  }

  const roots: IaScreenNode[] = [];
  for (const node of byId.values()) {
    if (node.parent_id && byId.has(node.parent_id)) {
      byId.get(node.parent_id)!.children!.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}
