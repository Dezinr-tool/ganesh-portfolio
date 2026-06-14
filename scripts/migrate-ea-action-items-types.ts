import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { sql } from "../lib/db";

async function migrate() {
  console.log("Migrating ea_action_items task_type + assigned_to…");
  await sql`
    ALTER TABLE ea_action_items
    ADD COLUMN IF NOT EXISTS task_type TEXT DEFAULT 'my_task',
    ADD COLUMN IF NOT EXISTS assigned_to TEXT
  `;
  console.log("Done. task_type and assigned_to are ready.");
}

migrate().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
