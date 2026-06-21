import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.evaluate(() => sessionStorage.setItem("portfolio-loaded", "1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("#works").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  await page.locator(".works-gallery__canvas-wrap").hover();
  await page.waitForTimeout(300);
  await page.screenshot({ path: "/tmp/works-carousel-qa.png" });
  await browser.close();
  console.log("screenshot saved");
}

main();
