import Link from "next/link";
import { readInvoices } from "@/lib/invoices-store";
import { DeleteInvoiceButton } from "./delete-invoice-button";
import { formatCurrency, formatDate } from "../_lib/invoices";

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

export default async function InvoicesPage() {
  const invoices = await readInvoices();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Invoices</h1>
          <p className="mt-2 text-sm text-neutral-400">
            {invoices.length === 0
              ? "No invoices yet."
              : `${invoices.length} invoice${invoices.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Link
          href="/dashboard/invoices/new"
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-950"
        >
          New invoice
        </Link>
      </div>

      {invoices.length === 0 ? (
        <div className="mt-8 rounded-lg border border-neutral-800 bg-neutral-900 p-8 text-center text-sm text-neutral-500">
          Create your first invoice to get started.
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-lg border border-neutral-800">
          <table className="min-w-full divide-y divide-neutral-800">
            <thead className="bg-neutral-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Invoice
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Client
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Issue date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 bg-neutral-950">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-neutral-900/50">
                  <td className="px-4 py-3 text-sm">
                    <Link
                      href={`/dashboard/invoices/${invoice.id}`}
                      className="font-medium text-white hover:underline"
                    >
                      {invoice.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-300">
                    {invoice.clientName}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-400">
                    {formatDate(invoice.issueDate)}
                  </td>
                  <td className="px-4 py-3 text-sm text-white">
                    {formatCurrency(invoice.total)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <StatusBadge status={invoice.status} />
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <DeleteInvoiceButton
                      invoiceId={invoice.id}
                      invoiceNumber={invoice.invoiceNumber}
                      variant="icon"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
