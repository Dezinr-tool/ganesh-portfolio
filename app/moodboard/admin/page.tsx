import { MoodboardNav } from "../_components/moodboard-nav";
import { AdminEditor } from "./_components/admin-editor";

export default function MoodboardAdminPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100">
      <MoodboardNav />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-light text-white">Question Editor</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Edit intake questions — changes save immediately.
        </p>
        <AdminEditor />
      </main>
    </div>
  );
}
