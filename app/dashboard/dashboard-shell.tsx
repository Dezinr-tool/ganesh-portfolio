"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/dashboard/login";

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <header className="border-b border-[var(--color-text)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-sm font-semibold text-[var(--color-bg)]">
            Dashboard
          </Link>
          <nav className="flex gap-4 text-sm text-[var(--color-text)]">
            <Link href="/dashboard" className="hover:text-[var(--color-bg)]">
              Overview
            </Link>
            <Link href="/dashboard/invoices" className="hover:text-[var(--color-bg)]">
              Invoices
            </Link>
            <Link href="/dashboard/agreements" className="hover:text-[var(--color-bg)]">
              Agreements
            </Link>
            <Link href="/dashboard/settings" className="hover:text-[var(--color-bg)]">
              Settings
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
