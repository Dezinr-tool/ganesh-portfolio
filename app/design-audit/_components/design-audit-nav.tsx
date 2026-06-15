"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function DesignAuditNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-zinc-800/80 bg-black">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-sm font-medium text-white">
          designbyganesh
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/design-audit"
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              pathname === "/design-audit"
                ? "bg-zinc-800 text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Design Audit
          </Link>
        </nav>
      </div>
    </header>
  );
}
