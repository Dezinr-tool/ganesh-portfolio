"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEASettings } from "./use-ea-settings";

const links = [
  { href: "/ea/dashboard", label: "Dashboard" },
  { href: "/ea/meetings", label: "Meetings" },
  { href: "/ea/followups", label: "Follow-ups" },
  { href: "/ea/insights", label: "Intelligence" },
  { href: "/ea/chat", label: "Chat" },
  { href: "/ea/settings", label: "Settings" },
];

export function EANav() {
  const pathname = usePathname();
  const { eaName } = useEASettings();

  return (
    <header className="border-b border-[var(--color-text)]/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link href="/ea/dashboard" className="text-sm font-medium text-[var(--color-bg)]">
          {eaName}
        </Link>
        <nav className="flex gap-1">
          {links.map((link) => {
            const active = pathname === link.href;
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
