import "server-only";

import { getSetting, setSetting } from "@/lib/settings-store";
import {
  DEFAULT_DESIGN_TOKENS,
  DESIGN_TOKEN_KEYS,
  designTokensCssText,
  designTokensToCssProperties,
  isValidHexColor,
  normalizeHexColor,
  type DesignTokens,
  type DesignTokensPatch,
} from "@/lib/design-tokens-shared";

export {
  DEFAULT_DESIGN_TOKENS,
  DESIGN_TOKEN_KEYS,
  designTokensCssText,
  designTokensToCssProperties,
  isValidHexColor,
  normalizeHexColor,
  type DesignTokens,
  type DesignTokensPatch,
};

function resolveToken(stored: string | null, fallback: string): string {
  if (!stored) return fallback;
  if (!isValidHexColor(stored)) return fallback;
  return normalizeHexColor(stored);
}

export async function ensureDesignTokenDefaults(): Promise<void> {
  const entries: [string, string][] = [
    [DESIGN_TOKEN_KEYS.bg, DEFAULT_DESIGN_TOKENS.bg],
    [DESIGN_TOKEN_KEYS.text, DEFAULT_DESIGN_TOKENS.text],
    [DESIGN_TOKEN_KEYS.accent, DEFAULT_DESIGN_TOKENS.accent],
  ];

  for (const [key, value] of entries) {
    const existing = await getSetting(key);
    if (existing === null) {
      await setSetting(key, value);
    }
  }

  const accent = await getSetting(DESIGN_TOKEN_KEYS.accent);
  if (accent?.toUpperCase() === "#FF3366") {
    await setSetting(DESIGN_TOKEN_KEYS.accent, DEFAULT_DESIGN_TOKENS.accent);
  }
}

export async function getDesignTokens(): Promise<DesignTokens> {
  try {
    await ensureDesignTokenDefaults();

    const [bg, text, accent] = await Promise.all([
      getSetting(DESIGN_TOKEN_KEYS.bg),
      getSetting(DESIGN_TOKEN_KEYS.text),
      getSetting(DESIGN_TOKEN_KEYS.accent),
    ]);

    return {
      bg: resolveToken(bg, DEFAULT_DESIGN_TOKENS.bg),
      text: resolveToken(text, DEFAULT_DESIGN_TOKENS.text),
      accent: resolveToken(accent, DEFAULT_DESIGN_TOKENS.accent),
    };
  } catch {
    return { ...DEFAULT_DESIGN_TOKENS };
  }
}

export async function updateDesignTokens(
  patch: DesignTokensPatch,
): Promise<DesignTokens> {
  const updates: Promise<void>[] = [];

  if (patch.bg !== undefined) {
    updates.push(
      setSetting(DESIGN_TOKEN_KEYS.bg, normalizeHexColor(patch.bg)),
    );
  }

  if (patch.text !== undefined) {
    updates.push(
      setSetting(DESIGN_TOKEN_KEYS.text, normalizeHexColor(patch.text)),
    );
  }

  if (patch.accent !== undefined) {
    updates.push(
      setSetting(DESIGN_TOKEN_KEYS.accent, normalizeHexColor(patch.accent)),
    );
  }

  if (updates.length === 0) {
    throw new Error("No design tokens to update.");
  }

  await Promise.all(updates);
  return getDesignTokens();
}
