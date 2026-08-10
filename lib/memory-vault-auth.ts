export const MEMORY_VAULT_AUTH_COOKIE = "memory_vault_auth";

/** Standalone password gate for /memory-vault — separate from the dashboard and mb-admin passwords. */
export async function createMemoryVaultAuthToken(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${password}:designbyganesh-memory-vault`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyMemoryVaultAuthCookie(
  cookieValue: string | undefined,
): Promise<boolean> {
  const password = process.env.MOODBOARD_MEMORY_PASSWORD;
  if (!password || !cookieValue) return false;
  const expected = await createMemoryVaultAuthToken(password);
  return cookieValue === expected;
}
