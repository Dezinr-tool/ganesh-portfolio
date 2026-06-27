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
  textPinHeight: "400vh",
  // Cards section: each card gets 100vh of scroll
  cardsMarginTop: "-300vh",
  cardsPinHeight: "400vh",      // 4 cards × 100vh each
  // Card visual
  cardMaxWidth: 420,
  // Fan rotations — index 0 = deepest card (most tilted), index 3 = front card
  // New card always arrives straight; previous cards pushed into fan positions
  cardFanRotations: [-22, -13, -6, 0],
  cardFanX: [-70, -40, -16, 0],        // px — all fan to the left
};
