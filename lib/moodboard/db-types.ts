export type MoodboardQuestionType = "open" | "chips" | "upload" | "url" | "skip";

export type MoodboardQuestionCategory =
  | "brand_basics"
  | "market_context"
  | "visual_direction"
  | "user_persona"
  | "competitive"
  | "references";

export type MoodboardQuestion = {
  id: string;
  key: string;
  question_text: string;
  question_type: MoodboardQuestionType;
  parent_key: string | null;
  chips_options: string[] | null;
  follow_up_condition: string | null;
  category: MoodboardQuestionCategory;
  order_index: number;
  is_active: boolean;
  created_at: string;
};

export type MoodboardQuestionSeed = Omit<
  MoodboardQuestion,
  "id" | "is_active" | "created_at"
>;

export type MoodboardSessionStatus =
  | "in_progress"
  | "generating"
  | "complete"
  | "error";

export type MoodboardSession = {
  id: string;
  session_id: string;
  brand_name: string | null;
  project_type: string | null;
  answers: Record<string, unknown>;
  generated_directions: MoodboardPresentationDirection[] | null;
  selected_direction: string | null;
  status: MoodboardSessionStatus;
  created_at: string;
  updated_at: string;
};

export type MoodboardColorSwatch = {
  hex: string;
  name: string;
  role: "Primary" | "Secondary" | "Accent" | "Background" | "Text";
};

export type MoodboardReferenceCard = {
  url: string;
  caption: string;
};

export type MoodboardPersona = {
  name: string;
  age: string;
  occupation: string;
  cityTier: string;
  description: string;
  financials: string;
  painPoints: string[];
  brandStrategy: string;
  toneOfVoice: string;
  toneExample: string;
};

export type MoodboardPresentationDirection = {
  id: string;
  directionName: string;
  directionIndex: number;
  tagline: string;
  persona: MoodboardPersona;
  uiSection: {
    title: string;
    description: string;
    principles: string[];
    references: MoodboardReferenceCard[];
  };
  illustrations: {
    styleDescription: string;
    references: MoodboardReferenceCard[];
  };
  typography: {
    heading: { font: string; rationale: string };
    body: { font: string; rationale: string };
    references: MoodboardReferenceCard[];
  };
  colorPalette: MoodboardColorSwatch[];
  moodKeywords: string[];
};

export type MoodboardDirectionRow = {
  id: string;
  session_id: string;
  direction_name: string;
  direction_index: number;
  persona_name: string | null;
  persona_description: string | null;
  pain_points: string[] | null;
  brand_strategy: string | null;
  tone_of_voice: string | null;
  ui_references: MoodboardReferenceCard[] | null;
  illustration_style: string | null;
  illustration_references: MoodboardReferenceCard[] | null;
  typography_heading: string | null;
  typography_body: string | null;
  typography_references: MoodboardReferenceCard[] | null;
  color_palette: MoodboardColorSwatch[] | null;
  mood_keywords: string[] | null;
  created_at: string;
};
