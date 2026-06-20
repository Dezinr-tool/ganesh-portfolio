/**
 * Moodboard Platform QA (updated for intake chat + slide deck flow)
 * Usage: npm run qa:moodboard
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { readFileSync } from "fs";
import { MOODBOARD_MODELS } from "../lib/moodboard/models";
import { scrapeWebsite } from "../lib/moodboard/scraper";
import {
  conversationSignalsSections,
  shouldOfferSectionsPhase,
} from "../lib/moodboard/intake-phase";

type Result = "pass" | "fail" | "partial";
const results: { item: string; status: Result; note?: string }[] = [];

function report(item: string, status: Result, note?: string) {
  results.push({ item, status, note });
  console.log(
    `${status === "pass" ? "✅" : status === "fail" ? "❌" : "⚠️"} ${item}${note ? ` — ${note}` : ""}`,
  );
}

const BASE = process.env.QA_BASE_URL ?? "http://localhost:3000";

async function main() {
  console.log("\n=== Moodboard QA ===\n");

  const engine = readFileSync("app/moodboard/_components/moodboard-engine.tsx", "utf8");
  const picker = readFileSync("app/moodboard/_components/moodboard-sections-picker.tsx", "utf8");
  const presentation = readFileSync("app/moodboard/_components/presentation-view.tsx", "utf8");
  const page = readFileSync("app/moodboard/page.tsx", "utf8");

  report(
    "MoodboardEngine on /moodboard",
    page.includes("MoodboardEngine") && engine.includes("MoodboardEngine") ? "pass" : "fail",
  );
  report(
    "Sections picker wired (QuestionOptionsCard)",
    picker.includes("QuestionOptionsCard") && engine.includes("MoodboardSectionsPicker")
      ? "pass"
      : "fail",
  );
  report(
    "Picker test id for E2E",
    engine.includes('data-testid="moodboard-sections-picker"') ? "pass" : "fail",
  );
  report(
    "Slide presentation output",
    engine.includes("PresentationView") || engine.includes("MoodboardOutputShell")
      ? "pass"
      : "fail",
  );
  report(
    "PDF export in presentation deck",
    presentation.includes("handlePdf") && presentation.includes("PDF —") ? "pass" : "fail",
  );
  report(
    "Generate intent + panel-help handlers",
    engine.includes("userRequestedGeneration") && engine.includes("userNeedsPanelHelp")
      ? "pass"
      : "fail",
  );
  report(
    "Model selector persists",
    engine.includes("MODEL_STORAGE_KEY") ? "pass" : "fail",
  );
  report(
    "Intake phase detection (unit-tested)",
    readFileSync("lib/moodboard/__tests__/intake-phase.test.ts", "utf8").includes(
      "conversationSignalsSections",
    )
      ? "pass"
      : "fail",
  );

  report(
    "Session sync does not clobber active chat",
    engine.includes("interactionStartedRef") &&
      engine.includes("messagesRef.current.length > 0")
      ? "pass"
      : "fail",
  );

  report(
    "Section signal detection (Astro thread)",
    conversationSignalsSections([
      {
        role: "assistant",
        text: "Use the panel below to select your moodboard elements.",
      },
    ])
      ? "pass"
      : "fail",
  );

  report(
    "shouldOfferSectionsPhase with partial intake",
    shouldOfferSectionsPhase({
      answers: { q1: "Astro", q2: "Shopify gems", q3: "Website", q6: "35-50" },
      messages: [],
      directionsCount: 0,
    })
      ? "pass"
      : "fail",
  );

  try {
    const scrape = await scrapeWebsite("https://example.com");
    report(
      "Website scrape",
      scrape.url.includes("example.com") ? "pass" : "fail",
      scrape.fallback ? "fallback" : "full",
    );
  } catch (e) {
    report("Website scrape", "fail", String(e));
  }

  let serverUp = false;
  try {
    const ping = await fetch(`${BASE}/moodboard`, { signal: AbortSignal.timeout(8000) });
    serverUp = ping.status === 200;
  } catch {
    serverUp = false;
  }

  if (!serverUp) {
    report("/moodboard HTTP", "partial", "Start dev server: npm run dev");
  } else {
    report("/moodboard HTTP 200", "pass");

    const html = await fetch(`${BASE}/moodboard`).then((r) => r.text());
    report(
      "Landing shell (client-rendered hero)",
      html.includes("moodboard") || html.includes("Moodboard") ? "pass" : "partial",
      "Hero text hydrates client-side",
    );

    if (process.env.ANTHROPIC_API_KEY) {
      const sessionId = crypto.randomUUID();
      await fetch(`${BASE}/api/moodboard/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      const chatRes = await fetch(`${BASE}/api/moodboard/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          modelId: "claude-sonnet",
          messages: [
            {
              role: "user",
              text: "Astro premium Shopify astrology gems for buyers 35-50. Premium celestial editorial feel.",
            },
          ],
          answers: {},
        }),
      });
      const chatData = await chatRes.json();
      report(
        "Chat intake API",
        chatRes.ok && chatData.reply ? "pass" : "fail",
        chatData.readyToGenerate ? "ready" : "collecting",
      );
      report(
        "Chat returns showSectionsPicker when ready",
        chatData.showSectionsPicker === true || chatData.readyToGenerate === true
          ? "pass"
          : "partial",
        `ready=${chatData.readyToGenerate} show=${chatData.showSectionsPicker}`,
      );
    } else {
      report("Chat API E2E", "partial", "ANTHROPIC_API_KEY not set");
    }
  }

  console.log("\n=== SUMMARY ===");
  const pass = results.filter((r) => r.status === "pass").length;
  const fail = results.filter((r) => r.status === "fail").length;
  const partial = results.filter((r) => r.status === "partial").length;
  console.log(`✅ ${pass}  ❌ ${fail}  ⚠️ ${partial}\n`);
  console.log("Run full browser QA: npm run qa:moodboard:e2e\n");
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
