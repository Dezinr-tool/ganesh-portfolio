import { NextRequest, NextResponse } from "next/server";
import { getIaScreens, getIaSession } from "@/lib/ia/db-store";
import {
  createWireframeSession,
  getWireframeByIaSession,
  getWireframeScreens,
  getWireframeSession,
  updateWireframeSession,
} from "@/lib/wireframe/db-store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("sessionId");
  const iaSessionId = request.nextUrl.searchParams.get("iaSessionId");

  if (!sessionId && !iaSessionId) {
    return NextResponse.json(
      { error: "sessionId or iaSessionId required." },
      { status: 400 },
    );
  }

  try {
    const session = sessionId
      ? await getWireframeSession(sessionId)
      : await getWireframeByIaSession(iaSessionId!);

    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    const [iaSession, iaScreens, wireframeScreens] = await Promise.all([
      getIaSession(session.ia_session_id),
      getIaScreens(session.ia_session_id),
      getWireframeScreens(session.session_id),
    ]);

    return NextResponse.json({
      session,
      iaSession: iaSession
        ? {
            client_name: iaSession.client_name,
            project_name: iaSession.project_name,
            product_type: iaSession.product_type,
            ia_output: iaSession.ia_output,
          }
        : null,
      iaScreens,
      wireframeScreens,
    });
  } catch (error) {
    console.error("[wireframe/sessions] GET error:", error);
    return NextResponse.json({ error: "Failed to load session." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const iaSessionId = body.iaSessionId as string | undefined;

    if (!iaSessionId) {
      return NextResponse.json({ error: "iaSessionId required." }, { status: 400 });
    }

    const iaSession = await getIaSession(iaSessionId);
    if (!iaSession || iaSession.status !== "complete") {
      return NextResponse.json(
        { error: "IA session not found or incomplete." },
        { status: 400 },
      );
    }

    const sessionId =
      (body.sessionId as string | undefined) ?? `wireframe-${iaSessionId}`;

    let session =
      (await getWireframeSession(sessionId)) ??
      (await getWireframeByIaSession(iaSessionId));

    if (!session) {
      session = await createWireframeSession({
        sessionId,
        iaSessionId,
        clientName: iaSession.client_name ?? undefined,
        projectName: iaSession.project_name ?? undefined,
      });
    }

    const [iaScreens, wireframeScreens] = await Promise.all([
      getIaScreens(iaSessionId),
      getWireframeScreens(session.session_id),
    ]);

    return NextResponse.json({
      session,
      iaSession: {
        client_name: iaSession.client_name,
        project_name: iaSession.project_name,
        product_type: iaSession.product_type,
        ia_output: iaSession.ia_output,
      },
      iaScreens,
      wireframeScreens,
    });
  } catch (error) {
    console.error("[wireframe/sessions] POST error:", error);
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

    const patch: Parameters<typeof updateWireframeSession>[1] = {};
    if (body.selected_screens) patch.selected_screens = body.selected_screens;
    if (body.screen_notes) patch.screen_notes = body.screen_notes;
    if (body.status) patch.status = body.status;

    await updateWireframeSession(sessionId, patch);

    const session = await getWireframeSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error("[wireframe/sessions] PATCH error:", error);
    return NextResponse.json({ error: "Failed to update session." }, { status: 500 });
  }
}
