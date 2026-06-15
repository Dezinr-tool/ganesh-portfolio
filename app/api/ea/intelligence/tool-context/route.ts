import { NextRequest, NextResponse } from "next/server";
import { requireEaSession } from "@/lib/ea-api-auth";
import {
  buildUnifiedToolContext,
  type ToolName,
} from "@/lib/unified-db";
import {
  buildToolContext,
  type ToolContextInput,
} from "@/lib/intelligence-insights";

const UNIFIED_TYPES = new Set<ToolName>([
  "ea_chat",
  "moodboard",
  "design_audit",
  "ux_framework",
  "visual_framework",
]);

const LEGACY_TOOLS = new Set([
  "moodboard",
  "ia",
  "proposal",
  "presentation",
  "design_audit",
]);

const LEGACY_TO_UNIFIED: Record<string, ToolName> = {
  moodboard: "moodboard",
  design_audit: "design_audit",
  ia: "ux_framework",
  proposal: "ea_chat",
  presentation: "visual_framework",
};

export async function POST(request: NextRequest) {
  const auth = await requireEaSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();

    const unifiedType = (body.type ?? body.tool) as string;
    const clientName =
      (typeof body.client_name === "string" ? body.client_name : undefined) ??
      (typeof body.clientName === "string" ? body.clientName : undefined);

    if (!clientName?.trim()) {
      return NextResponse.json(
        { error: "client_name is required." },
        { status: 400 },
      );
    }

    const projectName =
      (typeof body.project_name === "string" ? body.project_name : undefined) ??
      (typeof body.projectType === "string" ? body.projectType : undefined) ??
      (typeof body.projectBrief === "string" ? body.projectBrief : undefined);

    const mappedType = LEGACY_TO_UNIFIED[unifiedType] ?? unifiedType;

    if (UNIFIED_TYPES.has(mappedType as ToolName)) {
      const context = await buildUnifiedToolContext({
        type: mappedType as ToolName,
        client_name: clientName.trim(),
        project_name: projectName,
      });

      let legacyToolContext: Record<string, unknown> = {};
      const legacyTool = LEGACY_TOOLS.has(unifiedType) ? unifiedType : null;
      if (
        legacyTool &&
        ["moodboard", "design_audit", "ia", "proposal", "presentation"].includes(
          legacyTool,
        )
      ) {
        const input: ToolContextInput = {
          tool: legacyTool as ToolContextInput["tool"],
          clientName: clientName.trim(),
          projectType: projectName,
          projectBrief:
            typeof body.projectBrief === "string" ? body.projectBrief : undefined,
        };
        legacyToolContext = await buildToolContext(auth.sessionId, input, {
          useAi: body.useAi !== false,
        });
      }

      return NextResponse.json({
        ...context,
        legacy: legacyToolContext,
      });
    }

    if (!LEGACY_TOOLS.has(unifiedType)) {
      return NextResponse.json(
        {
          error:
            "Invalid type. Use: moodboard, design_audit, ea_chat, ux_framework, visual_framework.",
        },
        { status: 400 },
      );
    }

    const input: ToolContextInput = {
      tool: unifiedType as ToolContextInput["tool"],
      projectBrief:
        typeof body.projectBrief === "string" ? body.projectBrief : undefined,
      clientName: clientName.trim(),
      projectType: projectName,
    };

    const context = await buildToolContext(auth.sessionId, input, {
      useAi: body.useAi !== false,
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
