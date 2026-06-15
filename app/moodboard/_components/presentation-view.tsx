"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import type { MoodboardPresentationDirection } from "@/lib/moodboard/db-types";
import { presentationToMarkdown } from "@/lib/moodboard/presentation-markdown";
import { SECTION_GENERATION_SPEC } from "@/lib/moodboard/output-sections";

function ReferenceGrid({
  items,
}: {
  items: { url: string; caption: string }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item, i) => (
        <figure key={`${item.caption}-${i}`} className="overflow-hidden rounded-lg border border-neutral-200">
          {item.url ? (
            <div className="relative aspect-[4/3] bg-neutral-100">
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
            <div className="flex aspect-[4/3] items-center justify-center bg-neutral-100 text-xs text-neutral-400">
              Reference
            </div>
          )}
          <figcaption className="px-2 py-1.5 text-xs text-neutral-600">{item.caption}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function hasSection(sections: string[], key: string) {
  return sections.length === 0 || sections.includes(key);
}

function DirectionSection({
  direction,
  selectedSections,
}: {
  direction: MoodboardPresentationDirection;
  selectedSections: string[];
}) {
  const sections = direction.selectedSections ?? selectedSections;

  return (
    <section className="border-b border-neutral-200 py-16 last:border-b-0">
      <div className="mb-12">
        <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">
          Direction {direction.directionIndex}
        </p>
        <h2 className="mt-2 font-serif text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
          {direction.directionName}
        </h2>
        <p className="mt-3 max-w-2xl text-lg text-neutral-600">{direction.tagline}</p>
      </div>

      {hasSection(sections, "persona") && direction.persona ? (
        <div className="mb-14">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-500">
            {SECTION_GENERATION_SPEC.persona.title}
          </h3>
          <div className="max-w-3xl space-y-4 text-neutral-700">
            <p className="text-xl font-medium text-neutral-900">{direction.persona.name}</p>
            <p className="text-sm text-neutral-500">
              {direction.persona.age} · {direction.persona.occupation} · {direction.persona.cityTier}
            </p>
            <p>{direction.persona.description}</p>
            {direction.persona.financials ? (
              <p className="text-sm italic text-neutral-500">{direction.persona.financials}</p>
            ) : null}
            <ul className="list-disc space-y-1 pl-5">
              {direction.persona.painPoints.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <p>
              <span className="font-medium">Brand strategy:</span> {direction.persona.brandStrategy}
            </p>
            <p>
              <span className="font-medium">Tone of voice:</span> {direction.persona.toneOfVoice}
            </p>
            <p className="text-neutral-500">&ldquo;{direction.persona.toneExample}&rdquo;</p>
          </div>
        </div>
      ) : null}

      {hasSection(sections, "brand_voice") && direction.brandVoice ? (
        <div className="mb-14">
          <h3 className="mb-4 text-2xl font-bold text-neutral-900">Brand Voice & Tone</h3>
          <p className="mb-4 max-w-3xl text-neutral-700">{direction.brandVoice.toneDescription}</p>
          <p className="text-sm text-neutral-600">
            {direction.brandVoice.adjectives.join(" · ")}
          </p>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-neutral-700">
            {direction.brandVoice.examplePhrases.map((p) => (
              <li key={p}>&ldquo;{p}&rdquo;</li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasSection(sections, "ui_references") && direction.uiSection ? (
        <div className="mb-14">
          <h3 className="mb-2 text-2xl font-bold text-neutral-900">{direction.uiSection.title}</h3>
          <p className="mb-4 max-w-3xl text-neutral-700">{direction.uiSection.description}</p>
          <ul className="mb-6 list-disc space-y-1 pl-5 text-neutral-700">
            {direction.uiSection.principles.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <ReferenceGrid items={direction.uiSection.references} />
        </div>
      ) : null}

      {hasSection(sections, "micro_interactions") && direction.microInteractions ? (
        <div className="mb-14">
          <h3 className="mb-4 text-2xl font-bold text-neutral-900">Micro-interactions & Motion</h3>
          <p className="mb-4 max-w-3xl text-neutral-700">{direction.microInteractions.description}</p>
          <ul className="list-disc space-y-2 pl-5 text-neutral-700">
            {direction.microInteractions.patterns.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasSection(sections, "component_style") && direction.componentStyle ? (
        <div className="mb-14">
          <h3 className="mb-4 text-2xl font-bold text-neutral-900">Component Style</h3>
          <p className="mb-4 max-w-3xl text-neutral-700">{direction.componentStyle.description}</p>
          <ul className="mb-6 list-disc space-y-1 pl-5 text-neutral-700">
            {direction.componentStyle.principles.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <ReferenceGrid items={direction.componentStyle.references} />
        </div>
      ) : null}

      {hasSection(sections, "illustration_style") && direction.illustrations ? (
        <div className="mb-14">
          <h3 className="mb-4 text-2xl font-bold text-neutral-900">Illustrations</h3>
          <p className="mb-6 max-w-3xl text-neutral-700">{direction.illustrations.styleDescription}</p>
          <ReferenceGrid items={direction.illustrations.references} />
        </div>
      ) : null}

      {hasSection(sections, "photography_style") && direction.photography ? (
        <div className="mb-14">
          <h3 className="mb-4 text-2xl font-bold text-neutral-900">Photography Style</h3>
          <p className="mb-4 max-w-3xl text-neutral-700">{direction.photography.styleDescription}</p>
          <p className="mb-4 text-sm text-neutral-600">{direction.photography.treatment}</p>
          <ReferenceGrid items={direction.photography.references} />
        </div>
      ) : null}

      {hasSection(sections, "product_images") && direction.productImages ? (
        <div className="mb-14">
          <h3 className="mb-4 text-2xl font-bold text-neutral-900">Product Images Direction</h3>
          <p className="mb-4 max-w-3xl text-neutral-700">{direction.productImages.styleDescription}</p>
          <p className="mb-4 text-sm text-neutral-600">{direction.productImages.staging}</p>
          <ReferenceGrid items={direction.productImages.references} />
        </div>
      ) : null}

      {hasSection(sections, "video_motion") && direction.videoMotion ? (
        <div className="mb-14">
          <h3 className="mb-4 text-2xl font-bold text-neutral-900">Video / Motion Graphics</h3>
          <p className="mb-4 max-w-3xl text-neutral-700">{direction.videoMotion.styleDescription}</p>
          <ul className="mb-6 list-disc space-y-1 pl-5 text-neutral-700">
            {direction.videoMotion.principles.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <ReferenceGrid items={direction.videoMotion.references} />
        </div>
      ) : null}

      {hasSection(sections, "typography") && direction.typography ? (
        <div className="mb-14">
          <h3 className="mb-4 text-2xl font-bold text-neutral-900">Typography</h3>
          <div className="mb-6 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wider text-neutral-400">Heading</p>
              <p className="mt-1 text-2xl font-bold" style={{ fontFamily: direction.typography.heading.font }}>
                {direction.typography.heading.font}
              </p>
              <p className="mt-2 text-sm text-neutral-600">{direction.typography.heading.rationale}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-neutral-400">Body</p>
              <p className="mt-1 text-lg" style={{ fontFamily: direction.typography.body.font }}>
                {direction.typography.body.font}
              </p>
              <p className="mt-2 text-sm text-neutral-600">{direction.typography.body.rationale}</p>
            </div>
          </div>
          <ReferenceGrid items={direction.typography.references} />
        </div>
      ) : null}

      {hasSection(sections, "icon_library") && direction.iconography ? (
        <div className="mb-14">
          <h3 className="mb-4 text-2xl font-bold text-neutral-900">Iconography</h3>
          <p className="mb-2 text-neutral-700">
            {direction.iconography.style} · {direction.iconography.strokeWeight} · {direction.iconography.cornerStyle}
          </p>
          <ReferenceGrid items={direction.iconography.references} />
        </div>
      ) : null}

      {hasSection(sections, "competitor_references") && direction.competitorReferences ? (
        <div className="mb-14">
          <h3 className="mb-4 text-2xl font-bold text-neutral-900">Competitor References</h3>
          <p className="mb-4 max-w-3xl text-neutral-700">{direction.competitorReferences.description}</p>
          <ReferenceGrid items={direction.competitorReferences.references} />
        </div>
      ) : null}

      {hasSection(sections, "dos_donts") && direction.dosDonts ? (
        <div className="mb-14 grid gap-8 sm:grid-cols-2">
          <div>
            <h3 className="mb-3 text-lg font-bold text-neutral-900">Do</h3>
            <ul className="list-disc space-y-1 pl-5 text-neutral-700">
              {direction.dosDonts.dos.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-lg font-bold text-neutral-900">Don&apos;t</h3>
            <ul className="list-disc space-y-1 pl-5 text-neutral-700">
              {direction.dosDonts.donts.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {hasSection(sections, "color_palette") && direction.colorPalette ? (
        <div className="mb-14">
          <h3 className="mb-6 text-2xl font-bold text-neutral-900">Color Palette</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {direction.colorPalette.map((color) => (
              <div key={color.role} className="text-center">
                <div
                  className="mx-auto mb-2 h-20 w-full max-w-[120px] rounded-xl border border-neutral-200 shadow-sm"
                  style={{ backgroundColor: color.hex }}
                />
                <p className="text-xs font-semibold text-neutral-800">{color.role}</p>
                <p className="text-sm text-neutral-700">{color.name}</p>
                <p className="font-mono text-xs text-neutral-500">{color.hex}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {direction.moodKeywords?.length ? (
        <p className="text-sm text-neutral-500">
          Mood: {direction.moodKeywords.join(" · ")}
        </p>
      ) : null}
    </section>
  );
}

export function PresentationView({
  directions,
  brandName,
  selectedOutputSections = [],
  onRefine,
}: {
  directions: MoodboardPresentationDirection[];
  brandName: string;
  selectedOutputSections?: string[];
  onRefine?: (directionId: string, note: string) => Promise<void>;
}) {
  const [copyMsg, setCopyMsg] = useState("");
  const [refineId, setRefineId] = useState<string | null>(null);
  const [refineNote, setRefineNote] = useState("");
  const [refining, setRefining] = useState(false);

  const handleCopy = async () => {
    const md = presentationToMarkdown(directions, brandName, selectedOutputSections);
    await navigator.clipboard.writeText(md);
    setCopyMsg("Copied markdown");
    setTimeout(() => setCopyMsg(""), 2000);
  };

  const handlePdf = async (direction: MoodboardPresentationDirection) => {
    const res = await fetch("/api/moodboard/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction, tab: "moodboard", presentation: true }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${direction.directionName.replace(/\s+/g, "-").toLowerCase()}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRefine = async () => {
    if (!refineId || !refineNote.trim() || !onRefine) return;
    setRefining(true);
    try {
      await onRefine(refineId, refineNote.trim());
      setRefineId(null);
      setRefineNote("");
    } finally {
      setRefining(false);
    }
  };

  return (
    <div className="bg-white text-neutral-900">
      <div className="border-b border-neutral-200 bg-white px-4 py-6 sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">Moodboard</p>
            <h2 className="text-2xl font-bold text-neutral-900">{brandName}</h2>
            <p className="text-sm text-neutral-500">3 visual directions</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
            >
              Copy markdown
            </button>
            {copyMsg ? <span className="self-center text-xs text-green-600">{copyMsg}</span> : null}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
        {directions.map((dir) => (
          <div key={dir.id}>
            <DirectionSection direction={dir} selectedSections={selectedOutputSections} />
            <div className="mb-16 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handlePdf(dir)}
                className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-800"
              >
                Download PDF — {dir.directionName}
              </button>
              {onRefine ? (
                <button
                  type="button"
                  onClick={() => setRefineId(dir.id)}
                  className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                >
                  Refine this direction
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {refineId && onRefine ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold">Refine direction</h3>
            <textarea
              value={refineNote}
              onChange={(e) => setRefineNote(e.target.value)}
              rows={4}
              placeholder="What should change?"
              className="mt-3 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRefineId(null)}
                className="rounded-md px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={refining || !refineNote.trim()}
                onClick={handleRefine}
                className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {refining ? "Refining…" : "Refine"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function PresentationShell({ children }: { children: ReactNode }) {
  return <div className="print-friendly">{children}</div>;
}
