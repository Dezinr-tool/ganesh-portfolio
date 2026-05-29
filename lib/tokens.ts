/** Design tokens mirrored from app/globals.css — use for JS-driven styles (animations, GSAP). */
export const tokens = {
  color: {
    bg: "#FFFFFF",
    bgDark: "#111111",
    bgFooter: "#0A0A0A",
    bgMuted: "#F8F8F8",
    bgCardDark: "#1A1A1A",
    bgCardDarkHover: "#2A2A2A",
    text: "#111111",
    textMuted: "#888888",
    textSecondary: "#555555",
    textSubtle: "#999999",
    textRevealMuted: "#CCCCCC",
    border: "#E5E5E5",
    accent: "#7C3AED",
    accentHover: "#6D28D9",
    accentSoft: "#EDE9FF",
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
    bg: "rgba(255, 255, 255, 0.6)",
    border: "rgba(255, 255, 255, 0.4)",
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
