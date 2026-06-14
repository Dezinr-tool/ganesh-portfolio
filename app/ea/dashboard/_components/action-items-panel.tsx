"use client";

import { useState } from "react";
import { priorityFromDueDate } from "@/lib/action-item-classifier";

export type DashboardActionItem = {
  id: string;
  title: string;
  dueDate: string | null;
  assignedTo: string | null;
  taskType: "my_task" | "assigned_task" | "team_task";
};

export type GroupedTasks = {
  my_task: DashboardActionItem[];
  assigned_task: DashboardActionItem[];
  team_task: DashboardActionItem[];
};

function formatDueDate(iso: string | null): string {
  if (!iso) return "No due date";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "No due date";
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function PriorityBadge({ dueDate }: { dueDate: string | null }) {
  const priority = priorityFromDueDate(dueDate);
  const styles = {
    High: "border-red-500/40 bg-red-500/10 text-red-300",
    Medium: "border-amber-500/40 bg-amber-500/10 text-amber-300",
    Normal: "border-zinc-700 bg-zinc-900 text-zinc-400",
  } as const;

  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${styles[priority]}`}
    >
      {priority}
    </span>
  );
}

function TaskCard({
  item,
  showAssignee = false,
}: {
  item: DashboardActionItem;
  showAssignee?: boolean;
}) {
  return (
    <li className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 transition-colors hover:border-zinc-700">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white">{item.title}</p>
          {showAssignee && item.assignedTo ? (
            <p className="mt-1 text-xs text-sky-400/90">
              Assigned to {item.assignedTo}
            </p>
          ) : null}
          <p className="mt-2 text-xs text-zinc-500">{formatDueDate(item.dueDate)}</p>
        </div>
        <PriorityBadge dueDate={item.dueDate} />
      </div>
    </li>
  );
}

function CountBadge({ count }: { count: number }) {
  return (
    <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
      {count}
    </span>
  );
}

export function ActionItemsPanel({
  tasks,
  loading,
}: {
  tasks: GroupedTasks;
  loading: boolean;
}) {
  const [teamExpanded, setTeamExpanded] = useState(false);

  const teamAndAssignedCount =
    tasks.assigned_task.length + tasks.team_task.length;

  if (loading) {
    return (
      <div className="mt-10 space-y-6">
        <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-sm text-zinc-500">Loading tasks…</p>
        </section>
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-6">
      {/* Section 1 — My Tasks */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-base font-medium text-white">My Tasks</h2>
          <CountBadge count={tasks.my_task.length} />
        </div>

        {tasks.my_task.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/50 px-6 py-10 text-center">
            <p className="text-sm text-zinc-400">No tasks for you right now</p>
            <p className="mt-1 text-xs text-zinc-600">
              Tasks from processed meetings will appear here
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {tasks.my_task.map((item) => (
              <TaskCard key={item.id} item={item} />
            ))}
          </ul>
        )}
      </section>

      {/* Section 2 — Team & Assigned (collapsed) */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-950">
        <button
          type="button"
          onClick={() => setTeamExpanded((open) => !open)}
          className="flex w-full items-center justify-between px-6 py-4 text-left"
        >
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-medium text-zinc-300">
              Team &amp; Assigned
            </h2>
            <CountBadge count={teamAndAssignedCount} />
          </div>
          <span className="text-xs text-zinc-500">
            {teamExpanded ? "Hide" : "Show"}
          </span>
        </button>

        {teamExpanded ? (
          <div className="border-t border-zinc-800 px-6 pb-6 pt-4">
            {teamAndAssignedCount === 0 ? (
              <p className="py-4 text-center text-sm text-zinc-500">
                No team or assigned tasks yet
              </p>
            ) : (
              <div className="space-y-8">
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Assigned
                    </h3>
                    <CountBadge count={tasks.assigned_task.length} />
                  </div>
                  {tasks.assigned_task.length === 0 ? (
                    <p className="py-4 text-center text-sm text-zinc-500">
                      No tasks assigned to others
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {tasks.assigned_task.map((item) => (
                        <TaskCard key={item.id} item={item} showAssignee />
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Team
                    </h3>
                    <CountBadge count={tasks.team_task.length} />
                  </div>
                  {tasks.team_task.length === 0 ? (
                    <p className="py-4 text-center text-sm text-zinc-500">
                      No team-wide tasks yet
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {tasks.team_task.map((item) => (
                        <TaskCard key={item.id} item={item} />
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
}

export function mapApiTasks(data: {
  my_task?: DashboardActionItem[];
  assigned_task?: DashboardActionItem[];
  team_task?: DashboardActionItem[];
}): GroupedTasks {
  return {
    my_task: data.my_task ?? [],
    assigned_task: data.assigned_task ?? [],
    team_task: data.team_task ?? [],
  };
}

export function totalTaskCount(tasks: GroupedTasks): number {
  return (
    tasks.my_task.length + tasks.assigned_task.length + tasks.team_task.length
  );
}
