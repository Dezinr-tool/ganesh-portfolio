import { NextRequest, NextResponse } from "next/server";
import { requireMbAdmin } from "@/lib/mb-admin-auth";
import { deleteQuestion, updateQuestion } from "@/lib/moodboard/db-store";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const denied = await requireMbAdmin();
  if (denied) return denied;

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));

  try {
    const question = await updateQuestion(id, body);
    if (!question) {
      return NextResponse.json({ error: "Question not found." }, { status: 404 });
    }
    return NextResponse.json({ question });
  } catch (error) {
    console.error("[moodboard/admin/questions/id] PATCH error:", error);
    return NextResponse.json({ error: "Failed to update." }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const denied = await requireMbAdmin();
  if (denied) return denied;

  const { id } = await context.params;

  try {
    const ok = await deleteQuestion(id);
    if (!ok) {
      return NextResponse.json({ error: "Question not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[moodboard/admin/questions/id] DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete." }, { status: 500 });
  }
}
