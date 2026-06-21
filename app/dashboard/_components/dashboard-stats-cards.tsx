import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardStats } from "@/lib/dashboard-stats";
import {
  FileText,
  Handshake,
  IndianRupee,
  Timer,
} from "lucide-react";
import { formatCurrency } from "../_lib/invoices";

type StatCardProps = {
  label: string;
  value: string;
  icon: ReactNode;
};

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

type DashboardStatsCardsProps = {
  stats: DashboardStats;
};

export function DashboardStatsCards({ stats }: DashboardStatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Total Earned"
        value={formatCurrency(stats.totalEarned)}
        icon={<IndianRupee className="size-4" aria-hidden />}
      />
      <StatCard
        label="Pending Amount"
        value={formatCurrency(stats.pendingAmount)}
        icon={<Timer className="size-4" aria-hidden />}
      />
      <StatCard
        label="Total Invoices"
        value={String(stats.totalInvoices)}
        icon={<FileText className="size-4" aria-hidden />}
      />
      <StatCard
        label="Total Agreements"
        value={String(stats.totalAgreements)}
        icon={<Handshake className="size-4" aria-hidden />}
      />
    </div>
  );
}
