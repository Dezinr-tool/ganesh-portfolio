/**
 * Quick intake QA: landing → chat transition with a short brand prompt
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { chromium } from "playwright";

const BASE = process.env.QA_BASE_URL ?? "http://localhost:3000";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  try {
    await page.goto(`${BASE}/moodboard`, { waitUntil: "networkidle" });
    const composer = page.locator("textarea.moodboard-composer-textarea").first();
    await composer.fill("need a mood board for trublz");
    await composer.press("Enter");

    const chat = page.getByTestId("moodboard-chat");
    await chat.waitFor({ state: "visible", timeout: 8000 });
    console.log("✅ Chat screen visible");

    await page.waitForFunction(
      () => {
        const bubbles = document.querySelectorAll(".moodboard-user-bubble");
        return bubbles.length > 0 && bubbles[bubbles.length - 1]?.textContent?.includes("trublz");
      },
      { timeout: 5000 },
    );
    console.log("✅ User message visible");

    await page.waitForFunction(
      () => {
        const assistant = document.querySelectorAll(".moodboard-assistant-message");
        const last = assistant[assistant.length - 1];
        return last && (last.textContent?.trim().length ?? 0) > 20;
      },
      { timeout: 30000 },
    );
    console.log("✅ Assistant reply received");
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});
