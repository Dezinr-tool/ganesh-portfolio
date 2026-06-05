import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { sql } from "../lib/db";

const CREATE_INVOICES_TABLE = `
  CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY,
    invoice_number TEXT NOT NULL UNIQUE,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_company TEXT NOT NULL DEFAULT '',
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

async function initDb() {
  console.log("Creating invoices table if it doesn't exist…");
  await sql.query(CREATE_INVOICES_TABLE);
  console.log("Done. invoices table is ready.");
}

initDb().catch((error) => {
  console.error("Failed to initialize database:", error);
  process.exit(1);
});
