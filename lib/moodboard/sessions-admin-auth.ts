import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { isBrainOwner } from "@/lib/brain-owner-auth";
import {
  MB_ADMIN_AUTH_COOKIE,
  verifyMbAdminAuthCookie,
} from "@/lib/mb-admin-auth";

/** Brain owner token (x-owner-token) or mb_admin cookie — for sessions admin API. */
export async function requireSessionsAdmin(
  request: NextRequest,
): Promise<NextResponse | null> {
  if (isBrainOwner(request)) return null;

  const cookieStore = await cookies();
  const auth = cookieStore.get(MB_ADMIN_AUTH_COOKIE)?.value;
  if (verifyMbAdminAuthCookie(auth)) return null;

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
