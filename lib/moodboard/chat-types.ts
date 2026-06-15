import type { MoodboardDirection } from "./types";

export type ChipOption = {
  id: string;
  label: string;
};

export type ChatWidget =
  | { type: "chips"; options: ChipOption[]; multi?: boolean }
  | {
      type: "text";
      placeholder?: string;
      multiline?: boolean;
      submitLabel?: string;
    }
  | { type: "url"; placeholder?: string }
  | {
      type: "rich";
      placeholder?: string;
      multiline?: boolean;
      allowQuestionnaire?: boolean;
      allowImages?: boolean;
      maxImages?: number;
      skippable?: boolean;
      submitLabel?: string;
    }
  | { type: "loader"; message: string }
  | { type: "confirm"; summary: Record<string, string>; fields: string[] }
  | { type: "directions"; directions: MoodboardDirection[] };

export type MoodboardChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  widget?: ChatWidget;
  inactive?: boolean;
};

export const GENERATION_STATUS = [
  "Analyzing brand context...",
  "Crafting direction 1...",
  "Crafting direction 2...",
  "Crafting direction 3...",
  "Finalizing palettes...",
];

export const FEEL_CHIPS = [
  "Minimal",
  "Bold",
  "Warm",
  "Playful",
  "Premium",
  "Technical",
  "Human",
  "Raw",
];

export const COLOR_CHIPS = [
  "Warm",
  "Cool",
  "Neutral",
  "Dark",
  "Vibrant",
  "Muted",
  "Open to AI",
];

export const CAMPAIGN_GOAL_CHIPS = [
  "Awareness",
  "Launch",
  "Conversion",
  "Retention",
];

export const CAMPAIGN_PLATFORM_CHIPS = [
  "Social Media",
  "Print",
  "Web",
  "OOH",
  "All",
];

export const LOGO_MARK_CHIPS = [
  "Wordmark",
  "Lettermark",
  "Symbol",
  "Combination",
];

export const LOGO_STYLE_CHIPS = [
  "Geometric",
  "Organic",
  "Typographic",
  "Abstract",
  "Illustrative",
];
