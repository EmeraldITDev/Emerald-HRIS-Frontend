# Bulk Payroll Generation, Draft Review & Approval Workflow

## Deliverable
One consolidated documentation file:
- `docs/bulk-payroll.md` — contains backend spec, frontend spec, API shapes, permissions, mobile behavior, async/timeout behavior, integration checklist.

No other docs files. All references to `docs/bulk-payroll-frontend.md` removed.

## Goal
Replace single-employee payroll generation with:

```text
Generate Drafts → Review & Edit → Mark Ready → Validate → Approve Batch → Payroll Finalised
```

HR generates drafts in bulk, reviews exceptions, saves edits without approval, transitions records to `pending_review`, then approves selected or all ready records. Full audit trail including auto-populated values.

---

## Backend requirements (`docs/bulk-payroll.md`)

### Status machine
```text
draft → pending_review → approved → paid
```
- `draft`: generated, still being worked on
- `pending_review`: explicitly marked ready by HR; still editable
- `approved`: locked, payslips generated and distributed
- `paid`: post-payment

### Endpoint table (complete)

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/payroll/bulk-generate` | Generate drafts. Dedupe by `(pay_period, employee_id)`. Returns `already_exists`, `batch_id`, `created_count`, `skipped_count`, `drafts`, `warnings_by_employee`. May be async. |
| `GET` | `/payroll/bulk-generate/status/:batch_id` | Poll async bulk generation. Returns `status`, `processed`, `total`, `drafts`, `error`. |
| `GET` | `/payroll/drafts?pay_period=YYYY-MM` | List `draft` + `pending_review` records with full breakdown, `last_approved_snapshot`, and per-row warnings. |
| `GET` | `/payroll/draft-periods` | List of periods that currently have `draft` or `pending_review` records. Powers the review-screen period switcher. |
| `PUT` | `/payroll/{id}` | Update editable fields. Reject when status is `approved` or `paid`. Writes audit. |
| `POST` | `/payroll/{id}/save-draft` | Save without changing status. Writes audit. |
| `POST` | `/payroll/{id}/mark-ready` | Move `draft → pending_review`. Writes audit. |
| `POST` | `/payroll/{id}/revert-to-draft` | Move `pending_review → draft`. Writes audit. |
| `POST` | `/payroll/batch-approve` | Approve selected `pending_review` records. May be async. |
| `GET` | `/payroll/batch-approve/status/:batch_id` | Poll async approval. Returns `status`, `processed`, `total`, `error`. |
| `DELETE` | `/payroll/{id}` | Delete a draft. Only allowed when status is `draft` or `pending_review`. Writes audit. |
| `GET` | `/payroll/{id}/audit` | Returns ordered audit entries including system auto-populate entries. |

Note: a separate `/payroll/{id}/variance` endpoint is intentionally not included — variance is derived from `last_approved_snapshot` returned inline on `GET /payroll/drafts`.

### Endpoint behavior detail

**`POST /payroll/bulk-generate`**
- Request: `{ pay_period: "YYYY-MM", employee_ids?: number[] }`
- Omit `employee_ids` to generate for all active employees
- No future pay periods
- HR roles only
- Dedupe: if any requested `(pay_period, employee_id)` already has a `draft` or `pending_review` record, return existing records instead of creating duplicates
- Response includes `already_exists: true` when any record was reused
- Response includes `created_count` and `skipped_count`
- Auto-populates recurring values from each employee's most recent `approved` payroll

**`POST /payroll/batch-approve`**
- Request: `{ ids: number[], acknowledge_warnings?: boolean }`
- Approves only `pending_review` records
- Rejection rule: if any submitted ID is in `draft` status, reject the entire request with HTTP 422 and:
  ```text
  All records must be marked as ready before approval.
  Move draft records to pending_review first.
  ```
- Error-severity validation issues block approval
- Warn-severity issues require `acknowledge_warnings: true`
- On approval: lock records, generate payslips, distribute, write audit, update history
- Backend must confirm sync vs async; if multi-second, must return `batch_id` and expose the status endpoint

**`DELETE /payroll/{id}`**
- Allowed only for `draft` or `pending_review`
- Reject for `approved` or `paid` with a clear error
- Write audit entry (or use existing soft-delete with reason flow)

### Auto-populate rules
On bulk generation, copy from each employee's most recent `approved` payroll:
- Rent relief settings + annual rent
- Fixed personal deductions
- Recurring allowances and benefits
- Recurring bonus / commission
- Any other recurring saved values

Salary components come from the current employee salary record. If no prior approved payroll, fall back to employee defaults only.

### Audit requirements
For every auto-populated field on bulk generation, write one entry:
- `changed_by: "system"`
- `note: "auto-populated from [YYYY-MM]"`

For every manual edit, save-draft, status transition (`mark-ready`, `revert-to-draft`, `batch-approve`), and delete, write an audit entry with old/new value, user, and timestamp.

### Validation warnings
Returned inline with each draft row:
```json
{ "code": "GROSS_DELTA", "severity": "warn", "field": "gross_pay", "message": "..." }
```

Required codes:
- `HIGH_DEDUCTIONS` (warn) — total deductions unusually high vs previous approved
- `GROSS_DELTA` (warn) — gross changed beyond threshold vs previous approved
- `MISSING_FIELD` (error) — required payroll field missing
- `NO_BANK_ACCOUNT` (error) — bank account details missing

### Export scope
Bulk export endpoints take a status filter:
```text
GET /payroll/export/bulk-pdf?pay_period=YYYY-MM&status=draft|pending_review|approved|all
GET /payroll/export/bulk-csv?pay_period=YYYY-MM&status=draft|pending_review|approved|all
```
Non-approved exports must be clearly marked:
- PDF: `DRAFT — NOT FINALISED` watermark
- CSV: `DRAFT — NOT FINALISED` first-row banner

### Permissions
- Generate drafts, save, mark ready, revert, delete, batch approve: `executive`, `hr_manager`, `corporate_hr`
- Read drafts (read-only): `line_manager` scoped to own department
- Enforce server-side; frontend mirrors

### Payslip generation timing
Backend must confirm whether payslip generation in `batch-approve` is sync or async. If it can exceed a few seconds, it must be async with the status endpoint above.

---

## Frontend implementation

### API methods in `src/lib/api.ts`
Add or extend:
- `bulkGeneratePayroll(data)`
- `getBulkGenerateStatus(batchId)`
- `listPayrollDrafts(payPeriod)`
- `listDraftPeriods()`
- `saveDraftPayroll(id, payload)`
- `markPayrollReady(id)`
- `revertPayrollToDraft(id)`
- `batchApprovePayroll(payload)`
- `getBatchApproveStatus(batchId)`
- `getPayrollAudit(id)`
- Extend bulk export helpers to accept `status`

### Route
```text
/payroll/review/:payPeriod
```

### `BulkGenerateDialog`
Opened from Payroll page and from review empty state.

UI:
- Pay period picker (month + year only; future months disabled)
- Mode toggle: All Employees / Selected Employees
- Searchable multi-select grouped by department when Selected
- Confirm: `Generate Drafts`

Progress and failure handling:
- Disable confirm immediately on click
- Spinner: `Generating drafts for X employees…`
- If async, poll `/payroll/bulk-generate/status/:batch_id` until complete before redirect
- On failure, show error state with Retry

Duplicate handling:
- If `already_exists: true`, toast `Drafts already exist for this period. Redirecting to existing drafts.` and redirect to `/payroll/review/:payPeriod`

### `PayrollReview.tsx`
Header:
- Period label
- Period switcher: prev/next arrows + dropdown populated by `listDraftPeriods()`
- Period switcher fallback: if `listDraftPeriods()` returns empty, hide the switcher and show only the current period label. Keep the Generate Payroll button visible so HR can start from scratch.
- Summary totals: employees, drafts, pending review, gross total, net total
- Generate Payroll button (HR roles)
- Export All button with status scope

Empty state:
- `No drafts found for this period`
- Generate Payroll CTA opens `BulkGenerateDialog` for the current period

Filters:
- Name/ID search
- Department
- Status (draft, pending review, all)
- Warnings-only toggle

Table columns:
- Select · Employee · Employee ID · Department · Status badge (visually distinct for draft vs pending_review) · Gross · Total Deductions · Bonuses · Reliefs · Net Pay · Variance · Warnings · Actions

Actions:
- View/Edit
- `Mark as Ready` for `draft`
- `Revert to Draft` for `pending_review`
- `Delete` for `draft` and `pending_review` with confirm dialog: `Delete this draft? This cannot be undone.`

Mobile:
- Horizontal scroll on the table at `md` and above
- Collapsed card layout below `md` so 10+ columns do not break the page

### `PayrollEditDrawer`
Sections: Salary & Allowances · Bonuses & Commission · Deductions · Reliefs (rent relief + annual rent, NHF toggle) · Notes · Audit

Footer (state-aware):
- `draft`: Save Draft · Save & Close · Mark as Ready
- `pending_review`: Save Draft · Save & Close · Revert to Draft · Approve
- `approved`/`paid`: View Payslip · Download · close

Audit tab:
- System auto-populate entries labeled `Auto-populated from [YYYY-MM]`
- Manual edits show old value, new value, user, timestamp
- Status transitions appear in order

### Batch approval UI
- Approve Selected and Approve All Pending Review
- Confirmation dialog with count, gross total, net total, unresolved warnings
- Require `I acknowledge warnings` when warn-rows present
- Block approval on error-severity warnings
- Show progress modal during approval
- If backend returns async `batch_id`, poll `/payroll/batch-approve/status/:batch_id`

Async polling safeguards:
- Max poll duration: 60 seconds (or max ~20 retries at 3s interval)
- On timeout, stop polling and show:
  ```text
  Approval is taking longer than expected. Please refresh the page to check the status.
  ```
- Never leave the user on an infinite spinner

### Export All
- Status selector (Draft / Pending Review / Approved / All) before export
- Frontend passes `status` to backend export endpoints
- If backend does not yet support `status`, disable draft export and show a tooltip explaining backend support is required
- Draft/pending-review exports rely on backend watermark/banner

### Permissions
Reuse `canHrPayroll` for: generate, save, mark ready, revert, delete, approve.

Add `canViewPayrollDrafts(user)` to `src/lib/permissions.ts` alongside `canHrPayroll`:
- Returns true for `executive`, `hr_manager`, `corporate_hr`
- Returns true for `line_manager` (read-only, department-scoped)
- Read-only users do not see Generate, Mark Ready, Revert, Delete, Approve, or editable drawer fields

---

## Out of scope
- Approved-row payslip PDF/CSV layout (existing exports unchanged)
- Employee-side payslip view changes
- Notification/email fan-out on approval (backend hook)
- Rewriting `payrollCalc.ts` — drawer reuses it for live recompute
- Separate `/payroll/{id}/variance` endpoint (variance comes from `last_approved_snapshot`)

## Acceptance checklist
- [ ] Single doc `docs/bulk-payroll.md` exists; no `docs/bulk-payroll-frontend.md` references remain
- [ ] Generate Payroll supports All Employees and Selected Employees; future periods disabled
- [ ] Duplicate generation does not create duplicates; frontend shows warning and redirects
- [ ] Bulk generation shows loading/progress with retry on failure
- [ ] Review screen exists at `/payroll/review/:payPeriod`
- [ ] Empty state on review screen with Generate Payroll CTA
- [ ] Period switcher renders from `listDraftPeriods()` and gracefully hides when empty
- [ ] Required payroll columns and validation/variance indicators render in review table
- [ ] Mark Ready transitions a draft to pending_review
- [ ] Revert to Draft transitions a pending_review back to draft and is reachable from row action and drawer footer
- [ ] Draft and pending_review rows can be deleted with confirmation; approved cannot
- [ ] Save Draft persists without changing status
- [ ] Auto-populated values appear in audit with `changed_by: system`
- [ ] Manual edits and status changes are audited
- [ ] Batch approve only accepts `pending_review` records; mixing draft IDs returns 422 with the documented error
- [ ] Approval handles sync and async, with max-timeout fallback message instead of infinite spinner
- [ ] Approved records lock against edits and deletes
- [ ] Export All has status scope; draft exports are watermarked
- [ ] `canViewPayrollDrafts` added to `src/lib/permissions.ts` and used to gate the review screen
- [ ] Line managers see read-only review scoped to their department
- [ ] Review screen renders correctly on mobile (cards) and desktop (scrollable table)