"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { monthLabel } from "@/lib/expense-tracker-month";
import type { ExpenseMonthView } from "@/lib/expense-tracker-types";

type MonthSummary = {
  monthKey: string;
  label: string;
  salary: number;
  freelanceAmount: number;
  expenseTotal: number;
  remaining: number;
  hasFetched: boolean;
  isCurrent: boolean;
};

type Overview = {
  months: MonthSummary[];
  currentMonthKey: string;
  currentRemaining: number;
  trailingIncome: number;
  trailingExpense: number;
  trailingRemaining: number;
  sheetStart: string;
};

type Col = "A" | "B" | "C" | "D";
type CellRef = { row: number; col: Col };

type RowKind =
  | "header"
  | "section"
  | "salary"
  | "freelance"
  | "fixed"
  | "fixed-add"
  | "variable"
  | "variable-add"
  | "blank"
  | "total-income"
  | "total-expense"
  | "savings"
  | "overview-header"
  | "overview-total"
  | "overview-month";

type SheetRow = {
  kind: RowKind;
  id?: string;
  active?: boolean;
  a: string;
  b: string;
  c: string;
  d: string;
  monthKey?: string;
  editable?: Partial<Record<Col, boolean>>;
};

const COLS: Col[] = ["A", "B", "C", "D"];

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function parseMoney(raw: string): number | null {
  const cleaned = raw.replace(/[₹,\s]/g, "").trim();
  if (!cleaned) return 0;
  const n = Number(cleaned);
  if (Number.isNaN(n) || n < 0) return null;
  return n;
}

function cellLabel(ref: CellRef): string {
  return `${ref.col}${ref.row}`;
}

function shortMonth(label: string): string {
  const parts = label.split(" ");
  if (parts.length >= 2) return `${parts[0].slice(0, 3)} ${parts[1]}`;
  return label;
}

type Props = {
  overview: Overview;
  selectedMonth: string | null;
  monthView: ExpenseMonthView;
};

