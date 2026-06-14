"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEASettings } from "./use-ea-settings";

const links = [
  { href: "/ea/dashboard", label: "Dashboard" },
  { href: "/ea/meetings", label: "Meetings" },
  { href: "/ea/insights", label: "Intelligence" },
  { href: "/ea/chat", label: "Chat" },
  { href: "/ea/settings", label: "Settings" },
];

export function EANav() {
  const pathname = usePathname();
  const { eaName } = useEASettings();

  return (
    <header className="border-b border-zinc-800/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link href="/ea/dashboard" className="text-sm font-medium text-white">
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
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-500 hover:text-zinc-300"
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
