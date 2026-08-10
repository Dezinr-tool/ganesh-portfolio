import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const logs: string[] = [];
  page.on("console", (m) => logs.push(`[${m.type()}] ${m.text()}`));

  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);

  const info = await page.evaluate(() => {
    const hero = document.querySelector("#hero");
    const children = hero
      ? Array.from(hero.children).map((c) => ({
          tag: c.tagName,
          cls: (c as HTMLElement).className,
          w: (c as HTMLElement).offsetWidth,
          h: (c as HTMLElement).offsetHeight,
          childCount: c.childNodes.length,
        }))
      : [];
    return {
      reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      heroW: hero?.clientWidth,
      heroH: hero?.clientHeight,
      canvasCount: document.querySelectorAll("#hero canvas").length,
      children,
    };
  });

  console.log(JSON.stringify(info, null, 2));
  console.log(
    "RELEVANT LOGS:\n",
    logs.filter((l) => /hero|fluid|webgl|shader|warn|error/i.test(l)).join("\n") || "(none)",
  );
  await browser.close();
}

main();
