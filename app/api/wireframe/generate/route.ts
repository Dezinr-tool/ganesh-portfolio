import { NextRequest, NextResponse } from "next/server";
import { createSseStream, sseResponse } from "@/lib/ai-sse";
import { getIaSession } from "@/lib/ia/db-store";
import { generateWireframeScreen } from "@/lib/wireframe/generator";
import {
  getWireframeSession,
  saveWireframeIntelligence,
  saveWireframeScreen,
  updateWireframeSession,
} from "@/lib/wireframe/db-store";
import type { UserPreConfirmation } from "@/lib/pre-generation-types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionId = body.sessionId as string;
    const iaSessionId = body.iaSessionId as string;
    const stream = body.stream !== false;
    const userConfirmations = body.userConfirmations as UserPreConfirmation | undefined;

    if (!sessionId || !iaSessionId) {
      return NextResponse.json(
        { error: "sessionId and iaSessionId required." },
        { status: 400 },
      );
    }

    const [iaSession, wfSession] = await Promise.all([
      getIaSession(iaSessionId),
      getWireframeSession(sessionId),
    ]);

    if (!iaSession?.ia_output) {
      return NextResponse.json({ error: "IA output not found." }, { status: 400 });
    }
    if (!wfSession) {
      return NextResponse.json({ error: "Wireframe session not found." }, { status: 404 });
    }
    if (wfSession.selected_screens.length === 0) {
      return NextResponse.json({ error: "No screens selected." }, { status: 400 });
    }

    const appliedControversies = Object.values(iaSession.ux_controversy_decisions ?? {}).filter(
      (d) => d.decision === "applied",
    );

    const runGeneration = async (onStatus?: (msg: string) => void) => {
      const screens = [];
      for (const screenName of wfSession.selected_screens) {
        onStatus?.(`Wireframing ${screenName}…`);
        const { spec, jsxCode, componentsUsed } = await generateWireframeScreen({
          screenName,
          screenNotes: wfSession.screen_notes[screenName],
          iaOutput: iaSession.ia_output!,
          clientName: iaSession.client_name ?? undefined,
          userConfirmations,
          appliedControversies,
          onStatus,
        });

        const saved = await saveWireframeScreen({
          sessionId,
          screenName,
          spec,
          jsxCode,
          annotations: spec.annotations,
          componentsUsed,
        });

        await saveWireframeIntelligence({
          sessionId,
          clientName: iaSession.client_name ?? "Unknown",
          screenName,
          pattern: spec.layout,
        });

        screens.push(saved);
      }

      await updateWireframeSession(sessionId, { status: "complete" });
      return screens;
    };

    if (stream) {
      const sse = createSseStream(async (send) => {
        send({ type: "status", message: "Starting wireframe generation…" });
        const screens = await runGeneration((msg) => {
          send({ type: "status", message: msg });
        });
        send({ type: "complete", result: { screens } });
      });
      return sseResponse(sse);
    }

    const screens = await runGeneration();
    return NextResponse.json({ screens });
  } catch (error) {
    console.error("[wireframe/generate] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed." },
      { status: 500 },
    );
  }
}
