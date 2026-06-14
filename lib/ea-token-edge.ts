/** Cookie names — safe to import from Edge middleware (no Node.js APIs). */
export const EA_AUTH_COOKIE = "ea_auth";
export const EA_TOKEN_COOKIE = "ea_token";

/** SaaS session token: two UUIDs joined by `-` (created via randomUUID). */
const EA_TOKEN_FORMAT =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidEaTokenFormat(token: string | undefined): boolean {
  if (!token?.trim()) return false;
  return EA_TOKEN_FORMAT.test(token.trim());
}

/** Legacy password cookie — non-empty, reasonable charset (full verify in API routes). */
export function isValidLegacyEaAuthFormat(value: string | undefined): boolean {
  if (!value?.trim()) return false;
  const v = value.trim();
  return v.length >= 8 && /^[\w+/.=-]+$/.test(v);
}

/**
 * Edge-safe gate for middleware only — does NOT hit the database.
 * API routes must call requireEaSession() for full validation.
 */
export function hasEaMiddlewareAuth(
  eaToken: string | undefined,
  eaAuth: string | undefined,
): boolean {
  return isValidEaTokenFormat(eaToken) || isValidLegacyEaAuthFormat(eaAuth);
}
