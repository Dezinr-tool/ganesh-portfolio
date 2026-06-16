import { NextRequest, NextResponse } from "next/server";
import { listKnowledgeUpdates } from "@/lib/knowledge/db";
import { requireKnowledgeAdmin } from "@/lib/knowledge/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = await requireKnowledgeAdmin(request);
  if (denied) return denied;

  try {
    const limit = Number(request.nextUrl.searchParams.get("limit") ?? "50");
    const updates = await listKnowledgeUpdates(Math.min(limit, 200));
    return NextResponse.json({ updates, count: updates.length });
  } catch (error) {
    console.error("[knowledge/updates] error:", error);
    return NextResponse.json({ error: "Failed to load updates." }, { status: 500 });
  }
}
