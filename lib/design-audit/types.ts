export type AuditInputMode = "figma" | "website" | "screenshot";

export type AuditModelId =
  | "claude-haiku"
  | "claude-sonnet"
  | "claude-nano"
  | "gpt-4o"
  | "gemini-pro";

export type DimensionStatus = "good" | "needs_work" | "critical";

export type EffortEstimate = "quick" | "medium" | "significant";

export type AuditDimensionKey =
  | "visual_hierarchy"
  | "typography"
  | "color_system"
  | "spacing_layout"
  | "information_architecture"
  | "ux_patterns"
  | "accessibility"
  | "industry_standards"
  | "consistency"
  | "mobile_responsiveness";

export type AuditDimension = {
  score: number;
  status: DimensionStatus;
  working: string[];
  issues: string[];
  fixes: string[];
  effort_estimate?: EffortEstimate;
};

export type DesignAuditResult = {
  overall_score: number;
  summary: string;
  priority_issues: {
    critical: string[];
    important: string[];
    nice_to_have: string[];
  };
  annotated_issues: string[];
  dimensions: Record<AuditDimensionKey, AuditDimension>;
};

export type AuditContext = {
  productDescription: string;
  targetUser: string;
  primaryGoal: string;
  specificConcerns?: string;
  eaClientName?: string;
  eaPrefillSummary?: string;
};

export type AuditImage = {
  base64: string;
  mediaType: "image/png" | "image/jpeg" | "image/webp";
  label?: string;
};

export type FigmaInputMeta = {
  fileKey: string;
  nodeId: string;
  fileName?: string;
  components: string[];
  fonts: string[];
  colors: string[];
  layerSummary: string;
};

export type WebsiteInputMeta = {
  url: string;
  title: string;
  description: string;
  headings: string[];
  navLinks?: string[];
  ctaLabels?: string[];
  cssColors?: string[];
  screenshotFallback?: boolean;
};

export const DIMENSION_LABELS: Record<AuditDimensionKey, string> = {
  visual_hierarchy: "Visual Hierarchy",
  typography: "Typography",
  color_system: "Color System",
  spacing_layout: "Spacing & Layout",
  information_architecture: "Information Architecture",
  ux_patterns: "UX Patterns",
  accessibility: "Accessibility",
  industry_standards: "Industry Standards",
  consistency: "Consistency",
  mobile_responsiveness: "Mobile Responsiveness",
};

export const ALL_DIMENSION_KEYS = Object.keys(
  DIMENSION_LABELS,
) as AuditDimensionKey[];
