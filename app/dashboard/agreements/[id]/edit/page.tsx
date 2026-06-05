import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAgreementById } from "@/lib/agreements-store";
import AgreementForm from "../../agreement-form";

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
    <div>
      <div className="mb-6">
        <Link
          href={`/dashboard/agreements/${id}`}
          className="text-sm text-neutral-400 hover:text-white"
        >
          ← Back to agreement
        </Link>
      </div>

      <h1 className="text-2xl font-semibold text-white">Edit agreement</h1>
      <p className="mt-2 text-sm text-neutral-400">{agreement.title}</p>

      <div className="mt-8">
        <AgreementForm agreement={agreement} />
      </div>
    </div>
  );
}
