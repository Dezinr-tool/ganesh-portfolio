import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { AgreementPdf } from "@/lib/agreement-pdf";
import { getAgreementByToken } from "@/lib/agreements-store";
import { getDesignTokens } from "@/lib/design-tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const agreement = await getAgreementByToken(token);

    if (!agreement) {
      return NextResponse.json(
        { error: "Agreement not found or link expired." },
        { status: 404 },
      );
    }

    const designTokens = await getDesignTokens();

    const buffer = await renderToBuffer(
      <AgreementPdf agreement={agreement} designTokens={designTokens} />,
    );

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${agreement.title.replace(/[^a-z0-9-_]+/gi, "-")}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[sign/pdf] generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate agreement PDF." },
      { status: 500 },
    );
  }
}
