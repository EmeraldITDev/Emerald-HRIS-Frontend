# Frontend Routing Fixes — Notifications

## 1. Leave approval notifications pointed to a non-existent route

**Before:** Backend notifications carried `link = "/leave-approvals/pending-manager"` (or `/pending-hr`). Clicking landed on a 404 because the app's route is `/approvals/leave`.

**After:** `resolveNotificationLink()` now normalizes any `/leave-approvals/...` link to `/approvals/leave`, preserving the stage as a query string:

- `/leave-approvals/pending-manager` → `/approvals/leave?stage=manager`
- `/leave-approvals/pending-hr`      → `/approvals/leave?stage=hr`

The existing `LeaveApprovals` page (`src/pages/LeaveApprovals.tsx`, route registered in `src/App.tsx`) already reads `?stage=` and `?id=` to auto-select the queue and highlight the row.

**File changed:** `src/lib/notificationLinks.ts`

## 2. Payroll notification opened admin route for employees

**Before:** Notification linked to `/payroll/payslips/2026-05` for everyone, which is the HR/admin Payroll page. Regular employees saw an empty/forbidden view.

**After:** Routing is role-aware:

- `hr_manager`, `corporate_hr` → `/payroll/payslips/{period}` (admin)
- all other roles            → `/payroll/my-payslips/{period}` (employee self-service)

This applies both when normalizing a backend-provided `link` and when inferring from `type` (`payroll` / `payslip`). The pay period is read from `n.data.pay_period` / `payPeriod` / `period` when present.

**Files changed:**
- `src/lib/notificationLinks.ts` — added optional `role` parameter and role branching
- `src/components/NotificationBell.tsx` — passes `user.role` from `useAuth()`
- `src/pages/Notifications.tsx` — passes `user.role` from `useAuth()`

## Routes confirmed present

| Route                              | Component        |
| ---------------------------------- | ---------------- |
| `/approvals/leave`                 | `LeaveApprovals` |
| `/payroll/payslips` (and `:period`)| `Payroll`        |
| `/payroll/my-payslips/:period`     | `PayslipDetail`  |
| `/payroll/my-payslips`             | `MyPayslips`     |

No new pages were required — only the notification link resolver and its call sites were updated.