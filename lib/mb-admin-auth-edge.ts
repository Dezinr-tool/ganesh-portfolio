/** Edge-safe moodboard admin gate for middleware (no Node.js APIs). */
export const MB_ADMIN_AUTH_COOKIE = "mb_admin_auth";

/** Cookie value derived from the admin password, so it cannot be forged without knowing it. */
export async function createMbAdminAuthToken(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${password}:designbyganesh-mb-admin`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function hasMbAdminAuth(cookieValue: string | undefined): Promise<boolean> {
  const password = process.env.EA_PASSWORD;
  if (!password || !cookieValue) return false;
  return cookieValue === (await createMbAdminAuthToken(password));
}
