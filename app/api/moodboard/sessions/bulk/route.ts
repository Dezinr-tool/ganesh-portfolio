import { NextRequest, NextResponse } from "next/server";
import { requireSessionsAdmin } from "@/lib/moodboard/sessions-admin-auth";
import { isValidMoodboardSessionId } from "@/lib/moodboard/analytics";
import { deleteMoodboardSessionsBulk } from "@/lib/moodboard/delete-session";

export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
  const denied = await requireSessionsAdmin(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const ids = body.ids as unknown;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids array required." }, { status: 400 });
    }

    const validIds = ids.filter(
      (id): id is string => typeof id === "string" && isValidMoodboardSessionId(id),
    );

    if (validIds.length === 0) {
      return NextResponse.json({ error: "No valid session ids." }, { status: 400 });
    }

    const deleted = await deleteMoodboardSessionsBulk(validIds);

    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    console.error("[moodboard/sessions/bulk] DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete sessions." }, { status: 500 });
  }
}
