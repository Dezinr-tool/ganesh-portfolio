import { sql } from "@/lib/db";
import { randomUUID } from "crypto";
import type { ActionItemTaskType } from "@/lib/action-item-classifier";

export type MeetingPlatform = "google_meet" | "zoom" | "teams";
export type MeetingStatus =
  | "pending"
  | "joining"
  | "recording"
  | "processing"
  | "done"
  | "failed";

export type EAMeeting = {
  id: string;
  sessionId: string;
  meetingUrl: string | null;
  meetingPlatform: MeetingPlatform | null;
  title: string | null;
  scheduledAt: string | null;
  status: MeetingStatus;
  rawTranscript: string | null;
  processedSummary: string | null;
  actionItems: string[];
  attendees: string[];
  createdAt: string;
  updatedAt: string;
};

export type EAActionItem = {
  id: string;
  meetingId: string | null;
  sessionId: string;
  title: string;
  assignee: string | null;
  dueDate: string | null;
  status: "open" | "done" | "cancelled";
  taskType: ActionItemTaskType;
  assignedTo: string | null;
  createdAt: string;
};

export type GroupedActionItems = {
  my_task: EAActionItem[];
  assigned_task: EAActionItem[];
  team_task: EAActionItem[];
};

type MeetingRow = {
  id: string;
  session_id: string;
  meeting_url: string | null;
  meeting_platform: string | null;
  title: string | null;
  scheduled_at: Date | string | null;
  status: string;
  raw_transcript: string | null;
  processed_summary: string | null;
  action_items: string[] | unknown;
  attendees: string[] | unknown;
  created_at: Date | string;
  updated_at: Date | string;
};

type ActionItemRow = {
  id: string;
  meeting_id: string | null;
  session_id: string;
  title: string;
  assignee: string | null;
  due_date: Date | string | null;
  status: string;
  task_type: string | null;
  assigned_to: string | null;
  created_at: Date | string;
};

function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string");
      }
    } catch {
      return [];
    }
  }
  return [];
}

function rowToMeeting(row: MeetingRow): EAMeeting {
  return {
    id: row.id,
    sessionId: row.session_id,
    meetingUrl: row.meeting_url,
    meetingPlatform: row.meeting_platform as MeetingPlatform | null,
    title: row.title,
    scheduledAt: row.scheduled_at
      ? row.scheduled_at instanceof Date
        ? row.scheduled_at.toISOString()
        : String(row.scheduled_at)
      : null,
    status: row.status as MeetingStatus,
    rawTranscript: row.raw_transcript,
    processedSummary: row.processed_summary,
    actionItems: parseJsonArray(row.action_items),
    attendees: parseJsonArray(row.attendees),
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
    updatedAt:
      row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at),
  };
}

function normalizeTaskType(value: string | null | undefined): ActionItemTaskType {
  if (value === "assigned_task" || value === "team_task") return value;
  return "my_task";
}

function rowToActionItem(row: ActionItemRow): EAActionItem {
  return {
    id: row.id,
    meetingId: row.meeting_id,
    sessionId: row.session_id,
    title: row.title,
    assignee: row.assignee,
    dueDate: row.due_date
      ? row.due_date instanceof Date
        ? row.due_date.toISOString()
        : String(row.due_date)
      : null,
    status: row.status as EAActionItem["status"],
    taskType: normalizeTaskType(row.task_type),
    assignedTo: row.assigned_to ?? null,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  };
}

export async function listMeetings(sessionId: string): Promise<EAMeeting[]> {
  const { rows } = await sql<MeetingRow>`
    SELECT *
    FROM ea_meetings
    WHERE session_id = ${sessionId}
    ORDER BY COALESCE(scheduled_at, created_at) DESC
  `;
  return rows.map(rowToMeeting);
}

export async function getMeetingById(
  id: string,
  sessionId: string,
): Promise<EAMeeting | null> {
  const { rows } = await sql<MeetingRow>`
    SELECT *
    FROM ea_meetings
    WHERE id = ${id} AND session_id = ${sessionId}
    LIMIT 1
  `;
  return rows[0] ? rowToMeeting(rows[0]) : null;
}

export async function createMeeting(
  sessionId: string,
  input: {
    meetingUrl?: string;
    meetingPlatform?: MeetingPlatform;
    title?: string;
    scheduledAt?: string;
  },
): Promise<EAMeeting> {
  const id = randomUUID();
  const { rows } = await sql<MeetingRow>`
    INSERT INTO ea_meetings (
      id, session_id, meeting_url, meeting_platform, title, scheduled_at, status
    )
    VALUES (
      ${id},
      ${sessionId},
      ${input.meetingUrl ?? null},
      ${input.meetingPlatform ?? null},
      ${input.title ?? null},
      ${input.scheduledAt ?? null},
      'pending'
    )
    RETURNING *
  `;
  return rowToMeeting(rows[0]);
}

