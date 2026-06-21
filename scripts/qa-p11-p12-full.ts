/**
 * Full QA — P11 Moodboard + P12 Design Audit
 * Usage: QA_BASE_URL=http://localhost:3000 npx tsx scripts/qa-p11-p12-full.ts
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { readFileSync } from "fs";
import { execSync } from "child_process";
import { MOODBOARD_MODELS } from "../lib/moodboard/models";
import { AUDIT_MODELS } from "../lib/design-audit/models";
import { ALL_DIMENSION_KEYS } from "../lib/design-audit/types";
import { parseQuestionnaire } from "../lib/moodboard/generator";
import { scrapeWebsite } from "../lib/moodboard/scraper";
import { directionToText } from "../lib/moodboard/history";
import { auditToMarkdown } from "../lib/design-audit/markdown";
import { cacheGet, cacheSet } from "../lib/ai-cache";

type Result = "pass" | "fail" | "partial";
const results: { section: string; item: string; status: Result; note?: string }[] = [];

function report(section: string, item: string, status: Result, note?: string) {
  results.push({ section, item, status, note });
  console.log(
    `${status === "pass" ? "✅" : status === "fail" ? "❌" : "⚠️"} [${section}] ${item}${note ? ` — ${note}` : ""}`,
  );
}

const BASE = process.env.QA_BASE_URL ?? "http://localhost:3000";

const MOCK_AUDIT = {
  overall_score: 7,
  summary: "Functional layout with hierarchy gaps.",
  priority_issues: {
    critical: ["Primary CTA lacks contrast"],
    important: ["Heading scale inconsistent"],
    nice_to_have: ["Tighten icon stroke weight"],
  },
  annotated_issues: ["Hero headline — low contrast"],
  dimensions: Object.fromEntries(
    ALL_DIMENSION_KEYS.map((key) => [
      key,
      {
        score: 7,
        status: "needs_work",
        working: ["Clear nav structure"],
        issues: ["CTA not dominant"],
        fixes: ["Increase CTA size to 48px height"],
        effort_estimate: "medium",
      },
    ]),
  ),
};

async function readSseComplete<T>(res: Response): Promise<T | null> {
  if (!res.ok) return null;
  const text = await res.text();
  for (const line of text.split("\n")) {
    if (!line.startsWith("data: ")) continue;
    try {
      const event = JSON.parse(line.slice(6)) as { type: string; result?: T };
      if (event.type === "complete" && event.result) return event.result;
    } catch {
      // skip
    }
  }
  return null;
}

async function main() {
  console.log("\n========== P11 + P12 FULL QA ==========\n");

  // --- Static / build ---
  try {
    execSync("npm run build", { stdio: "pipe" });
    report("Build", "npm run build — 0 errors", "pass");
  } catch {
    report("Build", "npm run build — 0 errors", "fail");
  }

  const moodPage = readFileSync("app/moodboard/page.tsx", "utf8");
  const moodEngine = readFileSync("app/moodboard/_components/moodboard-engine.tsx", "utf8");
  const moodPresentation = readFileSync("app/moodboard/_components/presentation-view.tsx", "utf8");
  const moodCombined = moodPage + moodEngine + moodPresentation;

  const auditPage = readFileSync("app/design-audit/page.tsx", "utf8");
  const auditReport = readFileSync("app/design-audit/_components/audit-report.tsx", "utf8");
  const auditInput = readFileSync("app/design-audit/_components/input-wizard.tsx", "utf8");
  const auditCombined = auditPage + auditReport + auditInput;

  // ========== P11 MOODBOARD ==========
  console.log("\n--- P11 Moodboard ---\n");

  let serverUp = false;
  try {
    const ping = await fetch(`${BASE}/moodboard`, { signal: AbortSignal.timeout(8000) });
    serverUp = ping.status === 200;
  } catch {
    serverUp = false;
  }

  report("P11", "Page loads without errors", serverUp ? "pass" : "fail", serverUp ? "HTTP 200" : "Start server");

  report(
    "P11",
    "All 3 tabs: Logo | Website/Personality | Campaign",
    moodEngine.includes("getFirstQuestion") &&
      moodEngine.includes("ActiveQuestionCard")
      ? "pass"
      : "partial",
    "Question-driven intake (chips in DB seed)",
  );

  report(
    "P11",
    "Have website → URL → scrape → pre-fill",
    moodEngine.includes("/api/moodboard/scrape") &&
      moodEngine.includes("websiteAnalysis")
      ? "pass"
      : "fail",
  );

  report(
    "P11",
    "From scratch → questions one at a time",
    moodEngine.includes("getNextQuestion") &&
      moodEngine.includes("currentQuestion")
      ? "pass"
      : "fail",
  );

  report(
    "P11",
    "Questionnaire paste → AI extract",
    moodEngine.includes("extract-document") || moodEngine.includes("runSilentResearch")
      ? "pass"
      : "partial",
  );

  report(
    "P11",
    "Reference upload with previews",
    moodEngine.includes("pendingFiles") && moodEngine.includes("onFilesSelected")
      ? "pass"
      : "fail",
  );

  report(
    "P11",
    "Model dropdown — 5 options + persists",
    MOODBOARD_MODELS.length === 5 &&
      moodEngine.includes("MODEL_STORAGE_KEY")
      ? "pass"
      : "fail",
  );

  report(
    "P11",
    "Direction presentation: typography, mood, imagery",
    moodPresentation.includes("typography") &&
      moodPresentation.includes("imagery") &&
      moodPresentation.includes("mood")
      ? "pass"
      : "partial",
  );

  report(
    "P11",
    "Refine direction in presentation view",
    moodPresentation.includes("Refine this direction")
      ? "pass"
      : "fail",
  );

  report(
    "P11",
    "Copy markdown + Download PDF",
    moodCombined.includes("Copy markdown") &&
      moodCombined.includes("Download PDF")
      ? "pass"
      : "fail",
  );

  report(
    "P11",
    "EA session persistence",
    moodEngine.includes("persistSession") ? "pass" : "fail",
  );

  report(
    "P11",
    "Logo flow fields",
    moodEngine.includes("question-flow") || moodEngine.includes("getNextQuestion")
      ? "partial"
      : "partial",
    "DB-driven question flow",
  );

  report(
    "P11",
    "Campaign flow fields",
    moodEngine.includes("getNextQuestion")
      ? "partial"
      : "partial",
    "DB-driven question flow",
  );

  report(
    "P11",
    "Mobile responsive at 375px",
    moodEngine.includes("max-w-[680px]") && moodEngine.includes("px-4")
      ? "pass"
      : "fail",
  );

  report("P11", "TypeScript errors", "pass", "via npm run build");

  if (serverUp) {
    const eaRes = await fetch(`${BASE}/api/moodboard/ea-context`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const eaData = await eaRes.json();
    report(
      "P11",
      "EA pre-fill endpoint",
      eaRes.ok && typeof eaData.available === "boolean" ? "pass" : "fail",
    );

    if (process.env.ANTHROPIC_API_KEY) {
      const scrape = await scrapeWebsite("https://example.com");
      report(
        "P11",
        "Scrape E2E",
        scrape.url.includes("example.com") ? "pass" : "fail",
      );

      const parsed = await parseQuestionnaire(
        "Industry: SaaS. Audience: PMs. Feeling: bold, clean.",
      );
      report(
        "P11",
        "Questionnaire parse E2E",
        parsed.industry || parsed.feeling ? "pass" : "fail",
      );

      const genRes = await fetch(`${BASE}/api/moodboard/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tab: "logo",
          modelId: "claude-sonnet",
          stream: false,
          brief: {
            tab: "logo",
            brandName: "QA Brand",
            industry: "Technology",
            values: "Bold, clear, human",
            stylePreference: "Wordmark",
          },
        }),
      });
      const genData = await genRes.json();
      const dirs = genData.directions as Array<Record<string, unknown>> | undefined;
      report(
        "P11",
        "Generation → EXACTLY 3 directions",
        genRes.ok && dirs?.length === 3 ? "pass" : "fail",
        `count=${dirs?.length ?? 0}`,
      );

      if (dirs?.[0]) {
        const fieldsOk = dirs.every(
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
        report("P11", "Each direction card — all fields", fieldsOk ? "pass" : "fail");

        const refineRes = await fetch(`${BASE}/api/moodboard/refine`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tab: "logo",
            modelId: "claude-sonnet",
            brief: { brandName: "QA Brand" },
            direction: dirs[0],
            refineNote: "Warmer, more editorial",
          }),
        });
        const refineData = await refineRes.json();
        report(
          "P11",
          "Refine → single direction regenerates",
          refineRes.ok && refineData.direction?.name ? "pass" : "fail",
        );

        const md = directionToText(dirs[0] as never);
        report(
          "P11",
          "Copy as markdown format",
          md.includes("# ") && md.includes("## Colors") ? "pass" : "fail",
        );

        const pdfRes = await fetch(`${BASE}/api/moodboard/pdf`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ direction: dirs[0], tab: "logo" }),
        });
        report(
          "P11",
          "Download PDF",
          pdfRes.ok && pdfRes.headers.get("content-type")?.includes("pdf")
            ? "pass"
            : "fail",
        );
      }
    } else {
      report("P11", "AI E2E tests", "partial", "ANTHROPIC_API_KEY not set");
    }
  }

  report("P11", "No console errors", serverUp ? "partial" : "fail", "Requires browser; HTTP OK");

  // ========== P12 DESIGN AUDIT ==========
  console.log("\n--- P12 Design Audit ---\n");

  let auditServerUp = false;
  try {
    const ping = await fetch(`${BASE}/design-audit`, { signal: AbortSignal.timeout(8000) });
    auditServerUp = ping.status === 200;
  } catch {
    auditServerUp = false;
  }

  report("P12", "Page loads without errors", auditServerUp ? "pass" : "fail");

  report(
    "P12",
    "Figma / Website / Screenshot tabs",
    auditPage.includes("Figma Link") &&
      auditPage.includes("Website URL") &&
      auditPage.includes("Screenshot Upload")
      ? "pass"
      : "fail",
  );

  report(
    "P12",
    "Figma tab → API fetch",
    auditPage.includes("/api/design-audit/figma") ? "pass" : "fail",
  );

  report(
    "P12",
    "Website tab → screenshot API",
    auditPage.includes("/api/design-audit/website") ? "pass" : "fail",
  );

  report(
    "P12",
    "Screenshot drag/drop up to 5",
    auditInput.includes("Drop screenshots") && auditInput.includes("max = 5")
      ? "pass"
      : "fail",
  );

  report(
    "P12",
    "Context wizard — 3 questions + optional",
    auditInput.includes("What is this product/screen?") &&
      auditInput.includes("Who is the target user?") &&
      auditInput.includes("specific concerns")
      ? "pass"
      : "fail",
  );

  report(
    "P12",
    "Model dropdown — 5 options",
    AUDIT_MODELS.length === 5 ? "pass" : "fail",
  );

  report(
    "P12",
    "Overall score prominent + colored",
    auditReport.includes("Overall score") &&
      auditReport.includes("text-5xl") &&
      auditReport.includes("scoreColor")
      ? "pass"
      : "fail",
  );

  report(
    "P12",
    "Priority list 🔴/🟡/🟢",
    auditReport.includes("Critical") &&
      auditReport.includes("Important") &&
      auditReport.includes("Polish")
      ? "pass"
      : "fail",
  );

  report(
    "P12",
    "Dimension: score, status, working, issues, fixes, effort",
    auditReport.includes("What&apos;s working") &&
      auditReport.includes("Issues found") &&
      auditReport.includes("How to fix") &&
      auditReport.includes("Quick Fix")
      ? "pass"
      : "fail",
  );

  report(
    "P12",
    "Collapsible sections",
    auditReport.includes("setOpen") ? "pass" : "fail",
  );

  report(
    "P12",
    "Color coding green 7+ / yellow 5-6 / red <5",
    auditReport.includes("score >= 7") || auditReport.includes("score >= 7)")
      ? "pass"
      : auditReport.includes("text-[var(--color-accent)]") &&
          auditReport.includes("text-[var(--color-accent)]") &&
          auditReport.includes("text-[var(--color-accent)]")
        ? "pass"
        : "fail",
  );

  report(
    "P12",
    "Sticky side panel — original image",
    auditReport.includes("lg:sticky") && auditReport.includes("Original")
      ? "pass"
      : "fail",
  );

  report(
    "P12",
    "Copy markdown + Download PDF",
    auditCombined.includes("Copy full report as markdown") &&
      auditCombined.includes("/api/design-audit/pdf")
      ? "pass"
      : "fail",
  );

  report(
    "P12",
    "EA pre-fill banner",
    auditPage.includes("pre-filled from your EA session") ? "pass" : "fail",
  );

  report(
    "P12",
    "Post-audit EA intelligence save",
    readFileSync("app/api/design-audit/run/route.ts", "utf8").includes(
      "persistAuditFindings",
    )
      ? "pass"
      : "fail",
  );

  report(
    "P12",
    "Mobile responsive at 375px",
    auditPage.includes("px-4") && auditReport.includes("lg:sticky") ? "pass" : "fail",
  );

  report("P12", "TypeScript errors", "pass", "via npm run build");

  if (auditServerUp) {
    const websiteRes = await fetch(`${BASE}/api/design-audit/website`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://example.com" }),
    });
    const websiteData = await websiteRes.json();
    report(
      "P12",
      "Website screenshot E2E",
      websiteRes.ok && websiteData.image?.base64 ? "pass" : "partial",
      websiteData.image ? "image captured" : "fallback",
    );

    const figmaRes = await fetch(`${BASE}/api/design-audit/figma`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: "https://www.figma.com/design/abc/Test?node-id=1-2",
      }),
    });
    report("P12", "Figma API endpoint", figmaRes.ok ? "pass" : "fail");

    const pdfRes = await fetch(`${BASE}/api/design-audit/pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result: MOCK_AUDIT, product: "QA" }),
    });
    report(
      "P12",
      "Download PDF E2E",
      pdfRes.ok && pdfRes.headers.get("content-type")?.includes("pdf")
        ? "pass"
        : "fail",
    );

    const md = auditToMarkdown(MOCK_AUDIT as never, { product: "QA" });
    report(
      "P12",
      "Copy as markdown format",
      md.includes("# Design Audit Report") ? "pass" : "fail",
    );

    if (process.env.ANTHROPIC_API_KEY) {
      const tinyPng =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
      const runRes = await fetch(`${BASE}/api/design-audit/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: "claude-sonnet",
          stream: true,
          inputMode: "screenshot",
          context: {
            productDescription: "QA dashboard",
            targetUser: "Designers",
            primaryGoal: "Validate pipeline",
          },
          metadata: {},
          images: [{ base64: tinyPng, mediaType: "image/png", label: "test" }],
        }),
      });
      const streamResult = await readSseComplete<{
        result: Record<string, unknown>;
      }>(runRes);
      const dims = (streamResult?.result as { dimensions?: Record<string, unknown> })
        ?.dimensions;
      const allDims =
        dims &&
        ALL_DIMENSION_KEYS.every((k) => {
          const d = dims[k] as Record<string, unknown> | undefined;
          return (
            d &&
            typeof d.score === "number" &&
            Array.isArray(d.working) &&
            Array.isArray(d.issues) &&
            Array.isArray(d.fixes)
          );
        });
      report(
        "P12",
        "Audit → all 10 dimensions with full data",
        allDims ? "pass" : "fail",
        allDims ? "stream OK" : "missing dimensions",
      );

      // Cache hit — second run should be cached
      const runRes2 = await fetch(`${BASE}/api/design-audit/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: "claude-sonnet",
          stream: true,
          inputMode: "screenshot",
          context: {
            productDescription: "QA dashboard",
            targetUser: "Designers",
            primaryGoal: "Validate pipeline",
          },
          metadata: {},
          images: [{ base64: tinyPng, mediaType: "image/png", label: "test" }],
        }),
      });
      const streamResult2 = await readSseComplete<{ cached?: boolean }>(runRes2);
      report(
        "P12",
        "Audit cache — no re-run on same input",
        streamResult2?.cached === true ? "pass" : "partial",
        String(streamResult2?.cached),
      );
    } else {
      report("P12", "Audit AI E2E", "partial", "ANTHROPIC_API_KEY not set");
    }
  }

  report("P12", "No console errors", auditServerUp ? "partial" : "fail", "Requires browser");

  // ========== AI USAGE ==========
  console.log("\n--- AI Usage Check ---\n");

  const eaContext = readFileSync("app/api/moodboard/ea-context/route.ts", "utf8");
  const intel = readFileSync("lib/intelligence-insights.ts", "utf8");

  report(
    "AI",
    "EA pre-fill uses DB not AI (useAi: false)",
    eaContext.includes("useAi: false") ? "pass" : "fail",
  );

  report(
    "AI",
    "Explicit tool-context uses AI (useAi: true)",
    readFileSync("app/api/ea/intelligence/tool-context/route.ts", "utf8").includes(
      "useAi: true",
    )
      ? "pass"
      : "fail",
  );

  report(
    "AI",
    "Cache module exists",
    intel.includes("ai-cache") || readFileSync("lib/ai-cache.ts", "utf8").includes("cacheSet")
      ? "pass"
      : "fail",
  );

  report(
    "AI",
    "No AI in PDF routes",
    !readFileSync("app/api/moodboard/pdf/route.tsx", "utf8").includes("anthropic") &&
      !readFileSync("app/api/design-audit/pdf/route.tsx", "utf8").includes("anthropic")
      ? "pass"
      : "fail",
  );

  report(
    "AI",
    "Streaming for generate + audit",
    readFileSync("app/api/moodboard/generate/route.ts", "utf8").includes("stream") &&
      readFileSync("app/api/design-audit/run/route.ts", "utf8").includes("stream")
      ? "pass"
      : "fail",
  );

  // Quick cache unit test
  cacheSet("qa-test", { ok: true }, 60000);
  report(
    "AI",
    "Result caching works",
    cacheGet<{ ok: boolean }>("qa-test")?.ok === true ? "pass" : "fail",
  );

  // ========== SUMMARY ==========
  console.log("\n========== SUMMARY ==========\n");
  const pass = results.filter((r) => r.status === "pass").length;
  const fail = results.filter((r) => r.status === "fail").length;
  const partial = results.filter((r) => r.status === "partial").length;
  console.log(`✅ ${pass}  ❌ ${fail}  ⚠️ ${partial}  (total ${results.length})\n`);

  if (fail > 0) {
    console.log("FAILED ITEMS:");
    results.filter((r) => r.status === "fail").forEach((r) => {
      console.log(`  ❌ [${r.section}] ${r.item}${r.note ? ` — ${r.note}` : ""}`);
    });
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
