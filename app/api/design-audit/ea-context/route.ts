import { NextRequest, NextResponse } from "next/server";
import { resolveEaSessionId } from "@/lib/ea-api-auth";
import { buildToolContext } from "@/lib/intelligence-insights";
import { getMoodboardContext } from "@/lib/moodboard-context";

export async function POST(request: NextRequest) {
  const sessionId = await resolveEaSessionId(request);
  if (!sessionId) {
    return NextResponse.json({ available: false });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const clientName =
      typeof body.clientName === "string" ? body.clientName : undefined;

    const [designCtx, toolRaw] = await Promise.all([
      getMoodboardContext(sessionId, {
        brandName: clientName,
        projectName: clientName,
      }),
      buildToolContext(sessionId, {
        tool: "design_audit",
        clientName,
      }),
    ]);

    const tool = toolRaw as {
      clientGoals?: string[];
      userFeedback?: string[];
      painPoints?: string[];
      designContext?: string[];
    };

    const hasData =
      designCtx.designObservations.length > 0 ||
      (tool.clientGoals?.length ?? 0) > 0 ||
      (tool.painPoints?.length ?? 0) > 0;

    if (!hasData) {
      return NextResponse.json({ available: false });
    }

    const prefill = {
      productDescription: tool.clientGoals?.[0] ?? "",
      targetUser: "",
      primaryGoal: tool.clientGoals?.[1] ?? tool.designContext?.[0] ?? "",
      specificConcerns: [
        ...(tool.painPoints ?? []),
        ...(tool.userFeedback ?? []),
      ].join("; "),
      eaPrefillSummary: [
        designCtx.summary,
        tool.clientGoals?.length
          ? `Client goals: ${tool.clientGoals.join("; ")}`
          : "",
        tool.painPoints?.length
          ? `Pain points: ${tool.painPoints.join("; ")}`
          : "",
        tool.designContext?.length
          ? `Design context: ${tool.designContext.join("; ")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
    };

    return NextResponse.json({
      available: true,
      clientName: clientName ?? designCtx.brandName ?? "your client",
      prefill,
    });
  } catch (error) {
    console.error("[design-audit/ea-context] error:", error);
    return NextResponse.json({ available: false });
  }
}
