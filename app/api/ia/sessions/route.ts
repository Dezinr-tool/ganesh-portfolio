import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  createIaSession,
  getIaSession,
  updateIaSession,
} from "@/lib/ia/db-store";
import {
  extractClientName,
  extractProductName,
  extractProductType,
} from "@/lib/ia/question-flow";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required." }, { status: 400 });
  }

  try {
    const session = await getIaSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }
    return NextResponse.json({ session });
  } catch (error) {
    console.error("[ia/sessions] GET error:", error);
    return NextResponse.json({ error: "Failed to load session." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const sessionId = (body.sessionId as string) || randomUUID();
    const existing = await getIaSession(sessionId);
    if (existing) {
      return NextResponse.json({ session: existing });
    }
    const session = await createIaSession(sessionId);
    return NextResponse.json({ session });
  } catch (error) {
    console.error("[ia/sessions] POST error:", error);
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

    const answers = body.answers as Record<string, unknown> | undefined;
    const patch: Parameters<typeof updateIaSession>[1] = {};

    if (answers) {
      patch.answers = answers;
      patch.client_name = extractClientName(answers);
      patch.project_name = extractProductName(answers);
      patch.product_type = extractProductType(answers);
    }
    if (body.ia_output) {
      patch.ia_output = body.ia_output;
    }
    if (body.status) {
      patch.status = body.status;
    }

    const existing = await getIaSession(sessionId);
    if (!existing) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    await updateIaSession(sessionId, patch);
    const session = await getIaSession(sessionId);
    return NextResponse.json({ session });
  } catch (error) {
    console.error("[ia/sessions] PATCH error:", error);
    return NextResponse.json({ error: "Failed to update session." }, { status: 500 });
  }
}
