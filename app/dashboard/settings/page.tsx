import { BrandSettingsForm } from "./brand-settings-form";
import { PaymentBillingSettingsForm } from "./payment-billing-settings-form";
import { SignatureSettingsForm } from "./signature-settings-form";

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--color-bg)]">Settings</h1>
      <p className="mt-2 text-sm text-[var(--color-text)]">
        Manage brand colors, payment details, invoicing rates, and your
        agreement signature.
      </p>

      <div className="mt-8 max-w-xl space-y-8">
        <section className="rounded-lg border border-[var(--color-text)] bg-[var(--color-bg)] p-6">
          <h2 className="text-sm font-medium text-[var(--color-bg)]">
            Design System / Brand
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text)]">
            Three brand tokens used across the portfolio, invoice PDFs, and
            agreement previews.
          </p>
          <div className="mt-4">
            <BrandSettingsForm />
          </div>
        </section>

        <section className="rounded-lg border border-[var(--color-text)] bg-[var(--color-bg)] p-6">
          <h2 className="text-sm font-medium text-[var(--color-bg)]">Payment & Billing</h2>
          <p className="mt-1 text-sm text-[var(--color-text)]">
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
