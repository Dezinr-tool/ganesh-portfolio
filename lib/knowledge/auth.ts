import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { verifyEaAuthCookie } from "@/lib/ea-auth";
import { isBrainOwner } from "@/lib/brain-owner-auth";

export async function requireKnowledgeAdmin(request?: NextRequest) {
  if (request && isBrainOwner(request)) return null;

  const cookieStore = await cookies();
  const auth = cookieStore.get("ea_auth")?.value;
  if (!verifyEaAuthCookie(auth)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
