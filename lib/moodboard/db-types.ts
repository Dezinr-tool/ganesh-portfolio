export type MoodboardQuestionType =
  | "open"
  | "chips"
  | "upload"
  | "url"
  | "skip"
  | "multi_section_select";

export type MoodboardQuestionCategory =
  | "brand_basics"
  | "market_context"
  | "visual_direction"
  | "user_persona"
  | "competitive"
  | "references"
  | "output_sections";

export type OutputSectionOption = {
  key: string;
  label: string;
  group: string;
};

export type MoodboardQuestion = {
  id: string;
  key: string;
  question_text: string;
  question_type: MoodboardQuestionType;
  parent_key: string | null;
  chips_options: string[] | OutputSectionOption[] | null;
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
  selected_output_sections: string[] | null;
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
  selectedSections?: string[];
  persona?: MoodboardPersona | null;
  uiSection?: {
    title: string;
    description: string;
    principles: string[];
    references: MoodboardReferenceCard[];
  } | null;
  illustrations?: {
    styleDescription: string;
    references: MoodboardReferenceCard[];
  } | null;
  typography?: {
    heading: { font: string; rationale: string };
    body: { font: string; rationale: string };
    references: MoodboardReferenceCard[];
  } | null;
  colorPalette?: MoodboardColorSwatch[] | null;
  iconography?: {
    style: string;
    strokeWeight: string;
    cornerStyle: string;
    references: MoodboardReferenceCard[];
  } | null;
  microInteractions?: {
    description: string;
    patterns: string[];
  } | null;
  componentStyle?: {
    description: string;
    principles: string[];
    references: MoodboardReferenceCard[];
  } | null;
  photography?: {
    styleDescription: string;
    treatment: string;
    dos: string[];
    avoid: string[];
    references: MoodboardReferenceCard[];
  } | null;
  productImages?: {
    styleDescription: string;
    staging: string;
    references: MoodboardReferenceCard[];
  } | null;
  videoMotion?: {
    styleDescription: string;
    principles: string[];
    references: MoodboardReferenceCard[];
  } | null;
  brandVoice?: {
    toneDescription: string;
    adjectives: string[];
    examplePhrases: string[];
    writingPrinciples: string[];
  } | null;
  competitorReferences?: {
    description: string;
    whatToLearn: string[];
    whatToAvoid: string[];
    references: MoodboardReferenceCard[];
  } | null;
  dosDonts?: {
    dos: string[];
    donts: string[];
  } | null;
  moodKeywords?: string[];
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
