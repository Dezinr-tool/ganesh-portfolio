import type { MoodboardPresentationDirection } from "./db-types";

export function presentationToMarkdown(
  directions: MoodboardPresentationDirection[],
  brandName: string,
): string {
  const sections = directions.map((dir) => {
    const palette = dir.colorPalette
      .map((c) => `- **${c.role}** — ${c.name} (${c.hex})`)
      .join("\n");

    const painPoints = dir.persona.painPoints.map((p) => `- ${p}`).join("\n");
    const principles = dir.uiSection.principles.map((p) => `- ${p}`).join("\n");

    return `## ${dir.directionName}

> ${dir.tagline}

### Persona — ${dir.persona.name}
${dir.persona.description}

- **Age:** ${dir.persona.age}
- **Occupation:** ${dir.persona.occupation}
- **City:** ${dir.persona.cityTier}
- **Financials:** ${dir.persona.financials}

**Pain points:**
${painPoints}

**Brand strategy:** ${dir.persona.brandStrategy}

**Tone of voice:** ${dir.persona.toneOfVoice}
*"${dir.persona.toneExample}"*

### UI References
${dir.uiSection.description}

${principles}

### Illustrations
${dir.illustrations.styleDescription}

### Typography
- **Heading:** ${dir.typography.heading.font} — ${dir.typography.heading.rationale}
- **Body:** ${dir.typography.body.font} — ${dir.typography.body.rationale}

### Color Palette
${palette}

**Mood keywords:** ${dir.moodKeywords.join(", ")}
`;
  });

  return `# Moodboard — ${brandName}

${sections.join("\n---\n\n")}
`;
}
