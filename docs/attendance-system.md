# Attendance System v2

Emerald HRIS attendance: schedule-aware clocking, GPS verification, work
arrangements (Hybrid / Fully Onsite / Fully Remote), exception & WFH requests,
manager/HR approvals, and an org-wide HR dashboard.

All business rules (late thresholds, geofence radius, missing clock-out
detection, status derivation) are owned by the backend. The frontend never
re-implements time gates — it renders `attendance_status` and the schedule
context returned by the API.

## Frontend

### Routes

| Route | Page | Access |
| --- | --- | --- |
| `/approvals/attendance` | `src/pages/attendance/ManagerApprovals.tsx` | `canApproveAttendance` (line manager, HR manager, corporate HR, executive) |
| `/attendance/org-dashboard` | `src/pages/attendance/OrgAttendanceDashboard.tsx` | `canViewOrgDashboard` (HR manager, corporate HR, executive) |

Both routes are registered in `src/App.tsx` and linked from `AppSidebar`
("Attendance Approvals", "Org Attendance"). Each page redirects to `/` when the
permission check fails.

### Hooks

- `useAttendanceToday(enabled?)` — `src/hooks/useAttendanceToday.ts`. Single
  source of truth for today's record via `GET /attendance/today` (no
  pagination scanning). Returns `{ todayStatus, isLoading, refresh }`.
- `useCurrentEmployeeId(initial?)` — `src/hooks/useCurrentEmployeeId.ts`.
  Resolves the signed-in user's `employee_id` from the backend context.

### Shared helpers — `src/lib/attendanceUi.tsx`

`extractRows`, `extractRecord`, `formatTimeOnly`, `dateOnly`,
`attendanceStatusMeta`, `<AttendanceStatusBadge status compact />`,
`locationStatusLabel`, `todayWAT()`, `todayDayNameWAT()` (business timezone is
WAT / UTC+1).

### Components — `src/components/attendance/`

| Component | Props | Notes |
| --- | --- | --- |
| `TimeClockCard` | `employeeId, todayStatus, refresh, className?` | Shared Time Clock. Loads the employee attendance profile + schedule config, shows "Today is a Physical day — Lagos Office" / "Today is a WFH day", captures GPS for Physical days, and posts clock-in/out and break events. Renders the backend `attendance_status` badge. |
| `MissingClockoutBanner` | `employeeId, todayStatus, onSubmitted?` | Shown when the backend flags `missing-clockout`; submits a regularisation request. |
| `WeeklyAttendanceCard` | `employeeId, refreshKey?` | Mon–Fri view fetched from the attendance range endpoint (no localStorage). |
| `MyWorkRequestsCard` | `employeeId, refreshKey?` | History of exception, WFH and clock-out requests with approval-stage badges. |
| `ExceptionRequestForm` | `employeeId, onSubmitted?` | Official Duty, Business Travel, Training, Site/Client Assignment, Temporary Location, Other + optional supporting document. |
| `WFHRequestForm` | `employeeId, onSubmitted?` | Extra WFH day request for Hybrid employees. |
| `AttendanceProfilePanel` | `employeeId` | HR-editable assigned location, work arrangement, workdays and expected mode per day. Read-only for non-HR. Mounted as the "Attendance" tab in the Employees → View Details dialog. |

### Page integrations

- **Dashboard** (`src/pages/Dashboard.tsx`): the inline clock UI, lunch-window
  gates, late/early dialogs and all `localStorage` break patches were removed
  and replaced with `MissingClockoutBanner` + `TimeClockCard` driven by
  `useAttendanceToday`.
- **Attendance** (`src/pages/Attendance.tsx`): dead clock handlers deleted; the
  localStorage weekly grid replaced with `WeeklyAttendanceCard`; exception and
  WFH request entry points plus `MyWorkRequestsCard` added. Today's team table
  remains for managers/HR.
- **Employees** (`src/pages/Employees.tsx`): new "Attendance" tab hosting
  `AttendanceProfilePanel`.
- `src/pages/Attendance.local.tsx` (dead duplicate) was deleted.

### Permissions — `src/lib/permissions.ts`

`canViewOrgDashboard`, `canApproveAttendance`, `canSubmitException`,
`canSubmitWFH`, `canEditAttendanceProfile` (in addition to the existing
`canHrPayroll` / `canHrApproveLeave` helpers).

### API methods — `src/lib/api.ts`

```
getAttendanceToday()
getAttendanceRange({ employee_id, start_date, end_date })
getAttendanceScheduleConfig(location, day)
getEmployeeAttendanceProfile(employeeId)
updateEmployeeAttendanceProfile(employeeId, payload)
startBreak({ employee_id, date })
endBreak({ employee_id, date })
submitExceptionRequest(formData)
getExceptionRequests({ scope?, status?, employee_id? })
approveExceptionManager(id, notes?) / rejectExceptionManager(id, notes)
approveExceptionHR(id, notes?)      / rejectExceptionHR(id, notes)
submitWFHRequest({ employee_id, date, reason })
getWFHRequests({ status?, employee_id? })
approveWFHRequest(id, notes?)       / rejectWFHRequest(id, notes)
getOrgAttendanceDashboard({ date, location, department, mode, status })
submitMissingClockoutRequest({ employee_id, date, clock_out_time, reason })
```

`createAttendance` and `clockOut` accept flexible payloads including
`work_mode`, `location_lat`, `location_lng` and `location_status`. The
hardcoded `location: 'office'` value is gone.

### Integration notes

- GPS is requested only when the expected mode for the day is `Physical`. If
  the browser denies permission the clock-in still posts and the card explains
  that presence could not be verified.
- The org dashboard lists every employee for the selected date (including
  absentees), auto-refreshes every five minutes, and its summary chips filter
  the table client-side over the backend result set.
- The manager approvals page shows HR-stage exceptions for HR roles and
  manager-stage exceptions for line managers; rejections always require a note.