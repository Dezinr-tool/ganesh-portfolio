import { NextRequest, NextResponse } from "next/server";
import { requireEaSession } from "@/lib/ea-api-auth";
import { fetchAndSaveMeetTranscript } from "@/lib/meet-transcript-fetcher";
import { processMeetingFull } from "@/lib/meeting-pipeline";
import { getMeetingById, listMeetings } from "@/lib/meetings-store";
import { getGoogleAccessToken, isCalendarConnected } from "@/lib/google-calendar";

const PENDING_STATUSES = new Set(["pending", "joining", "recording", "processing"]);

export async function POST(request: NextRequest) {
  const auth = await requireEaSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const connected = await isCalendarConnected(auth.sessionId);
    if (!connected) {
      return NextResponse.json(
        { error: "Google account not connected. Connect calendar from dashboard." },
        { status: 400 },
      );
    }

    const accessToken = await getGoogleAccessToken(auth.sessionId);
    if (!accessToken) {
      return NextResponse.json(
        { error: "Could not obtain Google access token." },
        { status: 400 },
      );
    }

    const meetings = await listMeetings(auth.sessionId);
    const pending = meetings.filter(
      (m) =>
        PENDING_STATUSES.has(m.status) &&
        m.meetingPlatform === "google_meet" &&
        m.meetingUrl,
    );

    let synced = 0;
    let processed = 0;

    for (const meeting of pending) {
      const hadTranscript = !!meeting.rawTranscript?.trim();

      const transcript = await fetchAndSaveMeetTranscript(
        meeting.id,
        auth.sessionId,
        accessToken,
      );

      if (transcript && !hadTranscript) {
        synced += 1;
      }

      if (!transcript) continue;

      const current = await getMeetingById(meeting.id, auth.sessionId);
      if (!current?.rawTranscript?.trim()) continue;

      if (current.status !== "done") {
        await processMeetingFull(
          current,
          current.rawTranscript,
          auth.sessionId,
        );
        processed += 1;
      }
    }

    return NextResponse.json({ synced, processed });
  } catch (error) {
    console.error("[ea/meetings/sync POST] error:", error);
    return NextResponse.json(
      { error: "Failed to sync meetings." },
      { status: 500 },
    );
  }
}
