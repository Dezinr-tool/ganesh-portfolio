import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { sql } from "../lib/db";

const ENABLE_VECTOR = `CREATE EXTENSION IF NOT EXISTS vector;`;

const CREATE_EA_MEMORIES_TABLE = `
  CREATE TABLE IF NOT EXISTS ea_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536),
    category TEXT DEFAULT 'context',
    source TEXT DEFAULT 'conversation',
    importance INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accessed_at TIMESTAMPTZ DEFAULT NOW()
  );
`;

const CREATE_SESSION_INDEX = `
  CREATE INDEX IF NOT EXISTS ea_memories_session_idx
  ON ea_memories (session_id);
`;

const CREATE_CATEGORY_INDEX = `
  CREATE INDEX IF NOT EXISTS ea_memories_category_idx
  ON ea_memories (session_id, category);
`;

const ALTER_EA_MEMORIES_INTELLIGENCE = `
  ALTER TABLE ea_memories ADD COLUMN IF NOT EXISTS client_name TEXT;
  ALTER TABLE ea_memories ADD COLUMN IF NOT EXISTS project_name TEXT;
  ALTER TABLE ea_memories ADD COLUMN IF NOT EXISTS sentiment_score DECIMAL(3,2);
`;

async function initMemoryTables() {
  console.log("Enabling pgvector…");
  await sql.query(ENABLE_VECTOR);

  console.log("Creating ea_memories table if it doesn't exist…");
  await sql.query(CREATE_EA_MEMORIES_TABLE);
  await sql.query(CREATE_SESSION_INDEX);
  await sql.query(CREATE_CATEGORY_INDEX);
  console.log("Adding intelligence columns if missing…");
  await sql.query(ALTER_EA_MEMORIES_INTELLIGENCE);
  console.log("Done. ea_memories table is ready.");
}

initMemoryTables().catch((error) => {
  console.error("Failed to initialize memory tables:", error);
  process.exit(1);
});
