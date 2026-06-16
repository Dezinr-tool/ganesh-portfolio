import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { sql } from "../lib/db";
import {
  INTAKE_QUESTION_SEED,
  OUTPUT_SECTION_SEED,
} from "../lib/unified-db/seed-data";
import { seedKnowledgeBaseFromFiles } from "../lib/knowledge/db";

async function run(label: string, query: string) {
  console.log(`  ${label}…`);
  await sql.query(query);
}

async function createTables() {
  console.log("\n=== CORE BRIDGE ===\n");

  await run("tool_sessions", `
    CREATE TABLE IF NOT EXISTS tool_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id TEXT UNIQUE NOT NULL,
      tool_name TEXT NOT NULL,
      user_id TEXT,
      client_name TEXT,
      project_name TEXT,
      status TEXT DEFAULT 'active',
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await run("tool_intelligence", `
    CREATE TABLE IF NOT EXISTS tool_intelligence (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tool_session_id TEXT REFERENCES tool_sessions(session_id) ON DELETE SET NULL,
      tool_name TEXT NOT NULL,
      client_name TEXT,
      project_name TEXT,
      category TEXT NOT NULL,
      insight TEXT NOT NULL,
      confidence FLOAT DEFAULT 0.8,
      importance INTEGER DEFAULT 5,
      source TEXT,
      tags TEXT[] DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await run("client_profiles", `
    CREATE TABLE IF NOT EXISTS client_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      client_name TEXT UNIQUE NOT NULL,
      industry TEXT,
      business_description TEXT,
      target_audience JSONB DEFAULT '[]',
      brand_values TEXT[] DEFAULT '{}',
      visual_preferences JSONB DEFAULT '{}',
      ux_preferences JSONB DEFAULT '{}',
      pain_points TEXT[] DEFAULT '{}',
      competitors TEXT[] DEFAULT '{}',
      tone_of_voice TEXT,
      color_preferences JSONB DEFAULT '{}',
      typography_preferences JSONB DEFAULT '{}',
      last_tool_used TEXT,
      tools_used TEXT[] DEFAULT '{}',
      total_sessions INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  console.log("\n=== MOODBOARD ===\n");

  await run("moodboard_question_tree", `
    CREATE TABLE IF NOT EXISTS moodboard_question_tree (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      key TEXT UNIQUE NOT NULL,
      question_text TEXT NOT NULL,
      question_type TEXT NOT NULL,
      chips_options JSONB DEFAULT '[]',
      parent_key TEXT,
      follow_up_condition JSONB DEFAULT '{}',
      category TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      is_active BOOLEAN DEFAULT true,
      is_optional BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await run("moodboard_output_sections", `
    CREATE TABLE IF NOT EXISTS moodboard_output_sections (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      key TEXT UNIQUE NOT NULL,
      label TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      follow_up_question TEXT,
      follow_up_chips JSONB DEFAULT '[]',
      is_active BOOLEAN DEFAULT true,
      order_index INTEGER NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await run("moodboard_sessions", `
    CREATE TABLE IF NOT EXISTS moodboard_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id TEXT UNIQUE NOT NULL,
      tool_session_id TEXT REFERENCES tool_sessions(session_id) ON DELETE SET NULL,
      client_name TEXT,
      project_name TEXT,
      project_type TEXT,
      is_redesign BOOLEAN DEFAULT false,
      existing_url TEXT,
      answers JSONB DEFAULT '{}',
      selected_output_sections TEXT[] DEFAULT '{}',
      selected_model TEXT DEFAULT 'claude-sonnet-4-6',
      status TEXT DEFAULT 'in_progress',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await run("moodboard_directions", `
    CREATE TABLE IF NOT EXISTS moodboard_directions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id TEXT NOT NULL,
      direction_index INTEGER NOT NULL,
      direction_name TEXT NOT NULL,
      tagline TEXT,
      persona_name TEXT,
      persona_description TEXT,
      persona_age TEXT,
      persona_occupation TEXT,
      pain_points JSONB DEFAULT '[]',
      brand_strategy TEXT,
      tone_of_voice TEXT,
      tone_example TEXT,
      color_palette JSONB DEFAULT '[]',
      typography JSONB DEFAULT '{}',
      icon_style TEXT,
      icon_rationale TEXT,
      illustration_style TEXT,
      illustration_rationale TEXT,
      photography_style TEXT,
      product_image_direction TEXT,
      motion_direction TEXT,
      ui_references JSONB DEFAULT '[]',
      component_style JSONB DEFAULT '{}',
      brand_voice TEXT,
      dos_and_donts JSONB DEFAULT '{}',
      competitor_references JSONB DEFAULT '[]',
      is_selected BOOLEAN DEFAULT false,
      refinement_notes TEXT,
      refined_count INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  console.log("\n=== DESIGN AUDIT ===\n");

  await run("design_audit_sessions", `
    CREATE TABLE IF NOT EXISTS design_audit_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id TEXT UNIQUE NOT NULL,
      tool_session_id TEXT REFERENCES tool_sessions(session_id) ON DELETE SET NULL,
      client_name TEXT,
      project_name TEXT,
      input_type TEXT NOT NULL,
      input_source TEXT,
      context_product TEXT,
      context_target_user TEXT,
      context_primary_goal TEXT,
      context_concerns TEXT,
      selected_model TEXT DEFAULT 'claude-sonnet-4-6',
      status TEXT DEFAULT 'in_progress',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await run("design_audit_reports", `
    CREATE TABLE IF NOT EXISTS design_audit_reports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id TEXT NOT NULL,
      overall_score FLOAT NOT NULL,
      overall_summary TEXT NOT NULL,
      critical_issues JSONB DEFAULT '[]',
      important_issues JSONB DEFAULT '[]',
      polish_issues JSONB DEFAULT '[]',
      visual_hierarchy JSONB DEFAULT '{}',
      typography JSONB DEFAULT '{}',
      color_system JSONB DEFAULT '{}',
      spacing_layout JSONB DEFAULT '{}',
      information_architecture JSONB DEFAULT '{}',
      ux_patterns JSONB DEFAULT '{}',
      accessibility JSONB DEFAULT '{}',
      industry_standards JSONB DEFAULT '{}',
      consistency JSONB DEFAULT '{}',
      mobile_responsiveness JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  console.log("\n=== FRAMEWORKS ===\n");

  await run("ux_frameworks", `
    CREATE TABLE IF NOT EXISTS ux_frameworks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      client_name TEXT,
      project_name TEXT,
      framework_type TEXT NOT NULL,
      title TEXT NOT NULL,
      content JSONB NOT NULL,
      source TEXT,
      tool_session_id TEXT REFERENCES tool_sessions(session_id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await run("visual_frameworks", `
    CREATE TABLE IF NOT EXISTS visual_frameworks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      client_name TEXT,
      project_name TEXT,
      framework_type TEXT NOT NULL,
      title TEXT NOT NULL,
      content JSONB NOT NULL,
      source TEXT,
      tool_session_id TEXT REFERENCES tool_sessions(session_id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  console.log("\n=== KNOWLEDGE BASE ===\n");

  await run("ux_knowledge_base", `
    CREATE TABLE IF NOT EXISTS ux_knowledge_base (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      category TEXT NOT NULL,
      file_name TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      version INTEGER DEFAULT 1,
      sources JSONB DEFAULT '[]',
      last_researched_at TIMESTAMPTZ,
      last_updated_at TIMESTAMPTZ DEFAULT NOW(),
      next_update_at TIMESTAMPTZ,
      update_frequency TEXT DEFAULT 'weekly',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await run("ux_knowledge_updates", `
    CREATE TABLE IF NOT EXISTS ux_knowledge_updates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      knowledge_id UUID REFERENCES ux_knowledge_base(id) ON DELETE CASCADE,
      file_name TEXT NOT NULL,
      previous_version INTEGER,
      new_version INTEGER,
      changes_summary TEXT,
      new_content TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      update_source TEXT DEFAULT 'auto'
    );
  `);

  console.log("\n=== INFORMATION ARCHITECTURE (P13) ===\n");

  await run("ia_sessions", `
    CREATE TABLE IF NOT EXISTS ia_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id TEXT UNIQUE NOT NULL,
      tool_session_id TEXT REFERENCES tool_sessions(session_id) ON DELETE SET NULL,
      client_name TEXT,
      project_name TEXT,
      product_type TEXT,
      answers JSONB DEFAULT '{}',
      ia_output JSONB,
      competitor_analysis JSONB DEFAULT '{}',
      competitor_screenshots TEXT[] DEFAULT '{}',
      ux_controversy_decisions JSONB DEFAULT '{}',
      industry_pattern_used TEXT,
      status TEXT DEFAULT 'in_progress',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await run("ia_screen_inventory", `
    CREATE TABLE IF NOT EXISTS ia_screen_inventory (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id TEXT NOT NULL,
      screen_name TEXT NOT NULL,
      parent_screen_id TEXT,
      level INTEGER DEFAULT 0,
      priority TEXT DEFAULT 'P2',
      user_access TEXT[] DEFAULT '{}',
      primary_content TEXT[] DEFAULT '{}',
      key_actions TEXT[] DEFAULT '{}',
      notes TEXT,
      ux_rationale TEXT,
      controversy_applied TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await run("ia_user_flows", `
    CREATE TABLE IF NOT EXISTS ia_user_flows (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id TEXT NOT NULL,
      flow_name TEXT NOT NULL,
      flow_goal TEXT,
      steps JSONB DEFAULT '[]',
      decision_points JSONB DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  console.log("\n=== WIREFRAME (P14) ===\n");

  await run("wireframe_sessions", `
    CREATE TABLE IF NOT EXISTS wireframe_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id TEXT UNIQUE NOT NULL,
      ia_session_id TEXT NOT NULL REFERENCES ia_sessions(session_id) ON DELETE CASCADE,
      client_name TEXT,
      project_name TEXT,
      selected_screens TEXT[] DEFAULT '{}',
      screen_notes JSONB DEFAULT '{}',
      moodboard_session_id TEXT,
      audit_session_id TEXT,
      status TEXT DEFAULT 'in_progress',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await run("wireframe_screens", `
    CREATE TABLE IF NOT EXISTS wireframe_screens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id TEXT NOT NULL,
      screen_name TEXT NOT NULL,
      ia_screen_id TEXT,
      spec JSONB DEFAULT '{}',
      jsx_code TEXT NOT NULL,
      annotations JSONB DEFAULT '[]',
      shadcn_components_used TEXT[] DEFAULT '{}',
      version INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(session_id, screen_name)
    );
  `);

  await run("wireframe_versions", `
    CREATE TABLE IF NOT EXISTS wireframe_versions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      wireframe_screen_id UUID NOT NULL REFERENCES wireframe_screens(id) ON DELETE CASCADE,
      jsx_code TEXT NOT NULL,
      change_notes TEXT,
      version INTEGER NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

async function migrateLegacyColumns() {
  console.log("\n=== LEGACY COLUMN MIGRATIONS ===\n");

  const alters = [
    `ALTER TABLE moodboard_question_tree ADD COLUMN IF NOT EXISTS is_optional BOOLEAN DEFAULT false`,
    `ALTER TABLE moodboard_question_tree ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`,
    `ALTER TABLE moodboard_sessions ADD COLUMN IF NOT EXISTS tool_session_id TEXT`,
    `ALTER TABLE moodboard_sessions ADD COLUMN IF NOT EXISTS client_name TEXT`,
    `ALTER TABLE moodboard_sessions ADD COLUMN IF NOT EXISTS project_name TEXT`,
    `ALTER TABLE moodboard_sessions ADD COLUMN IF NOT EXISTS is_redesign BOOLEAN DEFAULT false`,
    `ALTER TABLE moodboard_sessions ADD COLUMN IF NOT EXISTS existing_url TEXT`,
    `ALTER TABLE moodboard_sessions ADD COLUMN IF NOT EXISTS selected_model TEXT DEFAULT 'claude-sonnet-4-6'`,
    `ALTER TABLE moodboard_sessions ADD COLUMN IF NOT EXISTS brand_name TEXT`,
    `ALTER TABLE moodboard_sessions ADD COLUMN IF NOT EXISTS generated_directions JSONB`,
    `ALTER TABLE moodboard_sessions ADD COLUMN IF NOT EXISTS selected_direction TEXT`,
    `ALTER TABLE moodboard_directions ADD COLUMN IF NOT EXISTS tagline TEXT`,
    `ALTER TABLE moodboard_directions ADD COLUMN IF NOT EXISTS persona_age TEXT`,
    `ALTER TABLE moodboard_directions ADD COLUMN IF NOT EXISTS persona_occupation TEXT`,
    `ALTER TABLE moodboard_directions ADD COLUMN IF NOT EXISTS tone_example TEXT`,
    `ALTER TABLE moodboard_directions ADD COLUMN IF NOT EXISTS typography JSONB DEFAULT '{}'`,
    `ALTER TABLE moodboard_directions ADD COLUMN IF NOT EXISTS icon_style TEXT`,
    `ALTER TABLE moodboard_directions ADD COLUMN IF NOT EXISTS icon_rationale TEXT`,
    `ALTER TABLE moodboard_directions ADD COLUMN IF NOT EXISTS illustration_rationale TEXT`,
    `ALTER TABLE moodboard_directions ADD COLUMN IF NOT EXISTS photography_style TEXT`,
    `ALTER TABLE moodboard_directions ADD COLUMN IF NOT EXISTS product_image_direction TEXT`,
    `ALTER TABLE moodboard_directions ADD COLUMN IF NOT EXISTS motion_direction TEXT`,
    `ALTER TABLE moodboard_directions ADD COLUMN IF NOT EXISTS component_style JSONB DEFAULT '{}'`,
    `ALTER TABLE moodboard_directions ADD COLUMN IF NOT EXISTS brand_voice TEXT`,
    `ALTER TABLE moodboard_directions ADD COLUMN IF NOT EXISTS dos_and_donts JSONB DEFAULT '{}'`,
    `ALTER TABLE moodboard_directions ADD COLUMN IF NOT EXISTS competitor_references JSONB DEFAULT '[]'`,
    `ALTER TABLE moodboard_directions ADD COLUMN IF NOT EXISTS is_selected BOOLEAN DEFAULT false`,
    `ALTER TABLE moodboard_directions ADD COLUMN IF NOT EXISTS refinement_notes TEXT`,
    `ALTER TABLE moodboard_directions ADD COLUMN IF NOT EXISTS refined_count INTEGER DEFAULT 0`,
    `ALTER TABLE moodboard_directions ADD COLUMN IF NOT EXISTS concept TEXT`,
    `ALTER TABLE moodboard_directions ADD COLUMN IF NOT EXISTS imagery_style TEXT`,
    `ALTER TABLE moodboard_directions ADD COLUMN IF NOT EXISTS persona JSONB`,
    `ALTER TABLE moodboard_directions ADD COLUMN IF NOT EXISTS full_content JSONB`,
    `ALTER TABLE moodboard_directions ADD COLUMN IF NOT EXISTS full_output_json JSONB`,
    `ALTER TABLE moodboard_directions ADD COLUMN IF NOT EXISTS model_used TEXT`,
    `ALTER TABLE moodboard_directions ADD COLUMN IF NOT EXISTS selected_output_sections JSONB`,
    `ALTER TABLE moodboard_directions ADD COLUMN IF NOT EXISTS typography_heading JSONB`,
    `ALTER TABLE moodboard_directions ADD COLUMN IF NOT EXISTS typography_body JSONB`,
    `ALTER TABLE moodboard_directions ADD COLUMN IF NOT EXISTS typography_references JSONB`,
    `ALTER TABLE moodboard_directions ADD COLUMN IF NOT EXISTS mood_keywords JSONB`,
    `ALTER TABLE moodboard_directions ADD COLUMN IF NOT EXISTS illustration_references JSONB`,
    `ALTER TABLE moodboard_sessions ADD COLUMN IF NOT EXISTS generation_status TEXT`,
    `ALTER TABLE moodboard_sessions ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ`,
    `ALTER TABLE moodboard_sessions ADD COLUMN IF NOT EXISTS selected_direction_index INTEGER`,
    `ALTER TABLE moodboard_sessions ADD COLUMN IF NOT EXISTS selected_at TIMESTAMPTZ`,
    `ALTER TABLE ia_sessions ADD COLUMN IF NOT EXISTS competitor_analysis JSONB DEFAULT '{}'`,
    `ALTER TABLE ia_sessions ADD COLUMN IF NOT EXISTS competitor_screenshots TEXT[] DEFAULT '{}'`,
    `ALTER TABLE ia_sessions ADD COLUMN IF NOT EXISTS ux_controversy_decisions JSONB DEFAULT '{}'`,
    `ALTER TABLE ia_sessions ADD COLUMN IF NOT EXISTS industry_pattern_used TEXT`,
    `ALTER TABLE ia_screen_inventory ADD COLUMN IF NOT EXISTS ux_rationale TEXT`,
    `ALTER TABLE ia_screen_inventory ADD COLUMN IF NOT EXISTS controversy_applied TEXT`,
  ];

  for (const stmt of alters) {
    try {
      await sql.query(stmt);
    } catch {
      /* column may already exist with different type */
    }
  }
  console.log("  Legacy migrations applied.");
}

async function ensureSessionUniqueConstraints() {
  console.log("\n=== UNIQUE CONSTRAINTS ===\n");

  const constraints = [
    {
      table: "moodboard_sessions",
      constraint: "moodboard_sessions_session_id_key",
      column: "session_id",
    },
    {
      table: "design_audit_sessions",
      constraint: "design_audit_sessions_session_id_key",
      column: "session_id",
    },
  ];

  for (const { table, constraint, column } of constraints) {
    const existing = await sql`
      SELECT 1 FROM pg_constraint WHERE conname = ${constraint} LIMIT 1
    `;
    if (existing.rows.length > 0) {
      console.log(`  ${constraint} already exists.`);
      continue;
    }

    const dupes = await sql.query(`
      SELECT ${column}, COUNT(*)::int AS cnt
      FROM ${table}
      GROUP BY ${column}
      HAVING COUNT(*) > 1
      LIMIT 1
    `);
    if (dupes.rows.length > 0) {
      console.log(`  ⚠ Skipping ${constraint} — duplicate ${column} values exist.`);
      continue;
    }

    await sql.query(
      `ALTER TABLE ${table} ADD CONSTRAINT ${constraint} UNIQUE (${column})`,
    );
    console.log(`  Added ${constraint}.`);
  }
}

async function createIndexes() {
  console.log("\n=== INDEXES ===\n");

  const indexes = [
    `CREATE INDEX IF NOT EXISTS idx_tool_sessions_tool ON tool_sessions (tool_name, client_name)`,
    `CREATE INDEX IF NOT EXISTS idx_tool_sessions_client ON tool_sessions (client_name)`,
    `CREATE INDEX IF NOT EXISTS idx_tool_intelligence_client ON tool_intelligence (client_name, category)`,
    `CREATE INDEX IF NOT EXISTS idx_tool_intelligence_tool ON tool_intelligence (tool_name, created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_client_profiles_name ON client_profiles (client_name)`,
    `CREATE INDEX IF NOT EXISTS idx_moodboard_questions_order ON moodboard_question_tree (order_index ASC)`,
    `CREATE INDEX IF NOT EXISTS idx_moodboard_output_sections_order ON moodboard_output_sections (order_index ASC)`,
    `CREATE INDEX IF NOT EXISTS idx_moodboard_sessions_sid ON moodboard_sessions (session_id)`,
    `CREATE INDEX IF NOT EXISTS idx_moodboard_directions_sid ON moodboard_directions (session_id, direction_index)`,
    `CREATE INDEX IF NOT EXISTS idx_design_audit_sessions_sid ON design_audit_sessions (session_id)`,
    `CREATE INDEX IF NOT EXISTS idx_design_audit_reports_sid ON design_audit_reports (session_id)`,
    `CREATE INDEX IF NOT EXISTS idx_ux_frameworks_client ON ux_frameworks (client_name)`,
    `CREATE INDEX IF NOT EXISTS idx_visual_frameworks_client ON visual_frameworks (client_name)`,
    `CREATE INDEX IF NOT EXISTS idx_ux_knowledge_category ON ux_knowledge_base (category, file_name)`,
    `CREATE INDEX IF NOT EXISTS idx_ux_knowledge_next_update ON ux_knowledge_base (next_update_at)`,
    `CREATE INDEX IF NOT EXISTS idx_ux_knowledge_updates_file ON ux_knowledge_updates (file_name, updated_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_ia_sessions_sid ON ia_sessions (session_id)`,
    `CREATE INDEX IF NOT EXISTS idx_ia_screen_inventory_sid ON ia_screen_inventory (session_id)`,
    `CREATE INDEX IF NOT EXISTS idx_ia_user_flows_sid ON ia_user_flows (session_id)`,
    `CREATE INDEX IF NOT EXISTS idx_wireframe_sessions_sid ON wireframe_sessions (session_id)`,
    `CREATE INDEX IF NOT EXISTS idx_wireframe_sessions_ia ON wireframe_sessions (ia_session_id)`,
    `CREATE INDEX IF NOT EXISTS idx_wireframe_screens_sid ON wireframe_screens (session_id)`,
  ];

  for (const idx of indexes) {
    await sql.query(idx);
  }
  console.log("  Indexes created.");
}

function followUpToJson(condition: string | null, parentKey: string | null): string {
  if (!condition) return "{}";
  return JSON.stringify({ answer: condition, parent_key: parentKey });
}

async function seedQuestions() {
  let inserted = 0;
  for (const q of INTAKE_QUESTION_SEED) {
    const existing = await sql`
      SELECT id FROM moodboard_question_tree WHERE key = ${q.key} LIMIT 1
    `;
    if (existing.rows.length > 0) continue;

    const isOptional = q.key === "q13" || q.key === "q18" || q.key === "q19";
    const followUp = followUpToJson(q.follow_up_condition, q.parent_key);

    await sql`
      INSERT INTO moodboard_question_tree (
        key, question_text, question_type, chips_options, parent_key,
        follow_up_condition, category, order_index, is_optional
      ) VALUES (
        ${q.key},
        ${q.question_text},
        ${q.question_type === "multi_section_select" ? "multi_section_select" : q.question_type},
        ${JSON.stringify(q.chips_options ?? [])},
        ${q.parent_key},
        ${followUp},
        ${q.category === "output_sections" ? "output_selection" : q.category},
        ${q.order_index},
        ${isOptional}
      )
    `;
    inserted++;
  }
  console.log(`  moodboard_question_tree: ${inserted} new rows (${INTAKE_QUESTION_SEED.length} intake total).`);
}

async function seedOutputSections() {
  let inserted = 0;
  for (const s of OUTPUT_SECTION_SEED) {
    const existing = await sql`
      SELECT id FROM moodboard_output_sections WHERE key = ${s.key} LIMIT 1
    `;
    if (existing.rows.length > 0) continue;

    await sql`
      INSERT INTO moodboard_output_sections (
        key, label, category, description,
        follow_up_question, follow_up_chips, order_index
      ) VALUES (
        ${s.key},
        ${s.label},
        ${s.category},
        ${s.description},
        ${s.follow_up_question},
        ${JSON.stringify(s.follow_up_chips)},
        ${s.order_index}
      )
    `;
    inserted++;
  }
  console.log(`  moodboard_output_sections: ${inserted} new rows (${OUTPUT_SECTION_SEED.length} total).`);
}

async function reportCounts() {
  const tables = [
    "tool_sessions",
    "tool_intelligence",
    "client_profiles",
    "moodboard_question_tree",
    "moodboard_output_sections",
    "moodboard_sessions",
    "moodboard_directions",
    "design_audit_sessions",
    "design_audit_reports",
    "ux_frameworks",
    "visual_frameworks",
    "ux_knowledge_base",
    "ux_knowledge_updates",
    "ia_sessions",
    "ia_screen_inventory",
    "ia_user_flows",
    "wireframe_sessions",
    "wireframe_screens",
    "wireframe_versions",
  ];

  console.log("\n=== TABLE COUNTS ===\n");
  for (const table of tables) {
    const result = await sql.query(`SELECT COUNT(*)::int AS count FROM ${table}`);
    const count = result.rows[0]?.count ?? 0;
    console.log(`  ${table}: ${count}`);
  }
}

async function main() {
  console.log("Unified intelligence DB — initializing\n");
  await createTables();
  await migrateLegacyColumns();
  await ensureSessionUniqueConstraints();
  await createIndexes();
  console.log("\n=== SEED DATA ===\n");
  await seedQuestions();
  await seedOutputSections();
  const knowledgeSeed = await seedKnowledgeBaseFromFiles();
  console.log(
    `  ux_knowledge_base: ${knowledgeSeed.inserted} inserted, ${knowledgeSeed.updated} updated, ${knowledgeSeed.skipped} skipped (${knowledgeSeed.inserted + knowledgeSeed.updated + knowledgeSeed.skipped} total).`,
  );
  await reportCounts();
  console.log("\n✅ Unified DB init complete.\n");
}

main().catch((error) => {
  console.error("init-unified-db failed:", error);
  process.exit(1);
});
