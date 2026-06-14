import { NextRequest, NextResponse } from "next/server";
import { requireEaSession } from "@/lib/ea-api-auth";
import {
  countPendingFollowUps,
  createFollowUp,
  listFollowUps,
} from "@/lib/followups-store";

export async function GET(request: NextRequest) {
  const auth = await requireEaSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const followups = await listFollowUps(auth.sessionId);
    const pendingCount = await countPendingFollowUps(auth.sessionId);
    return NextResponse.json({ followups, pendingCount });
  } catch (err) {
    console.error("[ea/followups] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to load follow-ups." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireEaSession(request);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const recipientEmail =
    typeof data.recipientEmail === "string" ? data.recipientEmail.trim() : "";
  const subject =
    typeof data.subject === "string" ? data.subject.trim() : "";
  const bodyText = typeof data.body === "string" ? data.body.trim() : "";

  if (!recipientEmail || !subject || !bodyText) {
    return NextResponse.json(
      { error: "Recipient email, subject, and body are required." },
      { status: 400 },
    );
  }

  try {
    const followup = await createFollowUp(auth.sessionId, {
      meetingId:
        typeof data.meetingId === "string" ? data.meetingId : null,
      recipientEmail,
      recipientName:
        typeof data.recipientName === "string" ? data.recipientName : null,
      subject,
      body: bodyText,
      status: "draft",
    });
    return NextResponse.json({ followup });
  } catch (err) {
    console.error("[ea/followups] POST failed:", err);
    return NextResponse.json(
      { error: "Failed to create follow-up." },
      { status: 500 },
    );
  }
}
