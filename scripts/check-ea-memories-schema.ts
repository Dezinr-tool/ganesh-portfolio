import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { sql } from "../lib/db";
import {
  getEaMemoriesSchema,
  listEaMemoryColumns,
  hasIntelligenceColumns,
  resetEaMemoriesSchemaCache,
} from "../lib/ea-memories-schema";

async function checkEaMemoriesSchema() {
  resetEaMemoriesSchemaCache();

  console.log("Checking ea_memories table…\n");

  const tableExists = await sql<{ exists: boolean }>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'ea_memories'
    ) AS exists
  `;

  if (!tableExists.rows[0]?.exists) {
    console.log("❌ Table ea_memories does not exist.");
    console.log("Run: npm run db:init-memory");
    process.exit(1);
  }

  const { rows } = await sql<{
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string | null;
  }>`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ea_memories'
    ORDER BY ordinal_position
  `;

  console.log("Columns:");
  for (const row of rows) {
    const nullable = row.is_nullable === "YES" ? "NULL" : "NOT NULL";
    const defaultVal = row.column_default ? ` DEFAULT ${row.column_default}` : "";
    console.log(
      `  - ${row.column_name}: ${row.data_type} ${nullable}${defaultVal}`,
    );
  }

  const schema = await getEaMemoriesSchema();
  console.log("\nCached column list:", listEaMemoryColumns(schema).join(", "));
  console.log(
    "Intelligence columns present:",
    hasIntelligenceColumns(schema) ? "yes ✅" : "no — run npm run db:migrate-memories",
  );

  const { rows: countRows } = await sql<{ count: string }>`
    SELECT COUNT(*)::text AS count FROM ea_memories
  `;
  console.log(`\nRow count: ${countRows[0]?.count ?? "0"}`);
}

checkEaMemoriesSchema().catch((error) => {
  console.error("Schema check failed:", error);
  process.exit(1);
});
