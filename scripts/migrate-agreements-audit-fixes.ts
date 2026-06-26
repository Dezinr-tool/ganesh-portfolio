import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import { sql } from "@vercel/postgres";

const MIGRATIONS = [
  `ALTER TABLE agreements ADD COLUMN IF NOT EXISTS client_phone VARCHAR(50)`,
  `ALTER TABLE agreements ADD COLUMN IF NOT EXISTS client_address TEXT`,
  `ALTER TABLE agreements ADD COLUMN IF NOT EXISTS client_gst_number VARCHAR(50)`,
  `ALTER TABLE agreements ADD COLUMN IF NOT EXISTS agreement_date DATE`,
  `ALTER TABLE agreements ADD COLUMN IF NOT EXISTS milestones JSONB`,
  `ALTER TABLE clients ADD COLUMN IF NOT EXISTS representative_name VARCHAR(255)`,
];

async function migrate() {
  for (const statement of MIGRATIONS) {
    await sql.query(statement);
    console.log("Applied:", statement.slice(0, 90) + "…");
  }
  console.log("Done. Agreement audit fix columns are ready.");
}

migrate().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
