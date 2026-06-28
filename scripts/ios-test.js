// @ts-check
// Uses Chromium with iPhone emulation — matches the user's actual browser
// (Chrome on iOS uses the same CSS/JS behavior as Chrome desktop emulation)
const { chromium } = require("@playwright/test");
const path = require("path");
const fs = require("fs");

const BASE_URL = "http://localhost:3000";

const DEVICES = [
  { name: "iphone-se-13mini", width: 375, height: 812, dpr: 3 },
  { name: "iphone-14", width: 390, height: 844, dpr: 3 },
  { name: "iphone-14plus", width: 430, height: 932, dpr: 3 },
  { name: "ipad", width: 768, height: 1024, dpr: 2 },
  { name: "android-s21", width: 360, height: 800, dpr: 3 },
  { name: "android-pixel7", width: 412, height: 915, dpr: 2.625 },
  { name: "desktop-1280", width: 1280, height: 800, dpr: 1 },
  { name: "desktop-1440", width: 1440, height: 900, dpr: 1 },
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

  const browser = await chromium.launch({ headless: true });

  for (const vp of DEVICES) {
    const isMobile = vp.width <= 768;
    console.log(`\n📱 Testing ${vp.name} (${vp.width}x${vp.height})...`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.dpr,
      isMobile,
      hasTouch: isMobile,
      userAgent: isMobile
        ? "Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
        : undefined,
    });

    // Skip the intro page loader — it takes ~9s and hides all body content.
    // The loader skips itself when sessionStorage["portfolio-loaded"] === "1".
    await context.addInitScript(() => {
      sessionStorage.setItem("portfolio-loaded", "1");
    });

    const page = await context.newPage();
    page.on("pageerror", (err) =>
      console.error(`  ❌ JS error: ${err.message.slice(0, 120)}`),
    );

    await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 60000 });

    // Wait for Lenis to initialize (it adds its class to <html>)
    await page
      .waitForFunction(() => window.__lenis != null, { timeout: 15000 })
      .catch(() => console.log("  ⚠ Lenis not detected, proceeding anyway"));

    // Let GSAP/Lenis settle after load
    await page.waitForTimeout(2000);

    // Diagnostic — printed once per viewport
    const diag = await page.evaluate(() => ({
      windowScrollY: window.scrollY,
      htmlOverflow: getComputedStyle(document.documentElement).overflow,
      pageHeight: document.body.scrollHeight,
      lenisScroll: window.__lenis?.scroll,
      lenisTarget: window.__lenis?.targetScroll,
      htmlClass: document.documentElement.className.slice(0, 80),
    }));
    console.log("  diag:", JSON.stringify(diag));

    for (const stop of SCROLL_STOPS) {
      await page.evaluate((y) => {
        const lenis = window.__lenis;
        if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
        else window.scrollTo(0, y);
      }, stop.scrollY);
      await page.waitForTimeout(500);

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
