import { NextRequest, NextResponse } from "next/server";
import { requireEaSession } from "@/lib/ea-api-auth";
import { getDesignContext } from "@/lib/design-memory";

export async function GET(request: NextRequest) {
  const auth = await requireEaSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const days = Math.min(Math.max(Number(searchParams.get("days") ?? 30), 1), 365);
    const context = await getDesignContext(auth.sessionId, days);

    return NextResponse.json({
      category: "design",
      ...context,
    });
  } catch (error) {
    console.error("[ea/memory/design GET] error:", error);
    return NextResponse.json(
      { error: "Failed to load design memories." },
      { status: 500 },
    );
  }
}
