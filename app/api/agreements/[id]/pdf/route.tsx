import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { AgreementPdf } from "@/lib/agreement-pdf";
import { getAgreementById } from "@/lib/agreements-store";
import { getDesignTokens } from "@/lib/design-tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const agreement = await getAgreementById(id);

    if (!agreement) {
      return NextResponse.json({ error: "Agreement not found." }, { status: 404 });
    }

    const designTokens = await getDesignTokens();

    const buffer = await renderToBuffer(
      <AgreementPdf agreement={agreement} designTokens={designTokens} />,
    );

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${agreement.title.replace(/[^a-z0-9-_]+/gi, "-")}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[agreements/pdf] generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate agreement PDF." },
      { status: 500 },
    );
  }
}
