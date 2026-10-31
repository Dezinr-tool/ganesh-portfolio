import { WORKS_PROJECTS } from "@/components/sections/works/projects";
import type { CaseStudy } from "@/lib/work/case-studies";

const COVE = "/img/projects/cove-lane";
const TOTOKO = "/img/projects/totoko/figma-brief.png";
const PROGENT = "/img/projects/progent/figma-home-page.png";
const SNABBIT = "/img/projects/snabbit";
const VERBAFLO = "/img/projects/verbaflo";

const shared = (title: string, image: string, services: CaseStudy["services"], sections: CaseStudy["sections"]): CaseStudy => ({
  slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  title,
  mainImage: image,
  services,
  barcodeTitle: `( ${title.toLowerCase()} )`,
  sections,
  backgroundMain: image,
  backgroundTop: { title: "the system behind the screen", image },
  backgroundMiddle: { title: "designed for the next decision", image },
  dsgn3: { title: "make the path feel obvious", image },
  dsgn4: { title: "from intent to interaction", image, bg: null },
  dsgn5: { title: "remove the reasons to hesitate", image },
  dsgn6: { title: "responsive by default", image },
  dsgn7: { title: "ready to measure and improve", image, bg: image, video: null },
});

const CASE_STUDIES: CaseStudy[] = [
  {
    ...shared("Cove & Lane", `${COVE}/figma-moodboard.png`, ["CVR + RTO", "UX/UI + brand system", "Lifestyle e-commerce", "Case study"], [
      {
        label: "BRIEF",
        paragraphs: [
          "Cove & Lane needed a commerce experience that could feel premium while doing a practical job: increase conversion and reduce return-to-origin orders.",
          "The engagement covered the full UX, from the first browse to the confidence a customer needs before placing an order.",
        ],
      },
      {
        label: "PROCESS",
        paragraphs: [
          "We started with layered moodboards: Modern Luxe Serenity, Bold Chic Energy, and Contemporary Heritage. Those lenses helped us define a brand personality that could stay calm, expressive, and trustworthy across every page.",
          "From there, we translated the direction into page rules, clearer product discovery, stronger product detail hierarchy, and reassurance around delivery, fit, and returns. The work moved page by page into the live experience so the team could track performance and keep learning.",
        ],
      },
      {
        label: "OUTCOME",
        paragraphs: [
          "The result is a conversion-focused product system that connects visual storytelling with useful decisions. CVR and RTO metrics will be added here once the final measurement set is shared.",
        ],
      },
    ]),
    backgroundMain: `${COVE}/figma-moodboard.png`,
    backgroundTop: { title: "a calmer way to browse", image: `${COVE}/figma-colors.png` },
    backgroundMiddle: { title: "confidence before checkout", image: `${COVE}/figma-moodboard.png` },
    dsgn3: { title: "make the path feel obvious", image: `${COVE}/figma-colors.png` },
    dsgn4: { title: "from moodboard to interface", image: `${COVE}/figma-moodboard.png`, bg: null },
    dsgn5: { title: "remove the reasons to hesitate", image: `${COVE}/figma-colors.png` },
    dsgn6: { title: "responsive by default", image: `${COVE}/figma-moodboard.png` },
    dsgn7: { title: "ready to measure and improve", image: `${COVE}/figma-colors.png`, bg: `${COVE}/figma-moodboard.png`, video: null },
  },
  {
    ...shared("Totoko", TOTOKO, ["PRODUCT UX", "UX/UI + interaction design", "Digital product", "Case study"], [
      {
        label: "BRIEF",
        paragraphs: [
          "Totoko was explored through three design phases, each one testing how the product should feel, explain itself, and help people move forward.",
          "The goal was to make the interface feel distinct without letting visual character get in the way of the task.",
        ],
      },
      {
        label: "PROCESS",
        paragraphs: [
          "The moodboards gave us a working language for emotion, imagery, colour, typography, and shapes. We then used that language to build interaction patterns: a clear first step, progressive disclosure, visible system status, and a mobile flow that keeps the next action in reach.",
          "Each phase tightened the relationship between the brand idea and the product behaviour, so Totoko reads as a product people can use, not just a visual treatment.",
        ],
      },
      {
        label: "OUTCOME",
        paragraphs: [
          "The case study is structured around the UX decisions behind the screens. Content and success measures can be refined when the final product details are supplied.",
        ],
      },
    ]),
  },
  {
    ...shared("Progent", PROGENT, ["BRAND FROM ZERO", "Brand strategy + digital system", "B2B technology", "Case study"], [
      {
        label: "BRIEF",
        paragraphs: [
          "Progent was built from scratch as an enterprise AI transformation platform. The brief was to make complex automation feel clear, credible, and ready for real operational work.",
          "The website had to explain the agent layer, show how workflows move from decision to outcome, and give teams a direct path to request a demo.",
        ],
      },
      {
        label: "PROCESS",
        paragraphs: [
          "The page structure follows the supplied product story: the challenge, the agent layer, workflow examples, simulation-driven readiness, integrations, outcomes, industries, success story, and the next step.",
          "The interaction direction keeps the interface editorial and technical at once, using real workflow UI, measurable outcomes, and a repeated request-a-demo path to turn understanding into action.",
        ],
      },
      {
        label: "OUTCOME",
        paragraphs: [
          "The result is a full website narrative that moves from operational friction to autonomous execution. The supplied success-story proof points remain visible without inventing new launch metrics.",
        ],
      },
    ]),
    heroVideo: "/img/projects/progent/progent-intro.mp4",
    backgroundMain: PROGENT,
    backgroundTop: { title: "the challenge, made legible", image: "/img/projects/progent/figma-challenge.png" },
    backgroundMiddle: { title: "one agent layer across the work", image: "/img/projects/progent/figma-agent-layer.png" },
    dsgn3: { title: "make the system legible", image: "/img/projects/progent/figma-agent-layer.png" },
    dsgn4: { title: "from moodboard to interface", image: PROGENT, bg: null },
    dsgn5: { title: "give every touchpoint a role", image: "/img/projects/progent/figma-home-page.png" },
    dsgn6: { title: "responsive by default", image: "/img/projects/progent/figma-challenge.png" },
    dsgn7: { title: "ready to scale", image: "/img/projects/progent/figma-agent-layer.png", bg: PROGENT, video: "/img/projects/progent/progent-intro.mp4" },
  },
  {
    ...shared("Snabbit", `${SNABBIT}/website.png`, ["Brand-led website", "UX/UI + illustration", "Q-commerce", "4 weeks"], [
      {
        label: "BRIEF",
        paragraphs: [
          "Snabbit is a quick-service app that sends trained help to people's homes within minutes, for cleaning, laundry and other household jobs.",
          "It needed a marketing website as lively as the brand itself, and one that made booking feel effortless.",
        ],
      },
      {
        label: "CHALLENGE",
        paragraphs: [
          "Keep Snabbit's playful energy intact on screen, simplify how people move through the site, and design around what customers expect before they book.",
        ],
      },
      {
        label: "SOLUTION",
        paragraphs: [
          "Moodboards and wireframes came first, followed by several rounds of refinement into a clean, easy interface. Custom illustrations carry the story, and printed collateral extends the same look offline.",
        ],
      },
      {
        label: "MOODBOARD",
        paragraphs: [
          "We kept Snabbit's signature pink and built the palette around it. Sofia Sans brings a modern, friendly voice to headlines, while Avantt gives body text structure.",
        ],
      },
      {
        label: "WIREFRAMES",
        paragraphs: [
          "High-fidelity wireframes set the structure of the landing page, so every block had its place before styling began.",
        ],
      },
      {
        label: "WEBSITE",
        paragraphs: [
          "Services sit up front in clear categories, followed by a simple walkthrough of how booking works. Benefits and ratings are easy to spot, and small brand touches add some delight.",
        ],
      },
      {
        label: "APPROACH",
        paragraphs: [
          "Close collaboration with the team shaped every decision. Layouts are built to move visitors towards booking, and the wireframes were refined over several rounds.",
        ],
      },
      {
        label: "RESPONSIVE",
        paragraphs: [
          "The layout adapts across phone, tablet and desktop while staying consistent and easy to use.",
        ],
      },
      {
        label: "ILLUSTRATION",
        paragraphs: [
          "A moodboard fixed the illustration style: professional yet warm. Custom characters give each service a friendly face.",
        ],
      },
      {
        label: "COLLATERAL",
        paragraphs: [
          "Canopy, standees, flyers, bus-shelter posters and pole banners all follow the same illustration style and brand elements, keeping Snabbit recognisable offline.",
        ],
      },
      {
        label: "IMPACT",
        paragraphs: [
          "The Snabbit team welcomed the fresher identity and sharper messaging, which sets the brand up for stronger recall and engagement.",
        ],
      },
      {
        label: "ROLE",
        paragraphs: [
          "Product design: UX/UI, user research, responsive and mobile web, tone and personality.",
          "Brand: colour, creative direction, iconography, illustration, collateral and moodboards.",
        ],
      },
    ]),
    heroVideo: `${SNABBIT}/homepage.mp4`,
    heroPoster: `${SNABBIT}/homepage-poster.jpg`,
    websiteUrl: "https://snabbit.com/",
    websiteLabel: "visit website",
    backgroundMain: `${SNABBIT}/website.png`,
    backgroundTop: { title: "moodboard + type", image: `${SNABBIT}/moodboard.png` },
    backgroundMiddle: { title: "high-fidelity wireframes", image: `${SNABBIT}/wireframes.png` },
    dsgn3: { title: "website design", image: `${SNABBIT}/website.png` },
    dsgn4: { title: "design approach", image: `${SNABBIT}/design-approach-poster.jpg`, video: `${SNABBIT}/design-approach.mp4`, bg: null },
    dsgn5: { title: "responsive design", image: `${SNABBIT}/responsive-poster.jpg`, video: `${SNABBIT}/responsive.mp4` },
    dsgn6: { title: "illustrations", image: `${SNABBIT}/illustrations.svg` },
    dsgn7: { title: "marketing collateral", image: `${SNABBIT}/collateral.png`, bg: `${SNABBIT}/website.png`, video: null },
  },
  {
    ...shared("VerbaFlo", `${VERBAFLO}/hero-mockup.webp`, ["CRM + workflow redesign", "Product design + UX audit", "AI automation, B2B SaaS", "Retainer"], [
      {
        label: "BRIEF",
        paragraphs: [
          "VerbaFlo is an AI-powered CRM and workflow platform that helps real estate teams reach leads, automate follow-ups and convert more of them.",
          "As UX and product design partners on a retainer, we helped turn it into a platform ready to scale.",
        ],
      },
      {
        label: "CHALLENGE",
        paragraphs: [
          "The product grew fast, and features piled up faster than the experience could keep pace: scattered navigation, inconsistent patterns, duplicated components and tangled workflows, with no shared design system to hold it together.",
        ],
      },
      {
        label: "SOLUTION",
        paragraphs: [
          "We audited the product, reorganised its structure, built one design system for the whole platform and redesigned its core modules around it.",
        ],
      },
      {
        label: "APPROACH",
        paragraphs: [
          "We aligned stakeholders, checked real user workflows against the product and mapped where the experience broke down. Then we reworked the automation logic and design foundations so the platform could keep evolving.",
        ],
      },
      {
        label: "AUDIT",
        paragraphs: [
          "A full audit of workflows, navigation and components surfaced the systemic issues behind the inconsistency, and gave the redesign a clear starting point.",
        ],
      },
      {
        label: "STRUCTURE",
        paragraphs: [
          "Instead of patching screens one by one, we reorganised the information architecture into clear, predictable journeys and introduced a single design system for components, interactions and visual language.",
        ],
      },
      {
        label: "CRM",
        paragraphs: [
          "The CRM was rebuilt around sales agents, account managers and admins, with simpler lead management, clearer hierarchy and consistent patterns that speed up decisions.",
        ],
      },
      {
        label: "WORKFLO",
        paragraphs: [
          "WorkFlo, the automation builder, became easier to use: simpler journey creation, standard patterns and better visibility into scheduled and dynamic journeys.",
        ],
      },
      {
        label: "SCREENS",
        paragraphs: [
          "The redesign covers the CRM, workflow automation, analytics, dashboards and property management, so the whole platform now reads as one product.",
        ],
      },
      {
        label: "IMPACT",
        paragraphs: [
          "The platform now rests on a scalable UX foundation that makes teams more efficient and gives future features a consistent place to land.",
        ],
      },
      {
        label: "ROLE",
        paragraphs: [
          "Product design: app design, design system, UI/UX and user research.",
          "Development: front-end development. Content: content writing.",
        ],
      },
    ]),
    backgroundMain: `${VERBAFLO}/workflo.webp`,
    backgroundTop: { title: "the approach", image: `${VERBAFLO}/approach.webp` },
    backgroundMiddle: { title: "ux audit", image: `${VERBAFLO}/ux-audit.webp` },
    dsgn3: { title: "design system", image: `${VERBAFLO}/design-system.webp` },
    dsgn4: { title: "information architecture", image: `${VERBAFLO}/information-architecture-poster.jpg`, video: `${VERBAFLO}/information-architecture.mp4`, bg: null },
    dsgn5: { title: "crm", image: `${VERBAFLO}/crm-poster.jpg`, video: `${VERBAFLO}/crm.mp4` },
    dsgn6: { title: "workflo", image: `${VERBAFLO}/workflo-poster.jpg`, video: `${VERBAFLO}/workflo.mp4` },
    dsgn7: { title: "all screens", image: `${VERBAFLO}/all-screens-poster.jpg`, bg: `${VERBAFLO}/workflo.webp`, video: `${VERBAFLO}/all-screens.mp4` },
  },
];

