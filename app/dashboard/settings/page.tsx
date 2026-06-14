import { HourlyRateSettingsForm } from "./hourly-rate-settings-form";
import { SignatureSettingsForm } from "./signature-settings-form";

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Settings</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Manage your default hourly rate and signature for agreements.
      </p>

      <div className="mt-8 max-w-xl space-y-8">
        <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="text-sm font-medium text-white">Invoicing</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Used as the default rate on new invoice line items.
          </p>
          <div className="mt-4">
            <HourlyRateSettingsForm />
          </div>
        </section>

        <SignatureSettingsForm />
      </div>
    </div>
  );
}
