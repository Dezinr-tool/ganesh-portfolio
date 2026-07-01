import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env.local") });

const sql = neon(process.env.DATABASE_URL);

await sql`ALTER TABLE agreements ADD COLUMN IF NOT EXISTS exclusions TEXT`;
await sql`ALTER TABLE agreements ADD COLUMN IF NOT EXISTS communication_protocol TEXT`;

console.log("Migration complete: added exclusions and communication_protocol columns");
