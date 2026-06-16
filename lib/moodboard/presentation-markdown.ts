import type { MoodboardPresentationDirection } from "./db-types";
import { SECTION_GENERATION_SPEC } from "./output-sections";

function hasSection(sections: string[], key: string) {
  return sections.length === 0 || sections.includes(key);
}

export function presentationToMarkdown(
  directions: MoodboardPresentationDirection[],
  brandName: string,
  selectedSections: string[] = [],
): string {
  const sections = directions.map((dir) => {
    const active = dir.selectedSections ?? selectedSections;
    const parts: string[] = [`## ${dir.directionName}\n\n> ${dir.tagline}\n`];

    if (hasSection(active, "persona") && dir.persona) {
      parts.push(`### Persona — ${dir.persona.name}\n${dir.persona.description}\n`);
    }
    if (hasSection(active, "color_palette") && dir.colorPalette) {
      const palette = dir.colorPalette
        .map((c) => `- **${c.role}** — ${c.name} (${c.hex})`)
        .join("\n");
      parts.push(`### Color Palette\n${palette}\n`);
    }
    if (hasSection(active, "typography") && dir.typography) {
      parts.push(
        `### Typography\n- **Heading:** ${dir.typography.heading.font}\n- **Body:** ${dir.typography.body.font}\n`,
      );
    }
    if (hasSection(active, "ui_references") && dir.uiSection) {
      parts.push(`### UI References\n${dir.uiSection.description}\n`);
    }
    if (hasSection(active, "illustration_style") && dir.illustrations) {
      parts.push(`### Illustrations\n${dir.illustrations.styleDescription}\n`);
    }
    if (hasSection(active, "brand_voice") && dir.brandVoice) {
      parts.push(`### Brand Voice\n${dir.brandVoice.toneDescription}\n`);
    }
    if (hasSection(active, "dos_donts") && dir.dosDonts) {
      parts.push(
        `### Do's & Don'ts\n**Do:** ${dir.dosDonts.dos.join("; ")}\n**Don't:** ${dir.dosDonts.donts.join("; ")}\n`,
      );
    }

    if (dir.moodKeywords?.length) {
      parts.push(`**Mood:** ${dir.moodKeywords.join(", ")}\n`);
    }

    return parts.join("\n");
  });

  const sectionLabels = selectedSections
    .map((k) => SECTION_GENERATION_SPEC[k]?.title ?? k)
    .join(", ");

  return `# Moodboard — ${brandName}

${sectionLabels ? `**Sections:** ${sectionLabels}\n\n` : ""}${sections.join("\n---\n\n")}
`;
}
