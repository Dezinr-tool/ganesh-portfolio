import { DashboardShell } from "./dashboard-shell";

export const metadata = {
  title: "Dashboard — Ganesh Das",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
