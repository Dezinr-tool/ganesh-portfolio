import { NextRequest, NextResponse } from "next/server";
import { requireEaSession } from "@/lib/ea-api-auth";
import {
  buildToolContext,
  type ToolContextInput,
} from "@/lib/intelligence-insights";

const VALID_TOOLS = new Set([
  "moodboard",
  "ia",
  "proposal",
  "presentation",
  "design_audit",
]);

export async function POST(request: NextRequest) {
  const auth = await requireEaSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const tool = body.tool as string;

    if (!tool || !VALID_TOOLS.has(tool)) {
      return NextResponse.json(
        {
          error:
            "Invalid tool. Use: moodboard, ia, proposal, presentation, design_audit.",
        },
        { status: 400 },
      );
    }

    const input: ToolContextInput = {
      tool: tool as ToolContextInput["tool"],
      projectBrief:
        typeof body.projectBrief === "string" ? body.projectBrief : undefined,
      clientName:
        typeof body.clientName === "string" ? body.clientName : undefined,
      projectType:
        typeof body.projectType === "string" ? body.projectType : undefined,
    };

    const context = await buildToolContext(auth.sessionId, input, {
      useAi: true,
    });
    return NextResponse.json(context);
  } catch (error) {
    console.error("[ea/intelligence/tool-context POST] error:", error);
    return NextResponse.json(
      { error: "Failed to build tool context." },
      { status: 500 },
    );
  }
}
