/** MWG-style scroll headline + fanned cards (madewithgsap.com) */

export const VALUE_SCROLL_DESKTOP_MQ = "(max-width: 56.25rem)"; /* 900px */

export const VALUE_SCROLL_TEXT = {
  desktop: ["Good design isn't magic.", "It's method."] as const,
  mobile: ["Good design", "isn't magic.", "It's method."] as const,
  mobileAccentFromLine: 2,
};

export type ValueScrollCard = {
  id: string;
  title: string;
  body: string;
  tone: "mint" | "yellow" | "sky" | "grey";
  index: string;
};

export const VALUE_SCROLL_CARDS: ValueScrollCard[] = [
  {
    id: "research-strategy",
    title: "I start with why.",
    body: "User research, competitor mapping, and product strategy. Before a single pixel is moved. Decisions backed by insight, not instinct.",
    tone: "mint",
    index: "1",
  },
  {
    id: "design-systems",
    title: "I build things that scale.",
    body: "From component libraries to full design systems. Ship-ready specs, high-fidelity UI, and handoffs engineers actually love.",
    tone: "yellow",
    index: "2",
  },
  {
    id: "prototyping",
    title: "I kill bad ideas early.",
    body: "Rapid prototypes that test assumptions before engineering burns time. Fail fast, learn faster, ship smarter.",
    tone: "sky",
    index: "3",
  },
  {
    id: "leadership",
    title: "I make teams better.",
    body: "Design sprints, workshops, mentoring. 15 years of building products and the teams that build them. D2C, B2B, B2B2C, funded startups.",
    tone: "grey",
    index: "4",
  },
];

/** Matches madewithgsap.com h-texts / h-cards layout */
export const VALUE_SCROLL_LAYOUT = {
  textMarginTop: "0",
  textPinHeight: "700vh",
  cardsMarginTop: "-400vh",
  cardsPinHeight: "400vh",
  circlesSize: 3675,
  cardMaxWidth: 338,
  carouselRotationStep: 6.2,
};
