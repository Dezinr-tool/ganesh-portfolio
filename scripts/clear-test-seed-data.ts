import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { sql } from "../lib/db";

async function clearTestSeedData() {
  console.log("Clearing test seed data from ea_action_items and ea_meetings…");

  const actionItems = await sql`DELETE FROM ea_action_items RETURNING id`;
  console.log(`Deleted ${actionItems.rowCount ?? actionItems.rows.length} action items.`);

  const meetings = await sql`DELETE FROM ea_meetings RETURNING id`;
  console.log(`Deleted ${meetings.rowCount ?? meetings.rows.length} meetings.`);

  console.log("Done.");
}

clearTestSeedData().catch((error) => {
  console.error("Failed to clear test seed data:", error);
  process.exit(1);
});
