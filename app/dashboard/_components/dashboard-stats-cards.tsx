"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "../_lib/invoices";
import { Sparkline } from "./sparkline";

type DashboardStats = {
  totalEarned: number;
  pendingAmount: number;
  totalInvoices: number;
  totalAgreements: number;
  monthlyEarned: number[];
  monthlyPending: number[];
  monthlyInvoices: number[];
  monthlyAgreements: number[];
};

type StatCardConfig = {
  label: string;
  value: string;
  data: number[];
  color: string;
  variant: "line" | "bar";
};

function StatCard({ label, value, data, color, variant }: StatCardConfig) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-5">
      <p className="text-sm text-neutral-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-white">
        {value}
      </p>
      <div className="mt-4">
        <Sparkline data={data} color={color} variant={variant} />
      </div>
    </div>
  );
}

export function DashboardStatsCards() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/stats", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load stats.");
        return res.json();
      })
      .then((data: DashboardStats) => setStats(data))
      .catch(() => setError("Could not load dashboard stats."));
  }, []);

  if (error) {
    return (
      <p className="text-sm text-red-400" role="alert">
        {error}
      </p>
    );
  }

  if (!stats) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-[132px] animate-pulse rounded-lg border border-neutral-800 bg-neutral-900"
          />
        ))}
      </div>
    );
  }

  const cards: StatCardConfig[] = [
    {
      label: "Total Earned",
      value: formatCurrency(stats.totalEarned),
      data: stats.monthlyEarned,
      color: "#4ade80",
      variant: "bar",
    },
    {
      label: "Pending Amount",
      value: formatCurrency(stats.pendingAmount),
      data: stats.monthlyPending,
      color: "#f59e0b",
      variant: "bar",
    },
    {
      label: "Total Invoices",
      value: String(stats.totalInvoices),
      data: stats.monthlyInvoices,
      color: "#ffffff",
      variant: "line",
    },
    {
      label: "Total Agreements",
      value: String(stats.totalAgreements),
      data: stats.monthlyAgreements,
      color: "#60a5fa",
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
