import { getDashboardStats } from "@/lib/dashboard-stats";
import { DashboardStatsCards } from "./_components/dashboard-stats-cards";
import { FreelanceFetchCard } from "./_components/freelance-fetch-card";
import { FYEarnings } from "./_components/fy-earnings";
import { PageHeader } from "./_components/page-header";
import { PipelineStats } from "./_components/pipeline-stats";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Overview"
        description="Track earnings, invoices, and agreements at a glance."
      />
      <FreelanceFetchCard />
      <FYEarnings current={stats.currentFY} previous={stats.previousFY} />
      <DashboardStatsCards stats={stats} />
      <PipelineStats stats={stats} />
    </div>
  );
}
