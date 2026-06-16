import { sql } from "@/lib/db";
import type {
  MoodboardDirectionRow,
  MoodboardGenerationStatus,
  MoodboardPresentationDirection,
  MoodboardQuestion,
  MoodboardSession,
  OutputSectionOption,
} from "./db-types";
import {
  extractConceptFromDirection,
  extractImageryStyleFromDirection,
  extractTypographyJson,
} from "./direction-fields";

function parseChipsOptions(chips: unknown): MoodboardQuestion["chips_options"] {
  if (!chips) return null;

  let arr: unknown[] | null = null;
  if (Array.isArray(chips)) {
    arr = chips;
  } else if (typeof chips === "string") {
    try {
      const parsed = JSON.parse(chips);
      arr = Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  if (!arr?.length) return null;

  if (typeof arr[0] === "object" && arr[0] !== null && "key" in (arr[0] as object)) {
    return arr as OutputSectionOption[];
  }

  return arr.map(String);
}

function rowToQuestion(row: Record<string, unknown>): MoodboardQuestion {
  return {
    id: String(row.id),
    key: String(row.key),
    question_text: String(row.question_text),
    question_type: row.question_type as MoodboardQuestion["question_type"],
    parent_key: row.parent_key ? String(row.parent_key) : null,
    chips_options: parseChipsOptions(row.chips_options),
    follow_up_condition: row.follow_up_condition
      ? String(row.follow_up_condition)
      : null,
    category: row.category as MoodboardQuestion["category"],
    order_index: Number(row.order_index),
    is_active: Boolean(row.is_active),
    created_at: String(row.created_at),
  };
}

export async function getActiveQuestions(): Promise<MoodboardQuestion[]> {
  const result = await sql`
    SELECT * FROM moodboard_question_tree
    WHERE is_active = true
    ORDER BY order_index ASC
  `;
  return result.rows.map((row) => rowToQuestion(row as Record<string, unknown>));
}

export async function getAllQuestions(): Promise<MoodboardQuestion[]> {
  const result = await sql`
    SELECT * FROM moodboard_question_tree
    ORDER BY order_index ASC
  `;
  return result.rows.map((row) => rowToQuestion(row as Record<string, unknown>));
}

export async function getQuestionById(id: string): Promise<MoodboardQuestion | null> {
  const result = await sql`
    SELECT * FROM moodboard_question_tree WHERE id = ${id} LIMIT 1
  `;
  const row = result.rows[0];
  return row ? rowToQuestion(row as Record<string, unknown>) : null;
}

export async function updateQuestion(
  id: string,
  data: Partial<{
    question_text: string;
    question_type: string;
    chips_options: string[] | OutputSectionOption[] | null;
    is_active: boolean;
    order_index: number;
    follow_up_condition: string | null;
    parent_key: string | null;
    category: string;
  }>,
): Promise<MoodboardQuestion | null> {
  const existing = await getQuestionById(id);
  if (!existing) return null;

  const result = await sql`
    UPDATE moodboard_question_tree SET
      question_text = ${data.question_text ?? existing.question_text},
      question_type = ${data.question_type ?? existing.question_type},
      chips_options = ${data.chips_options !== undefined ? JSON.stringify(data.chips_options) : JSON.stringify(existing.chips_options)},
      is_active = ${data.is_active ?? existing.is_active},
      order_index = ${data.order_index ?? existing.order_index},
      follow_up_condition = ${data.follow_up_condition !== undefined ? data.follow_up_condition : existing.follow_up_condition},
      parent_key = ${data.parent_key !== undefined ? data.parent_key : existing.parent_key},
      category = ${data.category ?? existing.category}
    WHERE id = ${id}
    RETURNING *
  `;
  const row = result.rows[0];
  return row ? rowToQuestion(row as Record<string, unknown>) : null;
}

export async function createQuestion(data: {
  key: string;
  question_text: string;
  question_type: string;
  parent_key?: string | null;
  chips_options?: string[] | null;
  follow_up_condition?: string | null;
  category: string;
  order_index: number;
}): Promise<MoodboardQuestion> {
  const result = await sql`
    INSERT INTO moodboard_question_tree (
      key, question_text, question_type, parent_key,
      chips_options, follow_up_condition, category, order_index
    ) VALUES (
      ${data.key},
      ${data.question_text},
      ${data.question_type},
      ${data.parent_key ?? null},
      ${data.chips_options ? JSON.stringify(data.chips_options) : null},
      ${data.follow_up_condition ?? null},
      ${data.category},
      ${data.order_index}
    )
    RETURNING *
  `;
  return rowToQuestion(result.rows[0] as Record<string, unknown>);
}

export async function deleteQuestion(id: string): Promise<boolean> {
  const result = await sql`
    DELETE FROM moodboard_question_tree WHERE id = ${id}
    RETURNING id
  `;
  return result.rows.length > 0;
}

export async function reorderQuestions(
  orderedIds: string[],
): Promise<void> {
  for (let i = 0; i < orderedIds.length; i++) {
    await sql`
      UPDATE moodboard_question_tree
      SET order_index = ${i + 1}
      WHERE id = ${orderedIds[i]}
    `;
  }
}

function rowToSession(row: Record<string, unknown>): MoodboardSession {
  return {
    id: String(row.id),
    session_id: String(row.session_id),
    brand_name: row.brand_name ? String(row.brand_name) : null,
    project_type: row.project_type ? String(row.project_type) : null,
    answers: (row.answers as Record<string, unknown>) ?? {},
    selected_output_sections: row.selected_output_sections as string[] | null,
    generated_directions: row.generated_directions as
      | MoodboardPresentationDirection[]
      | null,
    selected_direction: row.selected_direction
      ? String(row.selected_direction)
      : null,
    selected_direction_index:
      row.selected_direction_index != null
        ? Number(row.selected_direction_index)
        : null,
    selected_at: row.selected_at ? String(row.selected_at) : null,
    selected_model: row.selected_model ? String(row.selected_model) : null,
    generation_status: row.generation_status
      ? (String(row.generation_status) as MoodboardGenerationStatus)
      : null,
    generated_at: row.generated_at ? String(row.generated_at) : null,
    status: row.status as MoodboardSession["status"],
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function createSession(sessionId: string): Promise<MoodboardSession> {
  const result = await sql`
    INSERT INTO moodboard_sessions (session_id)
    VALUES (${sessionId})
    RETURNING *
  `;
  return rowToSession(result.rows[0] as Record<string, unknown>);
}

export async function getSessionBySessionId(
  sessionId: string,
): Promise<MoodboardSession | null> {
  const result = await sql`
    SELECT * FROM moodboard_sessions
    WHERE session_id = ${sessionId}
    ORDER BY created_at DESC
    LIMIT 1
  `;
  const row = result.rows[0];
  return row ? rowToSession(row as Record<string, unknown>) : null;
}

export async function updateSession(
  sessionId: string,
  data: Partial<{
    brand_name: string;
    project_type: string;
    answers: Record<string, unknown>;
    selected_output_sections: string[];
    generated_directions: MoodboardPresentationDirection[];
    selected_direction: string;
    selected_direction_index: number;
    selected_at: string;
    status: string;
    selected_model: string;
    generation_status: MoodboardGenerationStatus;
    generated_at: string;
  }>,
): Promise<MoodboardSession | null> {
  const existing = await getSessionBySessionId(sessionId);
  if (!existing) return null;

  const result = await sql`
    UPDATE moodboard_sessions SET
      brand_name = ${data.brand_name ?? existing.brand_name},
      project_type = ${data.project_type ?? existing.project_type},
      answers = ${JSON.stringify(data.answers ?? existing.answers)},
      selected_output_sections = ${data.selected_output_sections !== undefined ? JSON.stringify(data.selected_output_sections) : existing.selected_output_sections ? JSON.stringify(existing.selected_output_sections) : null},
      generated_directions = ${data.generated_directions ? JSON.stringify(data.generated_directions) : existing.generated_directions ? JSON.stringify(existing.generated_directions) : null},
      selected_direction = ${data.selected_direction ?? existing.selected_direction},
      selected_direction_index = ${data.selected_direction_index !== undefined ? data.selected_direction_index : existing.selected_direction_index ?? null},
      selected_at = ${data.selected_at !== undefined ? data.selected_at : existing.selected_at ?? null},
      status = ${data.status ?? existing.status},
      selected_model = ${data.selected_model !== undefined ? data.selected_model : existing.selected_model ?? null},
      generation_status = ${data.generation_status !== undefined ? data.generation_status : existing.generation_status ?? null},
      generated_at = ${data.generated_at !== undefined ? data.generated_at : existing.generated_at ?? null},
      updated_at = NOW()
    WHERE session_id = ${sessionId}
    RETURNING *
  `;
  const row = result.rows[0];
  return row ? rowToSession(row as Record<string, unknown>) : null;
}

export async function clearSessionDirections(sessionId: string): Promise<void> {
  await sql`DELETE FROM moodboard_directions WHERE session_id = ${sessionId}`;
}

export async function saveSingleDirectionToDb(
  sessionId: string,
  dir: MoodboardPresentationDirection,
  options?: {
    modelUsed?: string;
    selectedOutputSections?: string[];
  },
): Promise<void> {
  const concept = extractConceptFromDirection(dir);
  const imageryStyle = extractImageryStyleFromDirection(dir);
  const typography = extractTypographyJson(dir);
  const fullJson = JSON.stringify(dir);

  await sql`
    DELETE FROM moodboard_directions
    WHERE session_id = ${sessionId} AND direction_index = ${dir.directionIndex}
  `;

  await sql`
    INSERT INTO moodboard_directions (
      session_id, direction_name, direction_index, tagline, concept,
      persona_name, persona_description, pain_points,
      brand_strategy, tone_of_voice, ui_references,
      illustration_style, illustration_references,
      typography_heading, typography_body, typography_references,
      typography, imagery_style, color_palette, mood_keywords,
      persona, brand_voice,
      full_content, full_output_json, model_used, selected_output_sections
    ) VALUES (
      ${sessionId},
      ${dir.directionName},
      ${dir.directionIndex},
      ${dir.tagline || null},
      ${concept || null},
      ${dir.persona?.name ?? null},
      ${dir.persona?.description ?? null},
      ${JSON.stringify(dir.persona?.painPoints ?? [])},
      ${dir.persona?.brandStrategy ?? null},
      ${dir.persona?.toneOfVoice ?? null},
      ${JSON.stringify(dir.uiSection?.references ?? [])},
      ${dir.illustrations?.styleDescription ?? null},
      ${JSON.stringify(dir.illustrations?.references ?? [])},
      ${JSON.stringify(dir.typography?.heading ?? null)},
      ${JSON.stringify(dir.typography?.body ?? null)},
      ${JSON.stringify(dir.typography?.references ?? [])},
      ${typography ? JSON.stringify(typography) : null},
      ${imageryStyle || null},
      ${JSON.stringify(dir.colorPalette ?? [])},
      ${JSON.stringify(dir.moodKeywords ?? [])},
      ${dir.persona ? JSON.stringify(dir.persona) : null},
      ${dir.brandVoice ? JSON.stringify(dir.brandVoice) : null},
      ${fullJson},
      ${fullJson},
      ${options?.modelUsed ?? null},
      ${options?.selectedOutputSections ? JSON.stringify(options.selectedOutputSections) : null}
    )
  `;
}

export async function markSessionGenerationComplete(
  sessionId: string,
  directions: MoodboardPresentationDirection[],
  options?: {
    modelUsed?: string;
    selectedOutputSections?: string[];
  },
): Promise<void> {
  await updateSession(sessionId, {
    generated_directions: directions,
    status: "complete",
    generation_status: "completed",
    generated_at: new Date().toISOString(),
    selected_model: options?.modelUsed,
    selected_output_sections: options?.selectedOutputSections,
  });
}

export async function markDirectionSelected(
  sessionId: string,
  directionIndex: number,
  directionName: string,
): Promise<void> {
  await sql`
    UPDATE moodboard_directions
    SET is_selected = false
    WHERE session_id = ${sessionId}
  `;
  await sql`
    UPDATE moodboard_directions
    SET is_selected = true
    WHERE session_id = ${sessionId} AND direction_index = ${directionIndex}
  `;
  await updateSession(sessionId, {
    selected_direction: directionName,
    selected_direction_index: directionIndex,
    selected_at: new Date().toISOString(),
  });
}

export async function saveDirectionsToDb(
  sessionId: string,
  directions: MoodboardPresentationDirection[],
  options?: {
    modelUsed?: string;
    selectedOutputSections?: string[];
  },
): Promise<void> {
  await clearSessionDirections(sessionId);
  for (const dir of directions) {
    await saveSingleDirectionToDb(sessionId, dir, options);
  }
}

export async function getDirectionsFromDb(
  sessionId: string,
): Promise<MoodboardDirectionRow[]> {
  const result = await sql`
    SELECT * FROM moodboard_directions
    WHERE session_id = ${sessionId}
    ORDER BY direction_index ASC
  `;
  return result.rows.map((row) => ({
    id: String(row.id),
    session_id: String(row.session_id),
    direction_name: String(row.direction_name),
    direction_index: Number(row.direction_index),
    persona_name: row.persona_name ? String(row.persona_name) : null,
    persona_description: row.persona_description
      ? String(row.persona_description)
      : null,
    pain_points: row.pain_points as string[] | null,
    brand_strategy: row.brand_strategy ? String(row.brand_strategy) : null,
    tone_of_voice: row.tone_of_voice ? String(row.tone_of_voice) : null,
    ui_references: row.ui_references as MoodboardDirectionRow["ui_references"],
    illustration_style: row.illustration_style
      ? String(row.illustration_style)
      : null,
    illustration_references: row.illustration_references as MoodboardDirectionRow["illustration_references"],
    typography_heading: row.typography_heading
      ? String(row.typography_heading)
      : null,
    typography_body: row.typography_body ? String(row.typography_body) : null,
    typography_references: row.typography_references as MoodboardDirectionRow["typography_references"],
    color_palette: row.color_palette as MoodboardDirectionRow["color_palette"],
    mood_keywords: row.mood_keywords as string[] | null,
    created_at: String(row.created_at),
  }));
}
