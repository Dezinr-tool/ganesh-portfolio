import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { runWeeklyUpdate } from "../lib/knowledge-updater";

async function main() {
  console.log("Running weekly UX knowledge update…\n");
  const summary = await runWeeklyUpdate();
  console.log(`Updated: ${summary.updated}`);
  console.log(`Unchanged: ${summary.unchanged}`);
  console.log(`Errors: ${summary.errors}`);
  for (const result of summary.results) {
    console.log(`  ${result.status.padEnd(10)} ${result.fileName} — ${result.message}`);
  }
  if (summary.errors > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
