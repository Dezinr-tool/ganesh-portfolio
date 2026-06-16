import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  createSession,
  getSessionBySessionId,
  updateSession,
} from "@/lib/moodboard/db-store";
import {
  extractBrandName,
  extractProjectType,
} from "@/lib/moodboard/question-flow";
import { requireBrainOwner } from "@/lib/brain-owner-auth";
import {
  isValidMoodboardSessionId,
  listAllSessions,
} from "@/lib/moodboard/analytics";
import { backfillBrandFromOpening } from "@/lib/moodboard/session-brand-backfill";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("sessionId");

  if (sessionId) {
    const denied = requireBrainOwner(request);
    if (denied) return denied;
    if (!isValidMoodboardSessionId(sessionId)) {
      return NextResponse.json({ error: "Invalid session id." }, { status: 400 });
    }

    try {
      const session = await getSessionBySessionId(sessionId);
      if (!session) {
        return NextResponse.json({ error: "Session not found." }, { status: 404 });
      }
      return NextResponse.json({ session });
    } catch (error) {
      console.error("[moodboard/sessions] GET error:", error);
      return NextResponse.json({ error: "Failed to load session." }, { status: 500 });
    }
  }

  const denied = requireBrainOwner(request);
  if (denied) return denied;

  try {
    const sessions = await listAllSessions();
    return NextResponse.json({ sessions, count: sessions.length });
  } catch (error) {
    console.error("[moodboard/sessions] list error:", error);
    return NextResponse.json({ error: "Failed to list sessions." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const sessionId = (body.sessionId as string) || randomUUID();
    if (!isValidMoodboardSessionId(sessionId)) {
      return NextResponse.json({ error: "Invalid session id." }, { status: 400 });
    }
    const existing = await getSessionBySessionId(sessionId);
    if (existing) {
      const session = await backfillBrandFromOpening(existing);
      return NextResponse.json({ session });
    }
    const session = await createSession(sessionId);
    return NextResponse.json({ session });
  } catch (error) {
    console.error("[moodboard/sessions] POST error:", error);
    return NextResponse.json({ error: "Failed to create session." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionId = body.sessionId as string;
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required." }, { status: 400 });
    }
    if (!isValidMoodboardSessionId(sessionId)) {
      return NextResponse.json({ error: "Invalid session id." }, { status: 400 });
    }

    const existing = await getSessionBySessionId(sessionId);
    if (!existing) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    const answers = body.answers as Record<string, unknown> | undefined;
    const patch: Parameters<typeof updateSession>[1] = {};

    if (answers) {
      patch.answers = answers;
      patch.brand_name = extractBrandName(answers);
      patch.project_type = extractProjectType(answers);
    }
    if (body.generated_directions) {
      patch.generated_directions = body.generated_directions;
    }
    if (body.selected_direction) {
      patch.selected_direction = body.selected_direction;
    }
    if (body.status) {
      patch.status = body.status;
    }
    if (body.selected_output_sections) {
      patch.selected_output_sections = body.selected_output_sections;
    }
    if (body.selected_model) {
      patch.selected_model = body.selected_model;
    }

    const session = await updateSession(sessionId, patch);
    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }
    return NextResponse.json({ session });
  } catch (error) {
    console.error("[moodboard/sessions] PATCH error:", error);
    return NextResponse.json({ error: "Failed to update session." }, { status: 500 });
  }
}
