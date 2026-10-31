import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  MB_ADMIN_AUTH_COOKIE,
  createMbAdminAuthToken,
  hasMbAdminAuth,
} from "@/lib/mb-admin-auth-edge";

export { MB_ADMIN_AUTH_COOKIE, createMbAdminAuthToken };

export function verifyMbAdminAuthCookie(cookieValue: string | undefined): Promise<boolean> {
  return hasMbAdminAuth(cookieValue);
}

export async function requireMbAdmin() {
  const cookieStore = await cookies();
  const auth = cookieStore.get(MB_ADMIN_AUTH_COOKIE)?.value;
  if (!(await verifyMbAdminAuthCookie(auth))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
