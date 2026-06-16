import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { MoodboardPdf } from "@/lib/moodboard-pdf";
import type { MoodboardPresentationDirection } from "@/lib/moodboard/db-types";
import type { MoodboardDirection } from "@/lib/moodboard/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toLegacyDirection(
  direction: MoodboardDirection | MoodboardPresentationDirection,
): MoodboardDirection {
  if ("directionName" in direction) {
    return {
      id: direction.id,
      name: direction.directionName,
      concept: direction.tagline,
      colors: (direction.colorPalette ?? []).map((c) => ({ hex: c.hex, name: c.name })),
      typography: {
        heading: direction.typography?.heading.font ?? "Syne",
        body: direction.typography?.body.font ?? "DM Sans",
      },
      imagery: direction.illustrations?.styleDescription ?? direction.photography?.styleDescription ?? "",
      mood: direction.moodKeywords ?? [],
      visual_references: direction.uiSection?.description ?? "",
    };
  }
  return direction;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const direction = toLegacyDirection(body.direction);
  const tab = typeof body.tab === "string" ? body.tab : "moodboard";

  if (!direction?.name) {
    return NextResponse.json({ error: "Direction is required." }, { status: 400 });
  }

  const document = <MoodboardPdf direction={direction} tab={tab} />;

  try {
    const buffer = await renderToBuffer(document);

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
