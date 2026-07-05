import type { MoodboardPresentationDirection } from "./db-types";
import { fetchReferencesForDirection } from "./reference-scraper";
import { unsplashUrl } from "./unsplash";

export async function enrichDirectionReferences(
  direction: MoodboardPresentationDirection,
  keywords: string[],
  selectedSections?: string[],
  context?: {
    industry?: string;
    projectType?: string;
    onStatus?: (message: string) => void;
  },
): Promise<void> {
  const sections = selectedSections ?? direction.selectedSections ?? [];
  const baseKeyword = keywords.join(" ") || direction.directionName || "modern design";

  if (sections.includes("ui_references") && direction.uiSection) {
    context?.onStatus?.("Gathering visual references…");

    const captions = direction.uiSection.references.map((r) => r.caption).filter(Boolean);
    let scraped: { url: string; caption: string }[] = [];

    try {
      const refs = await fetchReferencesForDirection({
        directionName: direction.directionName,
        moodKeywords: direction.moodKeywords ?? keywords,
        industry: context?.industry,
        projectType: context?.projectType,
        captions,
        limit: Math.max(direction.uiSection.references.length, 4),
      });
      scraped = refs.map((r) => ({ url: r.url, caption: r.caption }));
    } catch {
      /* fall through to unsplash */
    }

    direction.uiSection.references = direction.uiSection.references.map((ref, i) => {
      const scrapedRef = scraped[i];
      if (scrapedRef?.url.startsWith("http")) {
        return { ...ref, url: scrapedRef.url, caption: ref.caption || scrapedRef.caption };
      }
      if (ref.url.startsWith("http")) return ref;
      return {
        ...ref,
        url: unsplashUrl(`${baseKeyword} ui ${ref.caption}`, i),
      };
    });
  }

  if (sections.includes("illustration_style") && direction.illustrations) {
    direction.illustrations.references = direction.illustrations.references.map(
      (ref, i) => ({
        ...ref,
        url: ref.url.startsWith("http")
          ? ref.url
          : unsplashUrl(`${baseKeyword} illustration ${ref.caption}`, i + 10),
      }),
    );
  }

  if (sections.includes("typography") && direction.typography) {
    direction.typography.references = direction.typography.references.map((ref, i) => ({
      ...ref,
      url: ref.url.startsWith("http")
        ? ref.url
        : unsplashUrl(`${baseKeyword} typography ${ref.caption}`, i + 20),
    }));
  }

  if (sections.includes("photography_style") && direction.photography) {
    direction.photography.references = direction.photography.references.map((ref, i) => ({
      ...ref,
      url: ref.url.startsWith("http")
        ? ref.url
        : unsplashUrl(`${baseKeyword} photography ${ref.caption}`, i + 30),
    }));
  }

  if (sections.includes("product_images") && direction.productImages) {
    direction.productImages.references = direction.productImages.references.map(
      (ref, i) => ({
        ...ref,
        url: ref.url.startsWith("http")
          ? ref.url
          : unsplashUrl(`${baseKeyword} product ${ref.caption}`, i + 40),
      }),
    );
  }
}
