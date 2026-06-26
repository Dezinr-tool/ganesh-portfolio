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

  check("Document header renders", await page.locator(".agreement-doc-title").isVisible());
  check("Agreement Date field present", await page.locator("#agreementDate").isVisible());
  check("No Advance % field", (await page.locator("#advancePercent").count()) === 0);

  const todayIso = new Date().toISOString().slice(0, 10);
  check(
    "Agreement Date defaults to today",
    (await page.locator("#agreementDate").inputValue()) === todayIso,
  );

  await page.waitForSelector("#paymentStructure");
  await page.locator("#paymentStructure").selectOption({ value: "milestone" });
  await page.waitForSelector('input[placeholder="Milestone name"]', {
    state: "visible",
    timeout: 15000,
  });
  check(
    "Milestone rows visible when milestone selected",
    await page.getByPlaceholder("Milestone name").first().isVisible(),
  );
  await page.getByPlaceholder("Milestone name").first().fill("Wireframes");
  await page.getByPlaceholder("Amount (INR)").first().fill("50000");
  await page
    .getByPlaceholder('Due on (e.g. "On delivery of wireframes")')
    .first()
    .fill("On delivery of wireframes");

  await page.locator("#paymentStructure").selectOption("50_50");
  check(
    "Milestone rows hidden for non-milestone structure",
    (await page.getByPlaceholder("Milestone name").count()) === 0,
  );

  const trigger = page.getByRole("button", { name: /saved client/i });
  await trigger.click();
  await page.locator("#client-selector-search").waitFor({ state: "visible" });
  await page.locator("#client-selector-search").fill("Cove");
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: /Adit & Sanya/i }).first().click();
  await page.waitForTimeout(200);

  await page.locator("#clientPhone").fill("+91 98765 43210");
  await page.locator("#clientAddress").fill("123 MG Road, Bangalore");
  await page.locator("#gstNumber").fill("29ABCDE1234F1Z5");

  check(
    "Company auto-fills",
    (await page.locator("#clientCompany").inputValue()).includes("Cove & Lane"),
  );
  check(
    "Email auto-fills",
    (await page.locator("#clientEmail").inputValue()) === "adit@coveandlane.in",
  );

  await page.locator("#title").fill("Brand Identity & Website — Cove & Lane QA");
  await page.locator("#clientRepresentative").fill("Adit");
  await page
    .locator("#projectOverview")
    .fill("QA agreement for audit fixes validation.");

  const scopeTasks = ["Brand Strategy", "Logo Design"];
  for (let i = 0; i < scopeTasks.length; i++) {
    if (i > 0) {
      await page.getByRole("button", { name: "+ Add row" }).first().click();
    }
    await page
      .locator('.agreement-doc-section:has-text("Scope of Work") input[placeholder="Task name"]')
      .nth(i)
      .fill(scopeTasks[i]!);
  }

  const deliverables = [
    { priority: "P0", item: "Brand Guidelines" },
    { priority: "P1", item: "Logo Files" },
  ];
  for (let i = 0; i < deliverables.length; i++) {
    if (i > 0) {
      await page.getByRole("button", { name: "+ Add row" }).nth(1).click();
    }
    const section = page.locator('.agreement-doc-section:has-text("Deliverables")');
    await section.locator("select").nth(i).selectOption(deliverables[i]!.priority);
    await section
      .locator('input[placeholder="Deliverable name"]')
      .nth(i)
      .fill(deliverables[i]!.item);
  }

  await page.locator("#timeline").fill("Week 1-2: Discovery");
  await page.locator("#fixedCost").fill("180000");
  await page.locator("#revisionsIncluded").fill("2");
  await page.locator("#governingLaw").fill("Mumbai, Maharashtra, India");

  await page.getByRole("button", { name: "Create agreement" }).click();
  await page.waitForURL(/\/dashboard\/agreements\/[a-f0-9-]+$/, {
    timeout: 60000,
  });
  check("Form submits without errors (50_50)", true);

  const docText = await page.locator("body").textContent();
  check("Phone in document", docText?.includes("+91 98765 43210") ?? false);
  check("Address in document", docText?.includes("123 MG Road, Bangalore") ?? false);
  check("GST in document", docText?.includes("29ABCDE1234F1Z5") ?? false);
  check(
    "Payment structure text in document (not raw advance %)",
    docText?.includes("50% advance, 50% on delivery") ?? false,
  );
  check(
    "Agreement date in document header (not Created)",
    !(docText?.includes("Created ") ?? false),
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
