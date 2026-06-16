import type { MoodboardQuestion } from "./db-types";
import { MOODBOARD_PICKER_SECTIONS, UI_REFERENCES_SOURCES } from "./output-sections";

export const OUTPUT_SECTIONS_QUESTION: MoodboardQuestion = {
  id: "inline-output-sections",
  key: "q_output_sections",
  question_text: `What should your moodboard include?\nUI references pull from ${UI_REFERENCES_SOURCES}.`,
  question_type: "multi_section_select",
  parent_key: null,
  chips_options: MOODBOARD_PICKER_SECTIONS,
  follow_up_condition: null,
  category: "output_sections",
  order_index: 22,
  is_active: true,
  created_at: "",
};

export function replySignalsSectionsPicker(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  return (
    /panel below|moodboard elements|Generate 3 directions|select your moodboard|elements you want below/i.test(
      t,
    ) ||
    /visual concepts|slide presentation|pick what to include|element selector/i.test(t) ||
    /enough to (move forward|generate)|ready to generate|enough context/i.test(t)
  );
}
