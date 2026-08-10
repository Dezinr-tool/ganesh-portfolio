# Expense Tracker — Design

Date: 2026-07-25  
Status: Approved (user: start building; less discussion)

## Goal

Standalone money OS at `/expense-tracker` that answers:  
**this month → salary + freelance − fixed − variable = remaining**.

## Locked decisions

| Decision | Choice |
| --- | --- |
| Location | `/expense-tracker` (own layout, not under dashboard UI) |
| Auth | Same dashboard cookie/login |
| Invoice paid date | Manual date picker when marking Paid → `paid_at` |
| Salary | Manual fixed monthly amount in tracker |
| Freelance | Pulled from Paid invoices; **manual Fetch** refreshes for selected month |
| Expenses | Fixed (recurring templates) + Variable (per-month entries) |

## Approach (recommended)

**Month ledger + templates**  
- `expense_month_settings`: salary for a month (or default salary)  
- `expense_fixed_items`: templates that apply every month  
- `expense_variable_items`: one-off per month  
- `expense_freelance_snapshots`: last fetched freelance total + invoice ids for a month (only updates on Fetch)

Freelance Fetch: sum of invoices where `status = Paid` and `paid_at` falls in selected calendar month. Snapshot stored so page stays stable until next Fetch.

## UI (one screen, month switcher)

1. Header: month prev/next + title  
2. Income cards: Salary (edit) · Freelance (amount + **Fetch** button + last-fetched hint)  
3. Summary strip: Income − Expenses = Remaining  
4. Two lists: Fixed (toggle active / amount) · Variable (add/edit/delete)  
5. Minimal shell nav: back to dashboard optional link

Colors: dashboard shell tokens (existing `.dashboard-app` pattern) for consistency with admin tools; accent for remaining positive/negative via text weight, not new colors outside system.

## Invoice change

- Add `paid_at DATE` nullable on `invoices`  
- Mark Paid → prompt for paid date → save status + paid_at  
- Mark Unpaid → clear paid_at  
- FY/monthly dashboard stats later can switch to `paid_at`; v1 expense tracker uses it for Fetch only

## Auth

Add `/expense-tracker` and `/api/expense-tracker` to `DASHBOARD_PROTECTED_PREFIXES`.

## Out of scope (YAGNI)

- Budgets/goals, receipts upload, multi-currency, bank sync, categories taxonomy beyond fixed/variable, charts v1.

## Testing

- Mark invoice Paid with date in July → Fetch July → freelance matches  
- Fetch again after new paid invoice → amount updates  
- Fixed items roll into each month total without re-entry  
- Variable only counts in its month  
- Unauthenticated visit redirects to dashboard login  
