import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { sql } from "../lib/db";

const ALTER_EA_MEMORIES_INTELLIGENCE = `
  ALTER TABLE ea_memories ADD COLUMN IF NOT EXISTS client_name TEXT;
  ALTER TABLE ea_memories ADD COLUMN IF NOT EXISTS project_name TEXT;
  ALTER TABLE ea_memories ADD COLUMN IF NOT EXISTS sentiment_score DECIMAL(3,2);
`;

async function migrateEaMemoriesColumns() {
  console.log("Migrating ea_memories intelligence columns…");
  await sql.query(ALTER_EA_MEMORIES_INTELLIGENCE);
  console.log("Done. client_name, project_name, sentiment_score are ready.");
}

migrateEaMemoriesColumns().catch((error) => {
  console.error("Failed to migrate ea_memories columns:", error);
  process.exit(1);
});
