import Link from "next/link";
import { VoiceNotesTool } from "./voice-notes-tool";

const STEPS = [
  {
    n: "01",
    title: "Download the extension",
    body: "Click the button below to get the .zip — it's the exact same source code, packaged fresh on every download.",
  },
  {
    n: "02",
    title: "Load it into Chrome",
    body: "Unzip it. Open chrome://extensions, turn on Developer Mode (top right), then click \"Load unpacked\" and select the unzipped folder.",
  },
  {
    n: "03",
    title: "Click the mic, anywhere",
    body: "The panel opens on any tab. Click the mic, allow microphone access once, and keep talking — it's one continuous note until you turn it off.",
  },
  {
    n: "04",
    title: "Circle anything to screenshot it",
    body: "Click the pen button, draw a mark around something on the page, and release — a screenshot of just that area attaches to your note.",
  },
] as const;

export function VoiceNotesProductPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-[#1a1a1a]">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
        Chrome extension
      </p>
      <h1 className="mb-3 text-3xl font-semibold">🎙️ Voice Notes</h1>
      <p className="mb-8 text-[15px] leading-relaxed text-neutral-700">
        A side panel that stays open across every tab. Click the mic and keep talking — it notes
        down the whole thing as one continuous note, until you turn it off. Circle anything on the
        page with the pen tool to attach a screenshot too.
      </p>

      <div className="mb-10 flex flex-wrap items-center gap-3">
        <a
          href="/api/tools/voice-notes/download"
          className="rounded-md bg-[#0a84ff] px-5 py-3 text-sm font-medium text-white hover:bg-[#0a6fd6]"
        >
          Download Chrome Extension
        </a>
        <Link href="/voice-notes/privacy" className="text-sm text-neutral-500 underline">
          Privacy policy
        </Link>
      </div>

      <div className="mb-12 rounded-lg border border-neutral-200 bg-neutral-50 px-5 py-4 text-sm text-neutral-600">
        Chrome Web Store listing is pending review — for now, installing means loading it as an
        unpacked extension (step 2 below). Once it&apos;s approved, this button will link straight to
        the Chrome Web Store.
      </div>

      <h2 className="mb-6 text-lg font-medium">How it works</h2>
      <div className="mb-14 space-y-6">
        {STEPS.map((step) => (
          <div key={step.n} className="flex gap-4">
            <span className="text-sm font-medium text-neutral-400">{step.n}</span>
            <div>
              <h3 className="mb-1 text-[15px] font-medium">{step.title}</h3>
              <p className="text-[14px] leading-relaxed text-neutral-600">{step.body}</p>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mb-4 text-lg font-medium">Try it in your browser first</h2>
      <p className="mb-6 text-sm text-neutral-600">
        No install needed — this is the same speech-to-text logic running right on this page. The
        pen tool needs the actual extension since it draws on top of other websites.
      </p>
      <div className="overflow-hidden rounded-xl border border-neutral-200">
        <VoiceNotesTool />
      </div>
    </main>
  );
}
