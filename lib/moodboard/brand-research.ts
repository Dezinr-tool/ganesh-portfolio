import { scrapeWebsite } from "./scraper";
import type { WebsiteAnalysis } from "./types";

export type BrandResearchResult = {
  found: boolean;
  url?: string;
  analysis?: WebsiteAnalysis;
};

export async function researchBrandName(brandName: string): Promise<BrandResearchResult> {
  const slug = brandName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 40);

  if (!slug) return { found: false };

  const candidates = [
    `https://${slug}.com`,
    `https://www.${slug}.com`,
    `https://${slug}.io`,
    `https://${slug}.co`,
  ];

  for (const url of candidates) {
    try {
      const analysis = await scrapeWebsite(url);
      if (!analysis.fallback && analysis.title && analysis.title !== url) {
        return { found: true, url, analysis };
      }
    } catch {
      // try next candidate
    }
  }

  return { found: false };
}
