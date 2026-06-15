import { NextRequest, NextResponse } from "next/server";
import { generatePreConfirmation } from "@/lib/pre-generation-advisor";
import { extractBrandName, extractProjectType } from "@/lib/moodboard/question-flow";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tool = body.tool as "moodboard" | "design_audit" | "ia" | "wireframe";
    if (
      tool !== "moodboard" &&
      tool !== "design_audit" &&
      tool !== "ia" &&
      tool !== "wireframe"
    ) {
      return NextResponse.json({ error: "Invalid tool." }, { status: 400 });
    }

    const sessionAnswers = (body.sessionAnswers ?? body.answers ?? {}) as Record<
      string,
      unknown
    >;

    const clientName =
      (typeof body.clientName === "string" ? body.clientName : undefined) ??
      extractBrandName(sessionAnswers) ??
      (typeof body.context?.eaClientName === "string"
        ? body.context.eaClientName
        : undefined);

    const preConfirmation = await generatePreConfirmation({
      tool,
      sessionAnswers,
      projectType:
        body.projectType ??
        extractProjectType(sessionAnswers) ??
        undefined,
      inputType: body.inputType ?? body.inputMode ?? undefined,
      clientName,
    });

    return NextResponse.json({ preConfirmation });
  } catch (error) {
    console.error("[pre-generation/advise] error:", error);
    return NextResponse.json(
      { error: "Failed to generate pre-confirmation." },
      { status: 500 },
    );
  }
}
