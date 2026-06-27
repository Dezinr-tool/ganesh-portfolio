/** MWG-style scroll headline + fanned cards (madewithgsap.com) */

export const VALUE_SCROLL_DESKTOP_MQ = "(max-width: 56.25rem)"; /* 900px */

export const VALUE_SCROLL_TEXT = {
  desktop: ["Design that delivers.", "From insight to interface."] as const,
  mobile: ["Design that", "delivers.", "From insight", "to interface."] as const,
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
    id: "user-centered",
    title: "User-Centered",
    body: "Research, testing, and flows grounded in real user needs — not assumptions.",
    tone: "mint",
    index: "1",
  },
  {
    id: "ship-ready",
    title: "Ship-Ready",
    body: "High-fidelity components and specs teams can pick up and build from day one.",
    tone: "yellow",
    index: "2",
  },
  {
    id: "fast-iteration",
    title: "Fast Iteration",
    body: "Prototypes that validate ideas before heavy engineering spend.",
    tone: "sky",
    index: "3",
  },
  {
    id: "end-to-end",
    title: "End-to-End",
    body: "Workshops, systems, UI, and handoff across the full product cycle.",
    tone: "grey",
    index: "4",
  },
];

export const VALUE_SCROLL_LAYOUT = {
  // Text section: shorter pin so cards arrive sooner
  textMarginTop: "-35vh",
  textPinHeight: "400vh",       // was 700vh — reduced for snappier feel
  // Cards section: each card gets 100vh of scroll
  cardsMarginTop: "-300vh",     // was -400vh
  cardsPinHeight: "400vh",      // 4 cards × 100vh each
  // Card visual
  cardMaxWidth: 338,
  // Fan rotation per card index (applied when next card arrives)
  cardFanRotations: [-7, -2, 2, 7],   // degrees, outer to inner
  cardFanX: [-18, -6, 6, 18],         // px horizontal offset
};
