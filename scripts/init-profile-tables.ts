import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { sql } from "../lib/db";

const CREATE_EA_USER_PROFILES = `
  CREATE TABLE IF NOT EXISTS ea_user_profiles (
    session_id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT '',
    industry TEXT NOT NULL DEFAULT '',
    communication_style TEXT NOT NULL DEFAULT 'casual',
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    work_style TEXT,
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;

const CREATE_EA_MESSAGE_SENTIMENT = `
  CREATE TABLE IF NOT EXISTS ea_message_sentiment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    sentiment_score DECIMAL(4,3),
    emotion_label TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;

const CREATE_SENTIMENT_SESSION_IDX = `
  CREATE INDEX IF NOT EXISTS ea_message_sentiment_session_idx
  ON ea_message_sentiment (session_id, created_at DESC);
`;

async function initProfileTables() {
  console.log("Creating ea_user_profiles table if it doesn't exist…");
  await sql.query(CREATE_EA_USER_PROFILES);
  console.log("Done. ea_user_profiles table is ready.");

  console.log("Creating ea_message_sentiment table if it doesn't exist…");
  await sql.query(CREATE_EA_MESSAGE_SENTIMENT);
  await sql.query(CREATE_SENTIMENT_SESSION_IDX);
  console.log("Done. ea_message_sentiment table is ready.");
}

initProfileTables().catch((error) => {
  console.error("Failed to initialize profile tables:", error);
  process.exit(1);
});
