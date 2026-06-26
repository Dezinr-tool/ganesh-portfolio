import * as dotenv from "dotenv";
import { chromium } from "playwright";
import {
  createDashboardAuthToken,
  DASHBOARD_AUTH_COOKIE,
} from "../app/dashboard/_lib/auth";

dotenv.config({ path: ".env.local" });

const BASE = process.env.QA_BASE_URL ?? "http://localhost:3000";

async function main() {
  const password = process.env.DASHBOARD_PASSWORD;
  if (!password) throw new Error("DASHBOARD_PASSWORD missing");

  const token = await createDashboardAuthToken(password);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addCookies([
    {
      name: DASHBOARD_AUTH_COOKIE,
      value: token,
      domain: "localhost",
      path: "/",
    },
  ]);

  const page = await context.newPage();
  const checks: { name: string; pass: boolean }[] = [];
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  function check(name: string, pass: boolean) {
    checks.push({ name, pass });
    console.log(`${pass ? "✓" : "✗"} ${name}`);
  }

  await page.goto(`${BASE}/dashboard/agreements/new`, {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });
  await page.waitForSelector("#currency", { timeout: 120000 });

  check(
    "Currency dropdown default INR",
    (await page.locator("#currency").inputValue()) === "INR",
  );
  check(
    "Kill fee percent visible when ON",
    await page.locator("#killFeePercent").isVisible(),
  );
  check(
    "Late payment inputs visible when ON",
    await page.locator("#latePaymentDays").isVisible(),
  );
  check(
    "Approval section present",
    (await page.getByText("Approval & Acceptance", { exact: true }).count()) > 0,
  );
  check(
    "Termination notice field present",
    await page.locator("#terminationNoticeDays").isVisible(),
  );
  check(
    "Out-of-scope rate input visible when ON",
    await page.locator("#outOfScopeRate").isVisible(),
  );

  await page.locator("#killFeePercent").fill("40");
  await page.locator("#latePaymentDays").fill("10");
  await page.locator("#latePaymentInterest").fill("3");
  await page.locator("#terminationNoticeDays").fill("14");
  await page.locator("#reviewWindowDays").fill("7");
  await page.locator("#outOfScopeRate").fill("2500");
  await page.locator("#currency").selectOption("USD");

  const unique = Date.now();
  await page.locator("#clientName").fill("Phase3 QA Client");
  await page.locator("#clientCompany").fill("QA Co");
  await page.locator("#clientEmail").fill(`phase3-qa-${unique}@example.com`);
  await page.locator("#clientRepresentative").fill("QA Rep");
  await page.locator("#title").fill("Phase 3 Legal QA Agreement");
  await page.locator("#projectOverview").fill("Testing phase 3 legal fields.");
  await page
    .locator(
      '.agreement-doc-section:has-text("Scope of Work") input[placeholder="Task name"]',
    )
    .first()
    .fill("Design");
  await page
    .locator(
      '.agreement-doc-section:has-text("Deliverables") input[placeholder="Deliverable name"]',
    )
    .first()
    .fill("Final files");
  await page.locator("#timeline").fill("Week 1");
  await page.locator("#fixedCost").fill("50000");
  await page.locator("#governingLaw").fill("Mumbai, Maharashtra, India");

  await page.getByRole("button", { name: "Create agreement" }).click();
  await page.waitForURL(/\/dashboard\/agreements\/[a-f0-9-]+$/, {
    timeout: 60000,
    waitUntil: "domcontentloaded",
  });
  check("Form submits with all new fields", true);

  let doc = await page.locator("body").textContent();
  check(
    "Kill fee 40% in document",
    doc?.includes("40% of total fee is retained") ?? false,
  );
  check(
    "Late payment 10 days 3% in document",
    doc?.includes("after 10 days attract 3%") ?? false,
  );
  check(
    "Portfolio rights in document",
    doc?.includes("portfolio, case studies") ?? false,
  );
  check(
    "Out-of-scope clause in document",
    doc?.includes("change order") ?? false,
  );
  check(
    "Approval section in document",
    doc?.includes("Approval & Acceptance") ?? false,
  );
  check(
    "Review window 7 days in document",
    doc?.includes("within 7 business days") ?? false,
  );
  check(
    "Limitation of liability in document",
    doc?.includes("total liability") ?? false,
  );
  check(
    "Termination 14 days in document",
    doc?.includes("14 days written notice") ?? false,
  );
  check(
    "Currency USD line in document",
    doc?.includes("All amounts in this agreement are in USD") ?? false,
  );
  check(
    "No hardcoded 7-day termination",
    !(doc?.includes("with 7 days written notice") ?? false),
  );

  const agreementId = page.url().split("/").pop()!;
  await page.goto(`${BASE}/dashboard/agreements/${agreementId}/edit`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector("#killFeePercent");
  check(
    "Edit mode loads kill fee percent",
    (await page.locator("#killFeePercent").inputValue()) === "40",
  );
  check(
    "Edit mode loads currency",
    (await page.locator("#currency").inputValue()) === "USD",
  );
  check(
    "Edit mode loads review window",
    (await page.locator("#reviewWindowDays").inputValue()) === "7",
  );

  await page.goto(`${BASE}/dashboard/agreements/new`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector("#killFee");
  await page.locator("#killFee").click();
  await page.locator("#latePaymentClause").click();
  await page.waitForTimeout(300);
  check(
    "Kill fee input hidden when OFF",
    (await page.locator("#killFeePercent").count()) === 0,
  );
  check(
    "Late payment inputs hidden when OFF",
    (await page.locator("#latePaymentDays").count()) === 0,
  );

  await page.locator("#clientName").fill("Toggle Off Client");
  await page.locator("#clientCompany").fill("QA Co");
  await page.locator("#clientEmail").fill(`toggle-off-${unique}@example.com`);
  await page.locator("#clientRepresentative").fill("Rep");
  await page.locator("#title").fill("Toggle Off Agreement");
  await page.locator("#projectOverview").fill("Kill fee and late payment off.");
  await page
    .locator(
      '.agreement-doc-section:has-text("Scope of Work") input[placeholder="Task name"]',
    )
    .first()
    .fill("Design");
  await page
    .locator(
      '.agreement-doc-section:has-text("Deliverables") input[placeholder="Deliverable name"]',
    )
    .first()
    .fill("Files");
  await page.locator("#timeline").fill("Week 1");
  await page.locator("#governingLaw").fill("Mumbai, Maharashtra, India");
  await page.getByRole("button", { name: "Create agreement" }).click();
  await page.waitForURL(/\/dashboard\/agreements\/[a-f0-9-]+$/, {
    timeout: 60000,
    waitUntil: "domcontentloaded",
  });

  doc = await page.locator("body").textContent();
  check(
    "Kill fee clause absent when OFF",
    !(doc?.includes("cancelled after kickoff") ?? false),
  );
  check(
    "Late payment clause absent when OFF",
    !(doc?.includes("monthly interest") ?? false),
  );

  await browser.close();
  check("No console errors", consoleErrors.length === 0);
  if (consoleErrors.length) console.error(consoleErrors);

  const failed = checks.filter((c) => !c.pass);
  if (failed.length) {
    console.error("\nFailed:");
    failed.forEach((f) => console.error(` - ${f.name}`));
    process.exit(1);
  }
  console.log(`\nAll ${checks.length} QA checks passed.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
