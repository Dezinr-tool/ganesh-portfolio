import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { sql } from "../lib/db";
import { ensureBillingDefaults } from "../lib/settings-store";
import { ensureDesignTokenDefaults } from "../lib/design-tokens";

const CREATE_INVOICES_TABLE = `
  CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY,
    invoice_number TEXT NOT NULL UNIQUE,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_company TEXT NOT NULL DEFAULT '',
    client_address TEXT NOT NULL DEFAULT '',
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    line_items JSONB NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    tax_percent NUMERIC(5, 2),
    total NUMERIC(12, 2) NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'unpaid',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;

const CREATE_AGREEMENTS_TABLE = `
  CREATE TABLE IF NOT EXISTS agreements (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_company TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_representative TEXT NOT NULL,
    project_overview TEXT NOT NULL,
    scope_of_work JSONB NOT NULL,
    deliverables JSONB NOT NULL,
    timeline TEXT NOT NULL,
    hourly_rate NUMERIC(10,2),
    fixed_cost NUMERIC(10,2),
    advance_percent INTEGER DEFAULT 50,
    payment_notes TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    ganesh_signed_at TIMESTAMPTZ,
    client_signed_at TIMESTAMPTZ,
    client_sign_token TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;

const CREATE_SETTINGS_TABLE = `
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
`;

const CREATE_CLIENTS_TABLE = `
  CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    address TEXT,
    gst_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
  );
`;

const ALTER_AGREEMENTS_ADD_SIGNATURES = `
  ALTER TABLE agreements ADD COLUMN IF NOT EXISTS ganesh_signature TEXT;
  ALTER TABLE agreements ADD COLUMN IF NOT EXISTS client_signature TEXT;
`;

const CREATE_EA_CALENDAR_TOKENS_TABLE = `
  CREATE TABLE IF NOT EXISTS ea_calendar_tokens (
    id TEXT PRIMARY KEY DEFAULT 'default',
    access_token TEXT,
    refresh_token TEXT,
    expiry_date BIGINT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
`;

const CREATE_EA_CONVERSATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS ea_conversations (
    id UUID PRIMARY KEY,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;

const CREATE_EA_CONVERSATIONS_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_ea_conversations_session_created
  ON ea_conversations (session_id, created_at DESC);
`;

const ALTER_INVOICES_ADD_CLIENT_ADDRESS = `
  ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_address TEXT NOT NULL DEFAULT '';
`;

const ALTER_EA_CALENDAR_TOKENS_ADD_EMAIL = `
  ALTER TABLE ea_calendar_tokens ADD COLUMN IF NOT EXISTS account_email TEXT;
`;

async function initDb() {
  console.log("Creating invoices table if it doesn't exist…");
  await sql.query(CREATE_INVOICES_TABLE);
  console.log("Done. invoices table is ready.");

  console.log("Adding client_address column to invoices if missing…");
  await sql.query(ALTER_INVOICES_ADD_CLIENT_ADDRESS);
  console.log("Done. invoices client_address column is ready.");

  console.log("Creating agreements table if it doesn't exist…");
  await sql.query(CREATE_AGREEMENTS_TABLE);
  console.log("Done. agreements table is ready.");

  console.log("Creating settings table if it doesn't exist…");
  await sql.query(CREATE_SETTINGS_TABLE);
  console.log("Done. settings table is ready.");

  console.log("Creating clients table if it doesn't exist…");
  await sql.query(CREATE_CLIENTS_TABLE);
  console.log("Done. clients table is ready.");

  console.log("Seeding billing settings defaults if missing…");
  await ensureBillingDefaults();
  console.log("Done. billing settings defaults are ready.");

  console.log("Seeding design token defaults if missing…");
  await ensureDesignTokenDefaults();
  console.log("Done. design token defaults are ready.");

  console.log("Adding signature columns to agreements if missing…");
  await sql.query(ALTER_AGREEMENTS_ADD_SIGNATURES);
  console.log("Done. agreements signature columns are ready.");

  console.log("Creating ea_calendar_tokens table if it doesn't exist…");
  await sql.query(CREATE_EA_CALENDAR_TOKENS_TABLE);
  console.log("Done. ea_calendar_tokens table is ready.");

  console.log("Adding account_email column to ea_calendar_tokens if missing…");
  await sql.query(ALTER_EA_CALENDAR_TOKENS_ADD_EMAIL);
  console.log("Done. ea_calendar_tokens account_email column is ready.");

  console.log("Creating ea_conversations table if it doesn't exist…");
  await sql.query(CREATE_EA_CONVERSATIONS_TABLE);
  await sql.query(CREATE_EA_CONVERSATIONS_INDEX);
  console.log("Done. ea_conversations table is ready.");
}

initDb().catch((error) => {
  console.error("Failed to initialize database:", error);
  process.exit(1);
});
