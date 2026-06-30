import { notFound } from "next/navigation";
import { getInvoiceById } from "@/lib/invoices-store";
import { getClientByEmail } from "@/lib/clients-store";
import { BackLink } from "../../../_components/back-link";
import { PageHeader } from "../../../_components/page-header";
import InvoiceForm from "../../new/invoice-form";

export const dynamic = "force-dynamic";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getInvoiceById(id);

  if (!invoice) {
    notFound();
  }

  const client = invoice.clientEmail
    ? await getClientByEmail(invoice.clientEmail)
    : null;

  return (
    <div className="space-y-8">
      <BackLink
        href={`/dashboard/invoices/${invoice.id}`}
        label="Back to invoice"
      />
      <PageHeader
        title={`Edit ${invoice.invoiceNumber}`}
        description="Update the invoice details and save your changes."
      />
      <InvoiceForm
        invoice={invoice}
        initialClientPhone={client?.phone ?? ""}
        initialClientGstNumber={client?.gstNumber ?? ""}
      />
    </div>
  );
}
