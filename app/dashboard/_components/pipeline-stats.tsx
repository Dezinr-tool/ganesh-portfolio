import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardStats } from "@/lib/dashboard-stats";
import { Repeat2, TrendingUp, Users } from "lucide-react";

type PipelineStatCardProps = {
  label: string;
  value: string;
  icon: React.ReactNode;
};

function PipelineStatCard({ label, value, icon }: PipelineStatCardProps) {
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

type PipelineStatsProps = {
  stats: DashboardStats;
};

export function PipelineStats({ stats }: PipelineStatsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">
          Client pipeline
        </h2>
        <Link
          href="/dashboard/projects"
          className="text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          View projects
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <PipelineStatCard
          label="Total Projects"
          value={String(stats.totalProjects)}
          icon={<Users className="size-4" aria-hidden />}
        />
        <PipelineStatCard
          label="Conversion Rate"
          value={
            stats.totalProjects > 0
              ? `${stats.conversionRate}% (${stats.convertedProjects}/${stats.totalProjects})`
              : "—"
          }
          icon={<TrendingUp className="size-4" aria-hidden />}
        />
        <PipelineStatCard
          label="Repeat Clients"
          value={String(stats.repeatClients)}
          icon={<Repeat2 className="size-4" aria-hidden />}
        />
      </div>
    </div>
  );
}
