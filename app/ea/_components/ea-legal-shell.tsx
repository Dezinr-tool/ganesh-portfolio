"use client";

import Link from "next/link";

export function EALegalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#111111] text-[#FFFFFF]">
      <header className="border-b border-[#FFFFFF]/15">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link
            href="/ea/login"
            className="text-sm font-medium text-[#FFFFFF] hover:opacity-80"
          >
            Virtual EA
          </Link>
          <Link
            href="/ea/login"
            className="text-sm text-[#FFFFFF]/70 hover:text-[#FFFFFF]"
          >
            Sign in
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10">{children}</main>
      <footer className="border-t border-[#FFFFFF]/15">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-4 px-6 py-6 text-sm text-[#FFFFFF]/70">
          <p>© {new Date().getFullYear()} Virtual EA</p>
          <Link href="/ea/privacy" className="hover:text-[#FFFFFF]">
            Privacy
          </Link>
          <Link href="/ea/terms" className="hover:text-[#FFFFFF]">
            Terms
          </Link>
        </div>
      </footer>
    </div>
  );
}
