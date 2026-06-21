import { chromium } from "playwright";

const CATEGORIES = [
  { id: "product-design", label: "Product Design", firstTitle: "Anima" },
  { id: "branding", label: "Branding", firstTitle: "Vera Studio" },
  { id: "illustration", label: "Illustration", firstTitle: "Wildflower" },
  { id: "iconography", label: "Iconography", firstTitle: "Glyph Set" },
  { id: "graphics", label: "Graphics", firstTitle: "Signal & Noise" },
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.evaluate(() => sessionStorage.setItem("portfolio-loaded", "1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  await page.locator("#works").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);

  const stage = page.locator(".works-gallery__canvas-wrap");
  await stage.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  console.log("=== Category filter tests ===");

  for (const category of CATEGORIES) {
    const tab = page.locator(".works-gallery__category-tab", {
      hasText: category.label,
    });
    await tab.click();
    await page.waitForTimeout(700);

    const isActive = await tab.evaluate((el) => el.classList.contains("is-active"));
    const href = await page.locator(".works-gallery__case-link").getAttribute("href");
    const expectedHref = `/work/${category.firstTitle.toLowerCase().replace(/\s+/g, "-").replace(/&/g, "").replace("sign-noise", "signal-noise")}`;

    // Map titles to actual hrefs from data
    const hrefMap: Record<string, string> = {
      Anima: "/work/anima",
      "Vera Studio": "/work/vera",
      Wildflower: "/work/wildflower",
      "Glyph Set": "/work/glyph-set",
      "Signal & Noise": "/work/signal-noise",
    };

    const expected = hrefMap[category.firstTitle] ?? expectedHref;
    const pass = isActive && href === expected;
    console.log(
      `${pass ? "PASS" : "FAIL"} ${category.label}: active=${isActive}, href=${href}, expected=${expected}`,
    );
  }

  console.log("\n=== Arrow navigation tests ===");

  await page
    .locator(".works-gallery__category-tab", { hasText: "Product Design" })
    .click();
  await page.waitForTimeout(500);

  await stage.hover();
  await page.waitForTimeout(350);

  const arrowsVisible = await page
    .locator(".works-gallery__carousel-arrows")
    .evaluate((el) => {
      const style = getComputedStyle(el);
      return parseFloat(style.opacity) > 0.5;
    });
  console.log(`${arrowsVisible ? "PASS" : "FAIL"} arrows visible on hover`);

  const nextBtn = page.locator(".works-gallery__carousel-arrow--next");
  const prevBtn = page.locator(".works-gallery__carousel-arrow--prev");

  const href = await page.locator(".works-gallery__case-link").getAttribute("href");
  console.log("start href:", href);

  await nextBtn.click();
  await page.waitForTimeout(700);
  const hrefAfterNext = await page.locator(".works-gallery__case-link").getAttribute("href");
  const nextPass = hrefAfterNext !== href;
  console.log(`${nextPass ? "PASS" : "FAIL"} next arrow: ${href} -> ${hrefAfterNext}`);

  await prevBtn.click();
  await page.waitForTimeout(700);
  const hrefAfterPrev = await page.locator(".works-gallery__case-link").getAttribute("href");
  const prevPass = hrefAfterPrev === href;
  console.log(`${prevPass ? "PASS" : "FAIL"} prev arrow: ${hrefAfterNext} -> ${hrefAfterPrev}`);

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
