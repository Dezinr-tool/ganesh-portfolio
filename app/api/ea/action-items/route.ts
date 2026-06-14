import { NextRequest, NextResponse } from "next/server";
import { requireEaSession } from "@/lib/ea-api-auth";
import { listOpenActionItemsGrouped } from "@/lib/meetings-store";

export async function GET(request: NextRequest) {
  const auth = await requireEaSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const grouped = await listOpenActionItemsGrouped(auth.sessionId);
    const total =
      grouped.my_task.length +
      grouped.assigned_task.length +
      grouped.team_task.length;

    return NextResponse.json({
      my_task: grouped.my_task,
      assigned_task: grouped.assigned_task,
      team_task: grouped.team_task,
      total,
      actionItems: [
        ...grouped.my_task,
        ...grouped.assigned_task,
        ...grouped.team_task,
      ],
    });
  } catch (error) {
    console.error("[ea/action-items GET] error:", error);
    return NextResponse.json(
      { error: "Failed to list action items." },
      { status: 500 },
    );
  }
}
