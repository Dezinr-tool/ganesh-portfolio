import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { sql } from "../lib/db";
import { MOODBOARD_QUESTION_SEED } from "../lib/moodboard/question-seed";

const CREATE_QUESTION_TREE = `
  CREATE TABLE IF NOT EXISTS moodboard_question_tree (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL,
    parent_key TEXT,
    chips_options JSONB,
    follow_up_condition TEXT,
    category TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
`;

const CREATE_SESSIONS = `
  CREATE TABLE IF NOT EXISTS moodboard_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    brand_name TEXT,
    project_type TEXT,
    answers JSONB DEFAULT '{}',
    selected_output_sections JSONB,
    generated_directions JSONB,
    selected_direction TEXT,
    status TEXT DEFAULT 'in_progress',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
`;

const CREATE_DIRECTIONS = `
  CREATE TABLE IF NOT EXISTS moodboard_directions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    direction_name TEXT NOT NULL,
    direction_index INTEGER NOT NULL,
    persona_name TEXT,
    persona_description TEXT,
    pain_points JSONB,
    brand_strategy TEXT,
    tone_of_voice TEXT,
    ui_references JSONB,
    illustration_style TEXT,
    illustration_references JSONB,
    typography_heading TEXT,
    typography_body TEXT,
    typography_references JSONB,
    color_palette JSONB,
    mood_keywords JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
`;

const CREATE_INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_moodboard_questions_order
  ON moodboard_question_tree (order_index ASC);
  CREATE INDEX IF NOT EXISTS idx_moodboard_sessions_session_id
  ON moodboard_sessions (session_id);
  CREATE INDEX IF NOT EXISTS idx_moodboard_directions_session
  ON moodboard_directions (session_id, direction_index);
`;

async function seedQuestions() {
  const countResult = await sql`SELECT COUNT(*)::int AS count FROM moodboard_question_tree`;
  const count = countResult.rows[0]?.count ?? 0;
  if (count > 0) {
    console.log(`Skipping seed — ${count} questions already exist.`);
    return;
  }

  console.log("Seeding moodboard question tree…");
  for (const q of MOODBOARD_QUESTION_SEED) {
    await sql`
      INSERT INTO moodboard_question_tree (
        key, question_text, question_type, parent_key,
        chips_options, follow_up_condition, category, order_index
      ) VALUES (
        ${q.key},
        ${q.question_text},
        ${q.question_type},
        ${q.parent_key},
        ${q.chips_options ? JSON.stringify(q.chips_options) : null},
        ${q.follow_up_condition},
        ${q.category},
        ${q.order_index}
      )
    `;
  }
  console.log(`Seeded ${MOODBOARD_QUESTION_SEED.length} questions.`);
}

async function initMoodboardTables() {
  console.log("Creating moodboard_question_tree…");
  await sql.query(CREATE_QUESTION_TREE);

  console.log("Creating moodboard_sessions…");
  await sql.query(CREATE_SESSIONS);

  console.log("Creating moodboard_directions…");
  await sql.query(CREATE_DIRECTIONS);

  await sql.query(CREATE_INDEXES);
  console.log("Indexes created.");

  await seedQuestions();
  console.log("Moodboard tables ready.");
}

initMoodboardTables().catch((error) => {
  console.error("Failed to initialize moodboard tables:", error);
  process.exit(1);
});
