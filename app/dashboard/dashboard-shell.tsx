"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  LayoutGridIcon,
  type LayoutGridIconHandle,
} from "@/components/ui/layout-grid";
import {
  FileTextIcon,
  type FileTextIconHandle,
} from "@/components/ui/file-text";
import {
  FileCheckIcon,
  type FileCheckIconHandle,
} from "@/components/ui/file-check";
import { UsersIcon, type UsersIconHandle } from "@/components/ui/users-icon";
import {
  SlidersHorizontalIcon,
  type SlidersHorizontalIconHandle,
} from "@/components/ui/sliders-horizontal";

type NavItem = {
  href: string;
  label: string;
  exact: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/projects", label: "Projects", exact: false },
  { href: "/dashboard/invoices", label: "Invoices", exact: false },
  { href: "/dashboard/agreements", label: "Agreements", exact: false },
  { href: "/dashboard/settings", label: "Settings", exact: false },
];

function isActive(pathname: string, href: string, exact: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function AnimatedTabBar({ pathname }: { pathname: string }) {
  const overviewRef = useRef<LayoutGridIconHandle>(null);
  const projectsRef = useRef<UsersIconHandle>(null);
  const invoicesRef = useRef<FileTextIconHandle>(null);
  const agreementsRef = useRef<FileCheckIconHandle>(null);
  const settingsRef = useRef<SlidersHorizontalIconHandle>(null);

  const tabs = [
    {
      ...NAV_ITEMS[0],
      ref: overviewRef,
      Icon: LayoutGridIcon as React.ComponentType<{
        ref?: React.Ref<LayoutGridIconHandle>;
        size?: number;
        className?: string;
      }>,
    },
    {
      ...NAV_ITEMS[1],
      ref: projectsRef,
      Icon: UsersIcon as React.ComponentType<{
        ref?: React.Ref<UsersIconHandle>;
        size?: number;
        className?: string;
      }>,
    },
    {
      ...NAV_ITEMS[2],
      ref: invoicesRef,
      Icon: FileTextIcon as React.ComponentType<{
        ref?: React.Ref<FileTextIconHandle>;
        size?: number;
        className?: string;
      }>,
    },
    {
      ...NAV_ITEMS[3],
      ref: agreementsRef,
      Icon: FileCheckIcon as React.ComponentType<{
        ref?: React.Ref<FileCheckIconHandle>;
        size?: number;
        className?: string;
      }>,
    },
    {
      ...NAV_ITEMS[4],
      ref: settingsRef,
      Icon: SlidersHorizontalIcon as React.ComponentType<{
        ref?: React.Ref<SlidersHorizontalIconHandle>;
        size?: number;
        className?: string;
      }>,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-background sm:hidden"
      aria-label="Main navigation"
    >
      {tabs.map((tab) => {
        const active = isActive(pathname, tab.href, tab.exact);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            onClick={() => tab.ref.current?.startAnimation()}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
              active ? "text-foreground" : "text-muted-foreground",
            )}
            aria-current={active ? "page" : undefined}
          >
            <tab.Icon ref={tab.ref} size={active ? 22 : 20} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
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

      {/* Main content */}
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6 sm:py-10 sm:pb-10">
        {children}
      </main>

      {/* Mobile bottom tab bar with animated icons */}
      <AnimatedTabBar pathname={pathname} />
    </div>
  );
}
