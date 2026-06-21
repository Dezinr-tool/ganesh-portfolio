import { notFound, redirect } from "next/navigation";
import { getAgreementById } from "@/lib/agreements-store";
import AgreementForm from "../../agreement-form";
import { BackLink } from "../../../_components/back-link";
import { PageHeader } from "../../../_components/page-header";

export const dynamic = "force-dynamic";

export default async function EditAgreementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agreement = await getAgreementById(id);

  if (!agreement) {
    notFound();
  }

  if (agreement.status === "signed") {
    redirect(`/dashboard/agreements/${id}`);
  }

  if (!["draft", "awaiting_client"].includes(agreement.status)) {
    redirect(`/dashboard/agreements/${id}`);
  }

  return (
    <div className="space-y-8">
      <BackLink href={`/dashboard/agreements/${id}`} label="Back to agreement" />
      <PageHeader title="Edit agreement" description={agreement.title} />
      <AgreementForm agreement={agreement} />
    </div>
  );
}
