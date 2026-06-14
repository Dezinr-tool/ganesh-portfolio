import * as dotenv from "dotenv";
import { execFile } from "child_process";
import * as path from "path";
import { promisify } from "util";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const execFileAsync = promisify(execFile);

const STEPS = [
  { script: "init-db.ts", label: "Core DB (invoices, agreements, EA calendar, conversations)" },
  { script: "init-meeting-tables.ts", label: "Meeting bot (ea_meetings, ea_action_items)" },
  { script: "migrate-ea-action-items-types.ts", label: "ea_action_items task_type + assigned_to columns" },
  { script: "init-memory-tables.ts", label: "AI memory (pgvector, ea_memories)" },
  { script: "migrate-ea-memories-columns.ts", label: "ea_memories intelligence columns (client_name, project_name, sentiment_score)" },
  { script: "init-intelligence-tables.ts", label: "Intelligence pipeline (ea_intelligence, ea_patterns, ea_client_profiles)" },
  { script: "init-followup-tables.ts", label: "Follow-ups (ea_followups, ea_scheduled_meetings)" },
  { script: "init-saas-tables.ts", label: "SaaS auth (ea_users, ea_sessions, ea_usage)" },
  { script: "init-profile-tables.ts", label: "User profiles & message sentiment (ea_user_profiles, ea_message_sentiment)" },
] as const;

async function runStep(index: number, script: string, label: string): Promise<boolean> {
  const stepNum = index + 1;
  const scriptPath = path.join(__dirname, script);

  try {
    await execFileAsync("npx", ["tsx", scriptPath], {
      cwd: process.cwd(),
      env: process.env,
    });
    console.log(`✅ Step ${stepNum} done — ${label}`);
    return true;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`❌ Step ${stepNum} failed: ${message}`);
    return false;
  }
}

async function main() {
  console.log("Virtual EA — initializing all database tables\n");

  let failed = 0;

  for (let i = 0; i < STEPS.length; i++) {
    const step = STEPS[i];
    const ok = await runStep(i, step.script, step.label);
    if (!ok) failed += 1;
  }

  console.log();
  if (failed === 0) {
    console.log("All steps completed ✅");
    process.exit(0);
  }

  console.log(`${failed} step(s) failed — review errors above ❌`);
  process.exit(1);
}

main().catch((error) => {
  console.error("init-all-tables fatal error:", error);
  process.exit(1);
});
