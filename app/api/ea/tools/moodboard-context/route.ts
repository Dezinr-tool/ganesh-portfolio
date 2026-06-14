import { NextRequest, NextResponse } from "next/server";
import { requireEaSession } from "@/lib/ea-api-auth";
import { getMoodboardContext } from "@/lib/moodboard-context";

export async function POST(request: NextRequest) {
  const auth = await requireEaSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json().catch(() => ({}));
    const brandName =
      typeof body.brandName === "string" ? body.brandName : undefined;
    const projectName =
      typeof body.projectName === "string" ? body.projectName : undefined;

    const context = await getMoodboardContext(auth.sessionId, {
      brandName,
      projectName,
    });

    return NextResponse.json(context);
  } catch (error) {
    console.error("[ea/tools/moodboard-context POST] error:", error);
    return NextResponse.json(
      { error: "Failed to build moodboard context." },
      { status: 500 },
    );
  }
}
