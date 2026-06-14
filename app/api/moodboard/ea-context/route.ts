import { NextRequest, NextResponse } from "next/server";
import { resolveEaSessionId } from "@/lib/ea-api-auth";
import { getMoodboardContext } from "@/lib/moodboard-context";
import { buildToolContext } from "@/lib/intelligence-insights";

export async function POST(request: NextRequest) {
  const sessionId = await resolveEaSessionId(request);
  if (!sessionId) {
    return NextResponse.json({ available: false });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const clientName =
      typeof body.clientName === "string" ? body.clientName : undefined;

    const [rawContext, toolContextRaw] = await Promise.all([
      getMoodboardContext(sessionId, {
        brandName: clientName,
        projectName: clientName,
      }),
      buildToolContext(sessionId, {
        tool: "moodboard",
        clientName,
      }),
    ]);

    const toolPayload = toolContextRaw as {
      styleDirection?: string[];
      clientContext?: string[];
      avoid?: string[];
      moodKeywords?: string[];
    };

    const hasData =
      rawContext.designObservations.length > 0 ||
      (toolPayload.styleDirection?.length ?? 0) > 0;

    if (!hasData) {
      return NextResponse.json({ available: false });
    }

    const prefill = {
      industry: "",
      audience: "",
      feeling: (toolPayload.moodKeywords ?? []).join(", "),
      admiredBrands: "",
      brandName: clientName ?? rawContext.brandName ?? "",
      eaPrefillSummary: [
        rawContext.summary,
        `Style direction: ${(toolPayload.styleDirection ?? []).join("; ")}`,
        `Client context: ${(toolPayload.clientContext ?? []).join("; ")}`,
        (toolPayload.avoid ?? []).length
          ? `Avoid: ${(toolPayload.avoid ?? []).join("; ")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
    };

    return NextResponse.json({
      available: true,
      clientName: clientName ?? rawContext.brandName ?? "your client",
      prefill,
      toolContext: toolPayload,
    });
  } catch (error) {
    console.error("[moodboard/ea-context] error:", error);
    return NextResponse.json({ available: false });
  }
}
