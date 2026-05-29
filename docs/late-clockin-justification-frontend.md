# Late Clock-In Justification & Approval Workflow — Frontend

Frontend wiring for the late clock-in / late-return-from-lunch approval
workflow. Backend endpoints already exist; this document describes what the
UI shows and which APIs it calls.

## 1. Late clock-in dialog (employee)

**Component:** `src/pages/Dashboard.tsx` — `<Dialog open={showLateClockInDialog}>`

Two contexts share one dialog (state: `lateClockInContext`):

- `morning` — triggered by `handleClockIn` when the employee clicks **Clock In**
  after 09:00 AM and is not an HR Manager / Corporate HR (admin bypass).
- `post_lunch` — triggered by `handleLunchBreak` when an employee on lunch break
  clicks **On Lunch Break** to return after 14:00 (2:00 PM). The lunch window is
  12:00 – 14:00; returns outside that window require HR approval.

Both submit through `handleConfirmLateClockIn`, which posts to:

`POST /attendance/late-clockin-request` via `apiService.submitLateClockinRequest({ employee_id, reason, requested_at })`.

Post-lunch submissions prefix the reason with `[Late return from lunch]` so HR
can distinguish the two cases in the approval queue.

Until approved:
- Morning context → the employee remains **not clocked in**.
- Post-lunch context → the employee remains **on break** (no `break_end` is set).

## 2. Employee attendance status badges

**Component:** `src/components/MyAttendanceRequestsCard.tsx`

Mounted on `src/pages/Attendance.tsx` below `AttendanceApprovalsCard`. Visible
to every employee. Lists their own late clock-in **and** early clock-out
approval requests with status badges:

- `Awaiting HR Approval` (warning) — `status = pending`
- `Approved` (success) — `status = approved`
- `Rejected` (destructive) — `status = rejected`

Data sources:
- `GET /attendance/late-clockin-requests?employee_id=...`
- `GET /attendance/early-clockout-requests?employee_id=...`

## 3. HR Manager — notification & approval UI

**Notification routing:** `src/lib/notificationLinks.ts` already routes
`late_clockin_request_*` notification types to `/attendance?tab=approvals`
for managers and to `/attendance` (with the status card visible) for the
requesting employee.

**Approval surface:** `src/components/AttendanceApprovalsCard.tsx`, mounted on
the Attendance page for HR Manager / Corporate HR. Each pending row shows
employee name, requested timestamp, full reason, and Approve / Reject buttons.

API calls used:

| Action  | Endpoint                                                | apiService method                  |
| ------- | ------------------------------------------------------- | ---------------------------------- |
| List    | `GET /attendance/late-clockin-requests?status=pending`  | `getLateClockinRequests`           |
| Approve | `POST /attendance/late-clockin-requests/{id}/approve`   | `approveLateClockinRequest`        |
| Reject  | `POST /attendance/late-clockin-requests/{id}/reject`    | `rejectLateClockinRequest`         |

(The same component handles early clock-out via the parallel
`/attendance/early-clockout-requests/...` endpoints.)

## 4. Post-action feedback

- HR action triggers a backend notification to the employee. The frontend
  `NotificationBell` opens the link returned by `resolveNotificationLink`,
  which lands the employee on `/attendance` where the status badge in
  `MyAttendanceRequestsCard` is updated (`Approved` / `Rejected` plus any HR
  notes shown in the **HR Notes** column).
- HR approvers see a success toast and the row disappears from the pending
  list after `load()` re-fetches.

## Files touched in this change

- `src/pages/Dashboard.tsx` — added `lateClockInContext` state, post-lunch
  trigger inside `handleLunchBreak`, contextual dialog copy, reason prefix.
- `src/components/MyAttendanceRequestsCard.tsx` — new component.
- `src/pages/Attendance.tsx` — mount `MyAttendanceRequestsCard` for employees.
- `docs/late-clockin-justification-frontend.md` — this document.

## Routes used

- `/attendance` — employee view (clock card on Dashboard, status card here)
- `/attendance?tab=approvals` — HR approver landing from notifications