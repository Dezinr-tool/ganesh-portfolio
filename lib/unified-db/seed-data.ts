import { MOODBOARD_QUESTION_SEED } from "@/lib/moodboard/question-seed";

/** Core intake questions Q1–Q19 (excludes output-selection phase). */
export const INTAKE_QUESTION_SEED = MOODBOARD_QUESTION_SEED.filter(
  (q) => q.category !== "output_sections",
);

export type OutputSectionSeed = {
  key: string;
  label: string;
  category: string;
  description: string;
  follow_up_question: string | null;
  follow_up_chips: string[];
  order_index: number;
};

export const OUTPUT_SECTION_SEED: OutputSectionSeed[] = [
  {
    key: "color_palette",
    label: "Color Palette",
    category: "visual_foundation",
    description: "Primary, secondary, accent, background, and text colors with rationale.",
    follow_up_question: null,
    follow_up_chips: [],
    order_index: 1,
  },
  {
    key: "typography",
    label: "Typography",
    category: "visual_foundation",
    description: "Heading and body typeface choices with hierarchy guidance.",
    follow_up_question: null,
    follow_up_chips: [],
    order_index: 2,
  },
  {
    key: "icon_library",
    label: "Iconography / Icon Library",
    category: "visual_foundation",
    description: "Icon style, stroke weight, and library direction.",
    follow_up_question: "Icon style preference?",
    follow_up_chips: ["Outlined", "Filled", "Duotone", "Bold/thick", "Open to AI"],
    order_index: 3,
  },
  {
    key: "ui_references",
    label: "UI References (screens, flows, patterns)",
    category: "ui_interaction",
    description: "Reference screens, flows, and UI patterns for this direction.",
    follow_up_question: null,
    follow_up_chips: [],
    order_index: 4,
  },
  {
    key: "micro_interactions",
    label: "Micro-interactions & Motion",
    category: "ui_interaction",
    description: "Interaction patterns, timing, and motion principles.",
    follow_up_question: null,
    follow_up_chips: [],
    order_index: 5,
  },
  {
    key: "component_style",
    label: "Component Style (buttons, cards, inputs)",
    category: "ui_interaction",
    description: "Button, card, input, and form component styling.",
    follow_up_question: null,
    follow_up_chips: [],
    order_index: 6,
  },
  {
    key: "illustration_style",
    label: "Illustration Style & Direction",
    category: "assets_imagery",
    description: "Illustration approach and visual language.",
    follow_up_question: "What illustration style feels right?",
    follow_up_chips: ["Flat", "3D", "Hand-drawn", "Abstract", "Minimal line", "Open to AI"],
    order_index: 7,
  },
  {
    key: "photography_style",
    label: "Photography Style",
    category: "assets_imagery",
    description: "Photography treatment, subjects, and mood.",
    follow_up_question: null,
    follow_up_chips: [],
    order_index: 8,
  },
  {
    key: "product_images",
    label: "Product Images Direction (for D2C/ecommerce)",
    category: "assets_imagery",
    description: "Product staging, lighting, and shot direction for ecommerce.",
    follow_up_question: "What kind of products?",
    follow_up_chips: [
      "Fashion",
      "Electronics",
      "Food & Beverage",
      "Beauty",
      "Home & Living",
      "Other",
    ],
    order_index: 9,
  },
  {
    key: "video_motion",
    label: "Video / Motion Graphics Direction",
    category: "assets_imagery",
    description: "Motion graphics and video style direction.",
    follow_up_question: null,
    follow_up_chips: [],
    order_index: 10,
  },
  {
    key: "persona",
    label: "Persona (who we're designing for)",
    category: "brand",
    description: "Primary user persona with pain points and strategy implications.",
    follow_up_question: null,
    follow_up_chips: [],
    order_index: 11,
  },
  {
    key: "brand_voice",
    label: "Brand Voice & Tone of Voice",
    category: "brand",
    description: "Tone, voice adjectives, and example phrases.",
    follow_up_question: null,
    follow_up_chips: [],
    order_index: 12,
  },
  {
    key: "competitor_references",
    label: "Competitor References",
    category: "brand",
    description: "Competitive landscape and visual differentiation.",
    follow_up_question: null,
    follow_up_chips: [],
    order_index: 13,
  },
  {
    key: "dos_donts",
    label: "Do's & Don'ts",
    category: "brand",
    description: "Explicit design do's and don'ts for this direction.",
    follow_up_question: null,
    follow_up_chips: [],
    order_index: 14,
  },
];
