import AgreementForm from "../agreement-form";
import { BackLink } from "../../_components/back-link";
import { PageHeader } from "../../_components/page-header";

export default function NewAgreementPage() {
  return (
    <div className="space-y-8">
      <BackLink href="/dashboard/agreements" label="Back to agreements" />
      <PageHeader
        title="New agreement"
        description="Create a new client agreement."
      />
      <AgreementForm />
    </div>
  );
}
