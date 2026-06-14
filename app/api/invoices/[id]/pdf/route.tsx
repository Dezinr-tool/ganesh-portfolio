import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { NextResponse } from "next/server";
import { getInvoiceById } from "@/lib/invoices-store";
import { InvoicePdf, type InvoicePdfBilling } from "@/lib/invoice-pdf";
import { getBillingSettings } from "@/lib/settings-store";

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

    const settings = await getBillingSettings();
    const billing: InvoicePdfBilling = {
      upiId: settings.upiId,
      bankAccountHolder: settings.bankAccountHolder,
      bankName: settings.bankName,
      bankAccountNumber: settings.bankAccountNumber,
      bankIfsc: settings.bankIfsc,
      panNumber: settings.panNumber,
    };

    const upiString = `upi://pay?pa=${billing.upiId}&pn=${encodeURIComponent(billing.bankAccountHolder)}&am=${invoice.total}&cu=INR&tn=${encodeURIComponent(`Invoice ${invoice.invoiceNumber}`)}`;
    const qrDataUrl = await QRCode.toDataURL(upiString, {
      width: 100,
      margin: 1,
    });

    const buffer = await renderToBuffer(
      <InvoicePdf invoice={invoice} billing={billing} qrDataUrl={qrDataUrl} />,
    );

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate invoice PDF." },
      { status: 500 },
    );
  }
}
