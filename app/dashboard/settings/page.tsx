import { SignatureSettingsForm } from "./signature-settings-form";

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Settings</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Manage your default signature for agreement signing.
      </p>

      <div className="mt-8 max-w-xl">
        <SignatureSettingsForm />
      </div>
    </div>
  );
}
