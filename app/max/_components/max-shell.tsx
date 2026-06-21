import Link from "next/link";

type MaxShellProps = {
  children: React.ReactNode;
};

export function MaxShell({ children }: MaxShellProps) {
  return (
    <div className="min-h-screen bg-[var(--color-text)] text-[var(--color-text)]">
      <header className="border-b border-[var(--color-text)]/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href="/max" className="text-sm font-medium text-[var(--color-bg)] hover:text-[var(--color-text)]">
            Virtual EA
          </Link>
          <div className="flex gap-3">
            <Link href="/ea/login" className="text-sm text-[var(--color-text)] hover:text-[var(--color-bg)]">
              Sign in
            </Link>
            <Link
              href="/ea/signup"
              className="rounded-lg bg-[var(--color-bg)] px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)]"
            >
              Start free trial
            </Link>
          </div>
        </div>
      </header>

      {children}

      <footer className="border-t border-[var(--color-text)]/80 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <p className="text-sm text-[var(--color-text)]">
            © {new Date().getFullYear()} Virtual EA
          </p>
          <div className="flex gap-6 text-sm">
            <Link href="/max/privacy" className="text-[var(--color-text)] hover:text-[var(--color-bg)]">
              Privacy
            </Link>
            <Link href="/max/terms" className="text-[var(--color-text)] hover:text-[var(--color-bg)]">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
