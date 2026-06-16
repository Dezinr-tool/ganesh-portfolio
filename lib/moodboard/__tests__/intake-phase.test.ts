import { describe, expect, it } from "vitest";
import {
  conversationSignalsSections,
  shouldOfferSectionsPhase,
  userNeedsPanelHelp,
  userRequestedGeneration,
} from "../intake-phase";
import { replySignalsSectionsPicker } from "../sections-picker-question";

const astroThread = [
  { role: "user", text: "Astro shopify premium astrology gems age 35-50" },
  {
    role: "assistant",
    text: "Use the panel below to select your moodboard elements, then click Generate 3 directions.",
  },
  { role: "user", text: "i cant see panel" },
  {
    role: "assistant",
    text: "Choose the moodboard elements you want below — color, typography, icons, and more.",
  },
];

describe("intake-phase", () => {
  it("detects panel help and generate intents", () => {
    expect(userNeedsPanelHelp("i cant see panel")).toBe(true);
    expect(userRequestedGeneration("just create the moodboard")).toBe(true);
  });

  it("detects assistant section signals in astro thread", () => {
    expect(conversationSignalsSections(astroThread)).toBe(true);
    expect(replySignalsSectionsPicker(astroThread[1]!.text)).toBe(true);
    expect(
      shouldOfferSectionsPhase({
        answers: { q1: "Astro" },
        messages: astroThread,
        directionsCount: 0,
      }),
    ).toBe(true);
  });

  it("does not offer sections when directions exist", () => {
    expect(
      shouldOfferSectionsPhase({
        answers: { q1: "Astro" },
        messages: astroThread,
        directionsCount: 3,
      }),
    ).toBe(false);
  });
});
