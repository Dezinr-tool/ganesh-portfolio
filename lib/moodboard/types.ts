export type MoodboardTab = "logo" | "website" | "campaign";

export type MoodboardModelId =
  | "claude-haiku"
  | "claude-sonnet"
  | "claude-nano"
  | "gpt-4o"
  | "gemini-pro";

export type MoodboardColor = {
  hex: string;
  name: string;
};

export type MoodboardDirection = {
  id: string;
  name: string;
  concept: string;
  colors: MoodboardColor[];
  typography: { heading: string; body: string };
  imagery: string;
  mood: string[];
  visual_references: string;
};

export type MoodboardBrief = {
  tab: MoodboardTab;
  industry?: string;
  audience?: string;
  feeling?: string;
  colorDirection?: string;
  admiredBrands?: string;
  brandName?: string;
  values?: string;
  stylePreference?: string;
  campaignGoal?: string;
  campaignFeeling?: string;
  platform?: string;
  hasWebsite?: boolean;
  websiteUrl?: string;
  websiteAnalysis?: WebsiteAnalysis;
  questionnaireText?: string;
  referenceNotes?: string;
  referenceImageCount?: number;
  eaClientName?: string;
  eaPrefillSummary?: string;
};

export type WebsiteAnalysis = {
  url: string;
  title: string;
  description: string;
  personality: string;
  tone: string;
  colors: string[];
  problems: string[];
  vision: string;
  fallback?: boolean;
};

export type MoodboardHistoryEntry = {
  id: string;
  tab: MoodboardTab;
  createdAt: string;
  chosenDirectionId?: string;
  directions: MoodboardDirection[];
  brief: MoodboardBrief;
};

export type GenerateMoodboardResult = {
  directions: MoodboardDirection[];
};
