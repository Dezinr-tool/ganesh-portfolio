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
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-sm font-semibold text-white">
            Dashboard
          </Link>
          <nav className="flex gap-4 text-sm text-neutral-400">
            <Link href="/dashboard" className="hover:text-white">
              Overview
            </Link>
            <Link href="/dashboard/invoices" className="hover:text-white">
              Invoices
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
