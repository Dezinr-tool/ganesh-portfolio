"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { EANav } from "../_components/ea-nav";
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
    <li className="flex items-start gap-4 border-b border-zinc-800/60 pb-3 last:border-0 last:pb-0">
      <span className="w-20 shrink-0 text-xs text-zinc-500">
        {dateLabel ?? formatTime(event)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-white">{event.title}</p>
        {event.location ? (
          <p className="mt-0.5 text-xs text-zinc-500">{event.location}</p>
        ) : null}
        {event.attendees?.length ? (
          <p className="mt-0.5 text-xs text-zinc-600">
            {event.attendees.join(", ")}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => onEdit(event)}
          className="rounded-md border border-zinc-700 px-2.5 py-1 text-xs text-zinc-300 transition-colors hover:border-zinc-500 hover:bg-zinc-900"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium text-white">Edit meeting</h3>
            <p className="mt-1 text-xs text-zinc-500">Times are in IST</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 transition-colors hover:text-zinc-300"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs text-zinc-400">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs text-zinc-400">Start</label>
              <input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-zinc-400">End</label>
              <input
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-zinc-400">
              Guest emails
            </label>
            <input
              type="text"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              placeholder="hello@designbyganesh.com"
              className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-zinc-400">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-zinc-400">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full resize-y rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
            />
          </div>

          {event.meetLink ? (
            <div>
              <label className="mb-1.5 block text-xs text-zinc-400">
                Google Meet
              </label>
              <a
                href={event.meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-emerald-400 underline underline-offset-2 hover:text-emerald-300"
              >
                {event.meetLink}
              </a>
            </div>
          ) : null}

          {error ? <p className="text-sm text-red-400">{error}</p> : null}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting || saving}
            className="rounded-lg border border-red-900/60 px-4 py-2 text-sm text-red-400 transition-colors hover:border-red-700 hover:bg-red-950/30 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={deleting || saving}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-900 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={deleting || saving}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
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

  useEffect(() => {
    loadCalendar();
    loadTasks();
  }, [loadCalendar, loadTasks]);

  useEffect(() => {
    const onCalendarUpdated = () => loadCalendar();
    window.addEventListener("ea-calendar-updated", onCalendarUpdated);
    window.addEventListener("focus", onCalendarUpdated);
    return () => {
      window.removeEventListener("ea-calendar-updated", onCalendarUpdated);
      window.removeEventListener("focus", onCalendarUpdated);
    };
  }, [loadCalendar]);

  const pendingTasks = totalTaskCount(tasks);

  const stats = [
    { label: "Today's Meetings", value: todayEvents.length },
    { label: "Pending Action Items", value: pendingTasks },
    { label: "Notes Saved", value: 0 },
  ];

  const nextMeeting =
    todayEvents.find((event) => {
      if (event.isAllDay) return true;
      return new Date(event.end).getTime() > Date.now();
    }) ??
    upcomingEvents[0] ??
    null;

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <EANav />

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-10">
          <h1 className="text-2xl font-light text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {eaName} — your executive assistant at a glance
          </p>
        </div>

        {displayStatusMessage ? (
          <p
            className={`mb-6 text-sm ${displayStatusMessage.includes("Failed") || displayStatusMessage.includes("Could not") ? "text-red-400" : "text-emerald-400"}`}
          >
            {displayStatusMessage}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-zinc-800 bg-zinc-950 p-6"
            >
              <p className="text-3xl font-light text-white">{stat.value}</p>
              <p className="mt-2 text-sm text-zinc-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {nextMeeting ? (
          <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950 p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Next meeting
            </p>
            <p className="mt-2 text-lg font-light text-white">
              {nextMeeting.title}
            </p>
            <p className="mt-1 text-sm text-zinc-400">
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
            <h2 className="text-sm font-medium text-white">
              Today&apos;s Schedule
            </h2>
            {!connected && !loading ? (
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/api/ea/calendar/auth";
                }}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-white transition-colors hover:border-zinc-500 hover:bg-zinc-900"
              >
                Connect Google Calendar
              </button>
            ) : null}
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
            {loading ? (
              <p className="text-sm text-zinc-500">Loading schedule…</p>
            ) : !connected ? (
              <p className="text-sm text-zinc-500">
                Connect Google Calendar to see your events here.
              </p>
            ) : todayEvents.length === 0 && upcomingEvents.length === 0 ? (
              <p className="text-sm text-zinc-500">
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
                  <p className="text-sm text-zinc-500">
                    No events scheduled for today.
                  </p>
                )}

                {upcomingEvents.length > 0 ? (
                  <div className="mt-6 border-t border-zinc-800 pt-6">
                    <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
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
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
          >
            New Meeting
          </button>
          <button
            type="button"
            onClick={() => router.push("/ea/chat")}
            className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:border-zinc-500 hover:bg-zinc-900"
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
        <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500 text-sm">
          Loading…
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
