import { listSessionsAnalytics } from "@/lib/moodboard/analytics";
import { SessionsDashboard } from "./_components/sessions-dashboard";

export const dynamic = "force-dynamic";

export default async function MoodboardSessionsPage() {
  const sessions = await listSessionsAnalytics();
  return <SessionsDashboard sessions={sessions} />;
}
