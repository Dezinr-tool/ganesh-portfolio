import Link from "next/link";

type EALegalShellProps = {
  children: React.ReactNode;
};

export function EALegalShell({ children }: EALegalShellProps) {
  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <header className="border-b border-zinc-800/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link
            href="/ea/login"
            className="text-sm font-medium text-white hover:text-zinc-200"
          >
            Virtual EA
          </Link>
          <Link
            href="/ea/login"
            className="text-sm text-zinc-400 hover:text-white"
          >
            Sign in
          </Link>
        </div>
      </header>

      {children}

      <footer className="border-t border-zinc-800/80 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <p className="text-sm text-zinc-500">
            © {new Date().getFullYear()} Virtual EA
          </p>
          <div className="flex gap-6 text-sm">
            <Link href="/ea/privacy" className="text-zinc-400 hover:text-white">
              Privacy
            </Link>
            <Link href="/ea/terms" className="text-zinc-400 hover:text-white">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
