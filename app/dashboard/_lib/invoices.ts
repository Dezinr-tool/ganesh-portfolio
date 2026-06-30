import { normalizeClientEmails } from "@/app/dashboard/_lib/client-emails";

export type InvoiceStatus = "Paid" | "Unpaid";

export type InvoiceBillingMode = "hourly" | "lumpsum";

export const BILLING_MODE_OPTIONS: {
  value: InvoiceBillingMode;
  label: string;
}[] = [
  { value: "hourly", label: "Hourly charges" },
  { value: "lumpsum", label: "Lumpsum amount" },
];

export type InvoiceLineItem = {
  id: string;
  description: string;
  effortHrs: number;
  rate: number;
  amount: number;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  clientName: string;
  clientEmail: string;
  clientEmails: string[];
  clientCompany: string;
  clientAddress: string;
  billingMode: InvoiceBillingMode;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxPercent: number | null;
  taxAmount: number;
  processingFeePercent: number;
  processingFeeAmount: number;
  total: number;
  notes: string;
  status: InvoiceStatus;
  createdAt: string;
};

export type CreateInvoiceInput = Omit<
  Invoice,
  "id" | "invoiceNumber" | "createdAt" | "status"
> & {
  status?: InvoiceStatus;
  clientPhone?: string;
  clientGstNumber?: string;
};

export function buildInvoiceInput(
  body: CreateInvoiceInput & { clientEmails?: string[] },
): CreateInvoiceInput {
  const clientEmails = normalizeClientEmails(body.clientEmails, body.clientEmail);

  return {
    ...body,
    issueDate: body.issueDate,
    billingMode: body.billingMode ?? "hourly",
    clientName: body.clientName.trim(),
    clientEmails,
    clientEmail: clientEmails[0] ?? "",
    clientCompany: body.clientCompany?.trim() ?? "",
    clientAddress: body.clientAddress?.trim() ?? "",
    notes: body.notes?.trim() ?? "",
  };
}

export const DEFAULT_PROCESSING_FEE_PERCENT = 2;

export const inputClassName =
  "w-full rounded-md border border-[var(--color-text)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-text)]";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function calculateLineAmount(effortHrs: number, rate: number): number {
  return Math.round(effortHrs * rate * 100) / 100;
}

export function validateInvoiceLineItems(
  lineItems: InvoiceLineItem[],
  billingMode: InvoiceBillingMode,
): boolean {
  if (!lineItems.length) return false;

  if (billingMode === "hourly") {
    return lineItems.every(
      (item) =>
        item.description?.trim() &&
        item.effortHrs > 0 &&
        item.rate >= 0 &&
        item.amount >= 0,
    );
  }

  return lineItems.every(
    (item) => item.description?.trim() && item.amount > 0,
  );
}

export function inferBillingMode(
  billingMode: string | null | undefined,
  lineItems: InvoiceLineItem[],
): InvoiceBillingMode {
  if (billingMode === "hourly" || billingMode === "lumpsum") {
    return billingMode;
  }

  const hasHourlyLine = lineItems.some((item) => item.effortHrs > 0);
  return hasHourlyLine ? "hourly" : "lumpsum";
}

export function calculateTotals(
  lineItems: Pick<InvoiceLineItem, "amount">[],
  taxPercent: number | null,
  processingFeePercent: number = DEFAULT_PROCESSING_FEE_PERCENT,
) {
  const subtotal =
    Math.round(lineItems.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;
  const taxRate = taxPercent ?? 0;
  const taxAmount = Math.round(subtotal * (taxRate / 100) * 100) / 100;
  const afterTax = subtotal + taxAmount;
  const processingFeeAmount =
    Math.round(afterTax * (processingFeePercent / 100) * 100) / 100;
  const total = Math.round((afterTax + processingFeeAmount) * 100) / 100;
  return { subtotal, taxAmount, processingFeeAmount, total };
}

export function generateInvoiceNumber(invoices: Invoice[]): string {
  const numbers = invoices
    .map((invoice) => invoice.invoiceNumber.match(/^INV-(\d+)$/)?.[1])
    .filter((value): value is string => Boolean(value))
    .map((value) => parseInt(value, 10));

  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `INV-${String(next).padStart(3, "0")}`;
}
