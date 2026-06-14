import { NextRequest, NextResponse } from "next/server";
import { requireEaSession } from "@/lib/ea-api-auth";
import { dedupeDbMeetings } from "@/lib/ea-meeting-schedule";
import { createMeeting, listMeetings } from "@/lib/meetings-store";
import type { MeetingPlatform } from "@/lib/meetings-store";

export async function GET(request: NextRequest) {
  const auth = await requireEaSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const rawMeetings = await listMeetings(auth.sessionId);
    const meetings = dedupeDbMeetings(rawMeetings);
    return NextResponse.json({ meetings });
  } catch (error) {
    console.error("[ea/meetings GET] error:", error);
    return NextResponse.json(
      { error: "Failed to list meetings." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireEaSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { meetingUrl, title, scheduledAt, meetingPlatform } = body as {
      meetingUrl?: string;
      title?: string;
      scheduledAt?: string;
      meetingPlatform?: MeetingPlatform;
    };

    if (!meetingUrl?.trim() && !title?.trim()) {
      return NextResponse.json(
        { error: "Meeting URL or title is required." },
        { status: 400 },
      );
    }

    const meeting = await createMeeting(auth.sessionId, {
      meetingUrl: meetingUrl?.trim(),
      title: title?.trim(),
      scheduledAt,
      meetingPlatform,
    });

    return NextResponse.json({ meeting }, { status: 201 });
  } catch (error) {
    console.error("[ea/meetings POST] error:", error);
    return NextResponse.json(
      { error: "Failed to create meeting." },
      { status: 500 },
    );
  }
}
