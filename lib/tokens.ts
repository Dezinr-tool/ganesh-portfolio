/** Design tokens mirrored from app/globals.css — use for JS-driven styles (animations, GSAP). */
export const tokens = {
  color: {
    bg: "#0A0A0A",
    bgDark: "#0A0A0A",
    bgFooter: "#0A0A0A",
    bgMuted: "#111111",
    bgCardDark: "#141414",
    bgCardDarkHover: "#1F1F1F",
    text: "#F0F0F0",
    textMuted: "rgba(255, 255, 255, 0.45)",
    textSecondary: "rgba(255, 255, 255, 0.65)",
    textSubtle: "rgba(255, 255, 255, 0.35)",
    textRevealMuted: "#3A3A3A",
    border: "rgba(255, 255, 255, 0.12)",
    accent: "#FF1E00",
    accentHover: "#FF4529",
    accentSoft: "rgba(255, 30, 0, 0.12)",
    linkedin: "#0A66C2",
    success: "#22C55E",
  },
  typography: {
    bodyLg: "clamp(1.4rem, 2.5vw, 2.25rem)",
    body: "1rem",
    label: "0.8125rem",
    headingSection: "2.5rem",
    fontWeightBody: 500,
    fontWeightHeading: 800,
  },
  glass: {
    bg: "rgba(255, 255, 255, 0.1)",
    border: "rgba(255, 255, 255, 0.35)",
    blur: "12px",
  },
} as const;

/** CSS variable references for inline styles */
export const cssVar = {
  colorText: "var(--color-text)",
  colorTextMuted: "var(--color-text-muted)",
  colorTextRevealMuted: "var(--color-text-reveal-muted)",
  colorBgDark: "var(--color-bg-dark)",
  colorAccent: "var(--color-accent)",
  colorSuccess: "var(--color-success)",
} as const;
