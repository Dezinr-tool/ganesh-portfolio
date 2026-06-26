"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Handshake, FileText, LayoutGrid, SlidersHorizontal } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid, exact: true },
  { href: "/dashboard/invoices", label: "Invoices", icon: FileText, exact: false },
  { href: "/dashboard/agreements", label: "Agreements", icon: Handshake, exact: false },
  { href: "/dashboard/settings", label: "Settings", icon: SlidersHorizontal, exact: false },
] as const;

function isActive(pathname: string, href: string, exact: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/dashboard/login";

  if (isLogin) {
    return <div className="dashboard-app min-h-dvh bg-background">{children}</div>;
  }

  return (
    <div className="dashboard-app min-h-dvh bg-background text-foreground">
      {/* Header — desktop nav only */}
      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <Link
            href="/dashboard"
            className="text-sm font-semibold tracking-tight text-foreground"
          >
            Dashboard
          </Link>

          {/* Desktop nav — hidden on mobile */}
          <nav className="hidden items-center gap-1 sm:flex">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    buttonVariants({ variant: active ? "secondary" : "ghost", size: "sm" }),
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <Separator className="hidden sm:block" />

      {/* Main content — extra bottom padding on mobile to clear the tab bar */}
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6 sm:py-10 sm:pb-10">
        {children}
      </main>

      {/* Mobile bottom tab bar — hidden on desktop */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-background sm:hidden"
        aria-label="Main navigation"
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                active ? "text-foreground" : "text-muted-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                className={cn("size-5", active ? "stroke-[2]" : "stroke-[1.5]")}
                aria-hidden
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
