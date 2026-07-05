import { NextRequest, NextResponse } from "next/server";
import { requireMbAdmin } from "@/lib/mb-admin-auth";
import { getMemoryCorpus } from "@/lib/moodboard/memory-corpus";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = await requireMbAdmin();
  if (denied) return denied;

  try {
    const limit = Number(request.nextUrl.searchParams.get("limit") ?? "1000");
    const corpus = await getMemoryCorpus(limit);
    return NextResponse.json(corpus);
  } catch (error) {
    console.error("[moodboard/memory] GET error:", error);
    return NextResponse.json({ error: "Failed to load memory corpus." }, { status: 500 });
  }
}
