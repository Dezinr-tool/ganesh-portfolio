import Link from "next/link";
import { readInvoices } from "@/lib/invoices-store";
import { DeleteInvoiceButton } from "./delete-invoice-button";
import { formatCurrency, formatDate } from "../_lib/invoices";

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

export default async function InvoicesPage() {
  const invoices = await readInvoices();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-bg)]">Invoices</h1>
          <p className="mt-2 text-sm text-[var(--color-text)]">
            {invoices.length === 0
              ? "No invoices yet."
              : `${invoices.length} invoice${invoices.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Link
          href="/dashboard/invoices/new"
          className="rounded-md bg-[var(--color-bg)] px-4 py-2 text-sm font-medium text-[var(--color-text)]"
        >
          New invoice
        </Link>
      </div>

      {invoices.length === 0 ? (
        <div className="mt-8 rounded-lg border border-[var(--color-text)] bg-[var(--color-bg)] p-8 text-center text-sm text-[var(--color-text)]">
          Create your first invoice to get started.
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-lg border border-[var(--color-text)]">
          <table className="min-w-full divide-y divide-[var(--color-text)]">
            <thead className="bg-[var(--color-bg)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-text)]">
                  Invoice
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-text)]">
                  Client
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-text)]">
                  Issue date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-text)]">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-text)]">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-[var(--color-text)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-text)] bg-[var(--color-bg)]">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-[var(--color-bg)]/50">
                  <td className="px-4 py-3 text-sm">
                    <Link
                      href={`/dashboard/invoices/${invoice.id}`}
                      className="font-medium text-[var(--color-bg)] hover:underline"
                    >
                      {invoice.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--color-text)]">
                    {invoice.clientName}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--color-text)]">
                    {formatDate(invoice.issueDate)}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--color-bg)]">
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
