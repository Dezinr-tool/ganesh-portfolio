import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { sql } from "../lib/db";

const CREATE_EA_USERS = `
  CREATE TABLE IF NOT EXISTS ea_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    password_hash TEXT NOT NULL,
    plan TEXT DEFAULT 'pro',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    subscription_status TEXT DEFAULT 'inactive',
    trial_ends_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '14 days',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW()
  );
`;

const CREATE_EA_SESSIONS = `
  CREATE TABLE IF NOT EXISTS ea_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES ea_users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
`;

const CREATE_EA_USAGE = `
  CREATE TABLE IF NOT EXISTS ea_usage (
    user_id UUID NOT NULL REFERENCES ea_users(id) ON DELETE CASCADE,
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    message_count INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, usage_date)
  );
`;

const CREATE_EA_SESSIONS_TOKEN_IDX = `
  CREATE INDEX IF NOT EXISTS ea_sessions_token_idx ON ea_sessions(token);
`;

const CREATE_EA_USERS_EMAIL_IDX = `
  CREATE INDEX IF NOT EXISTS ea_users_email_idx ON ea_users(email);
`;

const ALTER_EA_USERS_ONBOARDING = `
  ALTER TABLE ea_users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
`;

async function initSaasTables() {
  console.log("Creating ea_users table if it doesn't exist…");
  await sql.query(CREATE_EA_USERS);
  await sql.query(ALTER_EA_USERS_ONBOARDING);
  console.log("Done. ea_users table is ready.");

  console.log("Creating ea_sessions table if it doesn't exist…");
  await sql.query(CREATE_EA_SESSIONS);
  await sql.query(CREATE_EA_SESSIONS_TOKEN_IDX);
  await sql.query(CREATE_EA_USERS_EMAIL_IDX);
  console.log("Done. ea_sessions table is ready.");

  console.log("Creating ea_usage table if it doesn't exist…");
  await sql.query(CREATE_EA_USAGE);
  console.log("Done. ea_usage table is ready.");
}

initSaasTables().catch((error) => {
  console.error("Failed to initialize SaaS tables:", error);
  process.exit(1);
});
