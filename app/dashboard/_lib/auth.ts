export const DASHBOARD_AUTH_COOKIE = "dashboard-auth";

/** Routes gated by dashboard password + cookie (see middleware.ts). */
export const DASHBOARD_PROTECTED_PREFIXES = [
  "/dashboard",
  "/tools",
  "/design-audit",
  "/ia",
  "/wireframe",
  "/knowledge-admin",
  "/zoox-demo",
  "/max",
  "/moodboard",
  "/api/invoices",
  "/api/agreements",
  "/api/settings",
  "/api/dashboard",
  "/api/design-audit",
  "/api/ia",
  "/api/wireframe",
  "/api/knowledge",
  "/api/moodboard",
  "/api/pre-generation",
] as const;

export function isDashboardProtectedPath(pathname: string): boolean {
  return DASHBOARD_PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isDashboardLoginRedirect(pathname: string): boolean {
  if (pathname === "/dashboard/login") return false;
  return isDashboardProtectedPath(pathname);
}

export function isDashboardAuthExempt(pathname: string): boolean {
  return (
    pathname.startsWith("/dashboard/login") ||
    pathname === "/api/moodboard/admin/auth"
  );
}

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
