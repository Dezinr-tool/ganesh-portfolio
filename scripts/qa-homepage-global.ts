import { chromium } from "playwright";

const WORKS_DARK = "rgb(17, 17, 17)";
const WHITE = "rgb(255, 255, 255)";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.evaluate(() => sessionStorage.setItem("portfolio-loaded", "1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  const sections = [
    { name: "hero", selector: "#hero" },
    { name: "about", selector: "#about" },
    { name: "value-scroll", selector: ".value-scroll" },
    { name: "works", selector: "#works" },
    { name: "tools", selector: "#tools" },
    { name: "testimonials", selector: "#testimonials" },
  ];

  console.log("=== Section background audit ===");
  for (const { name, selector } of sections) {
    const bg = await page.locator(selector).evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        backgroundColor: style.backgroundColor,
        backgroundImage: style.backgroundImage,
      };
    });
    const isWorks = name === "works";
    const transparent =
      bg.backgroundColor === "rgba(0, 0, 0, 0)" || bg.backgroundColor === WHITE;
    const pass = isWorks ? bg.backgroundColor === WORKS_DARK : transparent;
    console.log(`${pass ? "PASS" : "FAIL"} ${name}:`, bg.backgroundColor);
  }

  const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  console.log(`${bodyBg === WHITE ? "PASS" : "FAIL"} body background:`, bodyBg);

  console.log("\n=== Parallax triggers ===");
  const triggers = await page.evaluate(() =>
    // @ts-expect-error gsap global in page context not available; use DOM check
    [...document.querySelectorAll("[data-parallax-child]")].slice(0, 3).map((el) => ({
      tag: el.tagName,
      opacity: getComputedStyle(el).opacity,
      transform: getComputedStyle(el).transform,
    })),
  );
  console.log("sample parallax children at load:", triggers);

  await page.locator("#about").scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);

  const aboutChild = await page.locator("#about [data-parallax-child]").first().evaluate((el) => ({
    opacity: getComputedStyle(el).opacity,
    transform: getComputedStyle(el).transform,
  }));
  console.log("about child after scroll into view:", aboutChild);

  await page.locator("#tools").scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);

  const toolRow = await page.locator("#tools [data-parallax-child]").first().evaluate((el) => ({
    opacity: getComputedStyle(el).opacity,
    transform: getComputedStyle(el).transform,
  }));
  console.log("tools row after scroll:", toolRow);

  await page.screenshot({ path: "/tmp/homepage-parallax-qa.png", fullPage: false });
  console.log("\nscreenshot saved");

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
