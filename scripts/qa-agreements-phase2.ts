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
  if (!password) {
    throw new Error("DASHBOARD_PASSWORD missing from .env.local");
  }

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
  await page.waitForSelector(".agreement-doc-title", { timeout: 120000 });

  const bodyText = await page.locator("body").textContent();
  check(
    "Scope section label and helper text",
    bodyText?.includes("Scope of Work (What we will do)") &&
      bodyText?.includes("List the high-level work areas and effort") === true,
  );
  check(
    "Deliverables section label and helper text",
    bodyText?.includes("Deliverables (What you will receive)") &&
      bodyText?.includes("List the specific files/outputs the client receives") ===
        true,
  );

  await page.locator("#title").fill("Adit & Sanya — Design Project");
  await page.locator("#clientName").fill("Adit & Sanya");
  await page.locator("#clientCompany").fill("Cove & Lane");
  await page.locator("#clientEmail").fill("adit@coveandlane.in");
  await page.locator("#clientPhone").fill("+91 98765 43210");

  check(
    "Client name field visible",
    (await page.locator("#clientName").count()) === 1,
  );
  check(
    "Company field visible",
    (await page.locator("#clientCompany").count()) === 1,
  );

  await page.locator("#clientRepresentative").fill("Adit");
  await page
    .locator("#projectOverview")
    .fill("Phase 2 QA agreement without scope hours.");

  await page
    .locator(
      '.agreement-doc-section:has-text("Scope of Work") input[placeholder="Task name"]',
    )
    .first()
    .fill("Brand Strategy");
  await page
    .locator(
      '.agreement-doc-section:has-text("Scope of Work") input[aria-label="Est. Hours (optional)"]',
    )
    .first()
    .fill("");

  const section = page.locator(
    '.agreement-doc-section:has-text("Deliverables")',
  );
  await section.locator('input[placeholder="Deliverable name"]').first().fill("Logo Files");

  await page.locator("#timeline").fill("Week 1-2");
  await page.locator("#fixedCost").fill("100000");
  await page.locator("#governingLaw").fill("Mumbai, Maharashtra, India");

  await page.getByRole("button", { name: "Create agreement" }).click();
  await page.waitForURL(/\/dashboard\/agreements\/[a-f0-9-]+$/, {
    timeout: 60000,
  });
  check("Form submits without scope hours", true);

  const docText = await page.locator("body").textContent();
  check(
    "Document scope renders without hours column when all null",
    (docText?.includes("Brand Strategy") &&
      !docText?.includes("Est. Hours (optional)")) ??
      false,
  );
  check(
    "Client name saved in document",
    docText?.includes("Adit & Sanya") ?? false,
  );

  await browser.close();

  check("No console errors", consoleErrors.length === 0);
  if (consoleErrors.length > 0) {
    console.error("Console errors:", consoleErrors);
  }

  const failed = checks.filter((item) => !item.pass);
  if (failed.length > 0) {
    console.error("\nFailed checks:");
    for (const item of failed) console.error(` - ${item.name}`);
    process.exit(1);
  }

  console.log(`\nAll ${checks.length} QA checks passed.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
