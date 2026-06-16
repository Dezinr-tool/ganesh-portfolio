import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const MB_ADMIN_AUTH_COOKIE = "mb_admin_auth";
export const MB_ADMIN_SESSION_VALUE = "true";

export function verifyMbAdminAuthCookie(cookieValue: string | undefined): boolean {
  return cookieValue === MB_ADMIN_SESSION_VALUE;
}

export async function requireMbAdmin() {
  const cookieStore = await cookies();
  const auth = cookieStore.get(MB_ADMIN_AUTH_COOKIE)?.value;
  if (!verifyMbAdminAuthCookie(auth)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