export async function updateMeeting(
  id: string,
  sessionId: string,
  input: Partial<{
    status: MeetingStatus;
    rawTranscript: string;
    processedSummary: string;
    actionItems: string[];
    attendees: string[];
    title: string;
    meetingUrl: string;
    meetingPlatform: MeetingPlatform;
    scheduledAt: string;
  }>,
): Promise<EAMeeting | null> {
  const existing = await getMeetingById(id, sessionId);
  if (!existing) return null;

  const { rows } = await sql<MeetingRow>`
    UPDATE ea_meetings
    SET
      status = ${input.status ?? existing.status},
      raw_transcript = ${input.rawTranscript ?? existing.rawTranscript},
      processed_summary = ${input.processedSummary ?? existing.processedSummary},
      action_items = ${JSON.stringify(input.actionItems ?? existing.actionItems)}::jsonb,
      attendees = ${JSON.stringify(input.attendees ?? existing.attendees)}::jsonb,
      title = ${input.title ?? existing.title},
      meeting_url = ${input.meetingUrl ?? existing.meetingUrl},
      meeting_platform = ${input.meetingPlatform ?? existing.meetingPlatform},
      scheduled_at = ${input.scheduledAt ?? existing.scheduledAt},
      updated_at = NOW()
    WHERE id = ${id} AND session_id = ${sessionId}
    RETURNING *
  `;
  return rows[0] ? rowToMeeting(rows[0]) : null;
}

export async function listActionItemsForMeeting(
  meetingId: string,
  sessionId: string,
): Promise<EAActionItem[]> {
  const { rows } = await sql<ActionItemRow>`
    SELECT *
    FROM ea_action_items
    WHERE meeting_id = ${meetingId} AND session_id = ${sessionId}
    ORDER BY created_at ASC
  `;
  return rows.map(rowToActionItem);
}

export async function listAllOpenActionItemsRaw(
  sessionId: string,
): Promise<EAActionItem[]> {
  const { rows } = await sql<ActionItemRow>`
    SELECT *
    FROM ea_action_items
    WHERE session_id = ${sessionId} AND status = 'open'
    ORDER BY created_at DESC
  `;
  return rows.map(rowToActionItem);
}

export async function listOpenActionItems(
  sessionId: string,
): Promise<EAActionItem[]> {
  const { rows } = await sql<ActionItemRow>`
    SELECT DISTINCT ON (
      COALESCE(meeting_id::text, ''),
      LOWER(TRIM(title))
    ) *
    FROM ea_action_items
    WHERE session_id = ${sessionId} AND status = 'open'
    ORDER BY
      COALESCE(meeting_id::text, ''),
      LOWER(TRIM(title)),
      created_at DESC
  `;
  return rows.map(rowToActionItem);
}

export function groupActionItemsByType(items: EAActionItem[]): GroupedActionItems {
  return {
    my_task: items.filter((item) => item.taskType === "my_task"),
    assigned_task: items.filter((item) => item.taskType === "assigned_task"),
    team_task: items.filter((item) => item.taskType === "team_task"),
  };
}

export async function listOpenActionItemsGrouped(
  sessionId: string,
): Promise<GroupedActionItems> {
  const items = await listOpenActionItems(sessionId);
  return groupActionItemsByType(items);
}

export async function replaceActionItemsForMeeting(
  sessionId: string,
  meetingId: string,
  items: Array<{
    title: string;
    assignee?: string;
    dueDate?: string;
    taskType?: ActionItemTaskType;
    assignedTo?: string | null;
  }>,
): Promise<EAActionItem[]> {
  await sql`
    DELETE FROM ea_action_items
    WHERE meeting_id = ${meetingId} AND session_id = ${sessionId}
  `;
  return createActionItems(sessionId, meetingId, items);
}

export async function createActionItems(
  sessionId: string,
  meetingId: string,
  items: Array<{
    title: string;
    assignee?: string;
    dueDate?: string;
    taskType?: ActionItemTaskType;
    assignedTo?: string | null;
  }>,
): Promise<EAActionItem[]> {
  const created: EAActionItem[] = [];
  for (const item of items) {
    const id = randomUUID();
    const taskType = item.taskType ?? "my_task";
    const { rows } = await sql<ActionItemRow>`
      INSERT INTO ea_action_items (
        id, meeting_id, session_id, title, assignee, due_date, status, task_type, assigned_to
      )
      VALUES (
        ${id},
        ${meetingId},
        ${sessionId},
        ${item.title},
        ${item.assignee ?? item.assignedTo ?? null},
        ${item.dueDate ?? null},
        'open',
        ${taskType},
        ${item.assignedTo ?? null}
      )
      RETURNING *
    `;
    created.push(rowToActionItem(rows[0]));
  }
  return created;
}

export async function updateActionItemStatus(
  id: string,
  sessionId: string,
  status: "open" | "done" | "cancelled",
): Promise<EAActionItem | null> {
  const { rows } = await sql<ActionItemRow>`
    UPDATE ea_action_items
    SET status = ${status}
    WHERE id = ${id} AND session_id = ${sessionId}
    RETURNING *
  `;
  return rows[0] ? rowToActionItem(rows[0]) : null;
}