export function ExpenseTrackerApp({
  overview: initialOverview,
  selectedMonth,
  monthView: initialMonth,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [overview, setOverview] = useState(initialOverview);
  const [monthView, setMonthView] = useState(initialMonth);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [addingMonth, setAddingMonth] = useState(false);
  const [selected, setSelected] = useState<CellRef>({ row: 1, col: "B" });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [addFixedName, setAddFixedName] = useState("");
  const [addFixedAmt, setAddFixedAmt] = useState("");
  const [addVarName, setAddVarName] = useState("");
  const [addVarAmt, setAddVarAmt] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const addDraftRef = useRef({
    fixedName: "",
    fixedAmt: "",
    varName: "",
    varAmt: "",
  });

  useEffect(() => {
    setOverview(initialOverview);
    setMonthView(initialMonth);
    setError(null);
    setEditing(false);
    setSelected({ row: 1, col: "B" });
  }, [initialOverview, initialMonth, selectedMonth]);

  useEffect(() => {
    addDraftRef.current = {
      fixedName: addFixedName,
      fixedAmt: addFixedAmt,
      varName: addVarName,
      varAmt: addVarAmt,
    };
  }, [addFixedName, addFixedAmt, addVarName, addVarAmt]);

  const isOverview = !selectedMonth;

  const baseRows: SheetRow[] = useMemo(() => {
    if (isOverview) return buildOverviewRows(overview);
    return buildMonthRows(monthView);
  }, [isOverview, overview, monthView]);

  const displayRows: SheetRow[] = useMemo(() => {
    return baseRows.map((r) => {
      if (r.kind === "fixed-add") {
        return { ...r, b: addFixedName, c: addFixedAmt };
      }
      if (r.kind === "variable-add") {
        return { ...r, b: addVarName, c: addVarAmt };
      }
      return r;
    });
  }, [baseRows, addFixedName, addFixedAmt, addVarName, addVarAmt]);

  const selectedRow = displayRows[selected.row - 1];
  const formulaValue = selectedRow
    ? selected.col === "A"
      ? selectedRow.a
      : selected.col === "B"
        ? selectedRow.b
        : selected.col === "C"
          ? selectedRow.c
          : selectedRow.d
    : "";

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing, selected]);

  function openMonth(monthKey: string | null) {
    startTransition(() => {
      if (!monthKey) {
        router.push("/expense-tracker");
        return;
      }
      router.push(`/expense-tracker?month=${monthKey}`);
    });
  }

  async function refreshMonth(monthKey: string) {
    const res = await fetch(`/api/expense-tracker?month=${monthKey}`);
    if (!res.ok) throw new Error("load failed");
    setMonthView((await res.json()) as ExpenseMonthView);
  }

  async function addMonth() {
    setAddingMonth(true);
    setError(null);
    try {
      const res = await fetch("/api/expense-tracker", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addMonth: true }),
      });
      if (!res.ok) {
        setError("Could not add next month.");
        return;
      }
      const data = (await res.json()) as { monthKey: string };
      router.refresh();
      openMonth(data.monthKey);
    } finally {
      setAddingMonth(false);
    }
  }

  async function refreshFreelance() {
    setError(null);
    setFetching(true);
    try {
      const res = await fetch("/api/expense-tracker", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthKey: monthView.monthKey,
          fetchFreelance: true,
        }),
      });
      if (!res.ok) {
        setError("Freelance refresh failed. Mark invoices Paid with a date first.");
        return;
      }
      setMonthView((await res.json()) as ExpenseMonthView);
      router.refresh();
    } finally {
      setFetching(false);
    }
  }

  const isEditable = useCallback(
    (ref: CellRef) => Boolean(displayRows[ref.row - 1]?.editable?.[ref.col]),
    [displayRows],
  );

  function beginEdit(ref: CellRef, seed?: string) {
    if (!isEditable(ref)) return;
    const row = displayRows[ref.row - 1];
    if (!row) return;
    const current =
      seed ??
      (ref.col === "A"
        ? row.a
        : ref.col === "B"
          ? row.b
          : ref.col === "C"
            ? row.c
            : row.d);
    setSelected(ref);
    setDraft(current);
    setEditing(true);
  }

  function moveSelection(from: CellRef, dir: "tab" | "enter" | "shift-tab") {
    if (dir === "enter") {
      setSelected({
        row: Math.min(displayRows.length, from.row + 1),
        col: from.col,
      });
      return;
    }
    const colIdx = COLS.indexOf(from.col);
    if (dir === "tab") {
      if (colIdx < COLS.length - 1) {
        setSelected({ row: from.row, col: COLS[colIdx + 1] });
      } else if (from.row < displayRows.length) {
        setSelected({ row: from.row + 1, col: "A" });
      }
      return;
    }
    if (colIdx > 0) {
      setSelected({ row: from.row, col: COLS[colIdx - 1] });
    } else if (from.row > 1) {
      setSelected({ row: from.row - 1, col: "D" });
    }
  }

  async function tryCreateFromAdd(
    type: "fixed" | "variable",
    col: Col,
    value: string,
  ) {
    const d = addDraftRef.current;
    let name = type === "fixed" ? d.fixedName : d.varName;
    let amt = type === "fixed" ? d.fixedAmt : d.varAmt;
    if (col === "B") name = value;
    if (col === "C") amt = value;

    if (type === "fixed") {
      setAddFixedName(name);
      setAddFixedAmt(amt);
      addDraftRef.current.fixedName = name;
      addDraftRef.current.fixedAmt = amt;
    } else {
      setAddVarName(name);
      setAddVarAmt(amt);
      addDraftRef.current.varName = name;
      addDraftRef.current.varAmt = amt;
    }

    const amount = parseMoney(amt);
    if (!name.trim() || amt === "" || amount === null) return;

    if (type === "fixed") {
      const res = await fetch("/api/expense-tracker/fixed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, amount }),
      });
      if (!res.ok) {
        setError("Could not add fixed expense.");
        return;
      }
      setAddFixedName("");
      setAddFixedAmt("");
      addDraftRef.current.fixedName = "";
      addDraftRef.current.fixedAmt = "";
    } else {
      const res = await fetch("/api/expense-tracker/variable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthKey: monthView.monthKey,
          name,
          amount,
        }),
      });
      if (!res.ok) {
        setError("Could not add variable expense.");
        return;
      }
      setAddVarName("");
      setAddVarAmt("");
      addDraftRef.current.varName = "";
      addDraftRef.current.varAmt = "";
    }
    await refreshMonth(monthView.monthKey);
    router.refresh();
  }

  async function commitEdit(
    next?: CellRef,
    nav?: "tab" | "enter" | "shift-tab",
  ) {
    const row = selectedRow;
    const col = selected.col;
    const value = draft.trim();
    const wasEditing = editing;
    setEditing(false);
    setError(null);

    if (wasEditing && row) {
      try {
        if (row.kind === "salary" && col === "C") {
          const amount = parseMoney(value);
          if (amount === null) {
            setError("Enter a valid salary.");
          } else {
            const res = await fetch("/api/expense-tracker", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                monthKey: monthView.monthKey,
                salary: amount,
              }),
            });
            if (!res.ok) throw new Error("salary");
            setMonthView((await res.json()) as ExpenseMonthView);
            router.refresh();
          }
        } else if (row.kind === "freelance" && col === "C") {
          const amount = parseMoney(value);
          if (amount === null) {
            setError("Enter a valid freelance amount.");
          } else {
            const res = await fetch("/api/expense-tracker", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                monthKey: monthView.monthKey,
                freelanceAmount: amount,
              }),
            });
            if (!res.ok) throw new Error("freelance");
            setMonthView((await res.json()) as ExpenseMonthView);
            router.refresh();
          }
        } else if (row.kind === "fixed" && row.id) {
          if (col === "B") {
            await fetch("/api/expense-tracker/fixed", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: row.id, name: value || row.b }),
            });
          } else if (col === "C") {
            const amount = parseMoney(value);
            if (amount === null) {
              setError("Enter a valid amount.");
            } else {
              await fetch("/api/expense-tracker/fixed", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: row.id, amount }),
              });
            }
          }
          await refreshMonth(monthView.monthKey);
          router.refresh();
        } else if (row.kind === "variable" && row.id) {
          if (col === "B") {
            await fetch("/api/expense-tracker/variable", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: row.id, name: value || row.b }),
            });
          } else if (col === "C") {
            const amount = parseMoney(value);
            if (amount === null) {
              setError("Enter a valid amount.");
            } else {
              await fetch("/api/expense-tracker/variable", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: row.id, amount }),
              });
            }
          }
          await refreshMonth(monthView.monthKey);
          router.refresh();
        } else if (row.kind === "fixed-add") {
          await tryCreateFromAdd("fixed", col, value);
        } else if (row.kind === "variable-add") {
          await tryCreateFromAdd("variable", col, value);
        }
      } catch {
        setError("Could not save cell.");
      }
    }

    if (next) setSelected(next);
    else if (nav) moveSelection(selected, nav);
  }

  async function toggleFixed(id: string, active: boolean) {
    await fetch("/api/expense-tracker/fixed", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active: !active }),
    });
    await refreshMonth(monthView.monthKey);
    router.refresh();
  }

  async function deleteRow(row: SheetRow) {
    if (row.kind === "fixed" && row.id) {
      await fetch(`/api/expense-tracker/fixed?id=${row.id}`, { method: "DELETE" });
    } else if (row.kind === "variable" && row.id) {
      await fetch(`/api/expense-tracker/variable?id=${row.id}`, {
        method: "DELETE",
      });
    } else return;
    await refreshMonth(monthView.monthKey);
    router.refresh();
  }

  function onCellPointerDown(rowIdx: number, col: Col) {
    const ref = { row: rowIdx, col };
    if (editing) {
      void commitEdit(ref);
      return;
    }
    setSelected(ref);
  }

  function onKeyDown(e: KeyboardEvent) {
    if (editing) {
      if (e.key === "Enter") {
        e.preventDefault();
        void commitEdit(undefined, "enter");
      } else if (e.key === "Tab") {
        e.preventDefault();
        void commitEdit(undefined, e.shiftKey ? "shift-tab" : "tab");
      } else if (e.key === "Escape") {
        e.preventDefault();
        setEditing(false);
      }
      return;
    }

    if (e.key === "Enter" || e.key === "F2") {
      e.preventDefault();
      beginEdit(selected);
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      moveSelection(selected, e.shiftKey ? "shift-tab" : "tab");
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => ({
        row: Math.min(displayRows.length, s.row + 1),
        col: s.col,
      }));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => ({ row: Math.max(1, s.row - 1), col: s.col }));
      return;
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      moveSelection(selected, "tab");
      return;
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      moveSelection(selected, "shift-tab");
      return;
    }
    if (e.key === "Delete" || e.key === "Backspace") {
      const row = displayRows[selected.row - 1];
      if (
        row &&
        (row.kind === "fixed" || row.kind === "variable") &&
        selected.col === "A"
      ) {
        e.preventDefault();
        void deleteRow(row);
      }
      return;
    }
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      if (isEditable(selected)) {
        e.preventDefault();
        beginEdit(selected, e.key);
      }
    }
  }

  const sheetTitle = isOverview ? "Overview" : monthLabel(monthView.monthKey);
  const activeFormula = editing ? draft : formulaValue;

  return (
    <div className="et-shell" onKeyDown={onKeyDown}>
      <div className="et-menubar">
        <p className="et-menubar__title">Expense Sheet</p>
        <span className="et-menubar__sep" aria-hidden="true" />
        <div className="et-formula">
          <span className="et-formula__ref">{cellLabel(selected)}</span>
          <div className="et-formula__box" title={activeFormula}>
            {activeFormula || "\u00A0"}
          </div>
        </div>
        {!isOverview ? (
          <button
            type="button"
            className="et-toolbar-btn"
            onClick={() => void refreshFreelance()}
            disabled={fetching || pending}
          >
            {fetching ? "Syncing…" : "Refresh freelance"}
          </button>
        ) : null}
      </div>

      {error ? <p className="et-error">{error}</p> : null}

      <div
        className="et-sheet-wrap"
        tabIndex={0}
        aria-label={`${sheetTitle} spreadsheet`}
      >
        <div
          className="et-sheet"
          role="grid"
          aria-rowcount={displayRows.length}
          aria-colcount={4}
        >
          <div className="et-corner" aria-hidden="true" />
          {COLS.map((c) => (
            <div key={c} className="et-colhead" aria-hidden="true">
              {c}
            </div>
          ))}

          {displayRows.map((row, idx) => {
            const rowNum = idx + 1;
            return (
              <RowCells
                key={`${row.kind}-${row.id ?? idx}`}
                row={row}
                rowNum={rowNum}
                selected={selected}
                editing={editing}
                draft={draft}
                inputRef={inputRef}
                setDraft={setDraft}
                onSelect={onCellPointerDown}
                onEdit={(r, c) => beginEdit({ row: r, col: c })}
                onToggleFixed={(id, active) => void toggleFixed(id, active)}
                onOpenMonth={openMonth}
                onCommit={() => void commitEdit()}
                savingsNeg={
                  row.kind === "savings" ? monthView.remaining < 0 : false
                }
              />
            );
          })}
        </div>
      </div>

      <nav className="et-tabs" aria-label="Sheets">
        <button
          type="button"
          className="et-tab"
          data-active={isOverview ? "true" : "false"}
          onClick={() => openMonth(null)}
        >
          Overview
          <span className="et-tab__amt">
            {formatINR(overview.trailingRemaining)}
          </span>
        </button>
        {overview.months.map((m) => (
          <button
            key={m.monthKey}
            type="button"
            className="et-tab"
            data-active={
              !isOverview && selectedMonth === m.monthKey ? "true" : "false"
            }
            onClick={() => openMonth(m.monthKey)}
            disabled={pending}
          >
            {shortMonth(m.label)}
            <span className="et-tab__amt">{formatINR(m.remaining)}</span>
          </button>
        ))}
        <button
          type="button"
          className="et-tab et-tab--add"
          onClick={() => void addMonth()}
          disabled={addingMonth || pending}
          aria-label="Add next month"
        >
          {addingMonth ? "…" : "+"}
        </button>
      </nav>
    </div>
  );
}

