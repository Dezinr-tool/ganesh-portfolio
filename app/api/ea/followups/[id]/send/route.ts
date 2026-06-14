import { NextRequest, NextResponse } from "next/server";
import { requireEaSession } from "@/lib/ea-api-auth";
import { sendFollowUpEmail } from "@/lib/email-service";
import { getFollowUpById, updateFollowUp } from "@/lib/followups-store";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireEaSession(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;

  let body: unknown = {};
  try {
    const text = await request.text();
    if (text.trim()) body = JSON.parse(text);
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
      { error: "This follow-up was already sent." },
      { status: 400 },
    );
  }

  const subject =
    typeof data.subject === "string" && data.subject.trim()
      ? data.subject.trim()
      : existing.subject;
  const bodyText =
    typeof data.body === "string" && data.body.trim()
      ? data.body.trim()
      : existing.body;

  try {
    const result = await sendFollowUpEmail({
      to: existing.recipientEmail,
      recipientName: existing.recipientName,
      subject,
      body: bodyText,
    });

    const followup = await updateFollowUp(id, auth.sessionId, {
      subject,
      body: bodyText,
      status: "sent",
      sentAt: new Date().toISOString(),
      emailId: result.id,
    });

    return NextResponse.json({ followup });
  } catch (err) {
    console.error("[ea/followups/send] failed:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to send follow-up.",
      },
      { status: 500 },
    );
  }
}
