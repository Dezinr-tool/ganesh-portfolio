import { readAgreements } from "@/lib/agreements-store";
import { readInvoices } from "@/lib/invoices-store";

export type DashboardStats = {
  totalEarned: number;
  pendingAmount: number;
  totalInvoices: number;
  totalAgreements: number;
  monthlyEarned: number[];
  monthlyPending: number[];
  monthlyInvoices: number[];
  monthlyAgreements: number[];
};

function monthKey(date: Date | string): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function getLast6MonthKeys(): string[] {
  const keys: string[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(monthKey(d));
  }

  return keys;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [invoices, agreements] = await Promise.all([
    readInvoices(),
    readAgreements(),
  ]);

  const months = getLast6MonthKeys();
  const monthlyEarned = months.map(() => 0);
  const monthlyPending = months.map(() => 0);
  const monthlyInvoices = months.map(() => 0);
  const monthlyAgreements = months.map(() => 0);

  for (const invoice of invoices) {
    const index = months.indexOf(monthKey(invoice.createdAt));
    if (index === -1) continue;

    monthlyInvoices[index]++;

    if (invoice.status === "Paid") {
      monthlyEarned[index] += invoice.total;
    } else {
      monthlyPending[index] += invoice.total;
    }
  }

  for (const agreement of agreements) {
    const index = months.indexOf(monthKey(agreement.createdAt));
    if (index === -1) continue;
    monthlyAgreements[index]++;
  }

  return {
    totalEarned: roundMoney(
      invoices
        .filter((invoice) => invoice.status === "Paid")
        .reduce((sum, invoice) => sum + invoice.total, 0),
    ),
    pendingAmount: roundMoney(
      invoices
        .filter((invoice) => invoice.status === "Unpaid")
        .reduce((sum, invoice) => sum + invoice.total, 0),
    ),
    totalInvoices: invoices.length,
    totalAgreements: agreements.length,
    monthlyEarned: monthlyEarned.map(roundMoney),
    monthlyPending: monthlyPending.map(roundMoney),
    monthlyInvoices,
    monthlyAgreements,
  };
}
