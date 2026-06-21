/** Design tokens — ONLY --color-bg, --color-text, --color-accent are allowed. */
export const tokens = {
  color: {
    bg: "#FFFFFF",
    text: "#111111",
    accent: "#FF3366",
  },
  typography: {
    bodyLg: "clamp(1.4rem, 2.5vw, 2.25rem)",
    body: "1rem",
    label: "0.8125rem",
    headingSection: "2.5rem",
    fontWeightBody: 500,
    fontWeightHeading: 800,
  },
} as const;

/** CSS variable references for inline styles */
export const cssVar = {
  colorBg: "var(--color-bg)",
  colorText: "var(--color-text)",
  colorAccent: "var(--color-accent)",
} as const;
