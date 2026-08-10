import { MemoryDashboard } from "./_components/memory-dashboard";
import "../moodboard/moodboard.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Memory Vault",
  description: "Private training corpus — prompts, intake, and generations.",
  robots: { index: false, follow: false },
};

export default function MemoryVaultPage() {
  return (
    <div className="moodboard-app moodboard-memory-page">
      <MemoryDashboard />
    </div>
  );
}
