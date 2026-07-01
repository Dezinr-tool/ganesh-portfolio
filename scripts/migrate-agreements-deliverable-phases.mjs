import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { sql } from "@vercel/postgres";

async function migrate() {
  await sql`ALTER TABLE agreements ADD COLUMN IF NOT EXISTS deliverable_phases JSONB NOT NULL DEFAULT '[]'`;
  console.log("Added deliverable_phases column.");
  await sql`ALTER TABLE agreements ADD COLUMN IF NOT EXISTS total_timeline TEXT NOT NULL DEFAULT ''`;
  console.log("Added total_timeline column.");
  console.log("Migration complete.");
  process.exit(0);
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
