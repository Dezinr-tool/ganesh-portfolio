import Link from "next/link";
import AgreementForm from "../agreement-form";

export default function NewAgreementPage() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/agreements"
          className="text-sm text-neutral-400 hover:text-white"
        >
          ← Back to agreements
        </Link>
      </div>

      <h1 className="text-2xl font-semibold text-white">New agreement</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Create a new design services agreement for your client.
      </p>

      <div className="mt-8">
        <AgreementForm />
      </div>
    </div>
  );
}
