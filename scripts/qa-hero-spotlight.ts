import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.evaluate(() => sessionStorage.setItem("portfolio-loaded", "1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1200);

  const spotlight = page.locator(".hero-photo-spotlight");
  await spotlight.waitFor({ state: "visible" });

  const idle = await spotlight.evaluate((el) => {
    const gray = el.querySelector(".hero-photo-grayscale");
    return {
      grayscaleFilter: gray ? getComputedStyle(gray).filter : null,
      radius: getComputedStyle(el).getPropertyValue("--spotlight-radius").trim(),
      active: el.classList.contains("is-spotlight-active"),
    };
  });
  console.log("idle:", idle);
  console.log(`${idle.grayscaleFilter?.includes("grayscale") ? "PASS" : "FAIL"} grayscale at rest`);
  console.log(`${idle.radius === "0px" ? "PASS" : "FAIL"} radius zero at rest`);

  const box = await spotlight.boundingBox();
  if (!box) throw new Error("spotlight box missing");

  const centerX = box.x + box.width * 0.5;
  const centerY = box.y + box.height * 0.45;

  await page.mouse.move(centerX - 200, centerY);
  await page.waitForTimeout(120);
  await page.mouse.move(centerX, centerY, { steps: 12 });
  await page.waitForTimeout(450);

  const hovered = await spotlight.evaluate((el) => ({
    radius: getComputedStyle(el).getPropertyValue("--spotlight-radius").trim(),
    x: getComputedStyle(el).getPropertyValue("--spotlight-x").trim(),
    y: getComputedStyle(el).getPropertyValue("--spotlight-y").trim(),
    active: el.classList.contains("is-spotlight-active"),
  }));
  console.log("hover center:", hovered);
  console.log(`${hovered.active ? "PASS" : "FAIL"} active on hover`);
  console.log(`${parseFloat(hovered.radius) >= 100 ? "PASS" : "FAIL"} radius expanded`);

  await page.mouse.move(centerX + 180, centerY - 120, { steps: 10 });
  await page.waitForTimeout(400);

  const moved = await spotlight.evaluate((el) => ({
    x: getComputedStyle(el).getPropertyValue("--spotlight-x").trim(),
    y: getComputedStyle(el).getPropertyValue("--spotlight-y").trim(),
  }));
  console.log("after move:", moved);
  console.log(`${moved.x !== hovered.x || moved.y !== hovered.y ? "PASS" : "FAIL"} spotlight follows cursor`);

  await page.mouse.move(0, 0);
  await page.waitForTimeout(700);

  const left = await spotlight.evaluate((el) => ({
    radius: getComputedStyle(el).getPropertyValue("--spotlight-radius").trim(),
    active: el.classList.contains("is-spotlight-active"),
  }));
  console.log("after leave:", left);
  console.log(`${!left.active ? "PASS" : "FAIL"} inactive after leave`);
  console.log(`${left.radius === "0px" ? "PASS" : "FAIL"} radius reset after leave`);

  await page.screenshot({ path: "/tmp/hero-spotlight-qa.png" });

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
