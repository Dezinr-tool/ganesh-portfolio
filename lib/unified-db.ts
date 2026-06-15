import { randomUUID } from "crypto";
import { sql } from "@/lib/db";

/** @vercel/postgres accepts text[] at runtime; tagged-template types do not. */
function textArray(values: string[] | undefined | null) {
  return (values ?? []) as unknown as string;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ToolName =
  | "ea_chat"
  | "moodboard"
  | "design_audit"
  | "ux_framework"
  | "visual_framework";

export type IntelligenceCategory =
  | "brand"
  | "visual"
  | "ux"
  | "user_persona"
  | "market"
  | "competitive"
  | "preference"
  | "decision";

export type ToolSession = {
  id: string;
  session_id: string;
  tool_name: ToolName;
  user_id: string | null;
  client_name: string | null;
  project_name: string | null;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ToolIntelligence = {
  id: string;
  tool_session_id: string | null;
  tool_name: string;
  client_name: string | null;
  project_name: string | null;
  category: string;
  insight: string;
  confidence: number;
  importance: number;
  source: string | null;
  tags: string[];
  created_at: string;
};

export type ClientProfile = {
  id: string;
  client_name: string;
  industry: string | null;
  business_description: string | null;
  target_audience: unknown[];
  brand_values: string[];
  visual_preferences: Record<string, unknown>;
  ux_preferences: Record<string, unknown>;
  pain_points: string[];
  competitors: string[];
  tone_of_voice: string | null;
  color_preferences: Record<string, unknown>;
  typography_preferences: Record<string, unknown>;
  last_tool_used: string | null;
  tools_used: string[];
  total_sessions: number;
  created_at: string;
  updated_at: string;
};

export type MoodboardQuestionRow = {
  id: string;
  key: string;
  question_text: string;
  question_type: string;
  chips_options: unknown;
  parent_key: string | null;
  follow_up_condition: unknown;
  category: string;
  order_index: number;
  is_active: boolean;
  is_optional: boolean;
};

export type MoodboardOutputSectionRow = {
  id: string;
  key: string;
  label: string;
  category: string;
  description: string | null;
  follow_up_question: string | null;
  follow_up_chips: string[];
  is_active: boolean;
  order_index: number;
};

export type MoodboardSessionRow = {
  id: string;
  session_id: string;
  tool_session_id: string | null;
  client_name: string | null;
  project_name: string | null;
  project_type: string | null;
  is_redesign: boolean;
  existing_url: string | null;
  answers: Record<string, unknown>;
  selected_output_sections: string[];
  selected_model: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type DesignAuditSessionRow = {
  id: string;
  session_id: string;
  tool_session_id: string | null;
  client_name: string | null;
  project_name: string | null;
  input_type: string;
  input_source: string | null;
  context_product: string | null;
  context_target_user: string | null;
  context_primary_goal: string | null;
  context_concerns: string | null;
  selected_model: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type UXFrameworkRow = {
  id: string;
  client_name: string | null;
  project_name: string | null;
  framework_type: string;
  title: string;
  content: Record<string, unknown>;
  source: string | null;
  tool_session_id: string | null;
  created_at: string;
};

export type VisualFrameworkRow = {
  id: string;
  client_name: string | null;
  project_name: string | null;
  framework_type: string;
  title: string;
  content: Record<string, unknown>;
  source: string | null;
  tool_session_id: string | null;
  created_at: string;
};

export type UnifiedToolContext = {
  type: string;
  client_name: string;
  project_name: string | null;
  client_profile: ClientProfile | null;
  intelligence: ToolIntelligence[];
  previous_sessions: ToolSession[];
  ux_frameworks: UXFrameworkRow[];
  visual_frameworks: VisualFrameworkRow[];
  tool_specific: Record<string, unknown>;
};

// ---------------------------------------------------------------------------
// Tool Sessions
// ---------------------------------------------------------------------------

export async function createToolSession(
  tool: ToolName,
  clientName?: string,
  projectName?: string,
  userId?: string,
): Promise<ToolSession> {
  const sessionId = randomUUID();
  const result = await sql`
    INSERT INTO tool_sessions (session_id, tool_name, client_name, project_name, user_id)
    VALUES (${sessionId}, ${tool}, ${clientName ?? null}, ${projectName ?? null}, ${userId ?? null})
    RETURNING *
  `;
  return rowToToolSession(result.rows[0] as Record<string, unknown>);
}

export async function getToolSession(sessionId: string): Promise<ToolSession | null> {
  const result = await sql`
    SELECT * FROM tool_sessions WHERE session_id = ${sessionId} LIMIT 1
  `;
  const row = result.rows[0];
  return row ? rowToToolSession(row as Record<string, unknown>) : null;
}

export async function updateToolSession(
  sessionId: string,
  data: Partial<{
    status: string;
    client_name: string;
    project_name: string;
    metadata: Record<string, unknown>;
  }>,
): Promise<ToolSession | null> {
  const existing = await getToolSession(sessionId);
  if (!existing) return null;

  const result = await sql`
    UPDATE tool_sessions SET
      status = ${data.status ?? existing.status},
      client_name = ${data.client_name ?? existing.client_name},
      project_name = ${data.project_name ?? existing.project_name},
      metadata = ${JSON.stringify(data.metadata ?? existing.metadata)},
      updated_at = NOW()
    WHERE session_id = ${sessionId}
    RETURNING *
  `;
  const row = result.rows[0];
  return row ? rowToToolSession(row as Record<string, unknown>) : null;
}

export async function getToolSessionsForClient(
  clientName: string,
  limit = 20,
): Promise<ToolSession[]> {
  const result = await sql`
    SELECT * FROM tool_sessions
    WHERE client_name ILIKE ${clientName}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return result.rows.map((r) => rowToToolSession(r as Record<string, unknown>));
}

// ---------------------------------------------------------------------------
// Intelligence
// ---------------------------------------------------------------------------

export async function saveIntelligence(
  toolSessionId: string,
  toolName: ToolName,
  category: IntelligenceCategory,
  insight: string,
  source: string,
  opts?: {
    clientName?: string;
    projectName?: string;
    confidence?: number;
    importance?: number;
    tags?: string[];
  },
): Promise<ToolIntelligence> {
  const result = await sql`
    INSERT INTO tool_intelligence (
      tool_session_id, tool_name, client_name, project_name,
      category, insight, confidence, importance, source, tags
    ) VALUES (
      ${toolSessionId},
      ${toolName},
      ${opts?.clientName ?? null},
      ${opts?.projectName ?? null},
      ${category},
      ${insight},
      ${opts?.confidence ?? 0.8},
      ${opts?.importance ?? 5},
      ${source},
      ${textArray(opts?.tags)}
    )
    RETURNING *
  `;
  return rowToIntelligence(result.rows[0] as Record<string, unknown>);
}

export async function getIntelligenceForClient(
  clientName: string,
  limit = 50,
): Promise<ToolIntelligence[]> {
  const result = await sql`
    SELECT * FROM tool_intelligence
    WHERE client_name ILIKE ${clientName}
    ORDER BY importance DESC, created_at DESC
    LIMIT ${limit}
  `;
  return result.rows.map((r) => rowToIntelligence(r as Record<string, unknown>));
}

export async function getIntelligenceForTool(
  toolName: ToolName,
  clientName?: string,
  limit = 50,
): Promise<ToolIntelligence[]> {
  if (clientName) {
    const result = await sql`
      SELECT * FROM tool_intelligence
      WHERE tool_name = ${toolName} AND client_name ILIKE ${clientName}
      ORDER BY importance DESC, created_at DESC
      LIMIT ${limit}
    `;
    return result.rows.map((r) => rowToIntelligence(r as Record<string, unknown>));
  }

  const result = await sql`
    SELECT * FROM tool_intelligence
    WHERE tool_name = ${toolName}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return result.rows.map((r) => rowToIntelligence(r as Record<string, unknown>));
}

// ---------------------------------------------------------------------------
// Client Profiles
// ---------------------------------------------------------------------------

export async function upsertClientProfile(
  clientName: string,
  data: Partial<Omit<ClientProfile, "id" | "client_name" | "created_at" | "updated_at">>,
): Promise<ClientProfile> {
  const result = await sql`
    INSERT INTO client_profiles (client_name, industry, business_description, target_audience,
      brand_values, visual_preferences, ux_preferences, pain_points, competitors,
      tone_of_voice, color_preferences, typography_preferences, last_tool_used, tools_used)
    VALUES (
      ${clientName},
      ${data.industry ?? null},
      ${data.business_description ?? null},
      ${JSON.stringify(data.target_audience ?? [])},
      ${textArray(data.brand_values)},
      ${JSON.stringify(data.visual_preferences ?? {})},
      ${JSON.stringify(data.ux_preferences ?? {})},
      ${textArray(data.pain_points)},
      ${textArray(data.competitors)},
      ${data.tone_of_voice ?? null},
      ${JSON.stringify(data.color_preferences ?? {})},
      ${JSON.stringify(data.typography_preferences ?? {})},
      ${data.last_tool_used ?? null},
      ${textArray(data.tools_used)}
    )
    ON CONFLICT (client_name) DO UPDATE SET
      industry = COALESCE(EXCLUDED.industry, client_profiles.industry),
      business_description = COALESCE(EXCLUDED.business_description, client_profiles.business_description),
      target_audience = CASE WHEN EXCLUDED.target_audience::text != '[]'
        THEN EXCLUDED.target_audience ELSE client_profiles.target_audience END,
      brand_values = CASE WHEN array_length(EXCLUDED.brand_values, 1) > 0
        THEN EXCLUDED.brand_values ELSE client_profiles.brand_values END,
      visual_preferences = client_profiles.visual_preferences || EXCLUDED.visual_preferences,
      ux_preferences = client_profiles.ux_preferences || EXCLUDED.ux_preferences,
      pain_points = CASE WHEN array_length(EXCLUDED.pain_points, 1) > 0
        THEN EXCLUDED.pain_points ELSE client_profiles.pain_points END,
      competitors = CASE WHEN array_length(EXCLUDED.competitors, 1) > 0
        THEN EXCLUDED.competitors ELSE client_profiles.competitors END,
      tone_of_voice = COALESCE(EXCLUDED.tone_of_voice, client_profiles.tone_of_voice),
      color_preferences = client_profiles.color_preferences || EXCLUDED.color_preferences,
      typography_preferences = client_profiles.typography_preferences || EXCLUDED.typography_preferences,
      last_tool_used = COALESCE(EXCLUDED.last_tool_used, client_profiles.last_tool_used),
      tools_used = (
        SELECT ARRAY(SELECT DISTINCT unnest(client_profiles.tools_used || EXCLUDED.tools_used))
      ),
      total_sessions = client_profiles.total_sessions + 1,
      updated_at = NOW()
    RETURNING *
  `;
  return rowToClientProfile(result.rows[0] as Record<string, unknown>);
}

export async function getClientProfile(clientName: string): Promise<ClientProfile | null> {
  const result = await sql`
    SELECT * FROM client_profiles WHERE client_name ILIKE ${clientName} LIMIT 1
  `;
  const row = result.rows[0];
  return row ? rowToClientProfile(row as Record<string, unknown>) : null;
}

export async function enrichClientFromTool(
  clientName: string,
  toolName: ToolName,
  data: Record<string, unknown>,
): Promise<ClientProfile> {
  const patch: Partial<Omit<ClientProfile, "id" | "client_name" | "created_at" | "updated_at">> = {
    last_tool_used: toolName,
    tools_used: [toolName],
  };

  if (typeof data.industry === "string") patch.industry = data.industry;
  if (typeof data.business_description === "string") {
    patch.business_description = data.business_description;
  }
  if (typeof data.tone_of_voice === "string") patch.tone_of_voice = data.tone_of_voice;
  if (Array.isArray(data.pain_points)) patch.pain_points = data.pain_points.map(String);
  if (Array.isArray(data.competitors)) patch.competitors = data.competitors.map(String);
  if (Array.isArray(data.brand_values)) patch.brand_values = data.brand_values.map(String);
  if (Array.isArray(data.target_audience)) patch.target_audience = data.target_audience;
  if (data.visual_preferences && typeof data.visual_preferences === "object") {
    patch.visual_preferences = data.visual_preferences as Record<string, unknown>;
  }
  if (data.ux_preferences && typeof data.ux_preferences === "object") {
    patch.ux_preferences = data.ux_preferences as Record<string, unknown>;
  }
  if (data.color_preferences && typeof data.color_preferences === "object") {
    patch.color_preferences = data.color_preferences as Record<string, unknown>;
  }
  if (data.typography_preferences && typeof data.typography_preferences === "object") {
    patch.typography_preferences = data.typography_preferences as Record<string, unknown>;
  }

  return upsertClientProfile(clientName, patch);
}

// ---------------------------------------------------------------------------
// Moodboard
// ---------------------------------------------------------------------------

export async function getMoodboardQuestions(
  activeOnly = true,
): Promise<MoodboardQuestionRow[]> {
  const result = activeOnly
    ? await sql`
        SELECT * FROM moodboard_question_tree
        WHERE is_active = true
        ORDER BY order_index ASC
      `
    : await sql`
        SELECT * FROM moodboard_question_tree
        ORDER BY order_index ASC
      `;
  return result.rows.map((r) => rowToQuestion(r as Record<string, unknown>));
}

export async function getMoodboardOutputSections(
  activeOnly = true,
): Promise<MoodboardOutputSectionRow[]> {
  const result = activeOnly
    ? await sql`
        SELECT * FROM moodboard_output_sections
        WHERE is_active = true
        ORDER BY order_index ASC
      `
    : await sql`
        SELECT * FROM moodboard_output_sections
        ORDER BY order_index ASC
      `;
  return result.rows.map((r) => rowToOutputSection(r as Record<string, unknown>));
}

export async function createMoodboardSession(data: {
  sessionId?: string;
  toolSessionId?: string;
  clientName?: string;
  projectName?: string;
  projectType?: string;
  isRedesign?: boolean;
  existingUrl?: string;
  selectedModel?: string;
}): Promise<MoodboardSessionRow> {
  const sessionId = data.sessionId ?? randomUUID();
  const result = await sql`
    INSERT INTO moodboard_sessions (
      session_id, tool_session_id, client_name, project_name,
      project_type, is_redesign, existing_url, selected_model
    ) VALUES (
      ${sessionId},
      ${data.toolSessionId ?? null},
      ${data.clientName ?? null},
      ${data.projectName ?? null},
      ${data.projectType ?? null},
      ${data.isRedesign ?? false},
      ${data.existingUrl ?? null},
      ${data.selectedModel ?? "claude-sonnet-4-6"}
    )
    ON CONFLICT (session_id) DO UPDATE SET updated_at = NOW()
    RETURNING *
  `;
  return rowToMoodboardSession(result.rows[0] as Record<string, unknown>);
}

export async function getMoodboardSession(
  sessionId: string,
): Promise<MoodboardSessionRow | null> {
  const result = await sql`
    SELECT * FROM moodboard_sessions WHERE session_id = ${sessionId} LIMIT 1
  `;
  const row = result.rows[0];
  return row ? rowToMoodboardSession(row as Record<string, unknown>) : null;
}

export async function saveMoodboardDirection(
  sessionId: string,
  direction: Record<string, unknown>,
): Promise<void> {
  await sql`
    INSERT INTO moodboard_directions (
      session_id, direction_index, direction_name, tagline,
      persona_name, persona_description, persona_age, persona_occupation,
      pain_points, brand_strategy, tone_of_voice, tone_example,
      color_palette, typography, icon_style, icon_rationale,
      illustration_style, illustration_rationale, photography_style,
      product_image_direction, motion_direction, ui_references,
      component_style, brand_voice, dos_and_donts, competitor_references,
      is_selected, refinement_notes, refined_count
    ) VALUES (
      ${sessionId},
      ${Number(direction.direction_index ?? direction.directionIndex ?? 1)},
      ${String(direction.direction_name ?? direction.directionName ?? "Untitled")},
      ${String(direction.tagline ?? "")},
      ${String(direction.persona_name ?? direction.personaName ?? "") || null},
      ${String(direction.persona_description ?? direction.personaDescription ?? "") || null},
      ${String(direction.persona_age ?? direction.personaAge ?? "") || null},
      ${String(direction.persona_occupation ?? direction.personaOccupation ?? "") || null},
      ${JSON.stringify(direction.pain_points ?? direction.painPoints ?? [])},
      ${String(direction.brand_strategy ?? direction.brandStrategy ?? "") || null},
      ${String(direction.tone_of_voice ?? direction.toneOfVoice ?? "") || null},
      ${String(direction.tone_example ?? direction.toneExample ?? "") || null},
      ${JSON.stringify(direction.color_palette ?? direction.colorPalette ?? [])},
      ${JSON.stringify(direction.typography ?? {})},
      ${String(direction.icon_style ?? direction.iconStyle ?? "") || null},
      ${String(direction.icon_rationale ?? direction.iconRationale ?? "") || null},
      ${String(direction.illustration_style ?? direction.illustrationStyle ?? "") || null},
      ${String(direction.illustration_rationale ?? direction.illustrationRationale ?? "") || null},
      ${String(direction.photography_style ?? direction.photographyStyle ?? "") || null},
      ${String(direction.product_image_direction ?? direction.productImageDirection ?? "") || null},
      ${String(direction.motion_direction ?? direction.motionDirection ?? "") || null},
      ${JSON.stringify(direction.ui_references ?? direction.uiReferences ?? [])},
      ${JSON.stringify(direction.component_style ?? direction.componentStyle ?? {})},
      ${String(direction.brand_voice ?? direction.brandVoice ?? "") || null},
      ${JSON.stringify(direction.dos_and_donts ?? direction.dosAndDonts ?? {})},
      ${JSON.stringify(direction.competitor_references ?? direction.competitorReferences ?? [])},
      ${Boolean(direction.is_selected ?? direction.isSelected ?? false)},
      ${String(direction.refinement_notes ?? direction.refinementNotes ?? "") || null},
      ${Number(direction.refined_count ?? direction.refinedCount ?? 0)}
    )
  `;
}

// ---------------------------------------------------------------------------
// Design Audit
// ---------------------------------------------------------------------------

export async function createAuditSession(data: {
  sessionId?: string;
  toolSessionId?: string;
  clientName?: string;
  projectName?: string;
  inputType: string;
  inputSource?: string;
  contextProduct?: string;
  contextTargetUser?: string;
  contextPrimaryGoal?: string;
  contextConcerns?: string;
  selectedModel?: string;
}): Promise<DesignAuditSessionRow> {
  const sessionId = data.sessionId ?? randomUUID();
  const result = await sql`
    INSERT INTO design_audit_sessions (
      session_id, tool_session_id, client_name, project_name,
      input_type, input_source, context_product, context_target_user,
      context_primary_goal, context_concerns, selected_model
    ) VALUES (
      ${sessionId},
      ${data.toolSessionId ?? null},
      ${data.clientName ?? null},
      ${data.projectName ?? null},
      ${data.inputType},
      ${data.inputSource ?? null},
      ${data.contextProduct ?? null},
      ${data.contextTargetUser ?? null},
      ${data.contextPrimaryGoal ?? null},
      ${data.contextConcerns ?? null},
      ${data.selectedModel ?? "claude-sonnet-4-6"}
    )
    ON CONFLICT (session_id) DO UPDATE SET updated_at = NOW()
    RETURNING *
  `;
  return rowToAuditSession(result.rows[0] as Record<string, unknown>);
}

export async function saveAuditReport(
  sessionId: string,
  report: Record<string, unknown>,
): Promise<void> {
  await sql`
    INSERT INTO design_audit_reports (
      session_id, overall_score, overall_summary,
      critical_issues, important_issues, polish_issues,
      visual_hierarchy, typography, color_system, spacing_layout,
      information_architecture, ux_patterns, accessibility,
      industry_standards, consistency, mobile_responsiveness
    ) VALUES (
      ${sessionId},
      ${Number(report.overall_score ?? report.overallScore ?? 0)},
      ${String(report.overall_summary ?? report.overallSummary ?? "")},
      ${JSON.stringify(report.critical_issues ?? report.criticalIssues ?? [])},
      ${JSON.stringify(report.important_issues ?? report.importantIssues ?? [])},
      ${JSON.stringify(report.polish_issues ?? report.polishIssues ?? [])},
      ${JSON.stringify(report.visual_hierarchy ?? report.visualHierarchy ?? {})},
      ${JSON.stringify(report.typography ?? {})},
      ${JSON.stringify(report.color_system ?? report.colorSystem ?? {})},
      ${JSON.stringify(report.spacing_layout ?? report.spacingLayout ?? {})},
      ${JSON.stringify(report.information_architecture ?? report.informationArchitecture ?? {})},
      ${JSON.stringify(report.ux_patterns ?? report.uxPatterns ?? {})},
      ${JSON.stringify(report.accessibility ?? {})},
      ${JSON.stringify(report.industry_standards ?? report.industryStandards ?? {})},
      ${JSON.stringify(report.consistency ?? {})},
      ${JSON.stringify(report.mobile_responsiveness ?? report.mobileResponsiveness ?? {})}
    )
  `;
}

export async function getAuditSession(
  sessionId: string,
): Promise<DesignAuditSessionRow | null> {
  const result = await sql`
    SELECT * FROM design_audit_sessions WHERE session_id = ${sessionId} LIMIT 1
  `;
  const row = result.rows[0];
  return row ? rowToAuditSession(row as Record<string, unknown>) : null;
}

// ---------------------------------------------------------------------------
// Frameworks
// ---------------------------------------------------------------------------

export async function saveUXFramework(data: {
  clientName?: string;
  projectName?: string;
  frameworkType: string;
  title: string;
  content: Record<string, unknown>;
  source?: string;
  toolSessionId?: string;
}): Promise<UXFrameworkRow> {
  const result = await sql`
    INSERT INTO ux_frameworks (
      client_name, project_name, framework_type, title, content, source, tool_session_id
    ) VALUES (
      ${data.clientName ?? null},
      ${data.projectName ?? null},
      ${data.frameworkType},
      ${data.title},
      ${JSON.stringify(data.content)},
      ${data.source ?? null},
      ${data.toolSessionId ?? null}
    )
    RETURNING *
  `;
  return rowToUXFramework(result.rows[0] as Record<string, unknown>);
}

export async function saveVisualFramework(data: {
  clientName?: string;
  projectName?: string;
  frameworkType: string;
  title: string;
  content: Record<string, unknown>;
  source?: string;
  toolSessionId?: string;
}): Promise<VisualFrameworkRow> {
  const result = await sql`
    INSERT INTO visual_frameworks (
      client_name, project_name, framework_type, title, content, source, tool_session_id
    ) VALUES (
      ${data.clientName ?? null},
      ${data.projectName ?? null},
      ${data.frameworkType},
      ${data.title},
      ${JSON.stringify(data.content)},
      ${data.source ?? null},
      ${data.toolSessionId ?? null}
    )
    RETURNING *
  `;
  return rowToVisualFramework(result.rows[0] as Record<string, unknown>);
}

export async function getFrameworksForClient(clientName: string): Promise<{
  ux: UXFrameworkRow[];
  visual: VisualFrameworkRow[];
}> {
  const [uxResult, visualResult] = await Promise.all([
    sql`
      SELECT * FROM ux_frameworks
      WHERE client_name ILIKE ${clientName}
      ORDER BY created_at DESC
    `,
    sql`
      SELECT * FROM visual_frameworks
      WHERE client_name ILIKE ${clientName}
      ORDER BY created_at DESC
    `,
  ]);

  return {
    ux: uxResult.rows.map((r) => rowToUXFramework(r as Record<string, unknown>)),
    visual: visualResult.rows.map((r) =>
      rowToVisualFramework(r as Record<string, unknown>),
    ),
  };
}

// ---------------------------------------------------------------------------
// Unified Tool Context
// ---------------------------------------------------------------------------

const TOOL_CATEGORY_MAP: Record<string, IntelligenceCategory[]> = {
  moodboard: ["brand", "visual", "user_persona", "competitive", "preference"],
  design_audit: ["ux", "visual", "preference", "decision"],
  ea_chat: ["brand", "market", "competitive", "decision", "user_persona"],
  ux_framework: ["ux", "user_persona", "decision"],
  visual_framework: ["visual", "brand", "preference"],
};

export async function buildUnifiedToolContext(input: {
  type: ToolName | string;
  client_name: string;
  project_name?: string;
}): Promise<UnifiedToolContext> {
  const type = input.type as ToolName;
  const clientName = input.client_name;

  const [profile, allIntelligence, sessions, frameworks] = await Promise.all([
    getClientProfile(clientName),
    getIntelligenceForClient(clientName),
    getToolSessionsForClient(clientName),
    getFrameworksForClient(clientName),
  ]);

  const relevantCategories = TOOL_CATEGORY_MAP[type] ?? [];
  const intelligence =
    relevantCategories.length > 0
      ? allIntelligence.filter((i) =>
          relevantCategories.includes(i.category as IntelligenceCategory),
        )
      : allIntelligence;

  const toolSpecific: Record<string, unknown> = {};

  if (type === "moodboard") {
    toolSpecific.questions_count = (await getMoodboardQuestions()).length;
    toolSpecific.output_sections = await getMoodboardOutputSections();
  }

  if (type === "design_audit") {
    toolSpecific.ux_preferences = profile?.ux_preferences ?? {};
    toolSpecific.visual_preferences = profile?.visual_preferences ?? {};
  }

  return {
    type,
    client_name: clientName,
    project_name: input.project_name ?? null,
    client_profile: profile,
    intelligence,
    previous_sessions: sessions,
    ux_frameworks: frameworks.ux,
    visual_frameworks: frameworks.visual,
    tool_specific: toolSpecific,
  };
}

// ---------------------------------------------------------------------------
// Row mappers
// ---------------------------------------------------------------------------

function rowToToolSession(row: Record<string, unknown>): ToolSession {
  return {
    id: String(row.id),
    session_id: String(row.session_id),
    tool_name: row.tool_name as ToolName,
    user_id: row.user_id ? String(row.user_id) : null,
    client_name: row.client_name ? String(row.client_name) : null,
    project_name: row.project_name ? String(row.project_name) : null,
    status: String(row.status ?? "active"),
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function rowToIntelligence(row: Record<string, unknown>): ToolIntelligence {
  return {
    id: String(row.id),
    tool_session_id: row.tool_session_id ? String(row.tool_session_id) : null,
    tool_name: String(row.tool_name),
    client_name: row.client_name ? String(row.client_name) : null,
    project_name: row.project_name ? String(row.project_name) : null,
    category: String(row.category),
    insight: String(row.insight),
    confidence: Number(row.confidence ?? 0.8),
    importance: Number(row.importance ?? 5),
    source: row.source ? String(row.source) : null,
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    created_at: String(row.created_at),
  };
}

function rowToClientProfile(row: Record<string, unknown>): ClientProfile {
  return {
    id: String(row.id),
    client_name: String(row.client_name),
    industry: row.industry ? String(row.industry) : null,
    business_description: row.business_description
      ? String(row.business_description)
      : null,
    target_audience: Array.isArray(row.target_audience) ? row.target_audience : [],
    brand_values: Array.isArray(row.brand_values) ? row.brand_values.map(String) : [],
    visual_preferences: (row.visual_preferences as Record<string, unknown>) ?? {},
    ux_preferences: (row.ux_preferences as Record<string, unknown>) ?? {},
    pain_points: Array.isArray(row.pain_points) ? row.pain_points.map(String) : [],
    competitors: Array.isArray(row.competitors) ? row.competitors.map(String) : [],
    tone_of_voice: row.tone_of_voice ? String(row.tone_of_voice) : null,
    color_preferences: (row.color_preferences as Record<string, unknown>) ?? {},
    typography_preferences:
      (row.typography_preferences as Record<string, unknown>) ?? {},
    last_tool_used: row.last_tool_used ? String(row.last_tool_used) : null,
    tools_used: Array.isArray(row.tools_used) ? row.tools_used.map(String) : [],
    total_sessions: Number(row.total_sessions ?? 0),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function rowToQuestion(row: Record<string, unknown>): MoodboardQuestionRow {
  return {
    id: String(row.id),
    key: String(row.key),
    question_text: String(row.question_text),
    question_type: String(row.question_type),
    chips_options: row.chips_options,
    parent_key: row.parent_key ? String(row.parent_key) : null,
    follow_up_condition: row.follow_up_condition,
    category: String(row.category),
    order_index: Number(row.order_index),
    is_active: Boolean(row.is_active),
    is_optional: Boolean(row.is_optional),
  };
}

function rowToOutputSection(row: Record<string, unknown>): MoodboardOutputSectionRow {
  const chips = row.follow_up_chips;
  return {
    id: String(row.id),
    key: String(row.key),
    label: String(row.label),
    category: String(row.category),
    description: row.description ? String(row.description) : null,
    follow_up_question: row.follow_up_question ? String(row.follow_up_question) : null,
    follow_up_chips: Array.isArray(chips) ? chips.map(String) : [],
    is_active: Boolean(row.is_active),
    order_index: Number(row.order_index),
  };
}

function rowToMoodboardSession(row: Record<string, unknown>): MoodboardSessionRow {
  const sections = row.selected_output_sections;
  return {
    id: String(row.id),
    session_id: String(row.session_id),
    tool_session_id: row.tool_session_id ? String(row.tool_session_id) : null,
    client_name: row.client_name ? String(row.client_name) : null,
    project_name: row.project_name ? String(row.project_name) : null,
    project_type: row.project_type ? String(row.project_type) : null,
    is_redesign: Boolean(row.is_redesign),
    existing_url: row.existing_url ? String(row.existing_url) : null,
    answers: (row.answers as Record<string, unknown>) ?? {},
    selected_output_sections: Array.isArray(sections) ? sections.map(String) : [],
    selected_model: String(row.selected_model ?? "claude-sonnet-4-6"),
    status: String(row.status ?? "in_progress"),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function rowToAuditSession(row: Record<string, unknown>): DesignAuditSessionRow {
  return {
    id: String(row.id),
    session_id: String(row.session_id),
    tool_session_id: row.tool_session_id ? String(row.tool_session_id) : null,
    client_name: row.client_name ? String(row.client_name) : null,
    project_name: row.project_name ? String(row.project_name) : null,
    input_type: String(row.input_type),
    input_source: row.input_source ? String(row.input_source) : null,
    context_product: row.context_product ? String(row.context_product) : null,
    context_target_user: row.context_target_user ? String(row.context_target_user) : null,
    context_primary_goal: row.context_primary_goal ? String(row.context_primary_goal) : null,
    context_concerns: row.context_concerns ? String(row.context_concerns) : null,
    selected_model: String(row.selected_model ?? "claude-sonnet-4-6"),
    status: String(row.status ?? "in_progress"),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function rowToUXFramework(row: Record<string, unknown>): UXFrameworkRow {
  return {
    id: String(row.id),
    client_name: row.client_name ? String(row.client_name) : null,
    project_name: row.project_name ? String(row.project_name) : null,
    framework_type: String(row.framework_type),
    title: String(row.title),
    content: (row.content as Record<string, unknown>) ?? {},
    source: row.source ? String(row.source) : null,
    tool_session_id: row.tool_session_id ? String(row.tool_session_id) : null,
    created_at: String(row.created_at),
  };
}

function rowToVisualFramework(row: Record<string, unknown>): VisualFrameworkRow {
  return {
    id: String(row.id),
    client_name: row.client_name ? String(row.client_name) : null,
    project_name: row.project_name ? String(row.project_name) : null,
    framework_type: String(row.framework_type),
    title: String(row.title),
    content: (row.content as Record<string, unknown>) ?? {},
    source: row.source ? String(row.source) : null,
    tool_session_id: row.tool_session_id ? String(row.tool_session_id) : null,
    created_at: String(row.created_at),
  };
}
