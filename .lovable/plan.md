# Investigation & Fix Plan (v2): Employees + Payroll

Revised per user feedback. Adds lifecycle verification, network-level evidence, a permission audit-before-change rule, a backend verification report, an all-entry-points sweep, export content validation, and an explicit "do not refactor during bug-fix" guard.

---

## Ground rules (apply to every section)

1. **Lifecycle verification — for every problematic field, walk all six stages and record where it dies:**
   - (a) value exists in `GET /employees-full/{id}` response
   - (b) value is mapped into edit-form state
   - (c) value is included in `PUT /employees-full/{id}` payload
   - (d) value is present in the update response
   - (e) value is still present in a fresh `GET` after the update
   - (f) UI rehydrates the value on refresh
2. **Network-level evidence required.** Reading code is not enough. For each issue, capture in DevTools Network tab and attach to the report:
   - Employee GET response (before edit)
   - Employee UPDATE request payload
   - Employee UPDATE response
   - Employee GET response after refresh
   Mark which stage each missing field disappears at.
3. **No speculative permission widening.** Differences between roles must be classified as intentional / accidental / legacy before any change.
4. **No mixing refactors with bug fixes.** Consolidation work is deferred until §1–§4 are verified green.

---

## 1. Edit Employee data not persisting

### Confirmed frontend bugs (Employees.tsx)

- `handleEditEmployee` (line ~1015) hard-codes `""` for many fields that exist in the API response, immediately blanking local state before the user touches anything:
  - `middleName`, all emergency-contact & next-of-kin fields, `basic_salary`, `other_allowance`, `bank_name`, `account_number`, `nuban`, `sort_code`, `contract_amount`, `payment_frequency`, `contract_duration`, `contract_terms`.
- `handleUpdateEmployee` (line ~1112) **omits** fields the user can edit:
  - `dob`, `middle_name`, all emergency / next-of-kin fields, `net_salary`, all contract fields.
- The edit financial tab binds `editEmployee.net_salary` (line ~3682) but the value is never loaded in and never saved out.
- Mixed camelCase/snake_case keys across mapping vs rendering (`bank_name || bankName` fallbacks) hide silent drops.
- `gross_salary` annual-vs-monthly semantics differ between Add and Edit (see §2).

### Two edit dialogs exist
- `src/pages/Employees.tsx` inline dialog (used from the list).
- `src/components/EmployeeEditDialog.tsx` (used from `src/pages/EmployeeProfile.tsx`).
They diverge in fields, payload shape, and validation.

### Action — per-field lifecycle audit
Run the six-stage check above for each of these fields, recording the failing stage with a network screenshot:

`dob`, `middle_name`, emergency-contact set, NoK set, `basic_salary`, `other_allowance`, `net_salary`, `bank_name`, `account_number`, `nuban`, `sort_code`, contract block, government IDs (re-verify after prior fix).

### Frontend fixes (only for fields that fail at stage (b) or (c))
1. In `handleEditEmployee`, populate every state key from the API response (no hard-coded `""`).
2. In `handleUpdateEmployee`, include every field the UI exposes.
3. Normalize on snake_case throughout the edit form; remove `field || altField` fallbacks once mapping is correct.
4. Align `gross_salary` semantics with Add (see §2).

Fields that fail at (a), (d), or (e) are backend issues and go into the §4 Backend Verification Report — do not attempt to "fix" them by patching more frontend code.

---

## 2. Add vs Edit financial parity

Differences confirmed by code read (Employees.tsx ~2155 vs ~3660):

| Aspect | Add | Edit |
|---|---|---|
| Branching by `employment_type` | yes (Full-time / Contract) | no |
| `gross_salary` | annual input | annual label, but rehydrated from API value that may be monthly |
| basic / housing / transport / other | auto-calc 40/20/9/31, read-only | free inputs |
| `net_salary` | absent | present, never saved |
| Bank name | nationality-driven `Select` | free-text |
| Auto-calc effect | yes (line 488) | no |
| Validation | required for Full-time | none |

### Frontend fixes
1. Extract a `useSalaryBreakdown` hook from the Add `useEffect` and apply to both forms.
2. Gate Edit financial layout by `employment_type` exactly like Add.
3. Make derived components read-only in Edit when Full-time.
4. Replace free-text bank with the nationality-driven `Select`.
5. Decide net_salary: wire end-to-end or remove from the UI.
6. Share validation rules (move to a single util/schema).

---

## 3. HR Manager vs Corporate HR — audit FIRST, change SECOND

**Do not set `corporate_hr: ['*']` blindly.** Risk: silently exposing Settings, Security, System Tools, IT admin features.

### Step A — Document every difference, classified
Produce a table with these columns: `Surface (page/component) | Element | HR Manager sees? | Corporate HR sees? | Source of the difference | Classification (intentional / accidental / legacy) | Recommended action`.

Sources to inspect:
- `src/contexts/AuthContext.tsx` `rolePermissions` map (root cause for most differences).
- `src/components/AppSidebar.tsx` nav role arrays.
- `src/components/ProtectedRoute.tsx` and any route-level guards in `App.tsx`.
- Every page-level `=== 'hr_manager'` or `['hr_manager']` check (sweep all of `src/pages/*` and `src/components/*`).
- `src/lib/permissions.ts` helpers (`canHrPayroll`, `canHrApproveLeave`).
- API authorization: log 401/403 responses observed when logged in as Corporate HR vs HR Manager to find backend-imposed differences not visible from FE code.

