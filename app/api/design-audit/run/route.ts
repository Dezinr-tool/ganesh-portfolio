import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { resolveEaSessionId } from "@/lib/ea-api-auth";
import {
  buildAuditCacheKey,
  runDesignAudit,
} from "@/lib/design-audit/auditor";
import { cacheGet } from "@/lib/ai-cache";
import { persistAuditFindings } from "@/lib/design-audit/persist";
import { saveAuditLearnings } from "@/lib/context-saveback";
import { createSseStream, sseResponse } from "@/lib/ai-sse";
import type {
  AuditContext,
  AuditImage,
  AuditModelId,
  DesignAuditResult,
} from "@/lib/design-audit/types";
import type { UserPreConfirmation } from "@/lib/pre-generation-types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const modelId = (body.modelId ?? "claude-sonnet") as AuditModelId;
    const inputMode = String(body.inputMode ?? "screenshot");
    const context = body.context as AuditContext;
    const metadata = (body.metadata ?? {}) as Record<string, unknown>;
    const images = (body.images ?? []) as AuditImage[];
    const stream = body.stream === true;

    if (
      !context?.productDescription ||
      !context?.targetUser ||
      !context?.primaryGoal
    ) {
      return NextResponse.json(
        { error: "Product description, target user, and primary goal are required." },
        { status: 400 },
      );
    }

    const preConfirmation = body.preConfirmation as UserPreConfirmation | undefined;

    const auditInput = {
      modelId,
      context,
      inputMode,
      metadata,
      images,
      userConfirmations: preConfirmation,
    };

    const cacheKeyStr = buildAuditCacheKey(auditInput);
    const cachedResult = cacheGet<DesignAuditResult>(cacheKeyStr);

    async function persistAuditComplete(
      result: DesignAuditResult,
      auditId: string,
    ): Promise<number> {
      const sessionId = await resolveEaSessionId(request);
      let intelligenceSaved = 0;
      if (sessionId) {
        try {
          intelligenceSaved = await persistAuditFindings(
            sessionId,
            result,
            auditId,
          );
        } catch (err) {
          console.error("[design-audit/run] persist failed:", err);
        }
      }
      if (context.eaClientName?.trim()) {
        try {
          await saveAuditLearnings({
            clientName: context.eaClientName.trim(),
            sessionId: sessionId ?? undefined,
            result,
          });
        } catch (err) {
          console.error("[design-audit/run] saveback failed:", err);
        }
      }
      return intelligenceSaved;
    }

    if (stream) {
      const sse = createSseStream(async (send) => {
        if (cachedResult) {
          send({ type: "cached", message: "Using cached audit result", cached: true });
          send({ type: "complete", result: { result: cachedResult, cached: true } });
          return;
        }

        send({ type: "status", message: "Analyzing visual hierarchy…" });
        let statusTick = 0;
        const statuses = [
          "Analyzing typography and color…",
          "Evaluating spacing and layout…",
          "Checking accessibility patterns…",
          "Scoring UX patterns…",
          "Finalizing audit report…",
        ];

        const result = await runDesignAudit({
          ...auditInput,
          clientName: context.eaClientName,
          onDelta: () => {
            statusTick += 1;
            if (statusTick % 12 === 0) {
              send({
                type: "status",
                message: statuses[Math.floor(statusTick / 12) % statuses.length]!,
              });
            }
          },
        });

        const auditId = randomUUID();
        const intelligenceSaved = await persistAuditComplete(result, auditId);

        send({
          type: "complete",
          result: { auditId, result, intelligenceSaved, cached: false },
        });
      });
      return sseResponse(sse);
    }

    if (cachedResult) {
      const auditId = randomUUID();
      const intelligenceSaved = await persistAuditComplete(cachedResult, auditId);
      return NextResponse.json({
        auditId,
        result: cachedResult,
        intelligenceSaved,
        cached: true,
      });
    }

    const auditId = randomUUID();
    const result = await runDesignAudit({
      ...auditInput,
      clientName: context.eaClientName,
    });

    const intelligenceSaved = await persistAuditComplete(result, auditId);

    return NextResponse.json({
      auditId,
      result,
      intelligenceSaved,
      cached: false,
    });
  } catch (error) {
    console.error("[design-audit/run] error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Audit failed.",
      },
      { status: 500 },
    );
  }
}
