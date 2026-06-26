import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import { sql } from "@vercel/postgres";

type InvoiceClientRow = {
  client_name: string;
  client_email: string;
  client_company: string;
  client_address: string;
};

function normalizeEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  return trimmed ? trimmed : null;
}

async function backfillClientsFromInvoices() {
  const { rows } = await sql<InvoiceClientRow>`
    SELECT DISTINCT ON (LOWER(TRIM(client_email)))
      client_name,
      client_email,
      client_company,
      client_address
    FROM invoices
    WHERE TRIM(client_name) <> ''
    ORDER BY LOWER(TRIM(client_email)), created_at DESC
  `;

  console.log(`Found ${rows.length} distinct invoice client(s) to process.`);

  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    const email = normalizeEmail(row.client_email);
    const name = row.client_name.trim();
    const company = row.client_company.trim() || null;
    const address = row.client_address.trim() || null;

    if (email) {
      const existing = await sql`
        SELECT id FROM clients
        WHERE LOWER(TRIM(email)) = ${email}
        LIMIT 1
      `;
      if (existing.rows.length > 0) {
        console.log(`Skip (duplicate email): ${email}`);
        skipped += 1;
        continue;
      }
    }

    await sql`
      INSERT INTO clients (name, email, phone, company, address, gst_number)
      VALUES (${name}, ${email}, ${null}, ${company}, ${address}, ${null})
    `;

    console.log(`Inserted: ${name}${email ? ` <${email}>` : ""}`);
    inserted += 1;
  }

  console.log(`Done. Inserted ${inserted}, skipped ${skipped}.`);
}

backfillClientsFromInvoices().catch((error) => {
  console.error("Backfill failed:", error);
  process.exit(1);
});
