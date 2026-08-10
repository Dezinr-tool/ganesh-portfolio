# Expense Tracker — Google Sheets UX

Date: 2026-07-26  
Status: Approved (build)

## Locked

- Sheets-style editing (click cell, Tab/Enter) — no formula engine
- Bottom sheet tabs: Overview | months | +
- Month grid: Income block → Expenses block → Savings
- Label: **Savings** (not Remaining)
- Existing APIs / data model unchanged

## Shell

- Top formula bar shows active cell ref + value
- Grid: column letters A–D, row numbers
- Columns: Section | Item | Amount | Notes
- Selection highlight; Esc cancels edit

## Out of scope

Real formulas, insert/delete columns, multi-user, charts
