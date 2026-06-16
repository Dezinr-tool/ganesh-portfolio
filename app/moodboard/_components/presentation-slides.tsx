"use client";

import Image from "next/image";
import type { MoodboardPresentationDirection, MoodboardReferenceCard } from "@/lib/moodboard/db-types";

const PHONE_SLOTS = [
  { left: "4%", top: "2%", width: 112, height: 242 },
  { left: "27%", top: "0%", width: 110, height: 238 },
  { left: "50%", top: "1%", width: 108, height: 235 },
  { left: "72%", top: "1%", width: 106, height: 232 },
  { left: "10%", top: "52%", width: 110, height: 240 },
  { left: "33%", top: "53%", width: 108, height: 236 },
  { left: "55%", top: "52%", width: 106, height: 238 },
  { left: "76%", top: "51%", width: 104, height: 234 },
];

export function SlideShell({ children }: { children: React.ReactNode }) {
  return (
    <section className="presentation-slide border-b border-neutral-100">
      <div className="mx-auto max-w-[1824px]">{children}</div>
    </section>
  );
}

export function CoverSlide({ brandName }: { brandName: string }) {
  const date = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <SlideShell>
      <div className="flex min-h-[min(80vh,640px)] flex-col justify-between">
        <div className="h-24 w-24 rounded-2xl bg-neutral-100" aria-hidden />
        <h1 className="presentation-cover-title max-w-4xl">{brandName} Moodboard</h1>
        <div className="flex items-end justify-between text-sm text-neutral-500">
          <span>© Brucira</span>
          <span>{date}</span>
        </div>
      </div>
    </SlideShell>
  );
}

function VisualPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-[420px] items-center justify-center p-8 text-sm text-neutral-400">
      {label}
    </div>
  );
}

