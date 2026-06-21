import { chromium } from "playwright";

const ACCENT = "rgb(255, 30, 0)";
const BLACK = "rgb(17, 17, 17)";
const GRAY = "rgb(204, 204, 204)";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.evaluate(() => sessionStorage.setItem("portfolio-loaded", "1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  const section = page.locator("#about");
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);

  const startY = await section.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return rect.top + window.scrollY;
  });

  const box = await section.boundingBox();
  const height = box?.height ?? 900;
  const steps = 16;
  const stepPx = Math.floor((height * 1.2) / steps);

  let accentCount = 0;
  let blurredUnrevealed = 0;
  let grayUnrevealed = 0;

  for (let i = 0; i <= steps; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), startY + stepPx * i);
    await page.waitForTimeout(150);

    const stats = await page.evaluate(
      ({ accent, black, gray }) => {
        const chars = [...document.querySelectorAll("#about .hero-reveal-copy__char")];
        let accentChars = 0;
        let blurred = 0;
        let grayCount = 0;
        let lit = 0;

        for (const el of chars) {
          const style = window.getComputedStyle(el);
          const color = style.color;
          const filter = style.filter;
          const isLit = el.classList.contains("is-lit");

          if (color === accent) accentChars++;
          if (!isLit && color === gray) grayCount++;
          if (!isLit && filter.includes("blur")) blurred++;
          if (isLit && color === black) lit++;
        }

        return { accentChars, blurred, gray: grayCount, lit, total: chars.length };
      },
      { accent: ACCENT, black: BLACK, gray: GRAY },
    );

    accentCount = Math.max(accentCount, stats.accentChars);
    blurredUnrevealed = Math.max(blurredUnrevealed, stats.blurred);
    grayUnrevealed = Math.max(grayUnrevealed, stats.gray);

    if (i % 4 === 0) {
      console.log(`step ${i}:`, stats);
    }
  }

  console.log("\n=== Summary ===");
  console.log(`${accentCount === 0 ? "PASS" : "FAIL"} accent-colored letters (max ${accentCount})`);
  console.log(`${blurredUnrevealed > 0 ? "PASS" : "FAIL"} blurred unrevealed letters (max ${blurredUnrevealed})`);
  console.log(`${grayUnrevealed > 0 ? "PASS" : "FAIL"} gray unrevealed letters (max ${grayUnrevealed})`);

  await page.evaluate((y) => window.scrollTo(0, y), startY + stepPx * 6);
  await page.waitForTimeout(200);
  await page.screenshot({ path: "/tmp/about-reveal-qa.png" });
  console.log("screenshot: /tmp/about-reveal-qa.png");

  await browser.close();

  if (accentCount > 0 || blurredUnrevealed === 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
