"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/tools", label: "All Tools" },
  { href: "/moodboard", label: "Session", match: "exact" as const },
  { href: "/moodboard/admin", label: "Admin", match: "prefix" as const },
];

export function MoodboardNav({ theme = "dark" }: { theme?: "dark" | "light" }) {
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
          ? "border-[#e8e8e8] bg-[#fafafa]/90 backdrop-blur-md"
          : "border-white/[0.06] bg-black/60 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/moodboard"
          className={`text-sm font-medium tracking-tight transition ${
            light ? "text-[#1a1a1a]/90 hover:text-[#1a1a1a]" : "text-white/90 hover:text-white"
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
                      ? "text-[#1a1a1a]"
                      : "text-white"
                    : light
                      ? "text-[#1a1a1a]/40 hover:text-[#1a1a1a]/70"
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
