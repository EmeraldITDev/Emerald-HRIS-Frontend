# Bulk Payroll Generation, Draft Review & Approval Workflow

Single source of truth for the bulk payroll feature — covers backend
endpoints, frontend routes/components, API shapes, permissions, mobile
behaviour, async/timeout handling, and the integration checklist.

## Flow

```text
Generate Drafts → Review & Edit → Mark Ready → Validate → Approve Batch → Payroll Finalised
```

## Status machine

```text
draft → pending_review → approved → paid
```

- `draft` — generated, still being worked on.
- `pending_review` — explicitly marked ready for approval; still editable.
- `approved` — locked; payslips generated and distributed; included in history.
- `paid` — post-disbursement.

---

## Backend

### Endpoint table

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/payroll/bulk-generate` | Generate drafts. Dedupes by `(pay_period, employee_id)`. Returns `already_exists`, `batch_id`, `created_count`, `skipped_count`, `drafts`, `warnings_by_employee`. May be async. |
| `GET` | `/payroll/bulk-generate/status/:batch_id` | Poll async bulk generation. Returns `status`, `processed`, `total`, `drafts`, `error`. |
| `GET` | `/payroll/drafts?pay_period=YYYY-MM` | List `draft` + `pending_review` records with full breakdown, `last_approved_snapshot`, and per-row warnings. |
| `GET` | `/payroll/draft-periods` | Periods that currently have `draft` or `pending_review` records (period switcher). |
| `PUT` | `/payroll/{id}` | Update editable fields. Reject when status is `approved`/`paid`. Writes audit. |
| `POST` | `/payroll/{id}/save-draft` | Idempotent save without status change. Writes audit. |
| `POST` | `/payroll/{id}/mark-ready` | `draft → pending_review`. Writes audit. |
| `POST` | `/payroll/{id}/revert-to-draft` | `pending_review → draft`. Writes audit. |
| `POST` | `/payroll/batch-approve` | Approve selected `pending_review` records. May be async. |
| `GET` | `/payroll/batch-approve/status/:batch_id` | Poll async approval. Returns `status`, `processed`, `total`, `error`. |
| `DELETE` | `/payroll/{id}` | Delete a draft. Only allowed when status is `draft` or `pending_review`. Writes audit. |
| `GET` | `/payroll/{id}/audit` | Ordered audit entries including system auto-populate entries. |

No separate `/payroll/{id}/variance` endpoint — variance is derived from
`last_approved_snapshot` returned inline on `GET /payroll/drafts`.

### `POST /payroll/bulk-generate`

Request:
```json
{ "pay_period": "YYYY-MM", "employee_ids": [1, 2, 3] }
```

Rules:
- Omit `employee_ids` to generate for all active employees.
- Reject future pay periods.
- HR roles only: `executive`, `hr_manager`, `corporate_hr`.
- **Dedupe:** if any `(pay_period, employee_id)` already has a `draft` or
  `pending_review` record, return those existing records and do not create
  duplicates. Response must include `already_exists: true` when any record
  was reused.
- Auto-populate recurring values from each employee's most recent
  `approved` payroll (see Auto-populate rules).

Response:
```json
{
  "success": true,
  "already_exists": true,
  "batch_id": "optional-batch-id",
  "created_count": 8,
  "skipped_count": 2,
  "drafts": [],
  "warnings_by_employee": {}
}
```

### `POST /payroll/batch-approve`

Request:
```json
{ "ids": [1, 2, 3], "acknowledge_warnings": true }
```

Rules:
- Approves only `pending_review` records.
- **Reject draft IDs:** if any submitted ID is in `draft` status, reject
  the entire request with HTTP 422 and the error message:
  ```text
  All records must be marked as ready before approval.
  Move draft records to pending_review first.
  ```
- Block approval on any `error`-severity validation issue.
- `warn`-severity issues require `acknowledge_warnings: true`.
- On approval: lock records, generate payslips, distribute payslips,
  update payroll history, write audit entries.
- Backend confirms whether payslip generation is sync or async. If it can
  exceed a few seconds, must return `{ batch_id, status: "running" }` and
  expose the status endpoint.

### `DELETE /payroll/{id}`

- Permitted only when status ∈ {`draft`, `pending_review`}.
- Reject for `approved`/`paid` with a clear error.
- Writes an audit entry (or uses the existing soft-delete with reason
  flow).

### Auto-populate rules

On bulk generation, copy from each employee's most recent `approved`
payroll:
- Rent relief settings + annual rent
- Fixed personal deductions
- Recurring allowances and benefits
- Recurring bonus and commission
- Any other recurring saved payroll values

Salary components come from the current employee salary record. If no
prior approved payroll exists, fall back to employee defaults only.

### Audit requirements

Table `payroll_audit (id, payroll_id, field, old_value, new_value, changed_by, changed_at, note)`.

- **Auto-populate:** on bulk generation, write one audit entry per
  auto-populated field with `changed_by: "system"` and
  `note: "auto-populated from [YYYY-MM]"`.
- **Manual edits / save-draft:** old value, new value, user, timestamp.
- **Status transitions:** `mark-ready`, `revert-to-draft`,
  `batch-approve`, and `delete` all write audit entries.

### Validation warnings

Returned inline with each draft row:
```json
{
  "code": "GROSS_DELTA",
  "severity": "warn",
  "field": "gross_pay",
  "message": "Gross changed by more than 25% vs the previous approved payroll."
}
```

Required codes:
- `HIGH_DEDUCTIONS` (warn) — total deductions > 1.5× previous approved.
- `GROSS_DELTA` (warn) — gross changed beyond threshold vs previous approved.
- `MISSING_FIELD` (error) — required payroll field missing.
- `NO_BANK_ACCOUNT` (error) — bank account details missing.

`error` blocks approval; `warn` requires `acknowledge_warnings: true`.

### Export scope

Bulk export endpoints take a status filter:
```text
GET /payroll/export/bulk-pdf?pay_period=YYYY-MM&status=draft|pending_review|approved|all
GET /payroll/export/bulk-csv?pay_period=YYYY-MM&status=draft|pending_review|approved|all
```

Non-approved exports must be clearly marked:
- PDF: `DRAFT — NOT FINALISED` watermark.
- CSV: `DRAFT — NOT FINALISED` first-row banner.

### Permissions (server-enforced)

- Bulk generate, save-draft, mark-ready, revert-to-draft, delete,
  batch-approve: `executive`, `hr_manager`, `corporate_hr`.
- Read drafts (read-only): `line_manager` scoped to their own department.

### Payslip generation timing

Backend must confirm whether payslip generation in `batch-approve` is
sync or async. If multi-second, it must be async with the status endpoint
above so the frontend can render progress and avoid an infinite spinner.

---

## Frontend

### Route

```text
/payroll/review/:payPeriod
```

### API client methods (`src/lib/api.ts`)

- `bulkGeneratePayroll(data)` — returns `already_exists`, `batch_id`,
  `created_count`, `skipped_count`, `drafts`, `warnings_by_employee`.
- `getBulkGenerateStatus(batchId)`
- `listPayrollDrafts(payPeriod)`
- `listDraftPeriods()`
- `saveDraftPayroll(id, payload)`
- `markPayrollReady(id)`
- `revertPayrollToDraft(id)`
- `batchApprovePayroll(payload)`
- `getBatchApproveStatus(batchId)`
- `getPayrollAudit(id)`
- `exportBulkPayrollPdf(payPeriod, status?)`,
  `exportBulkPayrollCsv(payPeriod, status?)` — extended with `status`.

### `BulkGenerateDialog`

- Pay period picker (month + year; future months disabled).
- Mode toggle: All Active Employees / Selected Employees.
- Searchable multi-select grouped by department when Selected.
- Confirm button `Generate Drafts`.

Progress / failure:
- Disable confirm immediately; show spinner
  `Generating drafts for X employees…`.
- If async, poll `/payroll/bulk-generate/status/:batch_id` before
  redirect.
- On failure, show error state with **Retry**.

Duplicate handling:
- If `already_exists: true`, show toast
  `Drafts already exist for this period. Redirecting to existing drafts.`
  and redirect to `/payroll/review/:payPeriod`.

### `PayrollReview` (`src/pages/PayrollReview.tsx`)

Header:
- Period label.
- Period switcher: prev/next chevrons + dropdown populated from
  `listDraftPeriods()`. If `listDraftPeriods()` returns empty, hide the
  switcher and show only the current period label; keep the
  Generate Payroll button visible so HR can start from scratch.
- Summary chips: employees, drafts, pending review, total gross,
  total net.
- Buttons: **Generate Payroll** (HR roles), **Export All** with explicit
  status scope.

Empty state:
- `No drafts found for this period` + Generate Payroll CTA pre-set to the
  current `:payPeriod`.

Filters: name/ID search, department, status (draft / pending review / all),
warnings-only toggle.

Table columns: select · Employee · Employee ID · Department · Status
(distinct badges for draft vs pending_review) · Gross · Total Deductions ·
Bonuses · Reliefs · Net Pay · Variance · Warnings · Actions.

Actions: View/Edit · Mark as Ready (draft) · Revert to Draft
(pending_review) · Delete (draft + pending_review). Delete confirm:
`Delete this draft? This cannot be undone.`

Mobile: horizontal scroll above `md`; stacked card layout below `md` so
10+ columns do not break the page.

### `PayrollEditDrawer`

Sections: Salary & Allowances · Bonuses & Commission · Deductions ·
Reliefs (rent relief + annual rent, NHF toggle) · Notes · Audit.

Footer (state-aware):
- `draft`: Save Draft · Save & Close · **Mark as Ready**
- `pending_review`: Save Draft · Save & Close · **Revert to Draft** · **Approve**
- `approved`/`paid`: View Payslip · Download · Close

Audit tab:
- System auto-populate entries labelled `Auto-populated from [YYYY-MM]`.
- Manual edits show old value, new value, user, timestamp.
- Status transitions in order.

### Batch approval UI

- Approve Selected and Approve All Pending Review.
- Confirmation dialog summarising count, gross total, net total, and
  unresolved warnings; requires `I acknowledge warnings` when warn-rows
  are present.
- Block approval on `error` severity warnings.
- Progress modal during approval.
- If backend returns async `batch_id`, poll
  `/payroll/batch-approve/status/:batch_id`.

Async polling safeguards:
- Max poll duration: 60 seconds (≈20 retries at 3s).
- On timeout, stop polling and show
  `Approval is taking longer than expected. Please refresh the page to check the status.`
- Never leave the user on an infinite spinner.

### Export All UI

- Status selector (Draft / Pending Review / Approved / All).
- Passes `status` to backend export endpoints.
- If backend has not shipped `status` support yet, disable draft export
  and show a tooltip explaining backend support is required.
- Draft exports rely on backend watermark/banner.

### Permissions (`src/lib/permissions.ts`)

Reuse `canHrPayroll` for write actions (generate, save, mark ready,
revert, delete, approve).

Add `canViewPayrollDrafts(user)`:
- Returns true for `executive`, `hr_manager`, `corporate_hr`.
- Returns true for `line_manager` (read-only, department-scoped).
- Read-only users do not see Generate / Mark Ready / Revert / Delete /
  Approve actions or editable drawer fields.

---

## Out of scope

- Approved-row payslip PDF/CSV layout (existing exports unchanged).
- Employee-side payslip view changes.
- Notification/email fan-out on approval (backend hook).
- Rewriting `payrollCalc.ts` — drawer reuses it for live recompute.
- Separate `/payroll/{id}/variance` endpoint (uses
  `last_approved_snapshot`).

## Acceptance checklist

- [ ] Single doc `docs/bulk-payroll.md` exists; no references to
      `docs/bulk-payroll-frontend.md` remain.
- [ ] Generate Payroll supports All Employees and Selected Employees;
      future periods disabled.
- [ ] Duplicate generation does not create duplicates; frontend shows
      warning and redirects.
- [ ] Bulk generation shows loading/progress with retry on failure.
- [ ] Review screen exists at `/payroll/review/:payPeriod`.
- [ ] Empty state on review screen with Generate Payroll CTA.
- [ ] Period switcher renders from `listDraftPeriods()` and gracefully
      hides when empty.
- [ ] Required payroll columns and validation/variance indicators render
      in review table.
- [ ] Mark Ready transitions a draft to pending_review.
- [ ] Revert to Draft is reachable from row action and drawer footer.
- [ ] Draft and pending_review rows can be deleted with confirmation;
      approved cannot.
- [ ] Save Draft persists without changing status.
- [ ] Auto-populated values appear in audit with `changed_by: system`.
- [ ] Manual edits and status changes are audited.
- [ ] Batch approve only accepts `pending_review`; mixing draft IDs
      returns 422 with the documented error.
- [ ] Approval handles sync and async, with max-timeout fallback message
      instead of infinite spinner.
- [ ] Approved records lock against edits and deletes.
- [ ] Export All has status scope; draft exports are watermarked.
- [ ] `canViewPayrollDrafts` added to `src/lib/permissions.ts` and used
      to gate the review screen.
- [ ] Line managers see read-only review scoped to their department.
- [ ] Review screen renders correctly on mobile (cards) and desktop
      (scrollable table).