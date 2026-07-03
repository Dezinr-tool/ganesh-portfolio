/**
 * Export the designed PhonePe proposal page to PDF.
 * Requires dev server: npm run dev
 * Usage: npx tsx scripts/export-phonepe-proposal-pdf.ts
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE_URL = process.env.PROPOSAL_URL ?? "http://localhost:3000/phonepe-proposal";
const OUT_DIR = path.join(process.cwd(), "public/downloads");
const OUT_FILE = path.join(OUT_DIR, "phonepe-brand-consistency-capabilities-response.pdf");

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 120_000 });
    await page.waitForSelector(".phonepe-proposal-md", { timeout: 60_000 });

    // Wait for fonts and markdown render
    await page.waitForTimeout(1500);

    await page.emulateMedia({ media: "print" });

    await page.pdf({
      path: OUT_FILE,
      format: "A4",
      printBackground: true,
      margin: { top: "12mm", bottom: "14mm", left: "12mm", right: "12mm" },
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: `
        <div style="width:100%;font-size:8px;color:#666;padding:0 12mm;font-family:system-ui,sans-serif;">
          <span>Brucira × PhonePe · Confidential · July 2026</span>
          <span style="float:right"><span class="pageNumber"></span> / <span class="totalPages"></span></span>
        </div>
      `,
    });

    const stat = fs.statSync(OUT_FILE);
    console.log(`PDF saved: ${OUT_FILE} (${(stat.size / 1024).toFixed(1)} KB)`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
