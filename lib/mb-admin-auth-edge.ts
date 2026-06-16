/** Edge-safe moodboard admin gate for middleware (no Node.js APIs). */
export const MB_ADMIN_AUTH_COOKIE = "mb_admin_auth";
export const MB_ADMIN_SESSION_VALUE = "true";

export function hasMbAdminAuth(cookieValue: string | undefined): boolean {
  return cookieValue === MB_ADMIN_SESSION_VALUE;
}
