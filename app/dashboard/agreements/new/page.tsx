import AgreementForm from "../agreement-form";
import { BackLink } from "../../_components/back-link";

export default function NewAgreementPage() {
  return (
    <div className="space-y-6">
      <BackLink href="/dashboard/agreements" label="Back to agreements" />
      <AgreementForm />
    </div>
  );
}
