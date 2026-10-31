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
    title: "Understand the problem.",
    body: "I talk to users, study the market, and work with your team to decide what matters most. That gives the design a clear starting point.",
    tone: "mint",
    index: "1",
  },
  {
    id: "design-systems",
    title: "Make it clear.",
    body: "I design clear screens and reusable components, with the details developers need to build a consistent product.",
    tone: "yellow",
    index: "2",
  },
  {
    id: "prototyping",
    title: "Test it early.",
    body: "I turn ideas into prototypes so we can try the flow, spot the friction, and improve it before development starts.",
    tone: "sky",
    index: "3",
  },
  {
    id: "leadership",
    title: "Build it together.",
    body: "I work with founders, designers, and developers through workshops, reviews, and everyday decisions. We keep learning as the product grows.",
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
