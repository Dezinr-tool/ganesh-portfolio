import { MoodboardNav } from "../_components/moodboard-nav";
import { AdminEditor } from "./_components/admin-editor";

export default function MoodboardAdminPage() {
  return (
    <div className="min-h-screen bg-[var(--color-text)] text-[var(--color-text)]">
      <MoodboardNav />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-light text-[var(--color-bg)]">Question Editor</h1>
        <p className="mt-1 text-sm text-[var(--color-text)]">
          Edit intake questions — changes save immediately.
        </p>
        <AdminEditor />
      </main>
    </div>
  );
}
