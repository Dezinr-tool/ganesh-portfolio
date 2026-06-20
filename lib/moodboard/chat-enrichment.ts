import { researchBrandNameFast } from "./brand-research";
import { scrapeWebsite } from "./scraper";
import { hasStoredAnswer, normalizeAnswer } from "./question-flow";

export type MoodboardExtras = {
  websiteAnalysis?: string;
  brandResearch?: string;
  competitorResearch?: string;
  documentExtract?: string;
};

export type EnrichmentResult = {
  answers: Record<string, unknown>;
  extras: MoodboardExtras;
  researched: boolean;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatWebsiteAnalysis(
  analysis: Awaited<ReturnType<typeof scrapeWebsite>>,
): string {
  return `${analysis.title}: ${analysis.personality}. ${analysis.tone}. Colors: ${analysis.colors?.join(", ")}. ${analysis.description ?? ""}`.trim();
}

export function mergeStoredExtras(
  clientExtras: MoodboardExtras,
  answers: Record<string, unknown>,
): MoodboardExtras {
  const fromAnswers = answers._moodboard_extras;
  if (fromAnswers && typeof fromAnswers === "object") {
    return { ...(fromAnswers as MoodboardExtras), ...clientExtras };
  }
  return { ...clientExtras };
}

export function brandResearchAlreadyAttempted(
  extras: MoodboardExtras,
  answers: Record<string, unknown>,
): boolean {
  return (
    extras.brandResearch !== undefined ||
    answers._brand_research_attempted === true
  );
}

export async function enrichChatContext(
  answers: Record<string, unknown>,
  extras: MoodboardExtras,
  prevAnswers: Record<string, unknown>,
  options?: { maxWaitMs?: number },
): Promise<EnrichmentResult & { continuation: Promise<EnrichmentResult> }> {
  const maxWaitMs = options?.maxWaitMs ?? 1500;
  let nextAnswers = { ...answers };
  let nextExtras = { ...extras };
  let researched = false;

  const prevUrl = normalizeAnswer(prevAnswers.q4a);
  const newUrl = normalizeAnswer(nextAnswers.q4a);
  const shouldScrapeUrl = Boolean(
    newUrl && (newUrl !== prevUrl || !nextExtras.websiteAnalysis),
  );

  const shouldResearchBrand =
    hasStoredAnswer(nextAnswers.q1, "q1") &&
    hasStoredAnswer(nextAnswers.q2, "q2") &&
    !brandResearchAlreadyAttempted(nextExtras, nextAnswers);

  if (!shouldScrapeUrl && !shouldResearchBrand) {
    const empty = { answers: nextAnswers, extras: nextExtras, researched };
    return { ...empty, continuation: Promise.resolve(empty) };
  }

  const continuation = (async (): Promise<EnrichmentResult> => {
    if (shouldScrapeUrl && newUrl) {
      try {
        const analysis = await scrapeWebsite(newUrl);
        nextExtras = {
          ...nextExtras,
          websiteAnalysis: formatWebsiteAnalysis(analysis),
        };
        researched = true;
        if (!hasStoredAnswer(nextAnswers.q2, "q2")) {
          nextAnswers = {
            ...nextAnswers,
            q2: `${analysis.title}. ${analysis.description || analysis.personality}. ${analysis.tone}`,
          };
        }
      } catch {
        /* optional */
      }
    }

    if (shouldResearchBrand) {
      nextAnswers = { ...nextAnswers, _brand_research_attempted: true };
      try {
        const result = await researchBrandNameFast(String(nextAnswers.q1));
        if (result.analysis) {
          nextExtras = {
            ...nextExtras,
            brandResearch: formatWebsiteAnalysis(result.analysis),
          };
          researched = true;
        }
      } catch {
        /* optional */
      }
    }

    return { answers: nextAnswers, extras: nextExtras, researched };
  })();

  await Promise.race([continuation, sleep(maxWaitMs)]);

  return {
    answers: nextAnswers,
    extras: nextExtras,
    researched,
    continuation,
  };
}
