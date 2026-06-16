export type IaQuestionType = "open" | "chips" | "url" | "upload" | "open_upload";

export type IaQuestion = {
  key: string;
  question_text: string;
  question_type: IaQuestionType;
  parent_key: string | null;
  follow_up_condition: string | null;
  chips_options: string[] | null;
  category: string;
  order_index: number;
  is_optional?: boolean;
};

export type IaScreenPriority = "P1" | "P2" | "P3";

export type IaScreenNode = {
  id: string;
  screen_name: string;
  parent_id: string | null;
  level: number;
  priority: IaScreenPriority;
  user_access: string[];
  primary_content: string[];
  key_actions: string[];
  notes?: string;
  children?: IaScreenNode[];
};

export type IaUserFlowStep = {
  step: number;
  label: string;
  screen?: string;
  type?: "action" | "decision" | "error" | "success";
};

export type IaUserFlow = {
  id: string;
  flow_name: string;
  flow_goal: string;
  steps: IaUserFlowStep[];
  decision_points: string[];
};

export type IaContentHierarchy = {
  screen_name: string;
  primary: string[];
  secondary: string[];
  tertiary: string[];
  key_actions: string[];
};

export type IaNavItem = {
  label: string;
  purpose: string;
  access_level: string;
  type: "primary" | "secondary" | "utility";
};

export type IaHealthScore = {
  depth_score: number;
  breadth_score: number;
  balance_assessment: string;
  recommendations: string[];
};

export type IaUxControversy = {
  id: string;
  title: string;
  debate: string;
  research: string;
  recommendation: string;
  rationale: string;
};

export type CompetitorScreenshotAnalysis = {
  filename: string;
  primary_nav: string[];
  top_level_count: number;
  nav_pattern: string;
  content_hierarchy: string;
  strengths: string[];
  improvements: string[];
};

export type IaCompetitorAnalysis = {
  summary: string;
  screenshots: CompetitorScreenshotAnalysis[];
  differentiation_notes?: string;
  analyzed_at?: string;
};

export type IaUxControversyDecision = {
  controversy_id: string;
  title: string;
  decision: "applied" | "rejected";
};

export type IaOutput = {
  product_overview: {
    product_name: string;
    product_type: string;
    primary_goal: string;
    user_types: { name: string; needs: string[] }[];
    key_tasks: string[];
  };
  navigation_structure: {
    primary: IaNavItem[];
    secondary: IaNavItem[];
    utility: IaNavItem[];
  };
  sitemap: IaScreenNode[];
  user_flows: IaUserFlow[];
  content_hierarchy: IaContentHierarchy[];
  navigation_patterns: {
    pattern: string;
    rationale: string;
  };
  health_score: IaHealthScore;
  ux_controversy_recommendations?: IaUxControversy[];
};

export type IaSession = {
  id: string;
  session_id: string;
  tool_session_id: string | null;
  client_name: string | null;
  project_name: string | null;
  product_type: string | null;
  answers: Record<string, unknown>;
  ia_output: IaOutput | null;
  competitor_analysis: IaCompetitorAnalysis | null;
  competitor_screenshots: string[];
  ux_controversy_decisions: Record<string, IaUxControversyDecision>;
  industry_pattern_used: string | null;
  status: "in_progress" | "complete";
  created_at: string;
  updated_at: string;
};

export type IaModelId = "claude-sonnet" | "claude-haiku" | "gpt-4o";
