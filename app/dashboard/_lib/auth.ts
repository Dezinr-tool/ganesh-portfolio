export const DASHBOARD_AUTH_COOKIE = "dashboard-auth";

export async function createDashboardAuthToken(
  password: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${password}:designbyganesh-dashboard`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyDashboardAuthCookie(
  cookieValue: string | undefined,
): Promise<boolean> {
  const password = process.env.DASHBOARD_PASSWORD;
  if (!password || !cookieValue) return false;
  const expected = await createDashboardAuthToken(password);
  return cookieValue === expected;
}
