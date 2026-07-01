import AgreementForm from "../agreement-form";
import { BackLink } from "../../_components/back-link";
import { getBillingSettings } from "@/lib/settings-store";

export const dynamic = "force-dynamic";

export default async function NewAgreementPage() {
  const billing = await getBillingSettings();
  return (
    <div className="space-y-6">
      <BackLink href="/dashboard/agreements" label="Back to agreements" />
      <AgreementForm defaultHourlyRate={billing.hourlyRate} />
    </div>
  );
}
