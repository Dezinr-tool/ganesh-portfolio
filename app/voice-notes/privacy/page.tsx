export const metadata = {
  title: "Voice Notes — Privacy Policy",
  description: "What Voice Notes collects, stores, and processes — and what it doesn't.",
};

export default function VoiceNotesPrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-[#1a1a1a]">
      <h1 className="mb-2 text-2xl font-semibold">Voice Notes — Privacy Policy</h1>
      <p className="mb-8 text-sm text-neutral-500">Last updated: July 2026</p>

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-medium">What this extension does</h2>
        <p className="text-[15px] leading-relaxed text-neutral-700">
          Voice Notes is a Chrome side-panel extension. Click the mic, talk, and it turns your
          speech into a note — one continuous note per session, until you turn the mic off.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-medium">What we collect</h2>
        <p className="text-[15px] leading-relaxed text-neutral-700">
          Nothing. Voice Notes has no backend server and sends no data to us. We do not collect,
          store, sell, or share any of your notes, audio, or personal information.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-medium">Where your notes are stored</h2>
        <p className="text-[15px] leading-relaxed text-neutral-700">
          Your notes are saved only in Chrome&apos;s local extension storage, on your own device.
          They stay there until you delete them or remove the extension — they are never uploaded
          anywhere by us.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-medium">How speech-to-text works</h2>
        <p className="text-[15px] leading-relaxed text-neutral-700">
          Voice Notes uses your browser&apos;s built-in speech recognition (the Web Speech API).
          To be precise about this: Chrome&apos;s speech recognition is not fully on-device — your
          audio is sent to Google&apos;s speech recognition service to be converted to text, under
          Google&apos;s own privacy policy. We don&apos;t operate that service, don&apos;t receive a
          copy of the audio, and have no visibility into it. Only the resulting text comes back to
          the extension and is stored locally as described above.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-medium">The pen tool (screenshots)</h2>
        <p className="text-[15px] leading-relaxed text-neutral-700">
          Click the pen button, then draw a mark around anything on the page — a screenshot of
          just that marked area is attached to your note. Voice Notes never takes a screenshot on
          its own: capture only happens right after you finish drawing. It captures the marked
          area of the currently visible tab, not your whole screen, other tabs, or your browsing
          history. Screenshots are stored the same way as your notes — locally, on your device,
          never uploaded anywhere by us.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-medium">Permissions</h2>
        <ul className="list-disc space-y-1 pl-5 text-[15px] leading-relaxed text-neutral-700">
          <li>
            <strong>storage</strong> — save your notes, screenshots, and language preference
            locally on your device.
          </li>
          <li>
            <strong>sidePanel</strong> — show the Voice Notes panel alongside any tab.
          </li>
          <li>
            <strong>activeTab</strong> — act on the tab you&apos;re viewing only when you use the
            pen tool. This is scoped to that single interaction, not standing access to every page
            you visit.
          </li>
          <li>
            <strong>scripting</strong> — inject the drawing overlay so you can circle something on
            the page, only when you click the pen button.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-medium">Contact</h2>
        <p className="text-[15px] leading-relaxed text-neutral-700">
          Questions about this policy: {" "}
          <a href="mailto:hello@designbyganesh.com" className="underline">
            hello@designbyganesh.com
          </a>
          .
        </p>
      </section>
    </main>
  );
}
