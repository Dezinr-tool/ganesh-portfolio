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
      ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
      : "bg-amber-500/10 text-amber-400 ring-amber-500/20";

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
          className="text-sm text-neutral-400 hover:text-white"
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

      <div className="rounded-lg border border-neutral-800 bg-neutral-900">
        <div className="border-b border-neutral-800 px-6 py-8 sm:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm text-neutral-500">Invoice</p>
              <h1 className="mt-1 text-3xl font-semibold text-white">
                {invoice.invoiceNumber}
              </h1>
            </div>
            <div className="text-sm text-neutral-400 sm:text-right">
              <p>
                <span className="text-neutral-500">Issue date:</span>{" "}
                {formatDate(invoice.issueDate)}
              </p>
              <p className="mt-1">
                <span className="text-neutral-500">Due date:</span>{" "}
                {formatDate(invoice.dueDate)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 border-b border-neutral-800 px-6 py-8 sm:grid-cols-2 sm:px-8">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              Bill to
            </p>
            <p className="mt-2 text-lg font-medium text-white">
              {invoice.clientName}
            </p>
            {invoice.clientCompany ? (
              <p className="mt-1 text-sm text-neutral-300">
                {invoice.clientCompany}
              </p>
            ) : null}
            {invoice.clientAddress ? (
              <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-300">
                {invoice.clientAddress}
              </p>
            ) : null}
            <p className="mt-1 text-sm text-neutral-400">{invoice.clientEmail}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              Amount due
            </p>
            <p className="mt-2 text-3xl font-semibold text-white">
              {formatCurrency(invoice.total)}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto px-6 py-8 sm:px-8">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-neutral-800 text-left text-xs uppercase tracking-wide text-neutral-500">
                <th className="pb-3 pr-4 font-medium">Description</th>
                <th className="pb-3 pr-4 font-medium">Effort (hrs)</th>
                <th className="pb-3 pr-4 font-medium">Rate</th>
                <th className="pb-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {invoice.lineItems.map((item) => (
                <tr key={item.id}>
                  <td className="py-4 pr-4 text-sm text-neutral-200">
                    {item.description}
                  </td>
                  <td className="py-4 pr-4 text-sm text-neutral-400">
                    {item.effortHrs}
                  </td>
                  <td className="py-4 pr-4 text-sm text-neutral-400">
                    {formatCurrency(item.rate)}
                  </td>
                  <td className="py-4 text-right text-sm text-white">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-neutral-800 px-6 py-6 sm:px-8">
          <div className="ml-auto max-w-xs space-y-2 text-sm">
            <div className="flex justify-between text-neutral-400">
              <span>Subtotal</span>
              <span className="text-white">
                {formatCurrency(invoice.subtotal)}
              </span>
            </div>
            {invoice.taxPercent !== null && invoice.taxPercent > 0 ? (
              <div className="flex justify-between text-neutral-400">
                <span>Tax ({invoice.taxPercent}%)</span>
                <span className="text-white">
                  {formatCurrency(invoice.taxAmount)}
                </span>
              </div>
            ) : null}
            <div className="flex justify-between border-t border-neutral-800 pt-2 text-base font-semibold text-white">
              <span>Total</span>
              <span>{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        {invoice.notes ? (
          <div className="border-t border-neutral-800 px-6 py-6 sm:px-8">
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              Notes
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-300">
              {invoice.notes}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
