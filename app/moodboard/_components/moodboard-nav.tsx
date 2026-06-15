"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/moodboard", label: "Moodboard" },
  { href: "/moodboard/admin", label: "Admin" },
];

export function MoodboardNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-zinc-800/80 bg-[#0d0d0d]">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-sm font-medium text-white">
          designbyganesh
        </Link>
        <nav className="flex items-center gap-1">
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
