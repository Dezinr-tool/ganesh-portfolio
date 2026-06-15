import { NextRequest, NextResponse } from "next/server";
import { getWireframeScreens, getWireframeSession } from "@/lib/wireframe/db-store";
import { createZipBuffer } from "@/lib/wireframe/simple-zip";
import { specToJsx } from "@/lib/wireframe/jsx-export";

export const dynamic = "force-dynamic";

function toFileName(screenName: string): string {
  const base = screenName
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `${base || "screen"}.tsx`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionId = body.sessionId as string;
    const format = (body.format as string | undefined) ?? "json";

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required." }, { status: 400 });
    }

    const session = await getWireframeSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    const screens = await getWireframeScreens(sessionId);
    if (screens.length === 0) {
      return NextResponse.json({ error: "No wireframes to export." }, { status: 400 });
    }

    const files = screens.map((screen) => ({
      name: toFileName(screen.screen_name),
      screen_name: screen.screen_name,
      content: screen.jsx_code || specToJsx(screen.spec),
    }));

    if (format === "zip") {
      const zip = createZipBuffer(
        files.map((f) => ({ name: f.name, content: f.content })),
      );
      return new NextResponse(new Uint8Array(zip), {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="wireframes-${sessionId}.zip"`,
        },
      });
    }

    return NextResponse.json({ sessionId, files });
  } catch (error) {
    console.error("[wireframe/export] error:", error);
    return NextResponse.json({ error: "Export failed." }, { status: 500 });
  }
}
