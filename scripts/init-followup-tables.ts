import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { sql } from "../lib/db";

const CREATE_EA_FOLLOWUPS_TABLE = `
  CREATE TABLE IF NOT EXISTS ea_followups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    meeting_id UUID REFERENCES ea_meetings(id),
    recipient_email TEXT NOT NULL,
    recipient_name TEXT,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    sent_at TIMESTAMPTZ,
    email_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
`;

const CREATE_EA_SCHEDULED_MEETINGS_TABLE = `
  CREATE TABLE IF NOT EXISTS ea_scheduled_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    title TEXT NOT NULL,
    proposed_times JSONB DEFAULT '[]',
    confirmed_time TIMESTAMPTZ,
    attendee_emails JSONB DEFAULT '[]',
    meeting_url TEXT,
    calendar_event_id TEXT,
    status TEXT DEFAULT 'proposing',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
`;

const CREATE_FOLLOWUPS_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_ea_followups_session_status
  ON ea_followups (session_id, status);
`;

async function initFollowupTables() {
  console.log("Creating ea_followups table if it doesn't exist…");
  await sql.query(CREATE_EA_FOLLOWUPS_TABLE);
  console.log("Done. ea_followups table is ready.");

  console.log("Creating ea_scheduled_meetings table if it doesn't exist…");
  await sql.query(CREATE_EA_SCHEDULED_MEETINGS_TABLE);
  await sql.query(CREATE_FOLLOWUPS_INDEX);
  console.log("Done. ea_scheduled_meetings table is ready.");
}

initFollowupTables().catch((error) => {
  console.error("Failed to initialize follow-up tables:", error);
  process.exit(1);
});
