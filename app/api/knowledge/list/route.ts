import { NextRequest, NextResponse } from "next/server";
import { listKnowledgeEntries } from "@/lib/knowledge/db";
import { requireKnowledgeAdmin } from "@/lib/knowledge/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = await requireKnowledgeAdmin(request);
  if (denied) return denied;

  try {
    const entries = await listKnowledgeEntries(true);
    return NextResponse.json({
      entries: entries.map((e) => ({
        id: e.id,
        category: e.category,
        file_name: e.file_name,
        title: e.title,
        version: e.version,
        sources: e.sources,
        last_researched_at: e.last_researched_at,
        last_updated_at: e.last_updated_at,
        next_update_at: e.next_update_at,
        update_frequency: e.update_frequency,
        is_active: e.is_active,
      })),
      count: entries.length,
    });
  } catch (error) {
    console.error("[knowledge/list] error:", error);
    return NextResponse.json({ error: "Failed to list knowledge." }, { status: 500 });
  }
}
