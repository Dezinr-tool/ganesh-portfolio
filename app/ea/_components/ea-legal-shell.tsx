import Link from "next/link";
import { AdSlot } from "@/components/adsense/ad-slot";
import { isAdSenseConfigured } from "@/lib/adsense-config";

type EALegalShellProps = {
  children: React.ReactNode;
};

export function EALegalShell({ children }: EALegalShellProps) {
  const showAds = isAdSenseConfigured();

  return (
    <div className="min-h-screen bg-[var(--color-text)] text-[var(--color-text)]">
        <header className="border-b border-[var(--color-text)]/80">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
            <Link
              href="/ea/login"
              className="text-sm font-medium text-[var(--color-bg)] hover:text-[var(--color-text)]"
            >
              Virtual EA
            </Link>
            <Link
              href="/ea/login"
              className="text-sm text-[var(--color-text)] hover:text-[var(--color-bg)]"
            >
              Sign in
            </Link>
          </div>
        </header>

        {showAds ? (
          <div className="mx-auto max-w-3xl px-6 pt-8">
            <AdSlot placement="banner" theme="ea" />
          </div>
        ) : null}

        {children}

        {showAds ? (
          <div className="mx-auto max-w-3xl px-6 pb-4">
            <AdSlot placement="banner" theme="ea" />
          </div>
        ) : null}

        <footer className="border-t border-[var(--color-text)]/80 py-10">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
            <p className="text-sm text-[var(--color-text)]">
              © {new Date().getFullYear()} Virtual EA
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="/ea/privacy" className="text-[var(--color-text)] hover:text-[var(--color-bg)]">
                Privacy
              </Link>
              <Link href="/ea/terms" className="text-[var(--color-text)] hover:text-[var(--color-bg)]">
                Terms
              </Link>
            </div>
          </div>
        </footer>
      </div>
  );
}

