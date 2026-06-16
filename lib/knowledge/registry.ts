import path from "path";

export type KnowledgeCategory = "ux_rules" | "design_framework" | "ia";

export type KnowledgeEntryMeta = {
  fileName: string;
  category: KnowledgeCategory;
  title: string;
  topic: string;
  researchQuery: string;
  skillSubdir: "ux-rules" | "design-frameworks" | "ia";
};

export const KNOWLEDGE_ROOT = path.join(process.cwd(), ".agents", "skills");

export function knowledgeFilePath(entry: KnowledgeEntryMeta): string {
  return path.join(KNOWLEDGE_ROOT, entry.skillSubdir, entry.fileName);
}

export const KNOWLEDGE_REGISTRY: KnowledgeEntryMeta[] = [
  {
    fileName: "heuristics.md",
    category: "ux_rules",
    title: "Usability Heuristics",
    topic: "Nielsen, Shneiderman, Gerhardt-Powals usability heuristics",
    skillSubdir: "ux-rules",
    researchQuery:
      "Nielsen Norman Group usability heuristics 2024 2025 updates Shneiderman golden rules severity rating",
  },
  {
    fileName: "accessibility.md",
    category: "ux_rules",
    title: "Accessibility Guidelines",
    topic: "WCAG 2.1, WCAG 3.0, ARIA, contrast, touch targets",
    skillSubdir: "ux-rules",
    researchQuery:
      "WCAG 2.1 AA guidelines WCAG 3.0 draft 2024 2025 color contrast touch target ARIA best practices",
  },
  {
    fileName: "mobile-ux.md",
    category: "ux_rules",
    title: "Mobile UX",
    topic: "iOS HIG, Material Design 3, thumb zones, mobile patterns",
    skillSubdir: "ux-rules",
    researchQuery:
      "Apple Human Interface Guidelines 2024 Material Design 3 mobile UX thumb zone Hoober research",
  },
  {
    fileName: "web-ux.md",
    category: "ux_rules",
    title: "Web UX",
    topic: "Web navigation, forms, CTAs, reading patterns",
    skillSubdir: "ux-rules",
    researchQuery:
      "web UX best practices 2024 navigation patterns form design F-pattern Z-pattern CTA placement",
  },
  {
    fileName: "conversion-ux.md",
    category: "ux_rules",
    title: "Conversion UX",
    topic: "Baymard checkout, Fogg model, persuasion, onboarding",
    skillSubdir: "ux-rules",
    researchQuery:
      "Baymard Institute checkout UX research 2024 Fogg behavior model conversion optimization onboarding",
  },
  {
    fileName: "data-viz-ux.md",
    category: "ux_rules",
    title: "Data Visualization UX",
    topic: "Chart selection, Tufte, dashboards, accessible data viz",
    skillSubdir: "ux-rules",
    researchQuery:
      "data visualization UX chart selection Edward Tufte dashboard design accessible data viz 2024",
  },
  {
    fileName: "voice-ai-ux.md",
    category: "ux_rules",
    title: "Voice & AI UX",
    topic: "Conversational UI, chatbots, VUI, AI trust and disclosure",
    skillSubdir: "ux-rules",
    researchQuery:
      "AI chatbot UX conversational design 2024 2025 voice interface design AI disclosure trust patterns",
  },
  {
    fileName: "emerging-trends.md",
    category: "ux_rules",
    title: "Emerging UX Trends",
    topic: "2024-2025 trends, spatial computing, inclusive design, dark patterns",
    skillSubdir: "ux-rules",
    researchQuery:
      "UX design trends 2024 2025 spatial computing AR UX inclusive design neurodesign dark patterns",
  },
  {
    fileName: "double-diamond.md",
    category: "design_framework",
    title: "Double Diamond",
    topic: "Discover, Define, Develop, Deliver framework",
    skillSubdir: "design-frameworks",
    researchQuery:
      "Double Diamond design process UK Design Council phases tools case study",
  },
  {
    fileName: "triple-diamond.md",
    category: "design_framework",
    title: "Triple Diamond",
    topic: "Extended diamond with problem validation",
    skillSubdir: "design-frameworks",
    researchQuery:
      "Triple Diamond design framework problem validation vs double diamond",
  },
  {
    fileName: "design-sprint.md",
    category: "design_framework",
    title: "Design Sprint",
    topic: "Google Ventures 5-day sprint methodology",
    skillSubdir: "design-frameworks",
    researchQuery:
      "Google Ventures design sprint 5 day process remote sprint facilitation 2024",
  },
  {
    fileName: "jobs-to-be-done.md",
    category: "design_framework",
    title: "Jobs To Be Done",
    topic: "JTBD theory Christensen Ulwick outcome-driven innovation",
    skillSubdir: "design-frameworks",
    researchQuery:
      "Jobs to be Done framework Christensen Ulwick switch interviews outcome driven innovation",
  },
  {
    fileName: "atomic-design.md",
    category: "design_framework",
    title: "Atomic Design",
    topic: "Brad Frost atoms molecules organisms templates pages",
    skillSubdir: "design-frameworks",
    researchQuery:
      "Brad Frost atomic design methodology design systems Figma React components",
  },
  {
    fileName: "lean-ux.md",
    category: "design_framework",
    title: "Lean UX",
    topic: "Jeff Gothelf assumptions mapping hypothesis MVP",
    skillSubdir: "design-frameworks",
    researchQuery:
      "Lean UX Jeff Gothelf assumptions mapping hypothesis driven design collaborative UX",
  },
  {
    fileName: "service-design.md",
    category: "design_framework",
    title: "Service Design",
    topic: "Service blueprints journey maps touchpoints",
    skillSubdir: "design-frameworks",
    researchQuery:
      "service design blueprint customer journey mapping touchpoint analysis backstage frontstage",
  },
  {
    fileName: "systems-thinking.md",
    category: "design_framework",
    title: "Systems Thinking",
    topic: "Systems thinking in design and UX",
    skillSubdir: "design-frameworks",
    researchQuery:
      "systems thinking design UX interconnected systems feedback loops service ecosystems",
  },
  {
    fileName: "jobs-stories.md",
    category: "design_framework",
    title: "Jobs Stories",
    topic: "Jobs story format for product and UX",
    skillSubdir: "design-frameworks",
    researchQuery:
      "jobs stories format Alan Klement JTBD alternative to user stories product design",
  },
  {
    fileName: "how-might-we.md",
    category: "design_framework",
    title: "How Might We",
    topic: "HMW question framing in design thinking",
    skillSubdir: "design-frameworks",
    researchQuery:
      "How Might We design thinking IDEO problem framing workshop facilitation",
  },
  {
    fileName: "ux-research-methods.md",
    category: "design_framework",
    title: "UX Research Methods",
    topic: "Full taxonomy of qualitative and quantitative research",
    skillSubdir: "design-frameworks",
    researchQuery:
      "UX research methods taxonomy card sorting tree testing sample sizes moderated unmoderated 2024",
  },
  {
    fileName: "ia-principles.md",
    category: "ia",
    title: "IA Principles",
    topic: "Card sorting, tree testing, wayfinding, cognitive load, Miller's Law, progressive disclosure",
    skillSubdir: "ia",
    researchQuery:
      "information architecture card sorting tree testing wayfinding cognitive load Miller's Law progressive disclosure 2024 2025",
  },
  {
    fileName: "navigation-patterns.md",
    category: "ia",
    title: "Navigation Patterns",
    topic: "Bottom tabs, hamburger, sidebar, mega menu, mobile vs desktop navigation",
    skillSubdir: "ia",
    researchQuery:
      "mobile navigation patterns bottom tab bar hamburger menu sidebar mega menu Nielsen Norman 2024",
  },
  {
    fileName: "content-strategy.md",
    category: "ia",
    title: "Content Strategy for IA",
    topic: "Content hierarchy, labeling, taxonomy, search architecture, filtering",
    skillSubdir: "ia",
    researchQuery:
      "content strategy information architecture labeling taxonomy search architecture filtering UX 2024",
  },
  {
    fileName: "competitor-analysis.md",
    category: "ia",
    title: "Competitor IA Analysis",
    topic: "Analyzing competitor navigation from screenshots, differentiation through IA",
    skillSubdir: "ia",
    researchQuery:
      "competitive UX analysis information architecture navigation screenshot analysis differentiation 2024",
  },
  {
    fileName: "ux-controversies.md",
    category: "ia",
    title: "UX Controversies in IA",
    topic: "Hamburger vs tabs, infinite scroll vs pagination, SPA vs multi-page, search vs browse",
    skillSubdir: "ia",
    researchQuery:
      "UX debates hamburger menu bottom tabs infinite scroll pagination SPA multi-page search browse cards lists tables 2024 2025",
  },
  {
    fileName: "ia-patterns-by-industry.md",
    category: "ia",
    title: "Industry IA Patterns",
    topic: "IA patterns for fintech, e-commerce, SaaS, healthcare, EdTech, social, marketplace, enterprise",
    skillSubdir: "ia",
    researchQuery:
      "information architecture patterns fintech e-commerce SaaS healthcare EdTech marketplace enterprise dashboard 2024",
  },
];

export function getRegistryEntry(fileName: string): KnowledgeEntryMeta | undefined {
  return KNOWLEDGE_REGISTRY.find((e) => e.fileName === fileName);
}
