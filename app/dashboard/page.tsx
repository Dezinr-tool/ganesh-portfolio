import { DashboardStatsCards } from "./_components/dashboard-stats-cards";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Overview</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Track earnings, invoices, and agreements at a glance.
      </p>

      <div className="mt-8">
        <DashboardStatsCards />
      </div>
    </div>
  );
}
