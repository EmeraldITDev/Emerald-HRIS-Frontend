# Backend Handoff — HRIS Production Readiness

Date: 2026-05-25
Scope: Companion document to the frontend changes shipped in this PR. Every section below maps directly to one of the 12 items in the product brief. The frontend is now production-ready; the backend tasks listed here must ship for the full feature set to work end-to-end.

Conventions:
- Endpoints prefixed with the existing API base `https://hris-backend-to3i.onrender.com`.
- "FE" = frontend changes already shipped. "BE" = backend work required.
- All money values in NGN; calculations follow the Nigerian Finance Act 2023 / 2026 PAYE schedule.

---

## 1. Attendance / Clock-In System

**FE shipped**
- Clock-in / clock-out / lunch break wired to live API in `src/pages/Attendance.tsx`.
- Admin bypass for `hr_manager` and `corporate_hr`:
  - Clock-in allowed after 09:00 (regular staff blocked).
  - Lunch break allowed outside 12:00–14:00.
  - Clock-out allowed before 17:00.
- Bypass actions add a `notes` field flagging the bypass; reason captured for non-bypass exceptions.
- **Early clock-out approval flow**: regular staff attempting to clock out before 17:00 no longer clock out directly. They must submit a reason via the "Request Early Clock-Out Approval" dialog. The request is queued (currently to `localStorage` key `early_clockout_requests_v1` as a UX bridge) and the employee stays clocked in until an HR Manager / Corporate HR approves it. HR Manager and Corporate HR still bypass entirely.

**Root cause of previous failure**
- Frontend short-circuit (`toast(...); return`) bypassed the API call, leaving clock-in non-functional even when the backend was healthy.
- Server-side validation rejected bypass roles because the guard tested `role === 'general_employee'` rather than checking permission.

**BE required**
- `/attendance/clock-in`, `/attendance/clock-out`, `/attendance/lunch-start`, `/attendance/lunch-end` must:
  1. Accept `notes` and `approval_reason` fields.
  2. Accept and persist `bypass_by_role` when caller is `hr_manager` or `corporate_hr`.
  3. Skip time-window enforcement when `bypass_by_role` is present and the caller has the right role.
