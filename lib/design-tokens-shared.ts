/** Client-safe design token types and helpers (no database imports). */

export const DESIGN_TOKEN_KEYS = {
  bg: "brand_color_bg",
  text: "brand_color_text",
  accent: "brand_color_accent",
} as const;

export type DesignTokens = {
  bg: string;
  text: string;
  accent: string;
};

export const DEFAULT_DESIGN_TOKENS: DesignTokens = {
  bg: "#FFFFFF",
  text: "#111111",
  accent: "#FF1E00",
};

const HEX_6 = /^#[0-9A-Fa-f]{6}$/;
const HEX_3 = /^#[0-9A-Fa-f]{3}$/;

export function isValidHexColor(value: string): boolean {
  const trimmed = value.trim();
  return HEX_6.test(trimmed) || HEX_3.test(trimmed);
}

export function normalizeHexColor(value: string): string {
  const trimmed = value.trim();
  if (HEX_6.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  if (HEX_3.test(trimmed)) {
    const hex = trimmed.slice(1);
    return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toUpperCase();
  }
  throw new Error(`Invalid hex color: ${value}`);
}

export function designTokensToCssProperties(
  tokens: DesignTokens,
): Record<"--color-bg" | "--color-text" | "--color-accent", string> {
  return {
    "--color-bg": tokens.bg,
    "--color-text": tokens.text,
    "--color-accent": tokens.accent,
  };
}

export function designTokensCssText(tokens: DesignTokens): string {
  return `:root{--color-bg:${tokens.bg};--color-text:${tokens.text};--color-accent:${tokens.accent};}`;
}

export type DesignTokensPatch = Partial<DesignTokens>;
