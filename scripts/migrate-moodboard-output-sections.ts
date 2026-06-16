import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { sql } from "../lib/db";
import { MOODBOARD_QUESTION_SEED } from "../lib/moodboard/question-seed";

const OUTPUT_QUESTION_KEYS = [
  "q_output_sections",
  "q_output_product_type",
  "q_output_illustration_style",
  "q_output_icon_style",
];

async function migrate() {
  console.log("Adding selected_output_sections column…");
  await sql`
    ALTER TABLE moodboard_sessions
    ADD COLUMN IF NOT EXISTS selected_output_sections JSONB
  `;

  const outputQuestions = MOODBOARD_QUESTION_SEED.filter((q) =>
    OUTPUT_QUESTION_KEYS.includes(q.key),
  );

  for (const q of outputQuestions) {
    const existing = await sql`
      SELECT id FROM moodboard_question_tree WHERE key = ${q.key} LIMIT 1
    `;
    if (existing.rows.length > 0) {
      console.log(`Question ${q.key} already exists — skipping.`);
      continue;
    }

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
    console.log(`Inserted question ${q.key}.`);
  }

  console.log("Migration complete.");
}

migrate().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
