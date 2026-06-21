import Link from "next/link";
import InvoiceForm from "./invoice-form";

export default function NewInvoicePage() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/invoices"
          className="text-sm text-[var(--color-text)] hover:text-[var(--color-bg)]"
        >
          ← Back to invoices
        </Link>
      </div>

      <h1 className="text-2xl font-semibold text-[var(--color-bg)]">New invoice</h1>
      <p className="mt-2 text-sm text-[var(--color-text)]">
        Create a new invoice for your client.
      </p>

      <div className="mt-8">
        <InvoiceForm />
      </div>
    </div>
  );
}
