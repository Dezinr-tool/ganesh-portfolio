import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { sql } from "../lib/db";

const ENABLE_VECTOR = `CREATE EXTENSION IF NOT EXISTS vector;`;

const CREATE_EA_INTELLIGENCE = `
  CREATE TABLE IF NOT EXISTS ea_intelligence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    source_type TEXT NOT NULL,
    source_id TEXT,
    category TEXT NOT NULL,
    subcategory TEXT,
    insight TEXT NOT NULL,
    raw_context TEXT,
    client_name TEXT,
    project_name TEXT,
    sentiment DECIMAL(3,2),
    confidence DECIMAL(3,2),
    importance INTEGER DEFAULT 5,
    tags JSONB DEFAULT '[]',
    embedding vector(1536),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
`;

const CREATE_EA_PATTERNS = `
  CREATE TABLE IF NOT EXISTS ea_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    pattern_type TEXT NOT NULL,
    description TEXT NOT NULL,
    evidence_count INTEGER DEFAULT 1,
    confidence DECIMAL(3,2) DEFAULT 0.5,
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    first_seen_at TIMESTAMPTZ DEFAULT NOW(),
    client_name TEXT,
    project_type TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
`;

const CREATE_EA_SUMMARIES = `
  CREATE TABLE IF NOT EXISTS ea_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    period_type TEXT NOT NULL,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    meeting_count INTEGER DEFAULT 0,
    insights_generated INTEGER DEFAULT 0,
    top_patterns JSONB DEFAULT '[]',
    sentiment_avg DECIMAL(3,2),
    key_learnings JSONB DEFAULT '[]',
    action_items JSONB DEFAULT '[]',
    generated_at TIMESTAMPTZ DEFAULT NOW()
  );
`;

const CREATE_EA_CLIENT_PROFILES = `
  CREATE TABLE IF NOT EXISTS ea_client_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    client_name TEXT NOT NULL,
    company TEXT,
    communication_style TEXT,
    decision_style TEXT,
    sentiment_history JSONB DEFAULT '[]',
    interaction_count INTEGER DEFAULT 0,
    last_interaction_at TIMESTAMPTZ,
    preferences JSONB DEFAULT '[]',
    red_flags JSONB DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, client_name)
  );
`;

const INDEXES = [
  `CREATE INDEX IF NOT EXISTS ea_intelligence_session_idx ON ea_intelligence(session_id);`,
  `CREATE INDEX IF NOT EXISTS ea_intelligence_category_idx ON ea_intelligence(session_id, category);`,
  `CREATE INDEX IF NOT EXISTS ea_intelligence_client_idx ON ea_intelligence(session_id, client_name);`,
  `CREATE INDEX IF NOT EXISTS ea_patterns_session_idx ON ea_patterns(session_id);`,
  `CREATE INDEX IF NOT EXISTS ea_client_profiles_idx ON ea_client_profiles(session_id, client_name);`,
];

async function initIntelligenceTables() {
  console.log("Enabling pgvector…");
  await sql.query(ENABLE_VECTOR);

  console.log("Creating ea_intelligence…");
  await sql.query(CREATE_EA_INTELLIGENCE);

  console.log("Creating ea_patterns…");
  await sql.query(CREATE_EA_PATTERNS);

  console.log("Creating ea_summaries…");
  await sql.query(CREATE_EA_SUMMARIES);

  console.log("Creating ea_client_profiles…");
  await sql.query(CREATE_EA_CLIENT_PROFILES);

  for (const index of INDEXES) {
    await sql.query(index);
  }

  console.log("Done. Intelligence tables are ready.");
}

initIntelligenceTables().catch((error) => {
  console.error("Failed to initialize intelligence tables:", error);
  process.exit(1);
});
