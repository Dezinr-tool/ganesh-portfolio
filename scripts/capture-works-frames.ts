/**
 * Captures scroll-driven frames from olhalazarieva.com #works — one sequence per project slide.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const OUT_DIR = path.join(process.cwd(), "public/works-sequence");
const FRAME_COUNT = 120;
const PROJECT_COUNT = 6;
const REF_URL = "https://olhalazarieva.com/";

async function swipeProject(page: import("playwright").Page, times: number) {
  const canvas = page.locator(".projects-canvas canvas").first();
  await canvas.waitFor({ state: "visible", timeout: 30000 });
  const box = await canvas.boundingBox();
  if (!box) return;

  for (let i = 0; i < times; i++) {
    const startX = box.x + box.width * 0.7;
    const endX = box.x + box.width * 0.3;
    const y = box.y + box.height * 0.5;
    await page.mouse.move(startX, y);
    await page.mouse.down();
    await page.mouse.move(endX, y, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(700);
  }
}

async function scrollToWorks(page: import("playwright").Page) {
  await page.goto(REF_URL, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(4000);
  await page.evaluate(() => {
    const el = document.getElementById("works");
    if (el) el.scrollIntoView({ block: "start" });
  });
  await page.waitForTimeout(2000);
  await page.locator("#works").waitFor({ state: "visible", timeout: 30000 });
  await page.locator(".projects-canvas canvas").first().waitFor({
    state: "visible",
    timeout: 30000,
  });
}

async function main() {
  const startProject = Number(process.env.START_PROJECT ?? 0);
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });

  await scrollToWorks(page);

  for (let projectIndex = startProject; projectIndex < PROJECT_COUNT; projectIndex++) {
    const projectDir = path.join(OUT_DIR, `p${projectIndex}`);
    fs.mkdirSync(projectDir, { recursive: true });

    if (projectIndex > startProject) {
      await swipeProject(page, 1);
      await page.waitForTimeout(800);
    } else if (projectIndex > 0) {
      await swipeProject(page, projectIndex);
      await page.waitForTimeout(800);
    }

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await scrollToWorks(page);

    const box = await page.locator("#works").boundingBox();
    if (!box) throw new Error("Could not find #works bounding box");

    const scrollStart = box.y;
    const scrollEnd = scrollStart + box.height - 900;

    console.log(`Project ${projectIndex}: scroll ${scrollStart} → ${scrollEnd}`);

    for (let i = 0; i < FRAME_COUNT; i++) {
      const t = i / (FRAME_COUNT - 1);
      const y = scrollStart + t * (scrollEnd - scrollStart);
      await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
      await page.waitForTimeout(100);

      const canvas = page.locator(".projects-canvas canvas").first();
      const frameNum = String(i + 1).padStart(3, "0");
      const outPath = path.join(projectDir, `frame_${frameNum}.jpg`);
      await canvas.screenshot({ path: outPath, type: "jpeg", quality: 88 });

      if (i % 30 === 0) console.log(`  p${projectIndex} frame ${frameNum}`);
    }
  }

  const defaultDir = path.join(OUT_DIR, "p0");
  if (fs.existsSync(defaultDir)) {
    for (let i = 1; i <= FRAME_COUNT; i++) {
      const frameNum = String(i).padStart(3, "0");
      fs.copyFileSync(
        path.join(defaultDir, `frame_${frameNum}.jpg`),
        path.join(OUT_DIR, `frame_${frameNum}.jpg`),
      );
    }
  }

  console.log(`Done — sequences in ${OUT_DIR}`);
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
