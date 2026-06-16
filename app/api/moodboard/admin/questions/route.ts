import { NextRequest, NextResponse } from "next/server";
import { requireMbAdmin } from "@/lib/mb-admin-auth";
import {
  createQuestion,
  getAllQuestions,
  reorderQuestions,
} from "@/lib/moodboard/db-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireMbAdmin();
  if (denied) return denied;

  try {
    const questions = await getAllQuestions();
    return NextResponse.json({ questions });
  } catch (error) {
    console.error("[moodboard/admin/questions] GET error:", error);
    return NextResponse.json({ error: "Failed to load questions." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireMbAdmin();
  if (denied) return denied;

  try {
    const body = await request.json();
    const question = await createQuestion({
      key: body.key ?? `custom_${Date.now()}`,
      question_text: body.question_text ?? "New question",
      question_type: body.question_type ?? "open",
      parent_key: body.parent_key ?? null,
      chips_options: body.chips_options ?? null,
      follow_up_condition: body.follow_up_condition ?? null,
      category: body.category ?? "brand_basics",
      order_index: body.order_index ?? 999,
    });
    return NextResponse.json({ question });
  } catch (error) {
    console.error("[moodboard/admin/questions] POST error:", error);
    return NextResponse.json({ error: "Failed to create question." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const denied = await requireMbAdmin();
  if (denied) return denied;

  try {
    const body = await request.json();
    const orderedIds = body.orderedIds as string[];
    if (!Array.isArray(orderedIds)) {
      return NextResponse.json({ error: "orderedIds required." }, { status: 400 });
    }
    await reorderQuestions(orderedIds);
    const questions = await getAllQuestions();
    return NextResponse.json({ questions });
  } catch (error) {
    console.error("[moodboard/admin/questions] PUT error:", error);
    return NextResponse.json({ error: "Failed to reorder." }, { status: 500 });
  }
}
