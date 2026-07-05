"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoodboardSessionsBar } from "./moodboard-sessions-bar";

const links = [
  { href: "/tools", label: "All Tools" },
  { href: "/moodboard", label: "Session", match: "exact" as const },
  { href: "/moodboard/memory", label: "Memory", match: "prefix" as const },
  { href: "/moodboard/sessions", label: "All", match: "prefix" as const },
  { href: "/moodboard/admin", label: "Admin", match: "prefix" as const },
];

export function MoodboardNav({
  theme = "dark",
  activeSessionId,
}: {
  theme?: "dark" | "light";
  activeSessionId?: string;
}) {
  const pathname = usePathname();
  const light = theme === "light";

  const isActive = (href: string, match?: "exact" | "prefix") => {
    if (match === "prefix") {
      return pathname === href || pathname.startsWith(`${href}/`);
    }
    return pathname === href;
  };

  return (
    <header
      className={`relative z-20 border-b transition-colors duration-[400ms] ease-out ${
        light
          ? "border-[var(--color-bg)] bg-[var(--color-bg)]"
          : "border-[var(--color-bg)]/[0.06] bg-[var(--color-text)]/60 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/moodboard"
          className={`text-sm font-medium tracking-tight transition ${
            light ? "text-[var(--color-text)]/90 hover:text-[var(--color-text)]" : "text-[var(--color-bg)]/90 hover:text-[var(--color-bg)]"
          }`}
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
                    ? light
                      ? "text-[var(--color-text)]"
                      : "text-[var(--color-bg)]"
                    : light
                      ? "text-[var(--color-text)]/40 hover:text-[var(--color-text)]/70"
                      : "text-[var(--color-bg)]/40 hover:text-[var(--color-bg)]/70"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
      {activeSessionId ? (
        <MoodboardSessionsBar activeSessionId={activeSessionId} theme={theme} />
      ) : null}
    </header>
  );
}
