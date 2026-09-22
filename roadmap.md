# HRIS fix roadmap (frontend)

## Batch A — empty states & currency
- [ ] Notifications: empty state vs real error
- [ ] My Payslips + Payslip detail: "No payslip available" vs network error; no infinite loading
- [ ] Policies: empty state vs network error
- [ ] Benefits/Allowance: ₦ instead of $ (icons + labels), prefer API currency_symbol

## Batch B — Settings & User Management
- [ ] Route /settings to the real Settings page (remove Coming Soon)
- [ ] Audit Trail wired to GET /settings/audit-logs, gated to HR/IT/Executive
- [ ] Security → User Management: load GET /users (no dummy data)
- [ ] Delete via DELETE /users/{id}, deactivate via POST /users/{id}/deactivate, refetch after

## Batch C — Performance review workflow
- [ ] Route /performance/:id loading GET /performance/{id}
- [ ] Notification links resolve to the specific review (no 404)
- [ ] Multi-step: Self-assessment (read-only for LM/HR) → Manager form → HR final → Completed
- [ ] Structured manager & HR forms from form_schema; clear action labels

## Batch D — Attendance, leave balances, training selection
- [ ] Attendance & Leave page redesign (remove duplicated birthdays/anniversaries)
- [ ] Org attendance: details modal via GET /attendance/{id} instead of toast
- [ ] Leave balances bound to total/used/remaining (no annual_cap fallback)
- [ ] Training: GET /training/eligible-employees for the picker
- [ ] Searchable multi-employee selector used everywhere "Select Employees" appears

## Blocked / pending
- Work Exception submit: backend fix deployed by user; verify after redeploy
