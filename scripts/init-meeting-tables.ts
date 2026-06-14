import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { sql } from "../lib/db";

const CREATE_EA_MEETINGS_TABLE = `
  CREATE TABLE IF NOT EXISTS ea_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    meeting_url TEXT,
    meeting_platform TEXT,
    title TEXT,
    scheduled_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending',
    raw_transcript TEXT,
    processed_summary TEXT,
    action_items JSONB DEFAULT '[]',
    attendees JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
`;

const CREATE_EA_ACTION_ITEMS_TABLE = `
  CREATE TABLE IF NOT EXISTS ea_action_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES ea_meetings(id),
    session_id TEXT NOT NULL,
    title TEXT NOT NULL,
    assignee TEXT,
    due_date TIMESTAMPTZ,
    status TEXT DEFAULT 'open',
    task_type TEXT DEFAULT 'my_task',
    assigned_to TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
`;

const CREATE_EA_MEETINGS_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_ea_meetings_session_created
  ON ea_meetings (session_id, created_at DESC);
`;

const CREATE_EA_ACTION_ITEMS_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_ea_action_items_session_status
  ON ea_action_items (session_id, status);
`;

async function initMeetingTables() {
  console.log("Creating ea_meetings table if it doesn't exist…");
  await sql.query(CREATE_EA_MEETINGS_TABLE);
  console.log("Done. ea_meetings table is ready.");

  console.log("Creating ea_action_items table if it doesn't exist…");
  await sql.query(CREATE_EA_ACTION_ITEMS_TABLE);
  await sql.query(CREATE_EA_MEETINGS_INDEX);
  await sql.query(CREATE_EA_ACTION_ITEMS_INDEX);
  console.log("Done. ea_action_items table is ready.");
}

initMeetingTables().catch((error) => {
  console.error("Failed to initialize meeting tables:", error);
  process.exit(1);
});
