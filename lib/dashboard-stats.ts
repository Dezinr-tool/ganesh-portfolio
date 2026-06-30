import { readAgreements } from "@/lib/agreements-store";
import { readInvoices } from "@/lib/invoices-store";
import { readProjects } from "@/lib/projects-store";

export type FYSummary = {
  label: string; // e.g. "FY 2025–26"
  startYear: number;
  earned: number;
  pending: number;
  invoiceCount: number;
  /** 12 values Apr→Mar, earned only */
  monthlyEarned: number[];
};

export type DashboardStats = {
  totalEarned: number;
  pendingAmount: number;
  totalInvoices: number;
  totalAgreements: number;
  monthlyEarned: number[];
  monthlyPending: number[];
  monthlyInvoices: number[];
  monthlyAgreements: number[];
  currentFY: FYSummary;
  previousFY: FYSummary;
  totalProjects: number;
  convertedProjects: number;
  conversionRate: number;
  repeatClients: number;
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

/** Indian FY: Apr 1 → Mar 31. Returns the April-start year for a given date. */
function fyStartYear(date: Date): number {
  return date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
}

/** Build a FYSummary for a given April-start year. */
function buildFY(
  startYear: number,
  invoices: Awaited<ReturnType<typeof readInvoices>>,
): FYSummary {
  // 12 months: Apr(index 0) … Mar(index 11)
  const monthlyEarned = Array<number>(12).fill(0);
  let earned = 0;
  let pending = 0;
  let invoiceCount = 0;

  for (const inv of invoices) {
    const d = new Date(inv.issueDate || inv.createdAt);
    if (fyStartYear(d) !== startYear) continue;
    invoiceCount++;
    // month index relative to April: Apr=0 … Mar=11
    const idx = (d.getMonth() - 3 + 12) % 12;
    if (inv.status === "Paid") {
      earned += inv.total;
      monthlyEarned[idx] += inv.total;
    } else {
      pending += inv.total;
    }
  }

  const endYear = startYear + 1;
  return {
    label: `FY ${startYear}–${String(endYear).slice(2)}`,
    startYear,
    earned: roundMoney(earned),
    pending: roundMoney(pending),
    invoiceCount,
    monthlyEarned: monthlyEarned.map(roundMoney),
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [invoices, agreements, projects] = await Promise.all([
    readInvoices(),
    readAgreements(),
    readProjects(),
  ]);

  const now = new Date();
  const currentFYStart = fyStartYear(now);

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

  const convertedProjects = projects.filter((p) => p.status === "converted");
  const conversionRate =
    projects.length > 0
      ? roundMoney((convertedProjects.length / projects.length) * 100)
      : 0;

  // Retention = clients who've converted more than once (identified by
  // email, falling back to name when no email was recorded).
  const conversionsByClient = new Map<string, number>();
  for (const project of convertedProjects) {
    const key = (project.clientEmail || project.clientName).trim().toLowerCase();
    if (!key) continue;
    conversionsByClient.set(key, (conversionsByClient.get(key) ?? 0) + 1);
  }
  const repeatClients = [...conversionsByClient.values()].filter(
    (count) => count >= 2,
  ).length;

  return {
    totalEarned: roundMoney(
      invoices.filter((i) => i.status === "Paid").reduce((s, i) => s + i.total, 0),
    ),
    pendingAmount: roundMoney(
      invoices.filter((i) => i.status === "Unpaid").reduce((s, i) => s + i.total, 0),
    ),
    totalInvoices: invoices.length,
    totalAgreements: agreements.length,
    monthlyEarned: monthlyEarned.map(roundMoney),
    monthlyPending: monthlyPending.map(roundMoney),
    monthlyInvoices,
    monthlyAgreements,
    currentFY: buildFY(currentFYStart, invoices),
    previousFY: buildFY(currentFYStart - 1, invoices),
    totalProjects: projects.length,
    convertedProjects: convertedProjects.length,
    conversionRate,
    repeatClients,
  };
}
