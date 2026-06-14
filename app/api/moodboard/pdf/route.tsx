import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { MoodboardPdf } from "@/lib/moodboard-pdf";
import type { MoodboardDirection } from "@/lib/moodboard/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const direction = body.direction as MoodboardDirection;
    const tab = typeof body.tab === "string" ? body.tab : "moodboard";

    if (!direction?.name) {
      return NextResponse.json({ error: "Direction is required." }, { status: 400 });
    }

    const buffer = await renderToBuffer(
      <MoodboardPdf direction={direction} tab={tab} />,
    );

    const filename = `${direction.name.replace(/\s+/g, "-").toLowerCase()}-moodboard.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[moodboard/pdf] error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF." },
      { status: 500 },
    );
  }
}
