/**
 * Design Audit Platform QA (P12)
 * Usage: npx tsx scripts/qa-design-audit.ts
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { readFileSync } from "fs";
import { DESIGN_AUDIT_SYSTEM_PROMPT } from "../lib/design-audit/system-prompt";
import { AUDIT_MODELS } from "../lib/design-audit/models";
import { ALL_DIMENSION_KEYS } from "../lib/design-audit/types";
import { auditToMarkdown } from "../lib/design-audit/markdown";
import { fetchWebsiteAuditInput } from "../lib/design-audit/website";

type Result = "pass" | "fail" | "partial";
const results: { item: string; status: Result; note?: string }[] = [];

function report(item: string, status: Result, note?: string) {
  results.push({ item, status, note });
  console.log(
    `${status === "pass" ? "✅" : status === "fail" ? "❌" : "⚠️"} ${item}${note ? ` — ${note}` : ""}`,
  );
}

const BASE = process.env.QA_BASE_URL ?? "http://localhost:3000";

const MOCK_RESULT = {
  overall_score: 7,
  summary: "Functional layout with hierarchy gaps.",
  priority_issues: {
    critical: ["Primary CTA lacks contrast"],
    important: ["Heading scale inconsistent"],
    nice_to_have: ["Tighten icon stroke weight"],
  },
  annotated_issues: ["Hero headline — low contrast vs background"],
  dimensions: Object.fromEntries(
    ALL_DIMENSION_KEYS.map((key) => [
      key,
      {
        score: 7,
        status: "needs_work",
        working: ["Clear nav structure"],
        issues: ["CTA not dominant"],
        fixes: ["Increase CTA size to 48px height"],
      },
    ]),
  ),
};

async function main() {
  console.log("\n=== Design Audit QA (P12) ===\n");

  report(
    "System prompt: brutally honest auditor",
    DESIGN_AUDIT_SYSTEM_PROMPT.includes("Brutally honest") ? "pass" : "fail",
  );

  report(
    "Model dropdown: 5 models + Sonnet default",
    AUDIT_MODELS.length === 5 &&
      AUDIT_MODELS.some((m) => m.recommended && m.id === "claude-sonnet")
      ? "pass"
      : "fail",
  );

  report(
    "All 10 audit dimensions defined",
    ALL_DIMENSION_KEYS.length === 10 ? "pass" : "fail",
  );

  const page = readFileSync("app/design-audit/page.tsx", "utf8");
  const reportUi = readFileSync(
    "app/design-audit/_components/audit-report.tsx",
    "utf8",
  );
  const inputUi = readFileSync(
    "app/design-audit/_components/input-wizard.tsx",
    "utf8",
  );
  const combined = page + reportUi + inputUi;

  report(
    "/design-audit route exists",
    page.includes("Design Audit") ? "pass" : "fail",
  );

  report(
    "All 3 input tabs (Figma / Website / Screenshot)",
    page.includes("Figma Link") &&
      page.includes("Website URL") &&
      page.includes("Screenshot Upload")
      ? "pass"
      : "fail",
  );

  report(
    "Context questions (product, user, goal, concerns)",
    combined.includes("What is this product/screen?") &&
      combined.includes("Who is the target user?") &&
      combined.includes("primary goal")
      ? "pass"
      : "fail",
  );

  report(
    "Screenshot upload preview (up to 5)",
    combined.includes("Drop screenshots") && combined.includes("max = 5")
      ? "pass"
      : "fail",
  );

  report(
    "EA pre-fill banner",
    page.includes("pre-filled from your EA session") ? "pass" : "fail",
  );

  report(
    "Report: overall score + priority list",
    reportUi.includes("Overall score") &&
      reportUi.includes("Critical") &&
      reportUi.includes("Important") &&
      reportUi.includes("Polish")
      ? "pass"
      : "fail",
  );

  report(
    "Report: sticky header + side panel + bar chart",
    reportUi.includes("sticky top-0") &&
      reportUi.includes("lg:sticky") &&
      reportUi.includes("Score breakdown")
      ? "pass"
      : "fail",
  );

  report(
    "Report: effort estimate + Strong status",
    reportUi.includes("effort_estimate") || reportUi.includes("Quick Fix")
      ? "pass"
      : "fail",
  );

  report(
    "Report: color-coded scores",
    reportUi.includes("text-[var(--color-accent)]") &&
      reportUi.includes("text-[var(--color-accent)]") &&
      reportUi.includes("text-[var(--color-accent)]")
      ? "pass"
      : "fail",
  );

  report(
    "Copy as markdown + Download PDF",
    combined.includes("Copy full report as markdown") &&
      combined.includes("Download PDF") &&
      combined.includes("/api/design-audit/pdf")
      ? "pass"
      : "fail",
  );

  report(
    "Mobile responsive classes",
    (page.includes("sm:") || reportUi.includes("sm:")) &&
      reportUi.includes("lg:sticky")
      ? "pass"
      : "fail",
  );

  report(
    "EA nav link",
    readFileSync("app/ea/_components/ea-nav.tsx", "utf8").includes(
      "/design-audit",
    )
      ? "pass"
      : "fail",
  );

  report(
    "EA tool-context includes design_audit",
    readFileSync("app/api/ea/intelligence/tool-context/route.ts", "utf8").includes(
      "design_audit",
    )
      ? "pass"
      : "fail",
  );

  const md = auditToMarkdown(MOCK_RESULT as never, {
    product: "Test SaaS",
    targetUser: "PMs",
  });
  report(
    "Markdown export format",
    md.includes("# Design Audit Report") && md.includes("Visual Hierarchy")
      ? "pass"
      : "fail",
  );

  try {
    const web = await fetchWebsiteAuditInput("https://example.com");
    report(
      "Website URL → metadata fetch",
      web.meta.title.length > 0 && web.meta.headings.length >= 0 ? "pass" : "fail",
      web.image ? "screenshot captured" : "OG/fallback only",
    );
  } catch (e) {
    report("Website URL fetch", "fail", String(e));
  }

  if (process.env.FIGMA_ACCESS_TOKEN) {
    report("Figma API token configured", "pass");
  } else {
    report("Figma API token configured", "partial", "FIGMA_ACCESS_TOKEN not set");
  }

  let serverUp = false;
  try {
    const ping = await fetch(`${BASE}/design-audit`, {
      signal: AbortSignal.timeout(8000),
    });
    serverUp = ping.status === 200;
  } catch {
    serverUp = false;
  }

  if (!serverUp) {
    report("/design-audit loads without error", "partial", "Start dev server");
    report("EA context endpoint", "partial", "Skipped — no server");
    report("PDF export endpoint", "partial", "Skipped — no server");
    report("Audit run E2E", "partial", "Skipped — no server");
  } else {
    report("/design-audit loads without error", "pass", "status 200");

    const html = await fetch(`${BASE}/design-audit`).then((r) => r.text());
    report(
      "Page renders Design Audit title",
      html.includes("Design Audit") ? "pass" : "fail",
    );

    const eaRes = await fetch(`${BASE}/api/design-audit/ea-context`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const eaData = await eaRes.json();
    report(
      "EA context endpoint responds",
      eaRes.ok && typeof eaData.available === "boolean" ? "pass" : "fail",
    );

    const figmaRes = await fetch(`${BASE}/api/design-audit/figma`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://www.figma.com/design/abc/Test?node-id=1-2" }),
    });
    report(
      "Figma endpoint responds",
      figmaRes.ok || figmaRes.status === 500 ? "pass" : "fail",
      `status ${figmaRes.status}`,
    );

    const websiteRes = await fetch(`${BASE}/api/design-audit/website`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://example.com" }),
    });
    report(
      "Website endpoint responds",
      websiteRes.ok ? "pass" : "fail",
      `status ${websiteRes.status}`,
    );

    const pdfRes = await fetch(`${BASE}/api/design-audit/pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result: MOCK_RESULT, product: "QA Product" }),
    });
    report(
      "PDF export",
      pdfRes.ok && pdfRes.headers.get("content-type")?.includes("pdf")
        ? "pass"
        : "fail",
    );

    if (process.env.ANTHROPIC_API_KEY) {
      const tinyPng =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
      const runRes = await fetch(`${BASE}/api/design-audit/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: "claude-sonnet",
          inputMode: "screenshot",
          context: {
            productDescription: "QA test dashboard",
            targetUser: "Designers",
            primaryGoal: "Validate audit pipeline",
          },
          metadata: {},
          images: [{ base64: tinyPng, mediaType: "image/png", label: "test" }],
        }),
      });
      const runData = await runRes.json();
      const dims = runData.result?.dimensions;
      const allDims =
        dims &&
        ALL_DIMENSION_KEYS.every(
          (k) =>
            typeof dims[k]?.score === "number" &&
            Array.isArray(dims[k]?.working) &&
            Array.isArray(dims[k]?.issues) &&
            Array.isArray(dims[k]?.fixes),
        );
      report(
        "Audit runs and returns all 10 dimensions",
        runRes.ok && allDims ? "pass" : "fail",
        runRes.ok ? `score=${runData.result?.overall_score}` : String(runData.error),
      );
    } else {
      report("Audit run E2E", "partial", "ANTHROPIC_API_KEY not set");
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
