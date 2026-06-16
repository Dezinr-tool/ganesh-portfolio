import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { chromium } from "playwright";

const BASE = process.env.QA_BASE_URL ?? "http://localhost:3000";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${BASE}/moodboard`, { waitUntil: "networkidle" });

  const composer = page.locator("textarea.moodboard-composer-textarea").first();
  await composer.fill(
    "Moodboard for Lumen — B2B SaaS analytics. Audience: data teams. Feel: trustworthy, modern. New brand website.",
  );
  await composer.press("Enter");

  for (const text of [
    "Trustworthy, data-forward, minimal with teal accent",
    "No constraints",
  ]) {
    await page.waitForTimeout(4000);
    const c = page.locator("textarea.moodboard-composer-textarea").first();
    await c.fill(text);
    await c.press("Enter");
  }

  await page.waitForTimeout(6000);
  const picker = await page.getByTestId("moodboard-sections-picker").isVisible().catch(() => false);
  const lastAssistant = await page.locator(".moodboard-assistant-message").last().textContent();
  console.log("Picker:", picker ? "✅ visible" : "❌ hidden");
  console.log("Last assistant snippet:", lastAssistant?.slice(0, 200));
  await browser.close();
}

main();
