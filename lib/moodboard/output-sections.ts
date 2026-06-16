import type { MoodboardQuestion, OutputSectionOption } from "./db-types";

/** Sections shown in the pre-generation picker (user-facing moodboard elements). */
export const MOODBOARD_PICKER_SECTIONS: OutputSectionOption[] = [
  { key: "color_palette", label: "Color palette", group: "VISUAL FOUNDATION" },
  { key: "typography", label: "Typography", group: "VISUAL FOUNDATION" },
  { key: "icon_library", label: "Icons & iconography", group: "VISUAL FOUNDATION" },
  { key: "micro_interactions", label: "Micro-interactions", group: "UI & INTERACTION" },
  { key: "illustration_style", label: "Illustrations", group: "ASSETS & IMAGERY" },
  { key: "photography_style", label: "Image assets & photography", group: "ASSETS & IMAGERY" },
  { key: "product_images", label: "Product image direction", group: "ASSETS & IMAGERY" },
  {
    key: "ui_references",
    label: "UI references (Pinterest, Dribbble, Behance, Mobbin)",
    group: "UI & INTERACTION",
  },
];

export const DEFAULT_MOODBOARD_PICKER_KEYS = MOODBOARD_PICKER_SECTIONS.map((s) => s.key);

export const UI_REFERENCES_SOURCES =
  "Pinterest, Dribbble, Behance, and Mobbin";

export const OUTPUT_SECTIONS: OutputSectionOption[] = [
  { key: "color_palette", label: "Color Palette", group: "VISUAL FOUNDATION" },
  { key: "typography", label: "Typography", group: "VISUAL FOUNDATION" },
  { key: "icon_library", label: "Iconography / Icon Library", group: "VISUAL FOUNDATION" },
  { key: "ui_references", label: "UI References (screens, flows, patterns)", group: "UI & INTERACTION" },
  { key: "micro_interactions", label: "Micro-interactions & Motion", group: "UI & INTERACTION" },
  { key: "component_style", label: "Component Style (buttons, cards, inputs)", group: "UI & INTERACTION" },
  { key: "illustration_style", label: "Illustration Style & Direction", group: "ASSETS & IMAGERY" },
  { key: "photography_style", label: "Photography Style", group: "ASSETS & IMAGERY" },
  { key: "product_images", label: "Product Images Direction (for D2C/ecommerce)", group: "ASSETS & IMAGERY" },
  { key: "video_motion", label: "Video / Motion Graphics Direction", group: "ASSETS & IMAGERY" },
  { key: "persona", label: "Persona (who we're designing for)", group: "BRAND" },
  { key: "brand_voice", label: "Brand Voice & Tone of Voice", group: "BRAND" },
  { key: "competitor_references", label: "Competitor References", group: "BRAND" },
  { key: "dos_donts", label: "Do's & Don'ts", group: "BRAND" },
];

export const OUTPUT_PHASE_KEYS = new Set([
  "q_output_sections",
  "q_output_product_type",
  "q_output_illustration_style",
  "q_output_icon_style",
]);

export const SECTION_FOLLOW_UPS: Record<string, string> = {
  product_images: "q_output_product_type",
  illustration_style: "q_output_illustration_style",
  icon_library: "q_output_icon_style",
};

export const MIN_OUTPUT_SECTIONS = 2;

export function parseSectionOptions(
  question: MoodboardQuestion | null | undefined,
): OutputSectionOption[] {
  if (!question?.chips_options?.length) return OUTPUT_SECTIONS;

  const opts = question.chips_options;
  if (typeof opts[0] === "object" && opts[0] !== null && "key" in (opts[0] as object)) {
    return opts as unknown as OutputSectionOption[];
  }

  return OUTPUT_SECTIONS.filter((s) =>
    (opts as string[]).includes(s.key) || (opts as string[]).includes(s.label),
  );
}

export function getSelectedOutputSections(
  answers: Record<string, unknown>,
): string[] {
  const raw = answers.q_output_sections;
  if (!Array.isArray(raw)) return [];
  return raw.map(String);
}

export function groupSections(options: OutputSectionOption[]): Map<string, OutputSectionOption[]> {
  const map = new Map<string, OutputSectionOption[]>();
  for (const opt of options) {
    const list = map.get(opt.group) ?? [];
    list.push(opt);
    map.set(opt.group, list);
  }
  return map;
}

export const SECTION_GENERATION_SPEC: Record<
  string,
  { title: string; jsonKey: string; description: string }
> = {
  color_palette: {
    title: "Color Palette",
    jsonKey: "colorPalette",
    description: "Exactly 5 colors with hex, name, role (Primary|Secondary|Accent|Background|Text)",
  },
  typography: {
    title: "Typography",
    jsonKey: "typography",
    description: "heading {font, rationale}, body {font, rationale}, references (4-6 items)",
  },
  icon_library: {
    title: "Iconography",
    jsonKey: "iconography",
    description: "style, strokeWeight, cornerStyle, references (6-8 icon examples with captions)",
  },
  ui_references: {
    title: "UI References",
    jsonKey: "uiSection",
    description:
      "title, description, principles (3-4 bullets), references (6-8 UI screens with captions citing source platforms: Pinterest, Dribbble, Behance, or Mobbin)",
  },
  micro_interactions: {
    title: "Micro-interactions & Motion",
    jsonKey: "microInteractions",
    description: "description paragraph, patterns (4-5 specific interaction behaviors with timing)",
  },
  component_style: {
    title: "Component Style",
    jsonKey: "componentStyle",
    description: "description, principles (buttons, cards, inputs), references (4-6 items)",
  },
  illustration_style: {
    title: "Illustration Style",
    jsonKey: "illustrations",
    description: "styleDescription paragraph, references (6-7 illustration examples)",
  },
  photography_style: {
    title: "Photography Style",
    jsonKey: "photography",
    description: "styleDescription, treatment, do/avoid lists, references (6 items)",
  },
  product_images: {
    title: "Product Images Direction",
    jsonKey: "productImages",
    description: "styleDescription, staging approach, references (6 product shot examples)",
  },
  video_motion: {
    title: "Video / Motion Graphics",
    jsonKey: "videoMotion",
    description: "styleDescription, motion principles, references (4-5 examples)",
  },
  persona: {
    title: "Persona",
    jsonKey: "persona",
    description: "name, age, occupation, cityTier, description, financials, painPoints (4-5), brandStrategy, toneOfVoice, toneExample",
  },
  brand_voice: {
    title: "Brand Voice & Tone",
    jsonKey: "brandVoice",
    description: "toneDescription, adjectives, examplePhrases (3-4), writingPrinciples",
  },
  competitor_references: {
    title: "Competitor References",
    jsonKey: "competitorReferences",
    description: "description, whatToLearn, whatToAvoid, references (4-6 items)",
  },
  dos_donts: {
    title: "Do's & Don'ts",
    jsonKey: "dosDonts",
    description: "dos (5 items), donts (5 items) — specific to this brand direction",
  },
};
