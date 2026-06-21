"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = { href: string; label: string; match?: "exact" | "prefix" };

type DesignToolNavProps = {
  title?: string;
  links: NavLink[];
};

export function DesignToolNav({ title = "Tools", links }: DesignToolNavProps) {
  const pathname = usePathname();

  const isActive = (link: NavLink) => {
    if (link.match === "prefix") {
      return pathname === link.href || pathname.startsWith(`${link.href}/`);
    }
    return pathname === link.href;
  };

  return (
    <header className="border-b border-[var(--color-text)]/80 bg-[var(--color-text)]">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/tools" className="shrink-0 text-sm font-medium text-[var(--color-bg)]">
          {title}
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-1">
          {links.map((link) => {
            const active = isActive(link);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-[var(--color-bg)] text-[var(--color-bg)]"
                    : "text-[var(--color-text)] hover:text-[var(--color-text)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
