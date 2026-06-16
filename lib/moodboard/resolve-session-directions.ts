import type { SessionAnalyticsSummary, MoodboardDirectionAnalytics } from "./analytics";
import type {
  MoodboardColorSwatch,
  MoodboardPresentationDirection,
  MoodboardReferenceCard,
} from "./db-types";

export type ResolvedSessionDirection = {
  id: string;
  index: number;
  name: string;
  content: MoodboardPresentationDirection;
  isSelected: boolean;
  modelUsed: string | null;
  refinedCount: number;
  refinementNotes: string | null;
};

function parseJsonField<T>(value: unknown): T | null {
  if (value == null) return null;
  if (typeof value === "object") return value as T;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }
  return null;
}

function parseFullContent(value: unknown): MoodboardPresentationDirection | null {
  const parsed = parseJsonField<MoodboardPresentationDirection>(value);
  if (!parsed?.directionName) return null;
  return parsed;
}

function buildFromRow(row: MoodboardDirectionAnalytics & Record<string, unknown>): MoodboardPresentationDirection | null {
  const fromFull =
    parseFullContent(row.full_output_json) ?? parseFullContent(row.full_content);
  if (fromFull) {
    if (!fromFull.tagline && row.tagline) {
      fromFull.tagline = String(row.tagline);
    }
    return fromFull;
  }

  const colorPalette = parseJsonField<MoodboardColorSwatch[]>(row.color_palette);
  const moodKeywords = parseJsonField<string[]>(row.mood_keywords);
  const typographyJson = parseJsonField<{
    heading: { font: string; rationale: string };
    body: { font: string; rationale: string };
  }>(row.typography);
  const typographyHeading =
    typographyJson?.heading ??
    parseJsonField<{ font: string; rationale: string }>(row.typography_heading);
  const typographyBody =
    typographyJson?.body ??
    parseJsonField<{ font: string; rationale: string }>(row.typography_body);
  const uiReferences = parseJsonField<MoodboardReferenceCard[]>(row.ui_references);
  const illustrationRefs = parseJsonField<MoodboardReferenceCard[]>(
    row.illustration_references,
  );
  const personaJson = parseJsonField<MoodboardPresentationDirection["persona"]>(row.persona);
  const storedTagline = row.tagline ? String(row.tagline) : "";
  const storedConcept = row.concept ? String(row.concept) : "";

  if (!row.direction_name) return null;

  const hasContent =
    storedTagline ||
    storedConcept ||
    colorPalette?.length ||
    moodKeywords?.length ||
    typographyHeading ||
    row.brand_strategy ||
    row.illustration_style ||
    row.imagery_style;

  if (!hasContent) return null;

  return {
    id: row.id,
    directionName: row.direction_name,
    directionIndex: row.direction_index,
    tagline: storedTagline || (row.brand_strategy ? String(row.brand_strategy).slice(0, 120) : ""),
    persona:
      personaJson ??
      (row.persona_name
        ? {
            name: String(row.persona_name),
            age: "",
            occupation: "",
            cityTier: "",
            description: row.persona_description ? String(row.persona_description) : "",
            financials: "",
            painPoints: parseJsonField<string[]>(row.pain_points) ?? [],
            brandStrategy: storedConcept || (row.brand_strategy ? String(row.brand_strategy) : ""),
            toneOfVoice: row.tone_of_voice ? String(row.tone_of_voice) : "",
            toneExample: "",
          }
        : null),
    uiSection:
      uiReferences?.length || storedConcept
        ? {
            title: row.direction_name,
            description: storedConcept || (row.brand_strategy ? String(row.brand_strategy) : ""),
            principles: [],
            references: uiReferences ?? [],
          }
        : null,
    illustrations:
      row.illustration_style || row.imagery_style
        ? {
            styleDescription: String(row.imagery_style ?? row.illustration_style),
            references: illustrationRefs ?? [],
          }
        : null,
    typography:
      typographyHeading && typographyBody
        ? {
            heading: typographyHeading,
            body: typographyBody,
            references: [],
          }
        : null,
    colorPalette,
    moodKeywords: moodKeywords ?? undefined,
    brandVoice: parseJsonField(row.brand_voice) ?? undefined,
  };
}

function matchesSelected(
  directionName: string,
  directionIndex: number,
  session: SessionAnalyticsSummary["session"],
): boolean {
  if (session.selected_direction_index === directionIndex) return true;
  if (!session.selected_direction?.trim()) return false;
  return (
    directionName.trim().toLowerCase() === session.selected_direction.trim().toLowerCase()
  );
}

export function resolveSessionDirections(
  summary: SessionAnalyticsSummary,
): ResolvedSessionDirection[] {
  const { session, directions } = summary;

  if (directions.length > 0) {
    const resolved = directions
      .map((dir) => {
        const content = buildFromRow(dir as MoodboardDirectionAnalytics & Record<string, unknown>);
        if (!content) return null;
        return {
          id: dir.id,
          index: dir.direction_index,
          name: dir.direction_name,
          content,
          isSelected:
            dir.is_selected || matchesSelected(dir.direction_name, dir.direction_index, session),
          modelUsed: dir.model_used,
          refinedCount: dir.refined_count,
          refinementNotes: dir.refinement_notes,
        };
      })
      .filter((d): d is ResolvedSessionDirection => d !== null);

    if (resolved.length > 0) return resolved;
  }

  const generated = session.generated_directions ?? [];
  return generated.map((dir) => ({
    id: dir.id,
    index: dir.directionIndex,
    name: dir.directionName,
    content: dir,
    isSelected: matchesSelected(dir.directionName, dir.directionIndex, session),
    modelUsed: session.selected_model ?? null,
    refinedCount: 0,
    refinementNotes: null,
  }));
}
