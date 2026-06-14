import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const c = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  bold: "\x1b[1m",
};

type EnvSpec = {
  key: string;
  required: boolean;
  missingNote: string;
};

const ENV_SPECS: EnvSpec[] = [
  {
    key: "ANTHROPIC_API_KEY",
    required: true,
    missingNote: "app will not work",
  },
  {
    key: "DATABASE_URL",
    required: true,
    missingNote: "app will not work",
  },
  { key: "EA_PASSWORD", required: true, missingNote: "app will not work" },
  {
    key: "ELEVENLABS_API_KEY",
    required: true,
    missingNote: "app will not work",
  },
  { key: "RESEND_API_KEY", required: true, missingNote: "app will not work" },
  {
    key: "GOOGLE_CLIENT_ID",
    required: true,
    missingNote: "app will not work",
  },
  {
    key: "GOOGLE_CLIENT_SECRET",
    required: true,
    missingNote: "app will not work",
  },
  {
    key: "OPENAI_API_KEY",
    required: false,
    missingNote: "Whisper disabled",
  },
  {
    key: "STRIPE_SECRET_KEY",
    required: false,
    missingNote: "Billing disabled",
  },
  {
    key: "STRIPE_WEBHOOK_SECRET",
    required: false,
    missingNote: "Webhooks disabled",
  },
  {
    key: "STRIPE_STARTER_PRICE_ID",
    required: false,
    missingNote: "Starter plan disabled",
  },
  {
    key: "STRIPE_PRO_PRICE_ID",
    required: false,
    missingNote: "Pro plan disabled",
  },
  {
    key: "RESEND_FROM_EMAIL",
    required: false,
    missingNote: "Uses default from address",
  },
];

function isSet(key: string): boolean {
  const value = process.env[key];
  return typeof value === "string" && value.trim().length > 0;
}

console.log(`${c.bold}Virtual EA — Environment check${c.reset}\n`);

let missingRequired = 0;

for (const spec of ENV_SPECS) {
  const set = isSet(spec.key);

  if (set) {
    console.log(`${c.green}✅ ${spec.key} — set${c.reset}`);
    continue;
  }

  if (spec.required) {
    missingRequired += 1;
    console.log(
      `${c.red}❌ ${spec.key} — MISSING (${spec.missingNote})${c.reset}`,
    );
  } else {
    console.log(
      `${c.yellow}⚠️  ${spec.key} — missing (${spec.missingNote})${c.reset}`,
    );
  }
}

console.log();
console.log(`${c.bold}Missing required:${c.reset} ${missingRequired}`);

if (missingRequired === 0) {
  console.log(`${c.green}${c.bold}Ready to deploy ✅${c.reset}`);
  process.exit(0);
}

console.log(`${c.red}${c.bold}Fix required vars before deploy ❌${c.reset}`);
process.exit(1);
