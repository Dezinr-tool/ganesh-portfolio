import { NextRequest, NextResponse } from "next/server";
import { requireEaSession } from "@/lib/ea-api-auth";
import {
  clearMemories,
  getMemoryCount,
  getRecentMemories,
  saveMemory,
  type MemoryCategory,
  type MemorySource,
} from "@/lib/memory-store";

export async function GET(request: NextRequest) {
  const auth = await requireEaSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? 10), 50);
    const category = searchParams.get("category") as MemoryCategory | null;

    const memories = await getRecentMemories(
      auth.sessionId,
      limit,
      category ?? undefined,
    );
    const count = await getMemoryCount(auth.sessionId);

    return NextResponse.json({ memories, count });
  } catch (error) {
    console.error("[ea/memory GET] error:", error);
    return NextResponse.json(
      { error: "Failed to load memories." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireEaSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const content = body.content?.trim();

    if (!content) {
      return NextResponse.json(
        { error: "Content is required." },
        { status: 400 },
      );
    }

    const category = (body.category ?? "context") as MemoryCategory;
    const source = (body.source ?? "manual") as MemorySource;
    const importance =
      typeof body.importance === "number" ? body.importance : 5;
    const metadata =
      body.clientName !== undefined ||
      body.projectName !== undefined ||
      body.sentimentScore !== undefined
        ? {
            clientName: body.clientName ?? null,
            projectName: body.projectName ?? null,
            sentimentScore:
              typeof body.sentimentScore === "number"
                ? body.sentimentScore
                : null,
          }
        : undefined;

    const id = await saveMemory(
      auth.sessionId,
      content,
      category,
      source,
      importance,
      metadata,
    );

    const count = await getMemoryCount(auth.sessionId);

    return NextResponse.json({ id, saved: true, count }, { status: 201 });
  } catch (error) {
    console.error("[ea/memory POST] error:", error);
    return NextResponse.json(
      { error: "Failed to save memory." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireEaSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const count = await clearMemories(auth.sessionId);
    return NextResponse.json({ cleared: true, count });
  } catch (error) {
    console.error("[ea/memory DELETE] error:", error);
    return NextResponse.json(
      { error: "Failed to clear memories." },
      { status: 500 },
    );
  }
}
