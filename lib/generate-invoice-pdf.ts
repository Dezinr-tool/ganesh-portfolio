import QRCode from "qrcode";
import type { Invoice } from "@/app/dashboard/_lib/invoices";
import type { InvoicePdfBilling } from "@/lib/invoice-pdf";
import { getBillingSettings } from "@/lib/settings-store";

function billingFromSettings(
  settings: Awaited<ReturnType<typeof getBillingSettings>>,
): InvoicePdfBilling {
  return {
    upiId: settings.upiId,
    bankAccountHolder: settings.bankAccountHolder,
    bankName: settings.bankName,
    bankAccountNumber: settings.bankAccountNumber,
    bankIfsc: settings.bankIfsc,
    panNumber: settings.panNumber,
  };
}

function buildUpiString(
  billing: InvoicePdfBilling,
  invoice: Invoice,
): string {
  return `upi://pay?pa=${billing.upiId}&pn=${encodeURIComponent(billing.bankAccountHolder)}&am=${invoice.total}&cu=INR&tn=${encodeURIComponent(`Invoice ${invoice.invoiceNumber}`)}`;
}

export async function getInvoicePdfData(invoice: Invoice): Promise<{
  billing: InvoicePdfBilling;
  qrDataUrl: string;
}> {
  const settings = await getBillingSettings();
  const billing = billingFromSettings(settings);
  const upiString = buildUpiString(billing, invoice);

  const qrDataUrl = await QRCode.toDataURL(upiString, {
    width: 120,
    margin: 1,
    type: "image/png",
  });

  return { billing, qrDataUrl };
}
