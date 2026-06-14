export const EA_AUTH_COOKIE = "ea_auth";

/** Stable cookie value — base64url avoids special-char encoding issues in cookies. */
export function getEaSessionValue(): string {
  const password = process.env.EA_PASSWORD;
  if (!password) return "";
  return Buffer.from(password, "utf8").toString("base64url");
}

export function verifyEaAuthCookie(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;

  const expected = getEaSessionValue();
  if (expected && cookieValue === expected) return true;

  // Legacy cookies that stored the raw password before base64url encoding
  const password = process.env.EA_PASSWORD;
  return !!password && cookieValue === password;
}

/** Stable session identifier from EA auth cookie — used for conversation persistence. */
export function getEaSessionId(cookieValue: string | undefined): string | null {
  if (!verifyEaAuthCookie(cookieValue)) return null;
  return cookieValue ?? null;
}
