import { NextRequest, NextResponse } from "next/server";
import { requireEaSession } from "@/lib/ea-api-auth";
import { getMeetingById, updateMeeting } from "@/lib/meetings-store";
import {
  formatTranscriptForAI,
  transcribeAudio,
} from "@/lib/transcription";
import { processMeetingFull } from "@/lib/meeting-pipeline";

type RouteContext = { params: Promise<{ id: string }> };

const ALLOWED_MIME = new Set([
  "audio/webm",
  "audio/mp4",
  "audio/m4a",
  "audio/wav",
  "audio/x-m4a",
  "audio/mpeg",
]);

const MAX_BYTES = 25 * 1024 * 1024;

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireEaSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await context.params;
    const meeting = await getMeetingById(id, auth.sessionId);

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found." }, { status: 404 });
    }

    const contentType = request.headers.get("content-type") ?? "";
    let transcript = "";

    if (contentType.includes("application/json")) {
      const body = await request.json();
      transcript = body.text?.trim() ?? "";
      if (!transcript) {
        return NextResponse.json(
          { error: "Transcript text is required." },
          { status: 400 },
        );
      }
    } else {
      const formData = await request.formData();
      const file = formData.get("audio");

      if (!(file instanceof File)) {
        return NextResponse.json(
          { error: "Audio file is required." },
          { status: 400 },
        );
      }

      if (file.size > MAX_BYTES) {
        return NextResponse.json(
          { error: "File must be under 25MB." },
          { status: 400 },
        );
      }

      const mimeType = file.type || "audio/webm";
      if (!ALLOWED_MIME.has(mimeType)) {
        return NextResponse.json(
          { error: "Unsupported audio format." },
          { status: 400 },
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await transcribeAudio(buffer, mimeType);
      transcript = formatTranscriptForAI(result);

      if (!transcript.trim()) {
        return NextResponse.json(
          { error: "Transcription failed or returned empty text." },
          { status: 502 },
        );
      }
    }

    await updateMeeting(id, auth.sessionId, {
      rawTranscript: transcript,
      status: "processing",
    });

    const refreshed = await getMeetingById(id, auth.sessionId);
    if (!refreshed) {
      return NextResponse.json({ error: "Meeting not found." }, { status: 404 });
    }

    void processMeetingFull(refreshed, transcript, auth.sessionId).catch(
      (error) => {
        console.error("[ea/meetings/[id]/transcript] process error:", error);
      },
    );

    return NextResponse.json({
      transcript,
      meetingId: id,
      processingStarted: true,
    });
  } catch (error) {
    console.error("[ea/meetings/[id]/transcript] error:", error);
    return NextResponse.json(
      { error: "Failed to save transcript." },
      { status: 500 },
    );
  }
}
