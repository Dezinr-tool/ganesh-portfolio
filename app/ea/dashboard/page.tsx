"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { EANav } from "../_components/ea-nav";
import {
  EA_BTN_PRIMARY,
  EA_BTN_SECONDARY,
  EA_CARD,
  EA_INPUT,
  EA_MUTED,
  EA_PAGE,
  EA_TITLE,
} from "../_components/ea-ui";
import {
  ActionItemsPanel,
  mapApiTasks,
  totalTaskCount,
  type GroupedTasks,
} from "./_components/action-items-panel";
import { useEASettings } from "../_components/use-ea-settings";
import { notifyCalendarUpdated } from "@/lib/ea-client-storage";

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
  meetLink?: string;
  attendees?: string[];
  isAllDay: boolean;
};

function formatTime(event: CalendarEvent): string {
  if (event.isAllDay) return "All day";
  return new Date(event.start).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDatetimeLocalIST(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "00";

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

function fromDatetimeLocalIST(value: string): string {
  return `${value}:00+05:30`;
}

function EventRow({
  event,
  dateLabel,
  onEdit,
}: {
  event: CalendarEvent;
  dateLabel?: string;
  onEdit: (event: CalendarEvent) => void;
}) {
  return (
    <li className="flex items-start gap-4 border-b border-[var(--color-text)]/15 pb-3 last:border-0 last:pb-0">
      <span className="w-20 shrink-0 text-xs text-[var(--color-text)] opacity-70">
        {dateLabel ?? formatTime(event)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-[var(--color-text)]">{event.title}</p>
        {event.location ? (
          <p className="mt-0.5 text-xs text-[var(--color-text)] opacity-70">{event.location}</p>
        ) : null}
        {event.attendees?.length ? (
          <p className="mt-0.5 text-xs text-[var(--color-text)] opacity-70">
            {event.attendees.join(", ")}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => onEdit(event)}
          className="rounded-md border border-[var(--color-text)]/35 px-2.5 py-1 text-xs text-[var(--color-text)] transition-colors hover:border-[var(--color-text)] hover:bg-[var(--color-text)]/5"
        >
          Edit
        </button>
      </div>
    </li>
  );
}

function EditEventModal({
  event,
  onClose,
  onSaved,
}: {
  event: CalendarEvent;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(event.title);
  const [start, setStart] = useState(toDatetimeLocalIST(event.start));
  const [end, setEnd] = useState(toDatetimeLocalIST(event.end));
  const [location, setLocation] = useState(event.location ?? "");
  const [guests, setGuests] = useState(event.attendees?.join(", ") ?? "");
  const [description, setDescription] = useState(event.description ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!start || !end) {
      setError("Start and end times are required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const attendees = guests
        .split(/[,;]+/)
        .map((email) => email.trim())
        .filter(Boolean);

      const res = await fetch(`/api/ea/calendar/${event.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          start: fromDatetimeLocalIST(start),
          end: fromDatetimeLocalIST(end),
          location: location.trim() || undefined,
          description: description.trim() || undefined,
          attendees,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to update meeting.");
        return;
      }

      notifyCalendarUpdated();
      onSaved();
      onClose();
    } catch {
      setError("Failed to update meeting.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${event.title}" from your calendar?`)) return;

    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/ea/calendar/${event.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to delete meeting.");
        return;
      }

      notifyCalendarUpdated();
      onSaved();
      onClose();
    } catch {
      setError("Failed to delete meeting.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-text)]/70 px-4">
      <div className="w-full max-w-lg rounded-xl border border-[var(--color-text)]/15 bg-[var(--color-bg)] p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium text-[var(--color-text)]">Edit meeting</h3>
            <p className="mt-1 text-xs text-[var(--color-text)] opacity-70">Times are in IST</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--color-text)] opacity-70 transition-colors hover:text-[var(--color-text)] hover:opacity-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs text-[var(--color-text)] opacity-70">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={EA_INPUT}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs text-[var(--color-text)] opacity-70">Start</label>
              <input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className={EA_INPUT}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-[var(--color-text)] opacity-70">End</label>
              <input
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className={EA_INPUT}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-[var(--color-text)] opacity-70">
              Guest emails
            </label>
            <input
              type="text"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              placeholder="hello@designbyganesh.com"
              className={EA_INPUT}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-[var(--color-text)] opacity-70">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={EA_INPUT}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-[var(--color-text)] opacity-70">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`${EA_INPUT} resize-y`}
            />
          </div>

          {event.meetLink ? (
            <div>
              <label className="mb-1.5 block text-xs text-[var(--color-text)] opacity-70">
                Google Meet
              </label>
              <a
                href={event.meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[var(--color-accent)] underline underline-offset-2 hover:opacity-80"
              >
                {event.meetLink}
              </a>
            </div>
          ) : null}

          {error ? <p className="text-sm text-[var(--color-accent)]">{error}</p> : null}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting || saving}
            className="rounded-lg border border-[var(--color-accent)] px-4 py-2 text-sm text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)] hover:text-[var(--color-bg)] disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={deleting || saving}
              className="rounded-lg border border-[var(--color-text)]/35 px-4 py-2 text-sm text-[var(--color-text)] transition-colors hover:bg-[var(--color-text)]/5 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={deleting || saving}
              className="rounded-lg bg-[var(--color-text)] px-4 py-2 text-sm font-medium text-[var(--color-bg)] transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { eaName } = useEASettings();
  const [connected, setConnected] = useState(false);
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [tasks, setTasks] = useState<GroupedTasks>({
    my_task: [],
    assigned_task: [],
    team_task: [],
  });
  const [tasksLoading, setTasksLoading] = useState(true);
  const [pendingFollowups, setPendingFollowups] = useState(0);

  const calendarStatus = searchParams.get("calendar");
  const oauthStatusMessage =
    calendarStatus === "connected"
      ? "Google Calendar connected."
      : calendarStatus === "error"
        ? "Failed to connect Google Calendar."
        : null;
  const displayStatusMessage = statusMessage ?? oauthStatusMessage;

  const loadCalendar = useCallback(() => {
    void (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/ea/calendar", { credentials: "include" });
        const data = await res.json();
        setConnected(data.connected ?? false);
        setTodayEvents(data.today ?? []);
        setUpcomingEvents(data.upcoming ?? []);
        if (data.error) {
          setStatusMessage(data.error);
        }
      } catch {
        setStatusMessage("Could not load calendar.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadTasks = useCallback(() => {
    void (async () => {
      setTasksLoading(true);
      try {
        const res = await fetch("/api/ea/action-items", {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok) {
          setTasks(mapApiTasks(data));
        }
      } catch {
        // ignore
      } finally {
        setTasksLoading(false);
      }
    })();
  }, []);

  const loadFollowups = useCallback(() => {
    void (async () => {
      try {
        const res = await fetch("/api/ea/followups", { credentials: "include" });
        const data = await res.json();
        if (res.ok) {
          setPendingFollowups(data.pendingCount ?? 0);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    loadCalendar();
    loadTasks();
    loadFollowups();
  }, [loadCalendar, loadTasks, loadFollowups]);

  useEffect(() => {
    const onCalendarUpdated = () => loadCalendar();
    window.addEventListener("ea-calendar-updated", onCalendarUpdated);
    window.addEventListener("focus", onCalendarUpdated);
    return () => {
      window.removeEventListener("ea-calendar-updated", onCalendarUpdated);
      window.removeEventListener("focus", onCalendarUpdated);
    };
  }, [loadCalendar]);

  const [nowMs] = useState(() => Date.now());

  const pendingTasks = totalTaskCount(tasks);

  const stats = [
    { label: "Today's Meetings", value: todayEvents.length },
    { label: "Pending Action Items", value: pendingTasks },
    {
      label: "Pending Follow-ups",
      value: pendingFollowups,
      href: "/ea/followups",
    },
    { label: "Notes Saved", value: 0 },
  ];

  const nextMeeting = useMemo(
    () =>
      todayEvents.find((event) => {
        if (event.isAllDay) return true;
        return new Date(event.end).getTime() > nowMs;
      }) ??
      upcomingEvents[0] ??
      null,
    [todayEvents, upcomingEvents, nowMs],
  );

  return (
    <div className={EA_PAGE}>
      <EANav />

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-10">
          <h1 className={`text-2xl font-light ${EA_TITLE}`}>Dashboard</h1>
          <p className={`mt-1 text-sm ${EA_MUTED}`}>
            {eaName} — your executive assistant at a glance
          </p>
        </div>

        {displayStatusMessage ? (
          <p className="mb-6 text-sm text-[var(--color-accent)]">{displayStatusMessage}</p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className={`${EA_CARD} p-6`}>
              {"href" in stat && stat.href ? (
                <button
                  type="button"
                  onClick={() => router.push(stat.href!)}
                  className="block w-full text-left"
                >
                  <p className="text-3xl font-light text-[var(--color-text)]">{stat.value}</p>
                  <p className="mt-2 text-sm text-[var(--color-text)] opacity-70">{stat.label}</p>
                </button>
              ) : (
                <>
                  <p className="text-3xl font-light text-[var(--color-text)]">{stat.value}</p>
                  <p className="mt-2 text-sm text-[var(--color-text)] opacity-70">{stat.label}</p>
                </>
              )}
            </div>
          ))}
        </div>

        {nextMeeting ? (
          <div className={`mt-6 ${EA_CARD} p-6`}>
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text)] opacity-70">
              Next meeting
            </p>
            <p className="mt-2 text-lg font-light text-[var(--color-text)]">
              {nextMeeting.title}
            </p>
            <p className="mt-1 text-sm text-[var(--color-text)] opacity-70">
              {nextMeeting.isAllDay
                ? "All day"
                : new Date(nextMeeting.start).toLocaleString("en-IN", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
            </p>
          </div>
        ) : null}

        <ActionItemsPanel tasks={tasks} loading={tasksLoading} />

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className={`text-sm font-medium ${EA_TITLE}`}>
              Today&apos;s Schedule
            </h2>
            {!connected && !loading ? (
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/api/ea/calendar/auth";
                }}
                className={EA_BTN_SECONDARY}
              >
                Connect Google Calendar
              </button>
            ) : null}
          </div>

          <div className={`${EA_CARD} p-6`}>
            {loading ? (
              <p className="text-sm text-[var(--color-text)] opacity-70">Loading schedule…</p>
            ) : !connected ? (
              <p className="text-sm text-[var(--color-text)] opacity-70">
                Connect Google Calendar to see your events here.
              </p>
            ) : todayEvents.length === 0 && upcomingEvents.length === 0 ? (
              <p className="text-sm text-[var(--color-text)] opacity-70">
                No events scheduled for today.
              </p>
            ) : (
              <>
                {todayEvents.length > 0 ? (
                  <ul className="space-y-3">
                    {todayEvents.map((event) => (
                      <EventRow
                        key={event.id}
                        event={event}
                        onEdit={setEditingEvent}
                      />
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[var(--color-text)] opacity-70">
                    No events scheduled for today.
                  </p>
                )}

                {upcomingEvents.length > 0 ? (
                  <div className="mt-6 border-t border-[var(--color-text)]/15 pt-6">
                    <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text)] opacity-70">
                      Upcoming
                    </h3>
                    <ul className="mt-3 space-y-3">
                      {upcomingEvents.slice(0, 10).map((event) => (
                        <EventRow
                          key={event.id}
                          event={event}
                          dateLabel={new Date(event.start).toLocaleDateString(
                            "en-IN",
                            {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            },
                          )}
                          onEdit={setEditingEvent}
                        />
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </section>

        <div className="mt-10 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => router.push("/ea/meetings")}
            className={EA_BTN_PRIMARY}
          >
            New Meeting
          </button>
          <button
            type="button"
            onClick={() => router.push("/ea/chat")}
            className={EA_BTN_SECONDARY}
          >
            Ask EA
          </button>
        </div>
      </main>

      {editingEvent ? (
        <EditEventModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSaved={loadCalendar}
        />
      ) : null}
    </div>
  );
}

export default function EADashboardPage() {
  return (
    <Suspense
      fallback={
        <div className={`${EA_PAGE} flex items-center justify-center text-sm ${EA_MUTED}`}>
          Loading…
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
