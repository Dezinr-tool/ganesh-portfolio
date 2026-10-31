import { WORKS_PROJECTS } from "@/components/sections/works/projects";
import type { CaseStudy } from "@/lib/work/case-studies";

const COVE = "/img/projects/cove-lane";
const TOTOKO = "/img/projects/totoko/figma-brief.png";
const PROGENT = "/img/projects/progent/figma-home-page.png";

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
];

export function getCaseStudyBySlugFallback(slug: string): CaseStudy | undefined {
  return CASE_STUDIES.find((study) => study.slug === slug);
}

export function getAllCaseSlugsFallback(): string[] {
  return WORKS_PROJECTS.map((project) => project.id);
}
