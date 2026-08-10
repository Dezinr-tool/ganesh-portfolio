import type { Metadata } from "next";
import "../dashboard/dashboard.css";
import "./expense-tracker.css";

export const metadata: Metadata = {
  title: "Expense Tracker — Ganesh Das",
  robots: { index: false, follow: false },
};

export default function ExpenseTrackerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-app expense-tracker min-h-dvh bg-background text-foreground">
      {children}
    </div>
  );
}
