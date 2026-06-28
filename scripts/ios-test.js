// @ts-check
const { chromium, webkit } = require("@playwright/test");
const path = require("path");
const fs = require("fs");

const BASE_URL = "http://localhost:3000";

const VIEWPORTS = [
  { name: "iphone-se-13mini", width: 375, height: 812 },
  { name: "iphone-14", width: 390, height: 844 },
  { name: "iphone-14plus", width: 430, height: 932 },
  { name: "ipad", width: 768, height: 1024 },
  { name: "android-s21", width: 360, height: 800 },
  { name: "android-pixel7", width: 412, height: 915 },
  { name: "desktop-1280", width: 1280, height: 800 },
  { name: "desktop-1440", width: 1440, height: 900 },
];

const SCROLL_STOPS = [
  { name: "hero", scrollY: 0 },
  { name: "about", scrollY: 900 },
  { name: "value-scroll", scrollY: 1800 },
  { name: "value-cards", scrollY: 2200 },
  { name: "tools", scrollY: 3200 },
  { name: "works", scrollY: 4200 },
  { name: "testimonials", scrollY: 5400 },
  { name: "footer", scrollY: 6500 },
];

async function run() {
  const outDir = path.join(__dirname, "../screenshots/ios");
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await webkit.launch({ headless: true });

  for (const vp of VIEWPORTS) {
    console.log(`\n📱 Testing ${vp.name} (${vp.width}x${vp.height})...`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.width <= 430 ? 3 : vp.width <= 768 ? 2 : 1,
      isMobile: vp.width <= 768,
      hasTouch: vp.width <= 768,
      userAgent:
        vp.width <= 768
          ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
          : undefined,
    });

    const page = await context.newPage();

    // Suppress console noise
    page.on("console", () => {});
    page.on("pageerror", (err) => console.error(`  ❌ JS error: ${err.message}`));

    await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 60000 });

    // Wait for Next.js dev-mode compilation and React hydration to complete.
    // The page is ready when Lenis adds its class to <html>.
    await page.waitForFunction(
      () =>
        document.documentElement.classList.contains("lenis") ||
        document.querySelector("[data-lenis-wrapper]") !== null ||
        // Fallback: wait until the Next.js loading indicator is gone
        !document.querySelector(".__next-loading-indicator"),
      { timeout: 30000 },
    ).catch(() => {});
    // Extra settle time for GSAP/Lenis to finish first frame
    await page.waitForTimeout(3000);

    for (const stop of SCROLL_STOPS) {
      // Use lenis.scrollTo if available (bypasses native scroll interception)
      await page.evaluate((y) => {
        const lenis = window.__lenis;
        if (lenis) {
          lenis.scrollTo(y, { immediate: true, force: true });
        } else {
          window.scrollTo(0, y);
        }
      }, stop.scrollY);
      await page.waitForTimeout(800);

      const fname = `${vp.name}__${stop.name}.png`;
      await page.screenshot({
        path: path.join(outDir, fname),
        clip: { x: 0, y: 0, width: vp.width, height: vp.height },
      });
      process.stdout.write(`  ✓ ${fname}\n`);
    }

    await context.close();
  }

  await browser.close();
  console.log("\n✅ Done — screenshots saved to screenshots/ios/");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
