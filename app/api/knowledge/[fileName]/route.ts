import { NextRequest, NextResponse } from "next/server";
import {
  getKnowledgeByFileName,
  saveKnowledgeManualEdit,
} from "@/lib/knowledge/db";
import { requireKnowledgeAdmin } from "@/lib/knowledge/auth";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ fileName: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const denied = await requireKnowledgeAdmin();
  if (denied) return denied;

  try {
    const { fileName } = await params;
    const decoded = decodeURIComponent(fileName);
    const entry = await getKnowledgeByFileName(decoded);
    if (!entry) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    return NextResponse.json({ entry });
  } catch (error) {
    console.error("[knowledge/fileName] GET error:", error);
    return NextResponse.json({ error: "Failed to load entry." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const denied = await requireKnowledgeAdmin();
  if (denied) return denied;

  try {
    const { fileName } = await params;
    const decoded = decodeURIComponent(fileName);
    const body = await request.json();
    const content = typeof body.content === "string" ? body.content : "";
    if (!content.trim()) {
      return NextResponse.json({ error: "content is required." }, { status: 400 });
    }

    const entry = await saveKnowledgeManualEdit(
      decoded,
      content,
      Array.isArray(body.sources) ? body.sources : undefined,
    );
    return NextResponse.json({ entry });
  } catch (error) {
    console.error("[knowledge/fileName] PUT error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save." },
      { status: 500 },
    );
  }
}