/**
 * Layout guide at /work/sample: every slot holds a labelled placeholder showing its name and size.
 * Not listed on the works page, so it only opens by direct link.
 */
const SAMPLE_PATH = "/img/projects/sample";
const SAMPLE_STUDY: CaseStudy = {
  slug: "sample",
  title: "Sample",
  mainImage: `${SAMPLE_PATH}/hero-poster.jpg`,
  heroVideo: `${SAMPLE_PATH}/hero.mp4`,
  heroPoster: `${SAMPLE_PATH}/hero-poster.jpg`,
  services: ["Brief: what was asked", "Service: what we did", "Industry: the sector", "Status: live or retainer"],
  barcodeTitle: "( sample )",
  sections: [
    { label: "BRIEF", paragraphs: ["A short paragraph on what the client needed. Each section is a label on the left and its text on the right."] },
    { label: "CHALLENGE", paragraphs: ["The problem we found. Add as many sections as the story needs, each with one or more paragraphs."] },
    { label: "SOLUTION", paragraphs: ["What we did about it, in a couple of sentences."] },
    { label: "ROLE", paragraphs: ["Your part in the project."] },
  ],
  websiteUrl: "https://example.com",
  websiteLabel: "visit website",
  backgroundMain: `${SAMPLE_PATH}/bg-main.svg`,
  backgroundTop: { title: "title for dsgn 1", image: `${SAMPLE_PATH}/dsgn1.svg` },
  backgroundMiddle: { title: "title for dsgn 2", image: `${SAMPLE_PATH}/dsgn2.svg` },
  dsgn3: { title: "title for dsgn 3", image: `${SAMPLE_PATH}/dsgn3.svg` },
  dsgn4: { title: "title for dsgn 4", image: `${SAMPLE_PATH}/dsgn4.svg`, bg: `${SAMPLE_PATH}/dsgn4-bg.svg` },
  dsgn5: { title: "title for dsgn 5", image: `${SAMPLE_PATH}/dsgn5.svg` },
  dsgn6: { title: "title for dsgn 6", image: `${SAMPLE_PATH}/dsgn6.svg` },
  dsgn7: { title: "title for dsgn 7", image: `${SAMPLE_PATH}/dsgn7.svg`, bg: `${SAMPLE_PATH}/dsgn7-bg.svg`, video: null },
};

export function getCaseStudyBySlugFallback(slug: string): CaseStudy | undefined {
  return [...CASE_STUDIES, SAMPLE_STUDY].find((study) => study.slug === slug);
}

export function getAllCaseSlugsFallback(): string[] {
  return WORKS_PROJECTS.map((project) => project.id);
}
