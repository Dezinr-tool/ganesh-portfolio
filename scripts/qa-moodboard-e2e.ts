/**
 * Moodboard intake → sections picker → generation E2E QA (Playwright)
 * Usage: npx tsx scripts/qa-moodboard-e2e.ts
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { chromium, type Page } from "playwright";

const BASE = process.env.QA_BASE_URL ?? "http://localhost:3000";
const SKIP_GENERATION = process.env.QA_SKIP_GENERATION === "1";

type Check = { name: string; pass: boolean; note?: string };
const checks: Check[] = [];

function log(name: string, pass: boolean, note?: string) {
  checks.push({ name, pass, note });
  console.log(`${pass ? "✅" : "❌"} ${name}${note ? ` — ${note}` : ""}`);
}

async function waitForComposer(page: Page) {
  return page.locator("textarea.moodboard-composer-textarea").first();
}

async function sendChat(page: Page, text: string) {
  const composer = await waitForComposer(page);
  await composer.fill(text);
  await composer.press("Enter");
}

async function main() {
  console.log("\n=== Moodboard E2E QA ===\n");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  try {
    await page.goto(`${BASE}/moodboard`, { waitUntil: "networkidle", timeout: 30000 });
    log("Page loads /moodboard", page.url().includes("/moodboard"));

    const heading = page.getByRole("heading", {
      name: /Great design starts with personality/i,
    });
    log("Landing hero visible", await heading.isVisible());

    const opening =
      "Astro — premium Shopify store for astrology gems. Audience: 35–50 premium buyers. Feel: premium, celestial, editorial. Color: open.";
    await sendChat(page, opening);

    await page.waitForTimeout(500);
    log(
      "Conversation started after landing submit",
      !(await heading.isVisible().catch(() => false)),
    );

    // Intake replies — enough context for sections phase
    const intakeReplies = [
      "New brand from scratch",
      "Website redesign for Shopify",
      "Premium, mystical, editorial — dark luxury with gold accents",
      "No strict constraints, open to bold directions",
    ];

    for (const reply of intakeReplies) {
      await page.waitForTimeout(1500);
      const composer = await waitForComposer(page);
      if (!(await composer.isVisible())) break;
      await sendChat(page, reply);
    }

    // Force sections picker via panel-help shortcut (mirrors user bug report)
    await page.waitForTimeout(2000);
    await sendChat(page, "i cant see panel");

    const picker = page.getByTestId("moodboard-sections-picker");
    await picker.waitFor({ state: "visible", timeout: 15000 }).catch(() => null);
    const pickerVisible = await picker.isVisible().catch(() => false);
    log("Sections picker visible (sticky above composer)", pickerVisible);

    if (pickerVisible) {
      const option = picker.getByRole("button", { name: /Color palette/i });
      log("Color palette option in picker", await option.isVisible().catch(() => false));
      await option.click().catch(() => null);

      const typography = picker.getByRole("button", { name: /Typography/i });
      await typography.click().catch(() => null);

      const generateBtn = picker.getByRole("button", {
        name: /Generate 3 directions/i,
      });
      log(
        "Generate button enabled after 2+ selections",
        await generateBtn.isEnabled().catch(() => false),
      );

      if (!SKIP_GENERATION && process.env.ANTHROPIC_API_KEY) {
        await generateBtn.click();
        log("Generate clicked", true);

        await page
          .waitForSelector(".presentation-deck, .moodboard-output-shell", {
            timeout: 180000,
          })
          .catch(() => null);

        const slides = await page.locator(".presentation-deck").isVisible().catch(() => false);
        log("Slide presentation rendered", slides);

        const pdfBtn = page.getByRole("button", { name: /^PDF —/i }).first();
        log("PDF export control in deck", await pdfBtn.isVisible().catch(() => false));
      } else {
        log("Full generation E2E", false, SKIP_GENERATION ? "QA_SKIP_GENERATION=1" : "No API key");
      }
    } else {
      // API fallback diagnosis
      const sessionId = await page.evaluate(() =>
        localStorage.getItem("moodboard-session-id"),
      );
      if (sessionId) {
        const chatRes = await fetch(`${BASE}/api/moodboard/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            modelId: "claude-sonnet",
            messages: [
              {
                role: "user",
                text: "Astro premium Shopify astrology gems audience 35-50",
              },
              {
                role: "assistant",
                text: "Pick moodboard elements in the selector above the input.",
              },
            ],
            answers: {
              q1: "Astro",
              q2: "Premium Shopify store for astrology gems",
              q3: "Website",
              q6: "35-50 premium buyers",
              q14: "premium, celestial, editorial",
            },
          }),
        });
        const chatData = await chatRes.json();
        log(
          "Chat API showSectionsPicker flag",
          chatData.showSectionsPicker === true,
          JSON.stringify({
            ready: chatData.readyToGenerate,
            show: chatData.showSectionsPicker,
          }),
        );
      }
      log("Full generation E2E", false, "Picker never appeared");
    }

    // UX checks (skip when presentation mode — composer is unmounted)
    const inPresentation = await page.locator(".presentation-deck").isVisible().catch(() => false);
    if (!inPresentation) {
      const composer = await waitForComposer(page);
      const composerBox = await composer.boundingBox();
      log(
        "Composer touch target height ≥44px",
        (composerBox?.height ?? 0) >= 44,
        composerBox ? `${Math.round(composerBox.height)}px` : "n/a",
      );
    } else {
      log("Composer touch target (skipped in presentation mode)", true);
    }

    if (pickerVisible) {
      const pickerBox = await picker.boundingBox();
      log(
        "Picker not clipped (width > 300px)",
        (pickerBox?.width ?? 0) > 300,
        pickerBox ? `${Math.round(pickerBox.width)}px wide` : "n/a",
      );
    }
  } catch (e) {
    log("E2E run", false, String(e));
  } finally {
    await browser.close();
  }

  console.log("\n=== SUMMARY ===");
  const pass = checks.filter((c) => c.pass).length;
  const fail = checks.filter((c) => !c.pass).length;
  console.log(`✅ ${pass}  ❌ ${fail}\n`);

  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