### Known divergences to seed the table
- `AuthContext` `corporate_hr` permissions are a small allowlist; `hr_manager` is `['*']`.
- `Dashboard.tsx` lines 1122, 1389, 1452, 1502, 1633 group `corporate_hr` with general-employee for hiding HR stats.
- `Payroll.tsx` line 855 explicitly excludes `corporate_hr` from one branch.
- `permissions.ts:canHrPayroll / canHrApproveLeave` already include `corporate_hr` — these are aligned.
- Settings / Security / IT admin items in `AppSidebar.tsx` `systemItems` gate on `admin.troubleshoot` and `system.controls` — neither currently granted to either role; this is intentional and must remain so.

### Step B — Confirm intent with the user
Before changing anything, present the classified table and confirm which "differences" are real product decisions (e.g. Settings/Security stays restricted) vs accidental.

### Step C — Targeted alignment (no `*` shortcut)
- Add only the specific permissions Corporate HR needs to mirror HR Manager's day-to-day surfaces (`payroll.manage`, `benefits.manage`, `training.manage`, `performance.manage`, `announcements.manage`, `reports.export`, `analytics.view`, `csv.export`, `csv.import`).
- Introduce `isHrEquivalent(user)` in `permissions.ts`; replace literal role checks with it across the sweep.
- Fix the specific Dashboard role-lists and the Payroll line-855 exclusion.
- Re-run the audit table; everything in the "accidental" column should now show identical visibility.

---

## 4. Backend Verification Report (required deliverable)

For every field that **looks correct on the frontend** but still fails persistence, add an entry:

```
Field:               <name>
Surface:             Add | Edit | Both
Endpoint:            PUT /employees-full/{id}
Request payload:     { ..., field: <value> }          ← actual captured body
Update response:     { ..., field: <missing|null> }   ← actual captured body
Fresh GET response:  { ..., field: <missing|null> }   ← actual captured body
Evidence of BE gap:  payload sent correctly, value absent from update + GET responses
BE action required:  add column / add to $fillable / add to validate() / add to API resource serializer
```

Produce the same kind of entry for the Payroll bulk-export endpoints if §6 finds discrepancies.

---

## 5. All employee-edit entry points

Sweep and compare:
- Employee List → Edit dialog (`src/pages/Employees.tsx` ~3225)
- Employee Profile → Edit (`src/components/EmployeeEditDialog.tsx` via `src/pages/EmployeeProfile.tsx`)
- Any quick-edit / inline-edit flows (search for `updateEmployee(` call sites across `src/`)
- CSV import update path (`src/utils/csvImport.ts`) — this also writes employee fields and must respect the same model.
- Any admin override flows (e.g. role assignment, password reset side-effects).

For each, record: state shape, validation rules, payload structure, endpoint hit. Fix divergences in place — do **not** unify them yet (§7).

---

## 6. Payroll Bulk Export — generation **and content** validation

### Generation (confirmed)
- Trigger: `src/pages/Payroll.tsx` line 1586 dropdown item, gated by `canHrPayroll(user) || user?.role === 'corporate_hr'`.
- CSV: `apiService.exportPayrollBulkCsv(pay_period)` → `GET /payroll/export/bulk-csv?pay_period=...` → Blob → download.
- PDF: `apiService.exportPayrollBulkPdf(pay_period)` → `GET /payroll/export/bulk-pdf?pay_period=...` → Blob → download.
- Frontend has a CSV-only fallback (line 1596) that builds from currently rendered rows when the server returns non-OK. PDF has no fallback.
- **Conclusion: generation is backend-driven.** Frontend orchestrates download only.

### Content validation (to perform)
For one HR-Manager session and one Corporate-HR session, in the same `pay_period`:
1. Download bulk CSV + bulk PDF.
2. Compare against:
   - The Payroll table currently rendered.
   - The raw `/payroll?pay_period=...` API rows.
3. Verify:
   - All payroll-eligible employees appear (count matches API total).
   - Per-row Gross, Allowances, Deductions, Net match displayed values.
   - Pay period filter is honored (no records from other periods leak in).
   - Totals/footers reconcile (sum of row Net = totals shown).
   - HR Manager export === Corporate HR export (byte- or row-equivalent after sorting).
4. Any discrepancy goes into the §4 Backend Verification Report.

---

## 7. Refactor discipline

**Do not consolidate the two edit dialogs during this bug-fix work.** Plan order:
1. Land §1–§3 fixes, with §1 and §6 validated via the lifecycle + network evidence above.
2. Sign off on the Backend Verification Report (§4).
3. Only after both edit flows are independently green, open a separate task to consolidate onto a single shared `EmployeeEditDialog` (or extracted hook + schema). Refactoring while persistence bugs are in flight will hide regressions and re-introduce the same issues across the merged surface.

---

## Execution order (build mode)

1. Capture network evidence for the failing fields (Edit Employee) and produce the lifecycle table.
2. Produce the HR Manager vs Corporate HR classified difference table; await confirmation.
3. Apply targeted frontend fixes in §1 and §2.
4. Apply targeted (non-`*`) permission fixes in §3 after sign-off.
5. Validate Payroll bulk export contents (§6); add any findings to the Backend Verification Report.
6. Deliver the Backend Verification Report (§4).
7. Hold on the consolidation refactor (§7) until everything above is green.

Approve to proceed with step 1.
