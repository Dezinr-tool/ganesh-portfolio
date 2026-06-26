import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import { sql } from "@vercel/postgres";

const MIGRATIONS = [
  `ALTER TABLE agreements ADD COLUMN IF NOT EXISTS kill_fee_percent INTEGER NOT NULL DEFAULT 50`,
  `ALTER TABLE agreements ADD COLUMN IF NOT EXISTS late_payment_days INTEGER NOT NULL DEFAULT 7`,
  `ALTER TABLE agreements ADD COLUMN IF NOT EXISTS late_payment_interest NUMERIC(5,2) NOT NULL DEFAULT 2`,
  `ALTER TABLE agreements ADD COLUMN IF NOT EXISTS portfolio_rights BOOLEAN NOT NULL DEFAULT TRUE`,
  `ALTER TABLE agreements ADD COLUMN IF NOT EXISTS out_of_scope_clause BOOLEAN NOT NULL DEFAULT TRUE`,
  `ALTER TABLE agreements ADD COLUMN IF NOT EXISTS out_of_scope_rate INTEGER`,
  `ALTER TABLE agreements ADD COLUMN IF NOT EXISTS review_window_days INTEGER NOT NULL DEFAULT 5`,
  `ALTER TABLE agreements ADD COLUMN IF NOT EXISTS deemed_acceptance BOOLEAN NOT NULL DEFAULT TRUE`,
  `ALTER TABLE agreements ADD COLUMN IF NOT EXISTS limitation_of_liability BOOLEAN NOT NULL DEFAULT TRUE`,
  `ALTER TABLE agreements ADD COLUMN IF NOT EXISTS termination_notice_days INTEGER NOT NULL DEFAULT 7`,
  `ALTER TABLE agreements ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'INR'`,
];

async function migrate() {
  for (const statement of MIGRATIONS) {
    await sql.query(statement);
    console.log("Applied:", statement.slice(0, 90) + "…");
  }
  console.log("Done. Phase 3 legal columns are ready.");
}

migrate().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
