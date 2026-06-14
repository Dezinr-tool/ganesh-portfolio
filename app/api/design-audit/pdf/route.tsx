import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { DesignAuditPdf } from "@/lib/design-audit-pdf";
import type { DesignAuditResult } from "@/lib/design-audit/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const result = body.result as DesignAuditResult;
  const product = typeof body.product === "string" ? body.product : undefined;

  if (!result?.overall_score) {
    return NextResponse.json({ error: "Audit result required." }, { status: 400 });
  }

  const document = <DesignAuditPdf result={result} product={product} />;

  try {
    const buffer = await renderToBuffer(document);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="design-audit-report.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[design-audit/pdf] error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF." },
      { status: 500 },
    );
  }
}
