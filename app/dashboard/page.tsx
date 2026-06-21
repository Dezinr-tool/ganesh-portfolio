import { getDashboardStats } from "@/lib/dashboard-stats";
import { DashboardStatsCards } from "./_components/dashboard-stats-cards";
import { PageHeader } from "./_components/page-header";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Overview"
        description="Track earnings, invoices, and agreements at a glance."
      />
      <DashboardStatsCards stats={stats} />
    </div>
  );
}
