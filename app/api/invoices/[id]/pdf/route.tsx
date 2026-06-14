import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { getInvoicePdfData } from "@/lib/generate-invoice-pdf";
import { InvoicePdf } from "@/lib/invoice-pdf";
import { getInvoiceById } from "@/lib/invoices-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const invoice = await getInvoiceById(id);

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }

    const { billing, qrDataUrl } = await getInvoicePdfData(invoice);

    const buffer = await renderToBuffer(
      <InvoicePdf invoice={invoice} billing={billing} qrDataUrl={qrDataUrl} />,
    );

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[invoices/pdf] generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate invoice PDF." },
      { status: 500 },
    );
  }
}
