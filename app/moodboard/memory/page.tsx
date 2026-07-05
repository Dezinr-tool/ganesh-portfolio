import { MemoryDashboard } from "./_components/memory-dashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Moodboard Memory — Agent Training",
  description: "Training corpus: user prompts, intake, and generations from Moodboard.",
};

export default function MoodboardMemoryPage() {
  return (
    <div className="moodboard-app moodboard-memory-page">
      <MemoryDashboard />
    </div>
  );
}
