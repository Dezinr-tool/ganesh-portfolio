import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.evaluate(() => sessionStorage.setItem("portfolio-loaded", "1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  const samples = [
    { name: "value-works-mid", selector: ".section-bg-bridge--light-to-dark" },
    { name: "works-tools-mid", selector: ".section-bg-bridge--dark-to-light" },
  ];

  for (const { name, selector } of samples) {
    const bridge = page.locator(selector);
    const box = await bridge.boundingBox();
    if (!box) {
      console.log(name, "bridge not found");
      continue;
    }
    const centerY = box.y + box.height / 2 + (await page.evaluate(() => window.scrollY));
    await page.evaluate((y) => window.scrollTo(0, y - 450), centerY);
    await page.waitForTimeout(400);

    const bg = await page.evaluate(() => {
      const layer = document.querySelector(".scroll-bg-layer") as HTMLElement | null;
      return layer ? getComputedStyle(layer).backgroundColor : "missing";
    });
    const bridgeOpacity = await bridge.evaluate((el) => getComputedStyle(el).opacity);

    await page.screenshot({ path: `/tmp/section-bg-${name}.png` });
    console.log(name, { bg, bridgeOpacity, scrollY: await page.evaluate(() => window.scrollY) });
  }

  await browser.close();
}

main();
