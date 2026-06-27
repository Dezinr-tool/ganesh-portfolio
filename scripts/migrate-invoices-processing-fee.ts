import { sql } from "@vercel/postgres";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

async function run() {
  console.log("Adding processing_fee_percent and processing_fee_amount to invoices…");

  await sql`
    ALTER TABLE invoices
      ADD COLUMN IF NOT EXISTS processing_fee_percent NUMERIC(5,2) DEFAULT 2,
      ADD COLUMN IF NOT EXISTS processing_fee_amount  NUMERIC(12,2) DEFAULT 0
  `;

  // Back-fill existing invoices that have 0 processing fee:
  // Old totals didn't include the fee, so:
  //   processing_fee_amount = old_total * 0.02
  //   new_total = old_total * 1.02
  const { rowCount } = await sql`
    UPDATE invoices
    SET
      processing_fee_percent = 2,
      processing_fee_amount  = ROUND((total * 0.02)::NUMERIC, 2),
      total                  = ROUND((total * 1.02)::NUMERIC, 2)
    WHERE processing_fee_amount = 0
  `;

  console.log(`✓ Migrated ${rowCount} existing invoices with 2% processing fee.`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
