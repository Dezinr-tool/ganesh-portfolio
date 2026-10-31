import { expect, test } from "@playwright/test";
import { difference, sampleGradient, usesSoftwareGl } from "./hero-gradient-helpers";

// Headless Chromium falls back to a software renderer unless told otherwise.
test.use({
  launchOptions: {
    args: process.platform === "darwin" ? ["--use-angle=metal", "--ignore-gpu-blocklist"] : [],
  },
});

test("moving the cursor reshapes the gradient more than time does", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("portfolio-loaded", "1"));
  await page.goto("/", { waitUntil: "load" });
  await page.waitForFunction(() => document.querySelector("#hero canvas")?.getAttribute("data-flow-ready") === "true");
  test.skip(await usesSoftwareGl(page), "software GL is slow enough that the gradient stops animating");

  const size = page.viewportSize()!;
  await page.mouse.move(size.width * 0.1, size.height * 0.1);
  await page.waitForTimeout(1500);

  const first = await sampleGradient(page);
  await page.waitForTimeout(800);
  const afterWaiting = await sampleGradient(page);
  await page.mouse.move(size.width * 0.9, size.height * 0.9);
  await page.waitForTimeout(800);
  const afterMoving = await sampleGradient(page);

  expect(difference(afterWaiting, afterMoving)).toBeGreaterThan(difference(first, afterWaiting) * 1.5);
});
