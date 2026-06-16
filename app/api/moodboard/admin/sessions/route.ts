import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyEaAuthCookie } from "@/lib/ea-auth";
import { listSessionsAnalytics } from "@/lib/moodboard/analytics";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const cookieStore = await cookies();
  const auth = cookieStore.get("ea_auth")?.value;
  if (!verifyEaAuthCookie(auth)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const sessions = await listSessionsAnalytics();
    return NextResponse.json({ sessions, count: sessions.length });
  } catch (error) {
    console.error("[moodboard/admin/sessions] GET error:", error);
    return NextResponse.json({ error: "Failed to load sessions." }, { status: 500 });
  }
}
