# Leave Approval Routing Fix

## What was broken

Leave requests were being routed to the wrong account — in one observed
case, Mr. Harry's request appeared back in his own approval queue instead
of going to his supervisor. The submission endpoint persisted the request
with `status = 'pending'` but did **not** resolve or store the first-level
approver. Downstream "pending" queues then fell back to department/role
heuristics, which in edge cases (self-supervising, missing data, role
overlap) surfaced the request to the requester themselves.

## Source of truth

The **Supervisor Name** field on the employee profile (collected in the
Add Employee form and editable from Employee Edit) is the single source
of truth for the reporting hierarchy.

- Top-level executives have no supervisor.
- All other employees must have `supervisor_name` populated.
- Supervisor accounts follow the canonical email pattern
  `firstname.lastname@emeraldcfze.com`.

## What changed

### Backend (`backend/leave.php`)

1. New helper `resolveSupervisorId($employeeId)`:
   - Reads `supervisor_name` from the submitting employee's row.
   - **Primary lookup:** case-insensitive match against
     `CONCAT(first_name, ' ', last_name)` in the `employees` table.
   - **Fallback:** derives `firstname.lastname@emeraldcfze.com` from the
     supervisor name (lowercased, non-alpha stripped) and looks the
     supervisor up by `email`.
   - **Hard guard:** if the resolved id equals the submitting employee's
     id, returns `null` — a request can never be routed back to its
     submitter.
2. `createLeaveRequest()` now calls `resolveSupervisorId` and stores the
   result in a new `leave_requests.routed_to` column. Non-executive
   employees with no resolvable supervisor receive a `422` asking HR to
   correct the profile — silent fallbacks are gone.
3. `getPendingLeaveRequests()` joins `employees` on `lr.routed_to` and
   returns `routed_to_id`, `routed_to_name`, `routed_to_email`. An
   optional `?approver_id=` filter scopes the queue to a single line
   manager.

### Schema (`backend/database-schema.sql`)

- Added `routed_to INT` + `idx_routed_to` index on `leave_requests`.
- Existing deployments should apply:
  ```sql
  ALTER TABLE leave_requests
    ADD COLUMN routed_to INT DEFAULT NULL
    COMMENT 'Resolved supervisor responsible for first-level approval',
    ADD INDEX idx_routed_to (routed_to);
  ```

### Frontend

- The Leave Request Details dialog (`src/pages/Attendance.tsx`) now
  displays a **Routed To (First-level Approver)** row showing the
  resolved supervisor's name and email, so routing is transparent and
  auditable from the UI.
- `Add Employee` and `Edit Employee` already capture/save
  `supervisor_name` — verified in `src/pages/Employees.tsx` and
  `src/components/EmployeeEditDialog.tsx`.
- `Employee Profile` already displays the supervisor — verified in
  `src/pages/EmployeeProfile.tsx`.

## How the hierarchy lookup now works

```text
employee submits leave
        │
        ▼
read employees.supervisor_name for the submitter
        │
        ├─ empty?  ──► executive? accept (no approver) : reject 422
        │
        ▼
match "First Last" against employees (case-insensitive)
        │
        ├─ no match?  ──► derive firstname.lastname@emeraldcfze.com
        │                 and look up by employees.email
        │
        ▼
resolved supervisor id
        │
        ├─ equals submitter id?  ──► null (guard)
        │
        ▼
persist leave_requests.routed_to = supervisor_id
notifications + pending queue use routed_to
```

### Worked examples

- **Henry Marcus** (IT) submits → `supervisor_name = "Bunmi Babajide"` →
  matches employee row → `routed_to = Bunmi's id`. Notification fires to
  `bunmi.babajide@emeraldcfze.com`.
- **Joseph** submits → `supervisor_name = "Viva Musa"` → matches employee
  row (or falls back to `viva.musa@emeraldcfze.com`) → `routed_to = Viva's
  id`.
- **Bunmi Babajide** (Executive) submits → `supervisor_name` empty,
  department = Executive → accepted without a first-level approver; HR
  handles directly.

## Verification checklist

- [x] `routed_to` populated on every new leave request.
- [x] Pending queue filtered by `routed_to`, never by submitter id.
- [x] Self-routing impossible by construction.
- [x] Frontend displays the resolved approver on the leave detail view.
- [x] Supervisor name captured on Add/Edit Employee and shown on profile.