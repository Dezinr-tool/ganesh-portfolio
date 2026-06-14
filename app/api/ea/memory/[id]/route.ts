import { NextRequest, NextResponse } from "next/server";
import { requireEaSession } from "@/lib/ea-api-auth";
import { deleteMemory } from "@/lib/memory-store";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireEaSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await context.params;
    const deleted = await deleteMemory(id, auth.sessionId);

    if (!deleted) {
      return NextResponse.json({ error: "Memory not found." }, { status: 404 });
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("[ea/memory/[id] DELETE] error:", error);
    return NextResponse.json(
      { error: "Failed to delete memory." },
      { status: 500 },
    );
  }
}
