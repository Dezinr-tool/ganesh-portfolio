import { expect, test } from "@playwright/test";

const VIEWPORTS = [
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "laptop", width: 1440, height: 900 },
  { name: "full-hd", width: 1920, height: 1080 },
  { name: "ultrawide", width: 2560, height: 1440 },
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("portfolio-loaded", "1"));
});

for (const vp of VIEWPORTS) {
  test(`snabbit hero video is full bleed and 16:9 on ${vp.name} @mobile`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("/work/snabbit", { waitUntil: "load" });

    const frame = page.locator(".case-study__hero-image--video");
    await expect(frame).toHaveCount(1);
    // Wait for the clip-path reveal to finish before measuring.
    await page.waitForTimeout(2600);

    const box = await frame.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, width: r.width, height: r.height };
    });
    const docWidth = await page.evaluate(() => document.documentElement.clientWidth);

    expect(Math.round(box.left)).toBe(0);
    expect(Math.round(box.right)).toBe(docWidth);
    expect(box.width / box.height).toBeCloseTo(16 / 9, 1);

    const video = frame.locator("video");
    const videoBox = await video.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { width: r.width, height: r.height };
    });
    expect(Math.round(videoBox.width)).toBe(Math.round(box.width));
    expect(Math.round(videoBox.height)).toBe(Math.round(box.height));
  });
}

test("hero video preloads fully and has a poster @mobile", async ({ page }) => {
  await page.goto("/work/snabbit", { waitUntil: "load" });
  const video = page.locator(".case-study__hero-video");
  await expect(video).toHaveAttribute("preload", "auto");
  await expect(video).toHaveAttribute("poster", /.+/);

  // readyState 4 = HAVE_ENOUGH_DATA, and the buffer reaches the end of the clip.
  await expect
    .poll(
      () =>
        video.evaluate((el: HTMLVideoElement) => {
          const end = el.buffered.length ? el.buffered.end(el.buffered.length - 1) : 0;
          return el.readyState === 4 && el.duration > 0 && end >= el.duration - 0.25;
        }),
      { timeout: 60_000 },
    )
    .toBe(true);
});

test("hero video does not add horizontal scroll @mobile", async ({ page }) => {
  await page.goto("/work/snabbit", { waitUntil: "load" });
  await page.waitForTimeout(2200);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
