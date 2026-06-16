import { NextResponse } from "next/server";
import { getActiveQuestions } from "@/lib/moodboard/db-store";
import { MOODBOARD_QUESTION_SEED } from "@/lib/moodboard/question-seed";
import type { MoodboardQuestion } from "@/lib/moodboard/db-types";

export const dynamic = "force-dynamic";

function seedFallback(): MoodboardQuestion[] {
  return MOODBOARD_QUESTION_SEED.map((q) => ({
    ...q,
    id: `seed-${q.key}`,
    is_active: true,
    created_at: new Date().toISOString(),
    chips_options: q.chips_options,
  }));
}

export async function GET() {
  try {
    const questions = await getActiveQuestions();
    if (questions.length === 0) {
      return NextResponse.json({ questions: seedFallback(), fallback: true });
    }
    return NextResponse.json({ questions });
  } catch (error) {
    console.error("[moodboard/questions] error:", error);
    return NextResponse.json({ questions: seedFallback(), fallback: true });
  }
}
