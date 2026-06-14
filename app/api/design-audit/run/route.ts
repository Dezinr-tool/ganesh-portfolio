import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { resolveEaSessionId } from "@/lib/ea-api-auth";
import { runDesignAudit } from "@/lib/design-audit/auditor";
import { persistAuditFindings } from "@/lib/design-audit/persist";
import type {
  AuditContext,
  AuditImage,
  AuditModelId,
} from "@/lib/design-audit/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const modelId = (body.modelId ?? "claude-sonnet") as AuditModelId;
    const inputMode = String(body.inputMode ?? "screenshot");
    const context = body.context as AuditContext;
    const metadata = (body.metadata ?? {}) as Record<string, unknown>;
    const images = (body.images ?? []) as AuditImage[];

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

    const auditId = randomUUID();
    const result = await runDesignAudit({
      modelId,
      context,
      inputMode,
      metadata,
      images,
    });

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

    return NextResponse.json({
      auditId,
      result,
      intelligenceSaved,
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