function buildOverviewRows(overview: Overview): SheetRow[] {
  const rows: SheetRow[] = [
    {
      kind: "overview-header",
      a: "Month",
      b: "Income",
      c: "Expenses",
      d: "Savings",
      editable: {},
    },
    {
      kind: "overview-total",
      a: "TOTAL",
      b: formatINR(overview.trailingIncome),
      c: formatINR(overview.trailingExpense),
      d: formatINR(overview.trailingRemaining),
      editable: {},
    },
  ];
  for (const m of overview.months) {
    rows.push({
      kind: "overview-month",
      a: m.label,
      b: formatINR(m.salary + m.freelanceAmount),
      c: formatINR(m.expenseTotal),
      d: formatINR(m.remaining),
      monthKey: m.monthKey,
      editable: {},
    });
  }
  return rows;
}

function buildMonthRows(view: ExpenseMonthView): SheetRow[] {
  const rows: SheetRow[] = [
    {
      kind: "header",
      a: "Section",
      b: "Item",
      c: "Amount",
      d: "Notes",
      editable: {},
    },
    {
      kind: "section",
      a: "INCOME",
      b: "",
      c: "",
      d: "",
      editable: {},
    },
    {
      kind: "salary",
      a: "Income",
      b: "Salary",
      c: view.salary ? String(view.salary) : "",
      d: "",
      editable: { C: true },
    },
    {
      kind: "freelance",
      a: "Income",
      b: "Freelance",
      c: view.freelanceAmount ? String(view.freelanceAmount) : "",
      d: view.freelanceFetchedAt
        ? `Synced ${new Date(view.freelanceFetchedAt).toLocaleDateString("en-IN")}`
        : "Approx or Refresh",
      editable: { C: true },
    },
    { kind: "blank", a: "", b: "", c: "", d: "", editable: {} },
    {
      kind: "section",
      a: "EXPENSES",
      b: "",
      c: "",
      d: "",
      editable: {},
    },
  ];

  for (const item of view.fixedItems) {
    rows.push({
      kind: "fixed",
      id: item.id,
      active: item.active,
      a: "Fixed",
      b: item.name,
      c: String(item.amount),
      d: item.active ? "" : "Off",
      editable: { B: true, C: true },
    });
  }
  rows.push({
    kind: "fixed-add",
    a: "Fixed",
    b: "",
    c: "",
    d: "Add fixed…",
    editable: { B: true, C: true },
  });

  for (const item of view.variableItems) {
    rows.push({
      kind: "variable",
      id: item.id,
      a: "Variable",
      b: item.name,
      c: String(item.amount),
      d: "",
      editable: { B: true, C: true },
    });
  }
  rows.push({
    kind: "variable-add",
    a: "Variable",
    b: "",
    c: "",
    d: "Add variable…",
    editable: { B: true, C: true },
  });

  rows.push({ kind: "blank", a: "", b: "", c: "", d: "", editable: {} });
  rows.push({
    kind: "total-income",
    a: "",
    b: "Income total",
    c: formatINR(view.incomeTotal),
    d: "",
    editable: {},
  });
  rows.push({
    kind: "total-expense",
    a: "",
    b: "Expense total",
    c: formatINR(view.expenseTotal),
    d: "",
    editable: {},
  });
  rows.push({
    kind: "savings",
    a: "",
    b: "Savings",
    c: formatINR(view.remaining),
    d: "Income − Expenses",
    editable: {},
  });

  return rows;
}

