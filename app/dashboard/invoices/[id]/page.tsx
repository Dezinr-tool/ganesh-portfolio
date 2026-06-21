import Link from "next/link";
import { notFound } from "next/navigation";
import { getInvoiceById } from "@/lib/invoices-store";
import { formatCurrency, formatDate } from "../../_lib/invoices";
import { DeleteInvoiceButton } from "../delete-invoice-button";
import { InvoiceStatusButton } from "../invoice-status-button";
import { DownloadPdfButton } from "./download-pdf-button";

export const dynamic = "force-dynamic";

function StatusBadge({ status }: { status: "Paid" | "Unpaid" }) {
  const styles =
    status === "Paid"
      ? "bg-[var(--color-accent)] text-[var(--color-accent)] ring-[var(--color-accent)]"
      : "bg-[var(--color-accent)] text-[var(--color-accent)] ring-[var(--color-accent)]";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles}`}
    >
      {status}
    </span>
  );
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getInvoiceById(id);

  if (!invoice) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link
          href="/dashboard/invoices"
          className="text-sm text-[var(--color-text)] hover:text-[var(--color-bg)]"
        >
          ← Back to invoices
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <DownloadPdfButton invoice={invoice} />
          <InvoiceStatusButton invoiceId={invoice.id} status={invoice.status} />
          <DeleteInvoiceButton
            invoiceId={invoice.id}
            invoiceNumber={invoice.invoiceNumber}
            redirectTo="/dashboard/invoices"
          />
          <StatusBadge status={invoice.status} />
        </div>
      </div>

      <div className="rounded-lg border border-[var(--color-text)] bg-[var(--color-bg)]">
        <div className="border-b border-[var(--color-text)] px-6 py-8 sm:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm text-[var(--color-text)]">Invoice</p>
              <h1 className="mt-1 text-3xl font-semibold text-[var(--color-bg)]">
                {invoice.invoiceNumber}
              </h1>
            </div>
            <div className="text-sm text-[var(--color-text)] sm:text-right">
              <p>
                <span className="text-[var(--color-text)]">Issue date:</span>{" "}
                {formatDate(invoice.issueDate)}
              </p>
              <p className="mt-1">
                <span className="text-[var(--color-text)]">Due date:</span>{" "}
                {formatDate(invoice.dueDate)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 border-b border-[var(--color-text)] px-6 py-8 sm:grid-cols-2 sm:px-8">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--color-text)]">
              Bill to
            </p>
            <p className="mt-2 text-lg font-medium text-[var(--color-bg)]">
              {invoice.clientName}
            </p>
            {invoice.clientCompany ? (
              <p className="mt-1 text-sm text-[var(--color-text)]">
                {invoice.clientCompany}
              </p>
            ) : null}
            {invoice.clientAddress ? (
              <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--color-text)]">
                {invoice.clientAddress}
              </p>
            ) : null}
            <p className="mt-1 text-sm text-[var(--color-text)]">{invoice.clientEmail}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs uppercase tracking-wide text-[var(--color-text)]">
              Amount due
            </p>
            <p className="mt-2 text-3xl font-semibold text-[var(--color-bg)]">
              {formatCurrency(invoice.total)}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto px-6 py-8 sm:px-8">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-[var(--color-text)] text-left text-xs uppercase tracking-wide text-[var(--color-text)]">
                <th className="pb-3 pr-4 font-medium">Description</th>
                <th className="pb-3 pr-4 font-medium">Effort (hrs)</th>
                <th className="pb-3 pr-4 font-medium">Rate</th>
                <th className="pb-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-text)]">
              {invoice.lineItems.map((item) => (
                <tr key={item.id}>
                  <td className="py-4 pr-4 text-sm text-[var(--color-text)]">
                    {item.description}
                  </td>
                  <td className="py-4 pr-4 text-sm text-[var(--color-text)]">
                    {item.effortHrs}
                  </td>
                  <td className="py-4 pr-4 text-sm text-[var(--color-text)]">
                    {formatCurrency(item.rate)}
                  </td>
                  <td className="py-4 text-right text-sm text-[var(--color-bg)]">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-[var(--color-text)] px-6 py-6 sm:px-8">
          <div className="ml-auto max-w-xs space-y-2 text-sm">
            <div className="flex justify-between text-[var(--color-text)]">
              <span>Subtotal</span>
              <span className="text-[var(--color-bg)]">
                {formatCurrency(invoice.subtotal)}
              </span>
            </div>
            {invoice.taxPercent !== null && invoice.taxPercent > 0 ? (
              <div className="flex justify-between text-[var(--color-text)]">
                <span>Tax ({invoice.taxPercent}%)</span>
                <span className="text-[var(--color-bg)]">
                  {formatCurrency(invoice.taxAmount)}
                </span>
              </div>
            ) : null}
            <div className="flex justify-between border-t border-[var(--color-text)] pt-2 text-base font-semibold text-[var(--color-bg)]">
              <span>Total</span>
              <span>{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        {invoice.notes ? (
          <div className="border-t border-[var(--color-text)] px-6 py-6 sm:px-8">
            <p className="text-xs uppercase tracking-wide text-[var(--color-text)]">
              Notes
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--color-text)]">
              {invoice.notes}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
