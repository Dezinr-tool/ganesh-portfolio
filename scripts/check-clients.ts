import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import { sql } from "@vercel/postgres";

async function main() {
  const { rows } = await sql`
    SELECT id, name, email, company FROM clients ORDER BY name
  `;
  console.log("clients count:", rows.length);
  console.log(JSON.stringify(rows, null, 2));
  console.log("id types:", rows.map((r) => typeof r.id));
}

main().catch(console.error);
