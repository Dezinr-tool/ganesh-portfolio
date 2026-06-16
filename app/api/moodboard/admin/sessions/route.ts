import { NextResponse } from "next/server";
import { requireMbAdmin } from "@/lib/mb-admin-auth";
import { listSessionsAnalytics } from "@/lib/moodboard/analytics";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireMbAdmin();
  if (denied) return denied;

  try {
    const sessions = await listSessionsAnalytics();
    return NextResponse.json({ sessions, count: sessions.length });
  } catch (error) {
    console.error("[moodboard/admin/sessions] GET error:", error);
    return NextResponse.json({ error: "Failed to load sessions." }, { status: 500 });
  }
}
