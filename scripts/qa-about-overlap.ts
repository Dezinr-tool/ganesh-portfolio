import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.evaluate(() => sessionStorage.setItem("portfolio-loaded", "1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  const about = page.locator("#about");
  await about.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  const startY = await about.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return rect.top + window.scrollY;
  });

  const sectionHeight = (await about.boundingBox())?.height ?? 900;
  const pinDistance = sectionHeight * 2;

  const steps = 20;
  let overlapFailures = 0;
  let unrevealedWhileOverlap = 0;

  for (let i = 0; i <= steps; i++) {
    const y = startY + (pinDistance / steps) * i;
    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
    await page.waitForTimeout(120);

    const result = await page.evaluate(() => {
      const aboutEl = document.querySelector("#about");
      const valueContainer = document.querySelector(".vs-headline__stage");
      if (!aboutEl || !valueContainer) {
        return { overlap: false, grayChars: 0, aboutZ: 0, valueZ: 0, valueVisible: false };
      }

      const aboutRect = aboutEl.getBoundingClientRect();
      const valueRect = valueContainer.getBoundingClientRect();
      const aboutStyle = window.getComputedStyle(aboutEl);
      const valueStyle = window.getComputedStyle(valueContainer);

      const aboutZ = Number.parseInt(aboutStyle.zIndex, 10) || 0;
      const valueRoot = document.querySelector(".value-scroll");
      const valueRootZ = valueRoot
        ? Number.parseInt(window.getComputedStyle(valueRoot).zIndex, 10) || 0
        : 0;

      const verticalOverlap =
        valueRect.top < aboutRect.bottom && valueRect.bottom > aboutRect.top;
      const valueVisible = valueRect.top < window.innerHeight && valueRect.bottom > 0;

      const grayChars = [...document.querySelectorAll("#about .hero-reveal-copy__char")].filter(
        (el) => !el.classList.contains("is-lit"),
      ).length;

      const overlap =
        verticalOverlap &&
        valueVisible &&
        aboutRect.top < window.innerHeight * 0.95 &&
        aboutRect.bottom > window.innerHeight * 0.05;

      return { overlap, grayChars, aboutZ, valueZ: valueRootZ, valueVisible, valueTop: valueRect.top };
    });

    if (result.overlap && result.grayChars > 0) {
      overlapFailures++;
      unrevealedWhileOverlap = Math.max(unrevealedWhileOverlap, result.grayChars);
      console.log(`FAIL step ${i}: overlap with ${result.grayChars} unrevealed chars`, result);
    } else if (result.valueVisible && i % 5 === 0) {
      console.log(`step ${i}: value visible, gray=${result.grayChars}, aboutZ=${result.aboutZ}`);
    }
  }

  console.log("\n=== Overlap QA ===");
  console.log(`${overlapFailures === 0 ? "PASS" : "FAIL"} overlap while unrevealed (${overlapFailures} steps)`);
  if (overlapFailures > 0) {
    console.log(`Max unrevealed chars during overlap: ${unrevealedWhileOverlap}`);
  }

  await browser.close();
  if (overlapFailures > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
