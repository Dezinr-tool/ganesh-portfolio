import Link from "next/link";
import { MaxShell } from "../_components/max-shell";

export const metadata = {
  title: "Terms of Service — Virtual EA",
  description: "Terms of service for Virtual EA",
};

export default function MaxTermsPage() {
  return (
    <MaxShell>
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm text-[var(--color-text)]">
          <Link href="/max" className="hover:text-[var(--color-text)]">
            ← Back to Virtual EA
          </Link>
        </p>

        <h1 className="mt-6 text-3xl font-light text-[var(--color-bg)]">Terms of Service</h1>
        <p className="mt-2 text-sm text-[var(--color-text)]">Last updated: June 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-[var(--color-text)]">
          <section>
            <h2 className="text-lg font-medium text-[var(--color-bg)]">Agreement</h2>
            <p className="mt-3">
              By accessing or using Virtual EA, you agree to these Terms of
              Service. If you do not agree, do not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[var(--color-bg)]">Personal use</h2>
            <p className="mt-3">
              Virtual EA is intended for personal and professional productivity
              use by individuals and small teams. You may not use Virtual EA to
              violate any law, harass others, send spam, or attempt to
              reverse-engineer or overload the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[var(--color-bg)]">Your responsibilities</h2>
            <p className="mt-3">You are responsible for:</p>
            <ul className="mt-4 list-inside list-disc space-y-2">
              <li>Maintaining the security of your account credentials</li>
              <li>
                The content you send to Virtual EA (messages, transcripts, emails)
              </li>
              <li>
                Your own Neon database — backups, access control, and compliance
              </li>
              <li>
                Reviewing AI-generated outputs (follow-ups, summaries, calendar
                events) before acting on them
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[var(--color-bg)]">AI-generated content</h2>
            <p className="mt-3">
              Virtual EA uses AI models that can make mistakes. Outputs are
              provided for assistance only and are not professional, legal, or
              financial advice. You are solely responsible for verifying anything
              Virtual EA produces before you send, schedule, or rely on it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[var(--color-bg)]">No warranty</h2>
            <p className="mt-3">
              Virtual EA is provided &quot;as is&quot; and &quot;as available&quot;
              without warranties of any kind, express or implied, including
              merchantability, fitness for a particular purpose, or uninterrupted
              availability. We do not guarantee that AI responses will be accurate,
              complete, or timely.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[var(--color-bg)]">Service changes</h2>
            <p className="mt-3">
              We may modify, suspend, or discontinue Virtual EA — or any feature
              — at any time, with or without notice. We are not liable for any
              modification, suspension, or discontinuation of the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[var(--color-bg)]">Limitation of liability</h2>
            <p className="mt-3">
              To the fullest extent permitted by law, Ganesh Das shall not be
              liable for any indirect, incidental, special, or consequential
              damages arising from your use of Virtual EA, including lost data,
              missed meetings, or unsent communications.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[var(--color-bg)]">Your data</h2>
            <p className="mt-3">
              Your data is stored in the database you provide. You retain ownership
              of your content. We recommend regular backups. If you stop using
              Virtual EA, export or delete your data from your database as needed.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[var(--color-bg)]">Contact</h2>
            <p className="mt-3">
              Questions about these terms? Email{" "}
              <a
                href="mailto:hello@designbyganesh.com"
                className="text-[var(--color-bg)] underline hover:text-[var(--color-text)]"
              >
                hello@designbyganesh.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </MaxShell>
  );
}
