import { NextRequest, NextResponse } from "next/server";
import { researchAndUpdateKnowledge } from "@/lib/knowledge-updater";
import { requireKnowledgeAdmin } from "@/lib/knowledge/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type RouteParams = { params: Promise<{ fileName: string }> };

export async function POST(_request: NextRequest, { params }: RouteParams) {
  const denied = await requireKnowledgeAdmin();
  if (denied) return denied;

  try {
    const { fileName } = await params;
    const decoded = decodeURIComponent(fileName);
    const result = await researchAndUpdateKnowledge(decoded, {
      force: true,
      updateSource: "manual",
    });
    return NextResponse.json({ result });
  } catch (error) {
    console.error("[knowledge/update/fileName] error:", error);
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }
}