function PhoneScatter({ items }: { items: MoodboardReferenceCard[] }) {
  if (!items.length) return <VisualPlaceholder label="UI references" />;

  return (
    <div className="presentation-phone-scatter">
      {items.slice(0, PHONE_SLOTS.length).map((item, i) => {
        const slot = PHONE_SLOTS[i];
        if (!slot) return null;
        return (
          <div
            key={`${item.caption}-${i}`}
            className="presentation-phone-card"
            style={{
              left: slot.left,
              top: slot.top,
              width: slot.width,
              height: slot.height,
            }}
          >
            {item.url ? (
              <Image
                src={item.url}
                alt={item.caption}
                fill
                className="object-cover object-top"
                sizes="120px"
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-neutral-200 text-[10px] text-neutral-500">
                Ref
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MasonryGrid({ items }: { items: MoodboardReferenceCard[] }) {
  if (!items.length) return <VisualPlaceholder label="References" />;

  return (
    <div className="presentation-masonry">
      {items.map((item, i) => (
        <figure
          key={`${item.caption}-${i}`}
          className="presentation-masonry-item"
          style={{ gridRow: i % 3 === 0 ? "span 2" : undefined }}
        >
          {item.url ? (
            <div className="relative aspect-[4/3] w-full sm:aspect-auto sm:min-h-[140px]">
              <Image
                src={item.url}
                alt={item.caption}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center bg-neutral-200 text-xs text-neutral-500">
              Reference
            </div>
          )}
        </figure>
      ))}
    </div>
  );
}

export function PersonaSlide({ direction }: { direction: MoodboardPresentationDirection }) {
  const persona = direction.persona;
  if (!persona) return null;

  const about = [
    persona.name,
    persona.age ? `age ${persona.age}` : null,
    persona.occupation,
    persona.cityTier,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <SlideShell>
      <div className="flex flex-col gap-10 lg:flex-row lg:gap-14">
        <h2 className="presentation-title-xl shrink-0 lg:w-[239px]">
          Persona {direction.directionIndex}
        </h2>
        <p className="presentation-body-large max-w-4xl flex-1">{persona.description}</p>
      </div>

      <div className="mt-16 flex flex-col gap-8 border-t border-neutral-200 pt-10 sm:flex-row sm:gap-0">
        <div className="sm:flex-1 sm:pr-10">
          <p className="presentation-label">About</p>
          <p className="presentation-body-muted mt-3 max-w-md">{about}</p>
        </div>
        <div className="hidden w-px shrink-0 bg-neutral-200 sm:block" />
        <div className="sm:flex-1 sm:pl-10">
          <p className="presentation-label">Financials</p>
          <p className="presentation-body-muted mt-3 max-w-md">
            {persona.financials ?? "—"}
          </p>
        </div>
      </div>
    </SlideShell>
  );
}

export function TextBlockSlide({
  label,
  body,
}: {
  label: string;
  body: string;
}) {
  if (!body.trim()) return null;

  return (
    <SlideShell>
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-16">
        <h3 className="presentation-label shrink-0 lg:w-56">{label}</h3>
        <p className="presentation-body-large max-w-5xl flex-1 whitespace-pre-wrap">{body}</p>
      </div>
    </SlideShell>
  );
}

export function SplitSectionSlide({
  title,
  description,
  items,
  variant = "masonry",
}: {
  title: string;
  description?: string;
  items: MoodboardReferenceCard[];
  variant?: "masonry" | "phones";
}) {
  return (
    <SlideShell>
      <div className="flex flex-col gap-10 lg:flex-row lg:items-stretch lg:gap-14">
        <div className="flex w-full flex-col justify-between lg:w-[min(495px,38%)] lg:shrink-0">
          <h2 className="presentation-title-xl">{title}</h2>
          {description ? (
            <p className="presentation-body-muted mt-8 lg:mt-0">{description}</p>
          ) : null}
        </div>
        <div className="presentation-visual-panel min-h-[480px] flex-1">
          {variant === "phones" ? <PhoneScatter items={items} /> : <MasonryGrid items={items} />}
        </div>
      </div>
    </SlideShell>
  );
}

export function ColorPaletteSlide({
  title,
  colors,
}: {
  title: string;
  colors: NonNullable<MoodboardPresentationDirection["colorPalette"]>;
}) {
  return (
    <SlideShell>
      <div className="flex flex-col gap-10 lg:flex-row lg:gap-14">
        <div className="lg:w-[min(379px,32%)]">
          <h2 className="presentation-title-lg">{title}</h2>
        </div>
        <div className="presentation-visual-panel flex-1 p-8">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
            {colors.map((color) => (
              <div key={color.role} className="text-center">
                <div
                  className="presentation-color-swatch mx-auto border border-neutral-200"
                  style={{ backgroundColor: color.hex }}
                />
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-neutral-500">
                  {color.role}
                </p>
                <p className="text-sm text-neutral-800">{color.name}</p>
                <p className="font-mono text-xs text-neutral-400">{color.hex}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SlideShell>
  );
}

export function DirectionDeck({
  direction,
  selectedSections,
}: {
  direction: MoodboardPresentationDirection;
  selectedSections: string[];
}) {
  const sections = direction.selectedSections ?? selectedSections;
  const has = (key: string) => sections.length === 0 || sections.includes(key);

  const painPoints = direction.persona?.painPoints?.join(" ") ?? "";
  const brandStrategy = direction.persona?.brandStrategy ?? "";
  const toneBody = [
    direction.persona?.toneOfVoice,
    direction.persona?.toneExample ? `Example: ${direction.persona.toneExample}` : null,
  ]
    .filter(Boolean)
    .join(". ");

  const uiRefs = direction.uiSection?.references ?? [];
  const moodDescription = [
    direction.tagline,
    direction.moodKeywords?.length ? `Mood: ${direction.moodKeywords.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="border-t-4 border-black">
      {has("persona") && direction.persona ? <PersonaSlide direction={direction} /> : null}

      {has("persona") && painPoints ? (
        <TextBlockSlide label="Pain Points" body={painPoints} />
      ) : null}

      {has("persona") && brandStrategy ? (
        <TextBlockSlide label="Brand Strategy" body={brandStrategy} />
      ) : null}

      {has("persona") && toneBody ? (
        <TextBlockSlide label="Tone of Voice" body={toneBody} />
      ) : null}

      {has("ui_references") && (uiRefs.length > 0 || direction.directionName) ? (
        <SplitSectionSlide
          title={direction.directionName}
          description={moodDescription}
          items={uiRefs}
          variant="phones"
        />
      ) : null}

      {has("illustration_style") && direction.illustrations ? (
        <SplitSectionSlide
          title="Illustrations"
          description={direction.illustrations.styleDescription}
          items={direction.illustrations.references}
        />
      ) : null}

      {has("typography") && direction.typography ? (
        <SplitSectionSlide
          title="Typography"
          description={`${direction.typography.heading.font} for headings. ${direction.typography.body.font} for body. ${direction.typography.heading.rationale}`}
          items={direction.typography.references}
        />
      ) : null}

      {has("color_palette") && direction.colorPalette?.length ? (
        <ColorPaletteSlide title="Color Palette" colors={direction.colorPalette} />
      ) : null}

      {has("icon_library") && direction.iconography ? (
        <SplitSectionSlide
          title="Iconography"
          description={`${direction.iconography.style} · ${direction.iconography.strokeWeight} · ${direction.iconography.cornerStyle}`}
          items={direction.iconography.references}
        />
      ) : null}

      {has("micro_interactions") && direction.microInteractions ? (
        <SlideShell>
          <div className="flex flex-col gap-10 lg:flex-row lg:gap-14">
            <div className="lg:w-[min(379px,32%)]">
              <h2 className="presentation-title-lg">Micro-interactions</h2>
              <p className="presentation-body-muted mt-4">
                {direction.microInteractions.description}
              </p>
            </div>
            <div className="presentation-visual-panel flex-1 p-8">
              <ul className="presentation-body-muted list-disc space-y-3 pl-5">
                {direction.microInteractions.patterns.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          </div>
        </SlideShell>
      ) : null}

      {has("component_style") && direction.componentStyle ? (
        <SplitSectionSlide
          title="Component Style"
          description={direction.componentStyle.description}
          items={direction.componentStyle.references}
        />
      ) : null}

      {has("photography_style") && direction.photography ? (
        <SplitSectionSlide
          title="Photography"
          description={`${direction.photography.styleDescription} ${direction.photography.treatment}`}
          items={direction.photography.references}
        />
      ) : null}

      {has("product_images") && direction.productImages ? (
        <SplitSectionSlide
          title="Product Images"
          description={`${direction.productImages.styleDescription} ${direction.productImages.staging}`}
          items={direction.productImages.references}
        />
      ) : null}

      {has("video_motion") && direction.videoMotion ? (
        <SplitSectionSlide
          title="Video / Motion"
          description={direction.videoMotion.styleDescription}
          items={direction.videoMotion.references}
        />
      ) : null}

      {has("brand_voice") && direction.brandVoice ? (
        <SplitSectionSlide
          title="Brand Voice"
          description={direction.brandVoice.toneDescription}
          items={[]}
        />
      ) : null}

      {has("competitor_references") && direction.competitorReferences ? (
        <SplitSectionSlide
          title="Competitor References"
          description={direction.competitorReferences.description}
          items={direction.competitorReferences.references}
        />
      ) : null}

      {has("dos_donts") && direction.dosDonts ? (
        <SlideShell>
          <div className="grid gap-12 sm:grid-cols-2">
            <div>
              <h3 className="presentation-label">Do</h3>
              <ul className="presentation-body-muted mt-4 list-disc space-y-2 pl-5">
                {direction.dosDonts.dos.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="presentation-label">Don&apos;t</h3>
              <ul className="presentation-body-muted mt-4 list-disc space-y-2 pl-5">
                {direction.dosDonts.donts.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
          </div>
        </SlideShell>
      ) : null}
    </div>
  );
}