function RowCells({
  row,
  rowNum,
  selected,
  editing,
  draft,
  inputRef,
  setDraft,
  onSelect,
  onEdit,
  onToggleFixed,
  onOpenMonth,
  onCommit,
  savingsNeg,
}: {
  row: SheetRow;
  rowNum: number;
  selected: CellRef;
  editing: boolean;
  draft: string;
  inputRef: RefObject<HTMLInputElement | null>;
  setDraft: (v: string) => void;
  onSelect: (row: number, col: Col) => void;
  onEdit: (row: number, col: Col) => void;
  onToggleFixed: (id: string, active: boolean) => void;
  onOpenMonth: (monthKey: string | null) => void;
  onCommit: () => void;
  savingsNeg: boolean;
}) {
  const kindAttr =
    row.kind === "section"
      ? "section"
      : row.kind === "header" || row.kind === "overview-header"
        ? "header"
        : row.kind === "savings"
          ? "savings"
          : row.kind === "total-income" ||
              row.kind === "total-expense" ||
              row.kind === "overview-total"
            ? "total"
            : "data";

  function cellValue(col: Col): string {
    const raw =
      col === "A" ? row.a : col === "B" ? row.b : col === "C" ? row.c : row.d;
    if (
      col === "C" &&
      raw !== "" &&
      (row.kind === "salary" ||
        row.kind === "freelance" ||
        row.kind === "fixed" ||
        row.kind === "variable")
    ) {
      return formatINR(Number(raw));
    }
    return raw;
  }

  function renderCell(col: Col) {
    const isSel = selected.row === rowNum && selected.col === col;
    const isEdit = isSel && editing && !!row.editable?.[col];
    const display = cellValue(col);
    const readonly = !row.editable?.[col];
    const off = row.kind === "fixed" && row.active === false;

    return (
      <div
        role="gridcell"
        className="et-cell"
        data-kind={kindAttr}
        data-selected={isSel ? "true" : "false"}
        data-readonly={readonly ? "true" : "false"}
        data-off={off ? "true" : "false"}
        data-neg={savingsNeg && col === "C" ? "true" : "false"}
        tabIndex={isSel ? 0 : -1}
        onMouseDown={(e) => {
          e.preventDefault();
          onSelect(rowNum, col);
        }}
        onDoubleClick={() => onEdit(rowNum, col)}
      >
        {col === "A" && row.kind === "fixed" && row.id ? (
          <input
            type="checkbox"
            className="et-check"
            checked={!!row.active}
            onChange={() => onToggleFixed(row.id!, !!row.active)}
            onMouseDown={(e) => e.stopPropagation()}
            aria-label={`Include ${row.b}`}
          />
        ) : null}

        {isEdit ? (
          <input
            ref={inputRef}
            className={`et-cell-input ${col === "C" ? "et-cell-input--amt" : ""}`}
            value={draft}
            inputMode={col === "C" ? "decimal" : "text"}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => onCommit()}
          />
        ) : col === "A" && row.kind === "overview-month" && row.monthKey ? (
          <button
            type="button"
            className="et-cell-link"
            onClick={() => onOpenMonth(row.monthKey!)}
          >
            {display}
          </button>
        ) : (
          <span
            className={`et-cell__text ${col === "C" ? "et-cell__text--right" : ""}`}
          >
            {display || "\u00A0"}
          </span>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="et-rowhead" aria-hidden="true">
        {rowNum}
      </div>
      {renderCell("A")}
      {renderCell("B")}
      {renderCell("C")}
      {renderCell("D")}
    </>
  );
}
