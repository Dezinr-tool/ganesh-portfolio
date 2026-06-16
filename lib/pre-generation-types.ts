export type ProposedItem = {
  name: string;
  reason: string;
  confidence: "high" | "medium" | "low";
  apply_by_default: boolean;
  key: string;
};

export type Observation = {
  source: "meeting" | "previous_audit" | "previous_moodboard" | "ea_memory";
  observation: string;
  relevance: string;
  question: string;
  relevance_score: number;
};

export type ConfirmationQuestion = {
  type: "framework" | "rule" | "observation" | "preference";
  question: string;
  options?: string[];
  default_answer?: string;
  is_optional: boolean;
  key: string;
};

export type PreConfirmation = {
  proposed_frameworks: ProposedItem[];
  proposed_rules: ProposedItem[];
  meeting_observations: Observation[];
  confirmation_questions: ConfirmationQuestion[];
  skip_confirmation: boolean;
  ia_preview?: {
    industry_pattern: string;
    navigation_pattern: string;
    controversies_to_address: string[];
  };
};

export type ObservationAnswer = {
  observation: string;
  answer: string;
  source?: string;
};

export type QuestionAnswer = {
  question: string;
  answer: string;
  key: string;
};

export type UserPreConfirmation = {
  confirmed_frameworks: string[];
  rejected_frameworks: string[];
  confirmed_rules: string[];
  rejected_rules: string[];
  observation_answers: ObservationAnswer[];
  question_answers: QuestionAnswer[];
};

export const PRE_CONFIRMATION_ANSWERS_KEY = "__pre_generation";
