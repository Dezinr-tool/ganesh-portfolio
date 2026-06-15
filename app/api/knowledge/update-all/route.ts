import { NextResponse } from "next/server";
import { updateAllKnowledge } from "@/lib/knowledge-updater";
import { requireKnowledgeAdmin } from "@/lib/knowledge/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST() {
  const denied = await requireKnowledgeAdmin();
  if (denied) return denied;

  try {
    const summary = await updateAllKnowledge("manual");
    return NextResponse.json({ summary });
  } catch (error) {
    console.error("[knowledge/update-all] error:", error);
    return NextResponse.json({ error: "Bulk update failed." }, { status: 500 });
  }
}
