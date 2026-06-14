import { NextRequest, NextResponse } from "next/server";
import { requireEaSession } from "@/lib/ea-api-auth";
import { getFollowUpById, updateFollowUp } from "@/lib/followups-store";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireEaSession(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const existing = await getFollowUpById(id, auth.sessionId);
  if (!existing) {
    return NextResponse.json({ error: "Follow-up not found." }, { status: 404 });
  }

  if (existing.status === "sent") {
    return NextResponse.json(
      { error: "Sent follow-ups cannot be edited." },
      { status: 400 },
    );
  }

  const status =
    data.status === "draft" ||
    data.status === "approved" ||
    data.status === "sent"
      ? data.status
      : undefined;

  try {
    const followup = await updateFollowUp(id, auth.sessionId, {
      subject:
        typeof data.subject === "string" ? data.subject.trim() : undefined,
      body: typeof data.body === "string" ? data.body.trim() : undefined,
      status,
    });

    return NextResponse.json({ followup });
  } catch (err) {
    console.error("[ea/followups] PATCH failed:", err);
    return NextResponse.json(
      { error: "Failed to update follow-up." },
      { status: 500 },
    );
  }
}
