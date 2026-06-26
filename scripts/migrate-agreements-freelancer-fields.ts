import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import { sql } from "@vercel/postgres";

const MIGRATIONS = [
  `ALTER TABLE agreements ADD COLUMN IF NOT EXISTS payment_structure TEXT NOT NULL DEFAULT '50_50'`,
  `ALTER TABLE agreements ADD COLUMN IF NOT EXISTS custom_payment_terms TEXT`,
  `ALTER TABLE agreements ADD COLUMN IF NOT EXISTS late_payment_clause BOOLEAN NOT NULL DEFAULT TRUE`,
  `ALTER TABLE agreements ADD COLUMN IF NOT EXISTS revisions_included INTEGER NOT NULL DEFAULT 2`,
  `ALTER TABLE agreements ADD COLUMN IF NOT EXISTS revision_scope_note TEXT`,
  `ALTER TABLE agreements ADD COLUMN IF NOT EXISTS ip_transfer BOOLEAN NOT NULL DEFAULT TRUE`,
  `ALTER TABLE agreements ADD COLUMN IF NOT EXISTS confidentiality BOOLEAN NOT NULL DEFAULT TRUE`,
  `ALTER TABLE agreements ADD COLUMN IF NOT EXISTS kill_fee BOOLEAN NOT NULL DEFAULT TRUE`,
  `ALTER TABLE agreements ADD COLUMN IF NOT EXISTS governing_law TEXT NOT NULL DEFAULT 'Mumbai, Maharashtra, India'`,
];

async function migrate() {
  for (const statement of MIGRATIONS) {
    await sql.query(statement);
    console.log("Applied:", statement.slice(0, 80) + "…");
  }
  console.log("Done. Agreement freelancer fields are ready.");
}

migrate().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
