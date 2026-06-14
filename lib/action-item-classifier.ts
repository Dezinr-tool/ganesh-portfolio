export type ActionItemTaskType = "my_task" | "assigned_task" | "team_task";

export type ParsedActionItem = {
  title: string;
  assignee?: string | null;
  dueDate?: string | null;
};

export type ClassifiedActionItem = ParsedActionItem & {
  taskType: ActionItemTaskType;
  assignedTo: string | null;
};

const OWNER_PREFIX = /^([A-Za-z][A-Za-z\s.'-]{0,40}):\s*(.+)$/;

export function parseActionItemEntry(entry: unknown): ParsedActionItem | null {
  if (typeof entry === "string") {
    const trimmed = entry.trim();
    if (!trimmed) return null;
    const match = trimmed.match(OWNER_PREFIX);
    if (match) {
      return { title: match[2].trim(), assignee: match[1].trim() };
    }
    return { title: trimmed };
  }

  if (entry && typeof entry === "object") {
    const obj = entry as Record<string, unknown>;
    const title = typeof obj.title === "string" ? obj.title.trim() : "";
    if (!title) return null;
    return {
      title,
      assignee:
        typeof obj.assignee === "string" && obj.assignee.trim()
          ? obj.assignee.trim()
          : null,
      dueDate:
        typeof obj.dueDate === "string" && obj.dueDate.trim()
          ? obj.dueDate.trim()
          : null,
    };
  }

  return null;
}

function namesMatch(a: string, b: string): boolean {
  const na = a.trim().toLowerCase();
  const nb = b.trim().toLowerCase();
  if (!na || !nb) return false;
  return na === nb || na.startsWith(nb) || nb.startsWith(na);
}

export function classifyActionItem(
  item: ParsedActionItem,
  currentUserName: string,
): ClassifiedActionItem {
  const assignee = item.assignee?.trim() || null;

  if (!assignee) {
    return { ...item, taskType: "team_task", assignedTo: null };
  }

  if (namesMatch(assignee, currentUserName)) {
    return {
      ...item,
      taskType: "my_task",
      assignedTo: currentUserName.trim() || null,
    };
  }

  return { ...item, taskType: "assigned_task", assignedTo: assignee };
}

export function classifyActionItems(
  entries: unknown[],
  currentUserName: string,
): ClassifiedActionItem[] {
  const seen = new Set<string>();
  const classified: ClassifiedActionItem[] = [];

  for (const entry of entries) {
    const parsed = parseActionItemEntry(entry);
    if (!parsed) continue;

    const key = `${parsed.title.toLowerCase()}|${parsed.assignee ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);

    classified.push(classifyActionItem(parsed, currentUserName));
  }

  return classified;
}

export function priorityFromDueDate(
  dueDate: string | null | undefined,
): "High" | "Medium" | "Normal" {
  if (!dueDate) return "Normal";

  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return "Normal";

  const diffDays = (due.getTime() - Date.now()) / 86_400_000;
  if (diffDays < 1) return "High";
  if (diffDays <= 7) return "Medium";
  return "Normal";
}
