import { sql } from "@vercel/postgres";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

async function run() {
  console.log("Making invoices.due_date optional…");
  await sql`ALTER TABLE invoices ALTER COLUMN due_date DROP NOT NULL`;

  console.log("Adding invoices.billing_mode column…");
  await sql`
    ALTER TABLE invoices
      ADD COLUMN IF NOT EXISTS billing_mode TEXT NOT NULL DEFAULT 'hourly'
  `;

  console.log("✓ Invoice billing_mode migration complete.");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
