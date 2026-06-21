import InvoiceForm from "./invoice-form";
import { BackLink } from "../../_components/back-link";
import { PageHeader } from "../../_components/page-header";

export default function NewInvoicePage() {
  return (
    <div className="space-y-8">
      <BackLink href="/dashboard/invoices" label="Back to invoices" />
      <PageHeader
        title="New invoice"
        description="Create a new invoice for your client."
      />
      <InvoiceForm />
    </div>
  );
}
