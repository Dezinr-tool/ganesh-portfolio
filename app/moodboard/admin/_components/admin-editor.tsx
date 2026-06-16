"use client";

import { useEffect, useState } from "react";
import type { MoodboardQuestion } from "@/lib/moodboard/db-types";
import { QuestionInput, ChatBubble } from "../../_components/question-input";

export function AdminEditor() {
  const [questions, setQuestions] = useState<MoodboardQuestion[]>([]);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch("/api/moodboard/admin/questions");
      if (cancelled) return;
      const data = await res.json();
      setQuestions(data.questions ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveQuestion = async (id: string, patch: Partial<MoodboardQuestion>) => {
    setSaving(id);
    const res = await fetch(`/api/moodboard/admin/questions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (data.question) {
      setQuestions((qs) => qs.map((q) => (q.id === id ? data.question : q)));
    }
    setSaving(null);
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    await fetch(`/api/moodboard/admin/questions/${id}`, { method: "DELETE" });
    setQuestions((qs) => qs.filter((q) => q.id !== id));
  };

  const addQuestion = async () => {
    const res = await fetch("/api/moodboard/admin/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: `custom_${Date.now()}`,
        question_text: "New question",
        question_type: "open",
        category: "brand_basics",
        order_index: questions.length + 1,
      }),
    });
    const data = await res.json();
    if (data.question) {
      setQuestions((qs) => [...qs, data.question]);
    }
  };

  const moveQuestion = async (index: number, direction: -1 | 1) => {
    const next = index + direction;
    if (next < 0 || next >= questions.length) return;
    const reordered = [...questions];
    [reordered[index], reordered[next]] = [reordered[next], reordered[index]];
    setQuestions(reordered);
    await fetch("/api/moodboard/admin/questions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: reordered.map((q) => q.id) }),
    });
  };

  const preview = questions.find((q) => q.id === previewId);

  if (loading) {
    return <p className="mt-8 text-sm text-zinc-500">Loading questions…</p>;
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-2">
      <div className="space-y-4">
        <button
          type="button"
          onClick={addQuestion}
          className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900"
        >
          Add question
        </button>

        {questions.map((q, index) => (
          <div
            key={q.id}
            className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-xs text-zinc-500">
                #{index + 1} · {q.key} · {q.category}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => moveQuestion(index, -1)}
                  className="rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-800"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveQuestion(index, 1)}
                  className="rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-800"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewId(q.id)}
                  className="rounded px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800"
                >
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => deleteQuestion(q.id)}
                  className="rounded px-2 py-1 text-xs text-red-400 hover:bg-zinc-800"
                >
                  Delete
                </button>
              </div>
            </div>

            <textarea
              defaultValue={q.question_text}
              rows={2}
              onBlur={(e) => {
                if (e.target.value !== q.question_text) {
                  saveQuestion(q.id, { question_text: e.target.value });
                }
              }}
              className="mb-2 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
            />

            <div className="flex flex-wrap gap-2 text-xs">
              <select
                value={q.question_type}
                onChange={(e) =>
                  saveQuestion(q.id, {
                    question_type: e.target.value as MoodboardQuestion["question_type"],
                  })
                }
                className="rounded border border-zinc-800 bg-zinc-950 px-2 py-1"
              >
                {["open", "chips", "upload", "url", "skip", "multi_section_select"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-1.5 text-zinc-400">
                <input
                  type="checkbox"
                  checked={q.is_active}
                  onChange={(e) => saveQuestion(q.id, { is_active: e.target.checked })}
                />
                Active
              </label>

              {saving === q.id ? (
                <span className="text-zinc-600">Saving…</span>
              ) : null}
            </div>

            {q.question_type === "chips" ? (
              <textarea
                defaultValue={(q.chips_options as string[] ?? []).join("\n")}
                rows={3}
                placeholder="One chip per line"
                onBlur={(e) => {
                  const opts = e.target.value.split("\n").map((s) => s.trim()).filter(Boolean);
                  saveQuestion(q.id, { chips_options: opts });
                }}
                className="mt-2 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs outline-none"
              />
            ) : null}

            {q.question_type === "multi_section_select" ? (
              <textarea
                defaultValue={JSON.stringify(q.chips_options ?? [], null, 2)}
                rows={8}
                placeholder='[{"key":"color_palette","label":"Color Palette","group":"VISUAL FOUNDATION"}]'
                onBlur={(e) => {
                  try {
                    const opts = JSON.parse(e.target.value);
                    if (Array.isArray(opts)) saveQuestion(q.id, { chips_options: opts });
                  } catch {
                    /* invalid JSON */
                  }
                }}
                className="mt-2 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-xs outline-none"
              />
            ) : null}
          </div>
        ))}
      </div>

      <div className="lg:sticky lg:top-8 lg:self-start">
        <h2 className="mb-4 text-sm font-medium text-zinc-400">Chat preview</h2>
        {preview ? (
          <div className="rounded-xl border border-zinc-800 bg-[#0d0d0d] p-4">
            <ChatBubble role="assistant">
              <p className="mb-3">{preview.question_text}</p>
              <QuestionInput
                question={preview}
                onSubmit={() => {}}
                onSkip={() => {}}
              />
            </ChatBubble>
          </div>
        ) : (
          <p className="text-sm text-zinc-600">Select Preview on a question.</p>
        )}
      </div>
    </div>
  );
}
