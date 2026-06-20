/**
 * Debug production moodboard landing → chat
 */
import { chromium } from "playwright";

const BASE = process.env.QA_BASE_URL ?? "https://www.designbyganesh.com";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  const logs: string[] = [];
  page.on("console", (msg) => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on("pageerror", (err) => logs.push(`[pageerror] ${err.message}`));

  await page.goto(`${BASE}/moodboard`, { waitUntil: "networkidle", timeout: 60000 });

  const hero = await page.getByRole("heading", { name: /Great design starts/i }).isVisible();
  console.log("Hero visible:", hero);

  const composer = page.locator("textarea.moodboard-composer-textarea").first();
  await composer.fill("need a mood board for trublz");
  await composer.press("Enter");

  await page.waitForTimeout(3000);

  const chatTestId = await page.getByTestId("moodboard-chat").isVisible().catch(() => false);
  const heroAfter = await page.getByRole("heading", { name: /Great design starts/i }).isVisible().catch(() => false);
  const userBubble = await page.locator(".moodboard-user-bubble").count();
  const assistant = await page.locator(".moodboard-assistant-message").count();
  const thinking = await page.locator(".moodboard-thinking-dots").count();
  const errorText = await page.getByText(/Something went wrong/i).isVisible().catch(() => false);

  console.log("Chat testid visible:", chatTestId);
  console.log("Hero still visible:", heroAfter);
  console.log("User bubbles:", userBubble);
  console.log("Assistant messages:", assistant);
  console.log("Thinking dots:", thinking);
  console.log("Error message:", errorText);

  const html = await page.content();
  console.log("Has moodboard-chat in HTML:", html.includes("moodboard-chat"));
  console.log("Has moodboard-chat-shell:", html.includes("moodboard-chat-shell"));

  if (logs.length) {
    console.log("\nConsole:");
    logs.slice(0, 20).forEach((l) => console.log(l));
  }

  await browser.close();
}

main().catch(console.error);
