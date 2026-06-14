import { PaymentBillingSettingsForm } from "./payment-billing-settings-form";
import { SignatureSettingsForm } from "./signature-settings-form";

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Settings</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Manage payment details, invoicing rates, and your agreement signature.
      </p>

      <div className="mt-8 max-w-xl space-y-8">
        <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="text-sm font-medium text-white">Payment & Billing</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Used on invoices and PDF payment details.
          </p>
          <div className="mt-4">
            <PaymentBillingSettingsForm />
          </div>
        </section>

        <SignatureSettingsForm />
      </div>
    </div>
  );
}
