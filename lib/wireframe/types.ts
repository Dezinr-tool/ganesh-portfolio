export type WireframeElement = {
  id: string;
  component: string;
  props?: Record<string, unknown>;
  children?: WireframeElement[] | string;
};

export type WireframeAnnotation = {
  element_id: string;
  note: string;
  ux_rule?: string;
  shadcn_component?: string;
  audit_finding?: string;
};

export type WireframeScreenSpec = {
  screen_name: string;
  description: string;
  layout: "stack" | "sidebar" | "split" | "dashboard";
  nav_pattern?: string;
  elements: WireframeElement[];
  annotations: WireframeAnnotation[];
};

export type WireframeSession = {
  id: string;
  session_id: string;
  ia_session_id: string;
  client_name: string | null;
  project_name: string | null;
  selected_screens: string[];
  screen_notes: Record<string, string>;
  moodboard_session_id: string | null;
  audit_session_id: string | null;
  status: "in_progress" | "complete";
  created_at: string;
  updated_at: string;
};

export type WireframeScreen = {
  id: string;
  session_id: string;
  screen_name: string;
  ia_screen_id: string | null;
  spec: WireframeScreenSpec;
  jsx_code: string;
  annotations: WireframeAnnotation[];
  shadcn_components_used: string[];
  version: number;
};

export type WireframeModelId = "claude-sonnet" | "claude-haiku";

export const SHADCN_COMPONENTS = [
  "Button",
  "Input",
  "Label",
  "Textarea",
  "Select",
  "Checkbox",
  "RadioGroup",
  "Switch",
  "Slider",
  "Card",
  "Badge",
  "Avatar",
  "Alert",
  "AlertDialog",
  "Dialog",
  "Sheet",
  "Drawer",
  "NavigationMenu",
  "Tabs",
  "Breadcrumb",
  "Pagination",
  "Table",
  "Calendar",
  "Progress",
  "Skeleton",
  "Accordion",
  "ScrollArea",
  "Tooltip",
  "Popover",
  "DropdownMenu",
  "Separator",
  "Form",
] as const;

export type ShadcnComponentName = (typeof SHADCN_COMPONENTS)[number];
