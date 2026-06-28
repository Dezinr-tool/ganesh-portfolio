import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  const section = page.locator(".value-scroll");
  const box = await section.boundingBox();
  if (!box) throw new Error("value-scroll not found");

  const startY = await section.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return rect.top + window.scrollY;
  });
  const steps = 24;
  const stepPx = Math.floor((box.height * 0.95) / steps);

  console.log("section height:", Math.round(box.height), "step:", stepPx);

  for (let i = 0; i <= steps; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), startY + stepPx * i);
    await page.waitForTimeout(120);

    const metrics = await page.evaluate(() => {
      const textContainer = document.querySelector(".vs-headline__stage");
      const firstCard = document.querySelector(".vs-arm.is-active");
      const firstMedia = document.querySelector(".vs-card");
      const chars = document.querySelectorAll(".vs-headline__char-inner");
      let visibleChars = 0;
      chars.forEach((el) => {
        const style = window.getComputedStyle(el);
        if (parseFloat(style.opacity) > 0.1) visibleChars++;
      });

      const textRect = textContainer?.getBoundingClientRect();
      const cardRect = firstMedia?.getBoundingClientRect();

      return {
        scrollY: Math.round(window.scrollY),
        textTop: textRect ? Math.round(textRect.top) : null,
        textOpacity: textContainer
          ? window.getComputedStyle(textContainer).opacity
          : null,
        cardOn: Boolean(firstCard),
        cardTop: cardRect ? Math.round(cardRect.top) : null,
        visibleChars,
        totalChars: chars.length,
      };
    });

    console.log(`step ${i}:`, JSON.stringify(metrics));
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
