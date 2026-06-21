/**
 * Side-by-side QA: capture works section at key scroll positions on reference vs local.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const OUT = path.join(process.cwd(), "tmp/works-qa");
const LOCAL = process.env.LOCAL_URL ?? "http://localhost:3000/#works";
const REF = "https://olhalazarieva.com/#works";
const POSITIONS = [0, 0.25, 0.5, 0.75, 1];

async function captureSite(
  page: import("playwright").Page,
  url: string,
  label: string,
) {
  const dir = path.join(OUT, label);
  fs.mkdirSync(dir, { recursive: true });

  await page.goto(url.replace(/#.*$/, "/"), {
    waitUntil: "networkidle",
    timeout: 90000,
  });

  if (label === "local") {
    await page.waitForFunction(
      () => !document.querySelector("[data-page-loader]"),
      { timeout: 30000 },
    ).catch(() => undefined);
    await page.waitForTimeout(1500);
  } else {
    await page.waitForTimeout(3000);
  }

  await page.evaluate(() => {
    const el = document.getElementById("works");
    if (el) el.scrollIntoView({ block: "start" });
  });
  await page.waitForTimeout(2000);

  const section = page.locator("#works");
  await section.waitFor({ state: "visible", timeout: 30000 });

  if (label === "local") {
    await page.waitForFunction(
      () => {
        const canvas = document.querySelector(
          ".works-gallery__canvas",
        ) as HTMLCanvasElement | null;
        return Boolean(canvas && canvas.width > 0 && canvas.height > 0);
      },
      { timeout: 30000 },
    );
    await page.waitForTimeout(800);
  } else {
    await page.locator(".projects-canvas canvas").first().waitFor({
      state: "visible",
      timeout: 30000,
    });
  }

  const metrics = await page.evaluate(() => {
    const el = document.getElementById("works");
    if (!el) return null;
    return {
      scrollStart: window.scrollY,
      scrollRange: el.offsetHeight - window.innerHeight,
    };
  });
  if (!metrics) throw new Error(`No #works metrics on ${label}`);

  const { scrollStart, scrollRange } = metrics;

  for (const t of POSITIONS) {
    const y = scrollStart + t * scrollRange;
    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
    await page.waitForTimeout(label === "local" ? 400 : 300);

    const pct = String(Math.round(t * 100)).padStart(3, "0");
    const target =
      label === "local"
        ? page.locator(".works-gallery__canvas").first()
        : page.locator(".projects-canvas canvas").first();

    if ((await target.count()) > 0) {
      await target.screenshot({
        path: path.join(dir, `scroll-${pct}.jpg`),
        type: "jpeg",
        quality: 90,
      });
    } else {
      await page.screenshot({
        path: path.join(dir, `scroll-${pct}-full.jpg`),
        type: "jpeg",
        quality: 90,
        clip: { x: 0, y: 0, width: 1440, height: 900 },
      });
    }

    console.log(`${label} @ ${pct}%`);
  }
}

async function main() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.addInitScript(() => {
    sessionStorage.setItem("portfolio-loaded", "1");
  });

  await captureSite(page, REF, "reference");
  await captureSite(page, LOCAL, "local");

  await browser.close();
  console.log(`QA screenshots → ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
