import type { MoodboardPresentationDirection } from "./db-types";

const UNSPLASH_PHOTOS = [
  "photo-1561070791-2526d30994b5",
  "photo-1558655146-d09347e92766",
  "photo-1555066931-4365d14bab8c",
  "photo-1512941937669-90a1b58e7e9c",
  "photo-1497366216548-37526070297c",
  "photo-1486406146926-c627a92ad1ab",
  "photo-1480714378408-67cf0d13bc1b",
  "photo-1550751827-4bd374c3f58b",
  "photo-1522071820081-009f0129c71c",
  "photo-1560448204-e02f11c3d0e2",
  "photo-1618005180814-d1db67ed6b6a",
  "photo-1529156069898-49953e39b3ac",
  "photo-1449824913935-59a10b8d2000",
  "photo-1524504388940-b1c1722653e1",
  "photo-1493663284031-b7e3aefcae8e",
  "photo-1586717791821-3f44a599b3c5",
  "photo-1552664730-d307ca884978",
  "photo-1677442136019-21780ecad995",
  "photo-1620712943543-bcc4688e7485",
  "photo-1558655146-9f40138ed237",
  "photo-1547658719-da2b51169166",
  "photo-1504384308090-c894fdcc538d",
  "photo-1460925895917-afdab827c52f",
  "photo-1551288049-bebda4e38f71",
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function unsplashUrl(query: string, index = 0): string {
  const photoId =
    UNSPLASH_PHOTOS[(hashString(query) + index) % UNSPLASH_PHOTOS.length];
  return `https://images.unsplash.com/${photoId}?w=800&q=80&auto=format&fit=crop`;
}

export function buildReferenceCards(
  queries: string[],
  captions?: string[],
): { url: string; caption: string }[] {
  return queries.map((query, i) => ({
    url: unsplashUrl(query, i),
    caption: captions?.[i] ?? query,
  }));
}

export async function enrichDirectionImages(
  direction: MoodboardPresentationDirection,
  keywords: string[],
  selectedSections?: string[],
): Promise<void> {
  const baseKeyword = keywords.join(" ") || "modern design";
  const sections = selectedSections ?? direction.selectedSections ?? [];

  if (sections.includes("ui_references") && direction.uiSection) {
    direction.uiSection.references = direction.uiSection.references.map(
      (ref, i) => ({
        ...ref,
        url: ref.url.startsWith("http")
          ? ref.url
          : unsplashUrl(`${baseKeyword} ui ${ref.caption}`, i),
      }),
    );
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
    direction.typography.references = direction.typography.references.map(
      (ref, i) => ({
        ...ref,
        url: ref.url.startsWith("http")
          ? ref.url
          : unsplashUrl(`${baseKeyword} typography ${ref.caption}`, i + 20),
      }),
    );
  }

  if (sections.includes("photography_style") && direction.photography) {
    direction.photography.references = direction.photography.references.map(
      (ref, i) => ({
        ...ref,
        url: ref.url.startsWith("http")
          ? ref.url
          : unsplashUrl(`${baseKeyword} photography ${ref.caption}`, i + 30),
      }),
    );
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
