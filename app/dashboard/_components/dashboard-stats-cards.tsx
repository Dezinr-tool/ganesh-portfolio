import { formatCurrency } from "../_lib/invoices";
import type { DashboardStats } from "@/lib/dashboard-stats";
import { Sparkline } from "./sparkline";

type StatCardConfig = {
  label: string;
  value: string;
  data: number[];
  color: string;
  variant: "line" | "bar";
};

function StatCard({ label, value, data, color, variant }: StatCardConfig) {
  return (
    <div className="rounded-lg border border-[var(--color-text)] bg-[var(--color-bg)] p-5">
      <p className="text-sm text-[var(--color-text)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-[var(--color-bg)]">
        {value}
      </p>
      <div className="mt-4">
        <Sparkline data={data} color={color} variant={variant} />
      </div>
    </div>
  );
}

type DashboardStatsCardsProps = {
  stats: DashboardStats;
};

export function DashboardStatsCards({ stats }: DashboardStatsCardsProps) {
  const cards: StatCardConfig[] = [
    {
      label: "Total Earned",
      value: formatCurrency(stats.totalEarned),
      data: stats.monthlyEarned,
      color: "var(--color-accent)",
      variant: "bar",
    },
    {
      label: "Pending Amount",
      value: formatCurrency(stats.pendingAmount),
      data: stats.monthlyPending,
      color: "var(--color-accent)",
      variant: "bar",
    },
    {
      label: "Total Invoices",
      value: String(stats.totalInvoices),
      data: stats.monthlyInvoices,
      color: "var(--color-bg)",
      variant: "line",
    },
    {
      label: "Total Agreements",
      value: String(stats.totalAgreements),
      data: stats.monthlyAgreements,
      color: "var(--color-accent)",
      variant: "line",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  );
}
