import { chromium } from "playwright";
import { mkdirSync } from "fs";

async function main() {
  mkdirSync("/tmp/value-scroll-qa", { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    sessionStorage.setItem("portfolio-loaded", "1");
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  const startY = await page.locator(".value-scroll").evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return rect.top + window.scrollY;
  });

  const captures = [
    { name: "01-text-visible", offset: 0 },
    { name: "02-card-rising", offset: 2000 },
    { name: "03-card-hits-text", offset: 2739 },
    { name: "04-scatter", offset: 3984 },
    { name: "05-cards-fan", offset: 4500 },
  ];

  for (const { name, offset } of captures) {
    await page.evaluate((y) => window.scrollTo(0, y), startY + offset);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `/tmp/value-scroll-qa/${name}.png` });
    console.log("captured", name, "at", startY + offset);
  }

  await browser.close();
}

main();
