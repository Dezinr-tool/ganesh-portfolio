import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyEaAuthCookie } from "@/lib/ea-auth";

export async function requireKnowledgeAdmin() {
  const cookieStore = await cookies();
  const auth = cookieStore.get("ea_auth")?.value;
  if (!verifyEaAuthCookie(auth)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