- **Early clock-out approval endpoints** (new):
  - `POST /attendance/early-clockout-request` — body: `{ employee_id, reason, requested_at }`. Creates a pending row in `early_clockout_requests`. Notifies HR Manager + Corporate HR.
  - `GET /attendance/early-clockout-requests?status=pending` — list for approvers.
  - `POST /attendance/early-clockout-requests/{id}/approve` — body: `{ approver_notes? }`. On approval the server performs the actual `clock_out` write at the originally requested timestamp (or `now()` per policy), marks the request `approved`, writes `attendance_audit_log`, and notifies the employee.
  - `POST /attendance/early-clockout-requests/{id}/reject` — body: `{ approver_notes }`. Marks `rejected`, notifies the employee, employee remains clocked in.
  - Schema: `early_clockout_requests (id, employee_id, reason, requested_at, status ENUM('pending','approved','rejected'), approver_user_id NULL, approver_notes NULL, decided_at NULL, created_at)`.
  - RBAC: only `hr_manager`, `corporate_hr`, `executive` may approve/reject. Self-approval guard: an `hr_manager` or `corporate_hr` who submitted the request cannot approve their own (they shouldn't hit this flow at all since they bypass, but enforce server-side).
  - Once the approval endpoints ship, remove the `localStorage` bridge and POST the request directly via the API.
- Audit log table (new): `attendance_audit_log`
  - Columns: `id`, `actor_user_id`, `target_employee_id`, `action`, `bypass`, `reason`, `original_timestamp`, `approved_timestamp`, `created_at`.
- Server-side timezone: store all timestamps in UTC; compare windows in `Africa/Lagos`.
- Middleware audit: a token expiring during a clock-in returns 401 — refresh logic should reissue and retry once.
- RBAC: `hr_manager`, `corporate_hr` already in roles enum, just expand permission set with `attendance.bypass`.

## 2. Remove Dummy Users

**FE shipped**
- `dummyUsers` map and `isDummyAccount` flag fully removed from `AuthContext`.
- All "TEST ACCOUNT" banners and badges removed from `Layout`.
- `Announcements` no longer ships with a hardcoded "Company Holiday Schedule" sample; list starts empty.

**BE required**
- Audit DB seed scripts and remove any seeded employees that look like test fixtures (e.g. "Kunle" in performance reviews).
- Performance Review API (`/performance/...`): guarantee responses only contain real `employees.id` rows; reject any with `email LIKE '%@example.com'` during the response build.
- Training, Payroll, Leave, Benefits, Announcements endpoints: same audit pass.

## 3. Training Module

**FE shipped**
- `cost: number` added to `newTraining` state in `src/pages/Training.tsx`.
- Cost input rendered with ₦ prefix; included in the `assignTraining` payload via `...newTraining`.
- "Select All" button on the employee picker.
- Line managers already retain access via `RoleBasedComponent allowedRoles={['hr_manager','corporate_hr','executive','line_manager']}`.
- Training cost surfaced from `a.training?.cost` instead of the previous hardcoded 0.

**Root cause of previous failure**
- Payload mismatch: the form never sent `cost`, but the backend `trainings` table had a `cost` NOT NULL column → 422 + 0-value display.

**BE required**
- `POST /training/assign` and `POST /training`: accept `cost` (decimal). Persist on `trainings.cost`.
- `GET /training-assignments`: include `training.cost` in the joined payload.
- Reports / dashboard: `Total Training Investment = SUM(trainings.cost * COUNT(assigned_employees))` (or per business rule).
- Permissions: `line_manager` already allowed to assign within their department; extend to "all staff" by removing the dept filter in the controller's eligible-employees scope when role is line_manager.

## 4. Benefits Module

**FE shipped**
- Frontend now validates `end_date > start_date` before POST; native `min` constraint on the date picker.
- New "Recurring Benefit" checkbox + monthly/yearly select in the assignment dialog.
- Payload now includes `is_recurring: boolean` and `recurrence: 'none' | 'monthly' | 'yearly'`.
- Select All for employee picker.

**Root cause of previous failure**
- 422 was returned because the frontend allowed `end_date === start_date`; backend (rightly) used `after:start_date` rule.

**BE required**
- `POST /benefits/assign`: schema accept `is_recurring`, `recurrence`. Persist to `employee_benefits`.
- New tables:
  - `benefit_recurrence_schedule (id, benefit_id, recurrence, next_run_at, status)`
  - `benefit_recurrence_history (id, benefit_id, generated_at, period_label)`
- Cron / scheduled task: daily job at 00:15 Africa/Lagos that:
  1. Selects schedules with `next_run_at <= NOW()`.
  2. Creates a new `employee_benefits` row for the next period.
  3. Updates balances and `next_run_at`.
  4. Emits notification (see §11 notification architecture).
- Validation: align with FE — `end_date > start_date`.

## 5. Leave Approval History

**FE shipped**
- `LeaveApprovals.tsx` now renders a "Leave Request History" panel below the pending queue with:
  - Status filter (All / Pending / Approved / Rejected).
  - Free-text search on employee + reason.
  - Client-side pagination (10/page).
  - Approved-by column populated from `hr_approver_name` / `manager_approver_name` / `approved_by`.

**BE required**
- `GET /leave` must return all requests visible to the caller, including approved/rejected, with: `workflow_status`, `hr_approver_name`, `manager_approver_name`, `decided_at`, `notes`.
- Optional: server-side pagination params (`page`, `per_page`, `status`) for scale — FE will degrade gracefully if absent.

## 6. Employee Form Label Update

**FE shipped**
- Add Employee dialog: "Gross Salary *" → "Gross Salary (Annual) *" (full-time + contract paths).
- Edit Employee dialog: "Gross Salary (Monthly)" → "Gross Salary (Annual)".
- Helper text updated everywhere to clarify monthly = annual ÷ 12.

**BE required**
- No schema change. `employees.gross_salary` is already stored as an annual figure (per `getEmployeePayrollPackage`).
- Add an `is_annual_gross` boolean comment on the column to document semantics for future devs.
- Backward-compatibility: existing records do not need migration — the value was already annual.

## 7. Payroll Generator

**FE shipped**
- Label flipped to "Monthly Basic Salary *" (and "Contract Amount (Monthly) *").
- Input now treated as monthly; multiplied by 12 internally in all 4 calc sites (`calculatePayroll`, CSV export, payslip PDF, `generatePayroll`).
- Autofill on employee select uses `monthlyBasic` from `getEmployeePayrollPackage`.
- CSV export gains a "Monthly Basic Salary" column alongside Annual.

**BE required**
- `POST /payroll/generate`: `basic_salary` continues to be monthly (already so). Verify it stores monthly value.
- Reports: ensure monthly basic = `gross_salary / 12 * 0.4` derivation is consistent.

## 8. NHF Contribution

**FE shipped**
- Payroll generation dialog now has an "Apply NHF Contribution (2.5% of Basic)" checkbox (default on).
- When unchecked, NHF is zeroed in the calculation preview (CRA, taxable income, PAYE recomputed accordingly).

**BE required**
- Add `include_nhf: boolean` to `POST /payroll/generate` payload.
- When `include_nhf = false`, persist `nhf = 0` and recompute downstream fields server-side.
- Reports: NHF column conditional on per-record flag, not a global toggle.

## 9. PAYE Tax (Nigeria 2026)

**FE shipped**
- `src/lib/payrollCalc.ts` already uses the progressive 7/11/15/19/21/24% bands from the Finance Act.
- `Payroll.tsx` uses the published cumulative checkpoint formula (`560000 + (taxable - 3200000) * 0.24` ...).
- Rent relief (see §10) reduces taxable income before band application — exempts low-income earners correctly.

**BE required**
- Confirm backend PAYE table uses the same bands. If the API persists `paye_tax`, it must:
  1. Compute `grossForCRA = annualGross - pension - nhf`.
  2. `CRA = grossForCRA * 0.20 + MAX(grossForCRA * 0.01, 200000)`.
  3. `taxableIncome = annualGross - CRA - pension - nhf - rentRelief`.
  4. Apply bands.
- For employees earning <= ₦300k taxable, ensure flat 7% (currently correct in FE).
- If 2026 bands are updated mid-year by FIRS, hot-swap via a `paye_bands` lookup table (id, year_effective, lower_bound, rate).

## 10. Rent Relief Plan

**FE shipped**
- Payroll dialog gains an "Employee on Rent Relief Plan" checkbox + annual rent input.
- Relief = `min(annual_rent * 0.2, 500000)` per Finance Act 2023.
- Applied to `taxableIncome` in `calculatePayroll`.

**BE required**
- `POST /payroll/generate`: accept `rent_relief_enabled: boolean` and `annual_rent: number`.
- Persist `rent_relief_amount` on the payroll record so payslips render the line item.
- Audit: log every payroll that claims rent relief; FIRS requires evidence (tenancy agreement) — add `rent_relief_evidence_doc_id` later.

## 11. Announcements

**FE shipped**
- Removed hardcoded sample announcement; list now strictly DB-driven.
- Create flow lets the sender choose **Entire Company**, **Specific Department(s)**, or **Individual Staff**.
- "Select All" button on both department and individual pickers.
- Comment thread per announcement on the list view.
- Comments persisted to `localStorage` (`announcement_comments_v1`) as a UX bridge until the backend ships endpoints.
- Payload to `POST /announcements` now includes `target_department_ids` and `target_employee_ids` arrays alongside `target_audience`.

**BE required**
- Schema:
  - `announcement_targets (id, announcement_id, target_type ENUM('all','department','individual'), target_ref_id NULL, target_ref_type)`
  - `announcement_comments (id, announcement_id, author_user_id, content, created_at, updated_at, parent_comment_id NULL)`
  - `announcement_reads (announcement_id, user_id, read_at)`
- Endpoints:
  - `POST /announcements` — accept arrays above.
  - `GET /announcements` — filter by caller (only show announcements where they are in the target set).
  - `GET /announcements/{id}/comments`
  - `POST /announcements/{id}/comments` `{ content, parent_comment_id? }`
  - `POST /announcements/{id}/read`
- Notification architecture (also covers §4 recurring benefit + §1 attendance):
  - **Phase 1** (minimum): write to in-app `notifications` table on create + comment; existing `NotificationBell` polls it.
  - **Phase 2**: queue worker (Laravel Horizon / BullMQ) that fans out to email (SES / Resend).
  - **Phase 3**: websockets via Pusher / Soketi for live delivery (optional).

## 12. System-wide Select All

Already shipped on Training and Benefits employee pickers and Announcement targeting. **Apply the same pattern wherever an employee multi-select exists**:

- Performance Review batch assignment
- Leave routing for HR (if multi-select introduced)
- Reports export filter

Pattern (reusable):
```tsx
<Button size="sm" variant="outline" onClick={() => {
  const all = employees.map(e => e.id).filter(Boolean)
  setSelected(selected.length === all.length ? [] : all)
}}>
  {selected.length === all.length ? 'Clear All' : 'Select All'}
</Button>
```

---

## Cross-cutting concerns

### Database migrations summary
| Module | Migration |
| --- | --- |
| Attendance | `attendance_audit_log` table |
| Benefits   | `benefit_recurrence_schedule`, `benefit_recurrence_history`, +columns on `employee_benefits` |
| Payroll    | +`include_nhf`, `rent_relief_enabled`, `annual_rent`, `rent_relief_amount` on payroll records; `paye_bands` lookup |
| Training   | confirm `cost` column nullable→default 0 |
| Announcements | `announcement_targets`, `announcement_comments`, `announcement_reads` |

### Cron / scheduler
- Daily 00:15 WAT: benefits recurrence runner.
- Daily 00:30 WAT: leave balance reconciliation.
- Monthly 1st 02:00 WAT: payroll period rollover, archive prior month.

### Queue workers / background jobs
- `EmailNotificationJob` (benefits recurrence, leave approval, payroll generated, announcement published).
- `AuditLogJob` (decouple audit writes from request path).

### RBAC matrix update
| Permission | hr_manager | corporate_hr | executive | line_manager | finance | general_employee |
| --- | --- | --- | --- | --- | --- | --- |
| attendance.bypass | ✓ | ✓ | – | – | – | – |
| leave.approve.hr | ✓ | ✓ | ✓ | – | – | – |
| leave.approve.manager | – | – | ✓ | ✓ | – | – |
| benefits.assign | ✓ | – | ✓ | – | – | – |
| training.assign.all | ✓ | ✓ | ✓ | ✓ | – | – |
| payroll.generate | ✓ | – | ✓ | – | – | – |
| announcements.create | ✓ | – | ✓ | – | – | – |
| announcements.comment | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

### Security
- Roles already enforced via `has_role()` security-definer function (per project memory). Add `attendance.bypass` permission row.
- Audit log writes must include actor `user_id`, IP, user-agent.
- File uploads (training attachments, leave docs) continue via the 3-step presigned S3 flow.
- Validate that `corporate_hr` cannot approve their own submitted leave request (self-approval guard).

### Performance
- Paginate `/leave`, `/payroll`, `/announcements`, `/training-assignments` (server-side cursor).
- Index `attendance_audit_log(target_employee_id, created_at)`.
- Cache `paye_bands` and `DEPARTMENTS` lookup.

### QA checklist
1. Clock in at 09:30 as `general_employee` → 403. As `hr_manager` → 200, audit row written.
2. Submit benefit with `end_date = start_date` → FE blocks before POST.
3. Toggle recurring benefit monthly → after cron run a new `employee_benefits` row exists for next month.
4. Generate payroll with NHF off + rent relief on (annual rent 1.2M) → taxable income drops by `min(240000, 500000) = 240000`.
5. Create announcement targeted to a single department → only those employees see it in their list.
6. Post a comment as employee A → appears for employee B on refresh (after backend ships; currently localStorage only).
7. Approve leave as HR Manager on a request submitted by `corporate_hr` → 200 (no `INSUFFICIENT_PERMISSIONS`).
8. Search history "Annual leave" + filter Approved → matching rows only; pagination works.
9. CSV export shows both "Monthly Basic Salary" and "Annual Basic Salary".
10. Add employee with `Gross Salary (Annual) = 2,400,000` → payroll auto-fills monthly basic ≈ 80,000.

### Edge cases
- Employee with zero `gross_salary`: payroll generation already aborts with a toast — keep server-side guard.
- Recurring benefit whose employee was terminated: cron must skip and emit a warning.
- Announcement targeted to a department that was renamed: store IDs, not names, on `announcement_targets`.
- PAYE bands changing mid-year: `effective_from`/`effective_to` on `paye_bands` rows.

### Deployment notes
- Frontend: `bun run build` ready; deploy via existing pipeline.
- Backend migrations: run in order (1) audit logs, (2) recurrence, (3) payroll columns, (4) announcements.
- Roll out the announcement comment endpoint **before** removing the localStorage bridge in a future FE release.

---

## Appendix — formulas

```
monthlyBasic        = annualGross / 12 * 0.40
annualHousing       = annualGross * 0.20
annualTransport     = annualGross * 0.09
annualOther         = annualGross * 0.31
pensionEmployee     = (basic + housing + transport) * 0.08
pensionEmployer     = annualGross * 0.10
nhf                 = include_nhf ? basic * 0.025 : 0
rentRelief          = rent_relief_enabled ? min(annual_rent * 0.20, 500_000) : 0
grossForCRA         = annualGross - pensionEmployee - nhf
cra                 = grossForCRA * 0.20 + MAX(grossForCRA * 0.01, 200_000)
taxableIncome       = annualGross - cra - pensionEmployee - nhf - rentRelief

PAYE bands (2026):
  first 300k @ 7%
  next  300k @ 11%
  next  500k @ 15%
  next  500k @ 19%
  next 1.6M  @ 21%
  above 3.2M @ 24%
```