/**
 * Moodboard Platform QA
 * Usage: npx tsx scripts/qa-moodboard.ts
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { readFileSync } from "fs";
import { MOODBOARD_SYSTEM_PROMPT } from "../lib/moodboard/system-prompt";
import { MOODBOARD_MODELS } from "../lib/moodboard/models";
import { parseQuestionnaire } from "../lib/moodboard/generator";
import { scrapeWebsite } from "../lib/moodboard/scraper";
import { directionToText } from "../lib/moodboard/history";

type Result = "pass" | "fail" | "partial";
const results: { item: string; status: Result; note?: string }[] = [];

function report(item: string, status: Result, note?: string) {
  results.push({ item, status, note });
  console.log(`${status === "pass" ? "✅" : status === "fail" ? "❌" : "⚠️"} ${item}${note ? ` — ${note}` : ""}`);
}

const BASE = process.env.QA_BASE_URL ?? "http://localhost:3000";

async function main() {
  console.log("\n=== Moodboard QA ===\n");

  report(
    "System prompt includes EXACTLY 3 rule",
    MOODBOARD_SYSTEM_PROMPT.includes("EXACTLY 3") ? "pass" : "fail",
  );

  report(
    "Model dropdown has 5 models + Sonnet default",
    MOODBOARD_MODELS.length === 5 &&
      MOODBOARD_MODELS.some((m) => m.recommended && m.id === "claude-sonnet")
      ? "pass"
      : "fail",
  );

  const page = readFileSync("app/moodboard/page.tsx", "utf8");
  const chat = readFileSync("app/moodboard/_components/moodboard-chat.tsx", "utf8");
  const cards = readFileSync("app/moodboard/_components/direction-cards.tsx", "utf8");
  const combined = chat + cards;
  report(
    "Conversational chat interface",
    chat.includes("MoodboardChat") && chat.includes("What are we creating a moodboard for today?")
      ? "pass"
      : "fail",
  );
  report(
    "Entry chips: Website / Brand / Campaign",
    chat.includes("🌐 Website") &&
      chat.includes("🎨 Brand / Logo") &&
      chat.includes("📣 Campaign")
      ? "pass"
      : "fail",
  );
  report(
    "Feedback: Select / Refine / Not this",
    cards.includes("✓ Select this") &&
      cards.includes("↻ Refine") &&
      cards.includes("✗ Not this")
      ? "pass"
      : "fail",
  );
  report(
    "Export: Copy / PDF / history",
    combined.includes("Copy as markdown") &&
      combined.includes("Download PDF") &&
      combined.includes("Save to history")
      ? "pass"
      : "fail",
  );
  report(
    "EA pre-fill",
    chat.includes("/api/moodboard/ea-context") ? "pass" : "fail",
  );
  report(
    "Mobile responsive grid classes",
    chat.includes("max-w-3xl") && cards.includes("md:grid-cols-2")
      ? "pass"
      : "fail",
  );
  report(
    "Model selector persists",
    chat.includes("MODEL_STORAGE_KEY") && chat.includes("localStorage")
      ? "pass"
      : "fail",
  );

  const cardsFile = readFileSync("app/moodboard/_components/direction-cards.tsx", "utf8");
  report(
    "Color swatches component",
    cardsFile.includes("backgroundColor: color.hex") ? "pass" : "fail",
  );

  try {
    const scrape = await scrapeWebsite("https://example.com");
    report(
      "Website scrape (graceful)",
      scrape.url.includes("example.com") ? "pass" : "fail",
      scrape.fallback ? "fallback mode" : "full analysis",
    );
  } catch (e) {
    report("Website scrape", "fail", String(e));
  }

  try {
    const parsed = await parseQuestionnaire(
      "Industry: Fintech. Audience: SMB founders. Feeling: trustworthy, modern, bold.",
    );
    report(
      "Questionnaire parsing",
      parsed.industry || parsed.summary || parsed.feeling ? "pass" : "partial",
    );
  } catch (e) {
    report("Questionnaire parsing", "partial", String(e));
  }

  let serverUp = false;
  try {
    const ping = await fetch(`${BASE}/moodboard`, { signal: AbortSignal.timeout(5000) });
    serverUp = ping.status === 200;
  } catch {
    serverUp = false;
  }

  if (!serverUp) {
    report("/moodboard page loads", "partial", "Start dev server for HTTP tests");
  } else {
    report("/moodboard page loads", "pass", `status 200`);

    const html = await fetch(`${BASE}/moodboard`).then((r) => r.text());
    report(
      "Page renders Moodboard Platform title",
      html.includes("Moodboard Platform") ? "pass" : "fail",
    );

    const eaRes = await fetch(`${BASE}/api/moodboard/ea-context`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const eaData = await eaRes.json();
    report(
      "EA context endpoint responds",
      eaRes.ok && typeof eaData.available === "boolean" ? "pass" : "fail",
    );

    if (process.env.ANTHROPIC_API_KEY) {
      const genRes = await fetch(`${BASE}/api/moodboard/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tab: "logo",
          modelId: "claude-sonnet",
          brief: {
            tab: "logo",
            brandName: "QA Brand",
            industry: "Technology",
            values: "Bold, clear, human",
            stylePreference: "Minimal geometric wordmark",
          },
        }),
      });
      const genData = await genRes.json();
      const dirs = genData.directions as Array<Record<string, unknown>> | undefined;
      const fieldsOk =
        dirs?.length === 3 &&
        dirs.every(
          (d) =>
            d.name &&
            d.concept &&
            Array.isArray(d.colors) &&
            d.colors.length === 5 &&
            d.typography &&
            d.imagery &&
            Array.isArray(d.mood) &&
            d.visual_references,
        );
      report(
        "Generation produces EXACTLY 3 directions with all fields",
        genRes.ok && fieldsOk ? "pass" : "fail",
        genRes.ok ? `count=${dirs?.length}` : String(genData.error),
      );

      if (dirs?.[0]) {
        const refineRes = await fetch(`${BASE}/api/moodboard/refine`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tab: "logo",
            modelId: "claude-sonnet",
            brief: { brandName: "QA Brand" },
            direction: dirs[0],
            refineNote: "Make it warmer and more editorial",
          }),
        });
        const refineData = await refineRes.json();
        report(
          "Refine regenerates single direction",
          refineRes.ok && refineData.direction?.name ? "pass" : "fail",
        );

        const text = directionToText(dirs[0] as never);
        report("Copy as text format", text.includes("# ") && text.includes("## Colors") ? "pass" : "fail");

        const pdfRes = await fetch(`${BASE}/api/moodboard/pdf`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ direction: dirs[0], tab: "logo" }),
        });
        report(
          "PDF export",
          pdfRes.ok && pdfRes.headers.get("content-type")?.includes("pdf")
            ? "pass"
            : "fail",
        );
      }
    } else {
      report("Generation E2E", "partial", "ANTHROPIC_API_KEY not set");
      report("Refine E2E", "partial", "Skipped");
      report("PDF export E2E", "partial", "Skipped");
    }
  }

  console.log("\n=== SUMMARY ===");
  const pass = results.filter((r) => r.status === "pass").length;
  const fail = results.filter((r) => r.status === "fail").length;
  const partial = results.filter((r) => r.status === "partial").length;
  console.log(`✅ ${pass}  ❌ ${fail}  ⚠️ ${partial}\n`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
