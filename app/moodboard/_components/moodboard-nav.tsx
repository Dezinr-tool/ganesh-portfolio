"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/tools", label: "All Tools" },
  { href: "/moodboard", label: "Session", match: "exact" as const },
  { href: "/moodboard/admin", label: "Admin", match: "prefix" as const },
];

export function MoodboardNav() {
  const pathname = usePathname();

  const isActive = (href: string, match?: "exact" | "prefix") => {
    if (match === "prefix") {
      return pathname === href || pathname.startsWith(`${href}/`);
    }
    return pathname === href;
  };

  return (
    <header className="relative z-20 border-b border-white/[0.06] bg-black/60 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link
          href="/moodboard"
          className="text-sm font-medium tracking-tight text-white/90 transition hover:text-white"
        >
          Moodboard
        </Link>
        <nav className="flex items-center gap-1">
          {links.map((link) => {
            const active = isActive(link.href, link.match);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "text-white"
                    : "text-white/40 hover:text-white/70"
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
