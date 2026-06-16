import { sql } from "@/lib/db";
import type {
  MoodboardPresentationDirection,
  MoodboardQuestion,
  MoodboardSession,
} from "./db-types";
import { getActiveQuestions } from "./db-store";

export type MoodboardEventRow = {
  id: string;
  session_id: string;
  event_type: string;
  question_key: string | null;
  payload: Record<string, unknown>;
  duration_ms: number | null;
  created_at: string;
};

export type SessionAnalyticsSummary = {
  session: MoodboardSession;
  completionPercent: number;
  answeredCount: number;
  totalQuestions: number;
  timeSpentMs: number | null;
  directions: MoodboardDirectionAnalytics[];
  events: MoodboardEventRow[];
};

export type MoodboardDirectionAnalytics = {
  id: string;
  direction_name: string;
  direction_index: number;
  model_used: string | null;
  selected_output_sections: string[] | null;
  is_selected: boolean;
  refinement_notes: string | null;
  refined_count: number;
  full_content: MoodboardPresentationDirection | null;
  created_at: string;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidMoodboardSessionId(sessionId: string): boolean {
  return UUID_RE.test(sessionId);
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
    status: row.status as MoodboardSession["status"],
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function rowToEvent(row: Record<string, unknown>): MoodboardEventRow {
  return {
    id: String(row.id),
    session_id: String(row.session_id),
    event_type: String(row.event_type),
    question_key: row.question_key ? String(row.question_key) : null,
    payload: (row.payload as Record<string, unknown>) ?? {},
    duration_ms: row.duration_ms != null ? Number(row.duration_ms) : null,
    created_at: String(row.created_at),
  };
}

function rowToDirectionAnalytics(
  row: Record<string, unknown>,
): MoodboardDirectionAnalytics {
  const sections = row.selected_output_sections;
  let parsedSections: string[] | null = null;
  if (Array.isArray(sections)) {
    parsedSections = sections.map(String);
  } else if (typeof sections === "string") {
    try {
      const parsed = JSON.parse(sections);
      parsedSections = Array.isArray(parsed) ? parsed.map(String) : null;
    } catch {
      parsedSections = null;
    }
  }

  return {
    id: String(row.id),
    direction_name: String(row.direction_name),
    direction_index: Number(row.direction_index),
    model_used: row.model_used ? String(row.model_used) : null,
    selected_output_sections: parsedSections,
    is_selected: Boolean(row.is_selected),
    refinement_notes: row.refinement_notes ? String(row.refinement_notes) : null,
    refined_count: Number(row.refined_count ?? 0),
    full_content: (row.full_content as MoodboardPresentationDirection) ?? null,
    created_at: String(row.created_at),
  };
}

export function computeCompletion(
  answers: Record<string, unknown>,
  questions: MoodboardQuestion[],
): { answeredCount: number; totalQuestions: number; completionPercent: number } {
  const intakeKeys = questions
    .filter((q) => q.category !== "output_sections")
    .map((q) => q.key);
  const uniqueKeys = [...new Set(intakeKeys)];
  const answeredCount = uniqueKeys.filter((key) => {
    const value = answers[key];
    if (value === undefined || value === null) return false;
    if (typeof value === "string" && !value.trim()) return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  }).length;
  const totalQuestions = uniqueKeys.length || 1;
  const completionPercent = Math.round((answeredCount / totalQuestions) * 100);
  return { answeredCount, totalQuestions, completionPercent };
}

export function computeTimeSpentMs(events: MoodboardEventRow[]): number | null {
  if (!events.length) return null;
  const timestamps = events.map((e) => new Date(e.created_at).getTime());
  const durationSum = events.reduce((sum, e) => sum + (e.duration_ms ?? 0), 0);
  if (durationSum > 0) return durationSum;
  return Math.max(...timestamps) - Math.min(...timestamps);
}

export async function listAllSessions(): Promise<MoodboardSession[]> {
  const result = await sql`
    SELECT * FROM moodboard_sessions
    ORDER BY updated_at DESC
  `;
  return result.rows.map((row) => rowToSession(row as Record<string, unknown>));
}

export async function getSessionEvents(
  sessionId: string,
): Promise<MoodboardEventRow[]> {
  const result = await sql`
    SELECT * FROM moodboard_events
    WHERE session_id = ${sessionId}
    ORDER BY created_at ASC
  `;
  return result.rows.map((row) => rowToEvent(row as Record<string, unknown>));
}

export async function getAllEvents(limit = 500): Promise<MoodboardEventRow[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 2000);
  const result = await sql`
    SELECT * FROM moodboard_events
    ORDER BY created_at DESC
    LIMIT ${safeLimit}
  `;
  return result.rows.map((row) => rowToEvent(row as Record<string, unknown>));
}

export async function getSessionDirectionsAnalytics(
  sessionId: string,
): Promise<MoodboardDirectionAnalytics[]> {
  const result = await sql`
    SELECT * FROM moodboard_directions
    WHERE session_id = ${sessionId}
    ORDER BY direction_index ASC
  `;
  return result.rows.map((row) =>
    rowToDirectionAnalytics(row as Record<string, unknown>),
  );
}

export async function insertMoodboardEvent(data: {
  sessionId: string;
  eventType: string;
  questionKey?: string;
  payload?: Record<string, unknown>;
  durationMs?: number;
}): Promise<void> {
  await sql`
    INSERT INTO moodboard_events (
      session_id, event_type, question_key, payload, duration_ms
    ) VALUES (
      ${data.sessionId},
      ${data.eventType},
      ${data.questionKey ?? null},
      ${JSON.stringify(data.payload ?? {})},
      ${data.durationMs ?? null}
    )
  `;
}

export async function getSessionAnalytics(
  sessionId: string,
  questions?: MoodboardQuestion[],
): Promise<SessionAnalyticsSummary | null> {
  const result = await sql`
    SELECT * FROM moodboard_sessions
    WHERE session_id = ${sessionId}
    LIMIT 1
  `;
  const row = result.rows[0];
  if (!row) return null;

  const session = rowToSession(row as Record<string, unknown>);
  const activeQuestions = questions ?? (await getActiveQuestions());
  const { answeredCount, totalQuestions, completionPercent } = computeCompletion(
    session.answers,
    activeQuestions,
  );
  const [events, directions] = await Promise.all([
    getSessionEvents(sessionId),
    getSessionDirectionsAnalytics(sessionId),
  ]);

  return {
    session,
    completionPercent,
    answeredCount,
    totalQuestions,
    timeSpentMs: computeTimeSpentMs(events),
    directions,
    events,
  };
}

export async function listSessionsAnalytics(): Promise<SessionAnalyticsSummary[]> {
  const [sessions, questions] = await Promise.all([
    listAllSessions(),
    getActiveQuestions(),
  ]);

  const summaries = await Promise.all(
    sessions.map(async (session) => {
      const { answeredCount, totalQuestions, completionPercent } =
        computeCompletion(session.answers, questions);
      const [events, directions] = await Promise.all([
        getSessionEvents(session.session_id),
        getSessionDirectionsAnalytics(session.session_id),
      ]);
      return {
        session,
        completionPercent,
        answeredCount,
        totalQuestions,
        timeSpentMs: computeTimeSpentMs(events),
        directions,
        events,
      };
    }),
  );

  return summaries;
}
