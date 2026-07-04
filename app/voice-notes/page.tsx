import { VoiceNotesProductPage } from "./_components/voice-notes-product-page";

export const metadata = {
  title: "Voice Notes — Chrome extension for continuous dictation",
  description:
    "A Chrome side-panel extension that notes down everything you say as one continuous note, across any tab, until you turn it off.",
};

export default function VoiceNotesPage() {
  return <VoiceNotesProductPage />;
}
