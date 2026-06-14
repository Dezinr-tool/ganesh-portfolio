import { NextRequest, NextResponse } from "next/server";
import { requireEaSession } from "@/lib/ea-api-auth";
import { updateActionItemStatus } from "@/lib/meetings-store";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireEaSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const status = body.status as "open" | "done" | "cancelled" | undefined;

    if (!status || !["open", "done", "cancelled"].includes(status)) {
      return NextResponse.json(
        { error: "Valid status required: open, done, cancelled." },
        { status: 400 },
      );
    }

    const item = await updateActionItemStatus(id, auth.sessionId, status);
    if (!item) {
      return NextResponse.json(
        { error: "Action item not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ actionItem: item });
  } catch (error) {
    console.error("[ea/action-items/[id] PATCH] error:", error);
    return NextResponse.json(
      { error: "Failed to update action item." },
      { status: 500 },
    );
  }
}
