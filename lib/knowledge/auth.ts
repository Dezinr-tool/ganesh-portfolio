import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { isBrainOwner } from "@/lib/brain-owner-auth";
import {
  MB_ADMIN_AUTH_COOKIE,
  verifyMbAdminAuthCookie,
} from "@/lib/mb-admin-auth";

export async function requireKnowledgeAdmin(request?: NextRequest) {
  if (request && isBrainOwner(request)) return null;

  const cookieStore = await cookies();
  const auth = cookieStore.get(MB_ADMIN_AUTH_COOKIE)?.value;
  if (!(await verifyMbAdminAuthCookie(auth))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
