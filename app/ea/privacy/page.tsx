import Link from "next/link";
import { EALegalShell } from "../_components/ea-legal-shell";

export const metadata = {
  title: "Privacy Policy — Virtual EA",
  description: "Privacy policy for Virtual EA",
};

export default function EAPrivacyPage() {
  return (
    <EALegalShell>
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm text-[var(--color-text)]">
          <Link href="/ea/login" className="hover:text-[var(--color-text)]">
            ← Back to Virtual EA
          </Link>
        </p>

        <h1 className="mt-6 text-3xl font-light text-[var(--color-bg)]">Privacy Policy</h1>
        <p className="mt-2 text-sm text-[var(--color-text)]">Last updated: June 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-[var(--color-text)]">
          <section>
            <h2 className="text-lg font-medium text-[var(--color-bg)]">Overview</h2>
            <p className="mt-3">
              Virtual EA is an AI-powered executive assistant operated by Ganesh
              Das. This policy explains what data Virtual EA collects, how it is
              used, and your choices.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[var(--color-bg)]">Your data stays yours</h2>
            <p className="mt-3">
              Conversation history, meeting notes, action items, memories, and
              calendar-related data are stored in your own Neon Postgres database
              — provisioned and controlled by the account holder. Virtual EA does
              not operate a shared multi-tenant data lake; your data lives in the
              database you connect via{" "}
              <code className="text-[var(--color-text)]">DATABASE_URL</code>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[var(--color-bg)]">We do not sell your data</h2>
            <p className="mt-3">
              Virtual EA does not sell, rent, or trade personal information to
              third parties for advertising or marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[var(--color-bg)]">Third-party services</h2>
            <p className="mt-3">
              Virtual EA uses the following services to provide functionality.
              Data sent to each service is limited to what is needed for that
              feature:
            </p>
            <ul className="mt-4 list-inside list-disc space-y-2">
              <li>
                <strong className="text-[var(--color-text)]">Anthropic API</strong> — processes
                your chat messages and meeting transcripts to generate AI responses,
                summaries, and follow-up drafts.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Google Calendar</strong> — access
                is requested only for scheduling: reading events, detecting conflicts,
                and creating calendar entries you ask for. Virtual EA does not use
                Calendar data for any other purpose.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">ElevenLabs</strong> — converts
                Virtual EA&apos;s text responses to speech when you enable voice
                output. Only the spoken portion of a reply is sent.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">OpenAI (optional)</strong> — if
                configured, transcribes meeting audio via Whisper. If not configured,
                a mock transcript is used instead.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Resend</strong> — sends emails
                you explicitly approve (e.g. meeting follow-ups, agreements).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[var(--color-bg)]">Cookies &amp; sessions</h2>
            <p className="mt-3">
              Virtual EA uses HTTP-only cookies to keep you signed in. Session
              tokens are stored in your database and expire after 30 days of
              inactivity.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[var(--color-bg)]">Data retention &amp; deletion</h2>
            <p className="mt-3">
              You can clear chat history and memories from within Virtual EA
              settings. Because data is stored in your own database, you may also
              delete records directly or drop tables if you decommission the
              service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[var(--color-bg)]">Contact</h2>
            <p className="mt-3">
              Questions about this policy? Email{" "}
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
    </EALegalShell>
  );
}
