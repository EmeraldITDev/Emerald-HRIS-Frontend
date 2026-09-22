# HRIS fix roadmap (frontend)

## Batch A — empty states & currency
- [x] Notifications: empty state vs real error
- [x] My Payslips + Payslip detail: "No payslip available" vs network error; no infinite loading
- [x] Policies: empty state vs network error
- [x] Benefits/Allowance: ₦ instead of $ (icons + labels), prefer API currency_symbol

## Batch B — Settings & User Management
- [x] Route /settings to the real Settings page (remove Coming Soon)
- [x] Audit Trail wired to GET /settings/audit-logs, gated to HR/IT/Executive
- [x] Security → User Management: load GET /users (no dummy data)
- [x] Delete via DELETE /users/{id}, deactivate via POST /users/{id}/deactivate, refetch after

## Batch C — Performance review workflow
- [x] Route /performance/:id loading GET /performance/{id}
- [x] Notification links resolve to the specific review (no 404)
- [x] Multi-step: Self-assessment (read-only for LM/HR) → Manager form → HR final → Completed
- [x] Structured manager & HR forms; clear action labels

## Batch D — Attendance, leave balances, training selection
- [x] Attendance & Leave page redesign (tabs: My Attendance / Leave / Organization; birthdays removed)
- [x] Org attendance: details modal via GET /attendance/{id} instead of toast
- [x] Leave balances bound to total/used/remaining (no annual_cap fallback)
- [x] Training: GET /training/eligible-employees for the picker
- [x] Searchable multi-employee selector used everywhere "Select Employees" appears

## Blocked / pending
- Work Exception submit: backend fix deployed by user; verify after redeploy
