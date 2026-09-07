import type { Employee, LeaveRequest, PayrollRecord } from "@/lib/api";
import { getAnnualGrossSalary, toMoneyNumber } from "@/lib/payrollCalc";

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

export type Trend = {
  /** Absolute change vs the comparison period. */
  delta: number;
  /** Percentage change vs the comparison period (null when base is 0). */
  pct: number | null;
  /** true when a rise is a good thing (used only for colouring). */
  higherIsBetter?: boolean;
  label: string;
};

export const ACTIVE_STATUSES = new Set([
  "active",
  "on probation",
  "probation",
  "confirmed",
]);

export const isActiveEmployee = (e: Partial<Employee>): boolean => {
  const s = String(e.employment_status || "active").trim().toLowerCase();
  if (!s) return true;
  if (["resigned", "terminated", "exited", "inactive", "retired", "dismissed"].includes(s)) {
    return false;
  }
  return true;
};

export const employeeName = (e: Partial<Employee>): string =>
  `${e.first_name || ""} ${e.last_name || ""}`.trim() || e.email || "Unknown";

export const parseDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const d = new Date(String(value).replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? null : d;
};

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export const currentPeriod = (ref: Date = new Date()) => monthKey(ref);

export const previousPeriod = (ref: Date = new Date()) => {
  const d = new Date(ref.getFullYear(), ref.getMonth() - 1, 1);
  return monthKey(d);
};

const inMonth = (value: string | null | undefined, ref: Date, offset = 0) => {
  const d = parseDate(value);
  if (!d) return false;
  const target = new Date(ref.getFullYear(), ref.getMonth() + offset, 1);
  return d.getFullYear() === target.getFullYear() && d.getMonth() === target.getMonth();
};

const pct = (current: number, base: number): number | null =>
  base > 0 ? ((current - base) / base) * 100 : null;

export const makeTrend = (
  current: number,
  base: number,
  label: string,
  higherIsBetter = true,
): Trend => ({
  delta: current - base,
  pct: pct(current, base),
  higherIsBetter,
  label,
});

/* ------------------------------------------------------------------ */
/* Attendance rows                                                     */
/* ------------------------------------------------------------------ */

export type AttendanceRow = Record<string, any>;

export const rowStatus = (r: AttendanceRow) => String(r.attendance_status || "").toLowerCase();

export const isPresent = (r: AttendanceRow) =>
  rowStatus(r).startsWith("present") || !!r.clock_in || !!r.clock_in_time;

export const isAbsent = (r: AttendanceRow) => !isPresent(r) && rowStatus(r) !== "leave";

export const isOnLeaveRow = (r: AttendanceRow) =>
  rowStatus(r).includes("leave") || String(r.work_mode || "").toLowerCase() === "leave";

export const isLateRow = (r: AttendanceRow) =>
  !!r.is_late || rowStatus(r).includes("late") || !!r.late_minutes;

export const isMismatchRow = (r: AttendanceRow) =>
  rowStatus(r) === "location-mismatch" ||
  String(r.location_status || "").toLowerCase() === "mismatch" ||
  rowStatus(r) === "unapproved-wfh";

/* ------------------------------------------------------------------ */
/* Workforce overview                                                  */
/* ------------------------------------------------------------------ */

export type WorkforceOverview = {
  total: number;
  active: number;
  newThisMonth: number;
  newLastMonth: number;
  exited: number;
  exitedThisMonth: number;
  departments: number;
  locations: number;
  onLeave: number;
  absent: number;
  present: number;
  late: number;
  attendanceRate: number | null;
};

export const buildWorkforceOverview = (
  employees: Employee[],
  formerEmployees: Employee[],
  rows: AttendanceRow[],
  onLeaveToday: number,
): WorkforceOverview => {
  const ref = new Date();
  const active = employees.filter(isActiveEmployee);
  const departments = new Set(active.map((e) => e.department).filter(Boolean));
  const locations = new Set(active.map((e) => e.work_location).filter(Boolean));

  const present = rows.filter(isPresent).length;
  const leaveRows = rows.filter(isOnLeaveRow).length;
  const absent = rows.filter((r) => isAbsent(r) && !isOnLeaveRow(r)).length;
  const expected = rows.length;

  return {
    total: employees.length,
    active: active.length,
    newThisMonth: employees.filter((e) => inMonth(e.hire_date, ref, 0)).length,
    newLastMonth: employees.filter((e) => inMonth(e.hire_date, ref, -1)).length,
    exited: formerEmployees.length,
    exitedThisMonth: formerEmployees.filter((e: any) =>
      inMonth(e.exit_date || e.resignation_date || e.last_working_day || e.updated_at, ref, 0),
    ).length,
    departments: departments.size,
    locations: locations.size,
    onLeave: onLeaveToday || leaveRows,
    absent,
    present,
    late: rows.filter(isLateRow).length,
    attendanceRate: expected > 0 ? (present / expected) * 100 : null,
  };
};

/* ------------------------------------------------------------------ */
/* Breakdowns                                                          */
/* ------------------------------------------------------------------ */

export type BreakdownRow = {
  key: string;
  headcount: number;
  active: number;
  onLeave: number;
  present: number;
  absent: number;
  attendanceRate: number | null;
};

const buildBreakdown = (
  employees: Employee[],
  rows: AttendanceRow[],
  leaveEmployeeIds: Set<number>,
  pick: (e: Employee) => string,
  pickRow: (r: AttendanceRow) => string,
): BreakdownRow[] => {
  const map = new Map<string, BreakdownRow>();
  const ensure = (key: string) => {
    if (!map.has(key)) {
      map.set(key, {
        key,
        headcount: 0,
        active: 0,
        onLeave: 0,
        present: 0,
        absent: 0,
        attendanceRate: null,
      });
    }
    return map.get(key)!;
  };

  employees.forEach((e) => {
    const bucket = ensure(pick(e) || "Unassigned");
    bucket.headcount += 1;
    if (isActiveEmployee(e)) bucket.active += 1;
    if (e.id && leaveEmployeeIds.has(Number(e.id))) bucket.onLeave += 1;
  });

  rows.forEach((r) => {
    const bucket = ensure(pickRow(r) || "Unassigned");
    if (isOnLeaveRow(r)) return;
    if (isPresent(r)) bucket.present += 1;
    else bucket.absent += 1;
  });

  return Array.from(map.values())
    .map((b) => ({
      ...b,
      attendanceRate: b.present + b.absent > 0 ? (b.present / (b.present + b.absent)) * 100 : null,
    }))
    .sort((a, b) => b.headcount - a.headcount);
};

export const byDepartment = (
  employees: Employee[],
  rows: AttendanceRow[],
  leaveIds: Set<number>,
) =>
  buildBreakdown(
    employees,
    rows,
    leaveIds,
    (e) => String(e.department || "Unassigned"),
    (r) => String(r.department || "Unassigned"),
  );

export const normalizedLocation = (value?: string | null): string => {
  const raw = String(value || "").trim();
  if (!raw) return "Unassigned";
  return proposeWorkLocationMigration(raw) || raw;
};

export const byLocation = (employees: Employee[], rows: AttendanceRow[], leaveIds: Set<number>) =>
  buildBreakdown(
    employees,
    rows,
    leaveIds,
    (e) => normalizedLocation(e.work_location),
    (r) => normalizedLocation(r.assigned_location || r.work_location),
  );


export const byEmploymentType = (employees: Employee[]) => {
  const map = new Map<string, number>();
  employees.forEach((e) => {
    const key = String(e.employment_type || "Unspecified");
    map.set(key, (map.get(key) || 0) + 1);
  });
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

/* ------------------------------------------------------------------ */
/* Leave                                                               */
/* ------------------------------------------------------------------ */

export type LeaveOverview = {
  currentlyOnLeave: LeaveRequest[];
  pending: LeaveRequest[];
  approved: LeaveRequest[];
  upcoming: LeaveRequest[];
  stalePending: LeaveRequest[];
  onLeaveEmployeeIds: Set<number>;
};

export const buildLeaveOverview = (requests: LeaveRequest[], ref: Date = new Date()): LeaveOverview => {
  const today = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const in14 = new Date(today.getTime() + 14 * 86400000);
  const status = (r: LeaveRequest) => String(r.status || "").toLowerCase();

  const approved = requests.filter((r) => status(r).includes("approved"));
  const pending = requests.filter((r) => status(r).includes("pending"));

  const currentlyOnLeave = approved.filter((r) => {
    const s = parseDate(r.start_date);
    const e = parseDate(r.end_date);
    return !!s && !!e && s <= today && e >= today;
  });

  const upcoming = approved.filter((r) => {
    const s = parseDate(r.start_date);
    return !!s && s > today && s <= in14;
  });

  const stalePending = pending.filter((r) => {
    const created = parseDate(r.created_at);
    return !!created && (today.getTime() - created.getTime()) / 86400000 > 5;
  });

  return {
    currentlyOnLeave,
    pending,
    approved,
    upcoming,
    stalePending,
    onLeaveEmployeeIds: new Set(currentlyOnLeave.map((r) => Number(r.employee_id))),
  };
};

/* ------------------------------------------------------------------ */
/* Payroll                                                             */
/* ------------------------------------------------------------------ */

export type PayrollOverview = {
  period: string;
  employeesIncluded: number;
  totalCost: number;
  statusCounts: Record<string, number>;
  unresolved: number;
  previousTotal: number;
  trend: Trend;
  missingGross: number;
};

export const buildPayrollOverview = (
  currentRecords: PayrollRecord[],
  previousRecords: PayrollRecord[],
  employees: Employee[],
  period: string,
): PayrollOverview => {
  const sum = (list: PayrollRecord[]) =>
    list.reduce((acc, r: any) => acc + toMoneyNumber(r.net_pay ?? r.netPay ?? r.gross_pay), 0);
  const statusCounts: Record<string, number> = {};
  currentRecords.forEach((r: any) => {
    const s = String(r.status || "unknown").toLowerCase();
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });

  const totalCost = sum(currentRecords);
  const previousTotal = sum(previousRecords);
  const unresolved =
    (statusCounts["draft"] || 0) + (statusCounts["pending"] || 0) + (statusCounts["ready"] || 0);

  return {
    period,
    employeesIncluded: new Set(currentRecords.map((r) => r.employee_id)).size,
    totalCost,
    statusCounts,
    unresolved,
    previousTotal,
    trend: makeTrend(totalCost, previousTotal, "vs last period", false),
    missingGross: employees.filter((e) => isActiveEmployee(e) && getAnnualGrossSalary(e) < 12).length,
  };
};

/* ------------------------------------------------------------------ */
/* Alerts                                                              */
/* ------------------------------------------------------------------ */

export type AlertSeverity = "critical" | "warning" | "info";

export type ExecAlert = {
  id: string;
  severity: AlertSeverity;
  title: string;
  detail: string;
  metric?: string;
  drill: { kind: "employees" | "attendance" | "leave" | "payroll"; filter?: any; title: string };
};

const REQUIRED_FIELDS: Array<[keyof Employee | string, string]> = [
  ["department", "Department"],
  ["work_location", "Work location"],
  ["hire_date", "Hire date"],
  ["phone", "Phone"],
];

export const employeesMissingInfo = (employees: Employee[]) =>
  employees.filter(
    (e) =>
      isActiveEmployee(e) &&
      REQUIRED_FIELDS.some(([field]) => {
        const v = (e as any)[field] ?? (field === "phone" ? (e as any).phone_number : undefined);
        return v === null || v === undefined || String(v).trim() === "";
      }),
  );

export const missingFieldsFor = (e: Employee): string[] =>
  REQUIRED_FIELDS.filter(([field]) => {
    const v = (e as any)[field] ?? (field === "phone" ? (e as any).phone_number : undefined);
    return v === null || v === undefined || String(v).trim() === "";
  }).map(([, label]) => label);

export const buildAlerts = (input: {
  overview: WorkforceOverview;
  departments: BreakdownRow[];
  locations: BreakdownRow[];
  leave: LeaveOverview;
  payroll: PayrollOverview;
  employees: Employee[];
  rows: AttendanceRow[];
}): ExecAlert[] => {
  const { overview, departments, leave, payroll, employees, rows } = input;
  const alerts: ExecAlert[] = [];

  // Org-wide attendance below 85%
  if (overview.attendanceRate !== null && overview.attendanceRate < 85 && rows.length > 0) {
    alerts.push({
      id: "org-attendance",
      severity: overview.attendanceRate < 70 ? "critical" : "warning",
      title: "Organisation attendance below target",
      detail: `${overview.attendanceRate.toFixed(1)}% present today against an 85% target.`,
      metric: `${overview.absent} absent`,
      drill: { kind: "attendance", filter: { absentOnly: true }, title: "Absent today" },
    });
  }

  // Departments with poor attendance
  departments
    .filter((d) => d.headcount >= 3 && d.attendanceRate !== null && d.attendanceRate < 70)
    .forEach((d) =>
      alerts.push({
        id: `dept-attendance-${d.key}`,
        severity: "warning",
        title: `${d.key} attendance is low`,
        detail: `Only ${d.attendanceRate!.toFixed(0)}% of ${d.key} clocked in today (${d.absent} absent).`,
        metric: `${d.absent} absent`,
        drill: {
          kind: "attendance",
          filter: { department: d.key, absentOnly: true },
          title: `${d.key} — absent today`,
        },
      }),
    );

  // Location mismatches / unapproved WFH
  const mismatches = rows.filter(isMismatchRow);
  if (mismatches.length > 0) {
    alerts.push({
      id: "location-mismatch",
      severity: "warning",
      title: "Unverified work locations",
      detail: `${mismatches.length} clock-in(s) today were outside the assigned location or unapproved remote work.`,
      metric: `${mismatches.length}`,
      drill: { kind: "attendance", filter: { mismatchOnly: true }, title: "Location exceptions today" },
    });
  }

  // Late clock-ins
  if (overview.late >= Math.max(3, Math.round(rows.length * 0.15))) {
    alerts.push({
      id: "late-clockins",
      severity: "info",
      title: "Elevated late clock-ins",
      detail: `${overview.late} employees clocked in late today.`,
      metric: `${overview.late}`,
      drill: { kind: "attendance", filter: { lateOnly: true }, title: "Late clock-ins today" },
    });
  }

  // Stale leave approvals
  if (leave.stalePending.length > 0) {
    alerts.push({
      id: "stale-leave",
      severity: leave.stalePending.length > 5 ? "critical" : "warning",
      title: "Leave approvals overdue",
      detail: `${leave.stalePending.length} leave request(s) have been pending for more than 5 days.`,
      metric: `${leave.stalePending.length}`,
      drill: { kind: "leave", filter: { stale: true }, title: "Leave requests pending over 5 days" },
    });
  }

  // Simultaneous absence concentration
  departments
    .filter((d) => d.headcount >= 3 && d.onLeave / d.headcount >= 0.3)
    .forEach((d) =>
      alerts.push({
        id: `leave-concentration-${d.key}`,
        severity: "warning",
        title: `${d.key} is thinly staffed`,
        detail: `${d.onLeave} of ${d.headcount} employees in ${d.key} are on leave right now.`,
        metric: `${d.onLeave} on leave`,
        drill: { kind: "leave", filter: { department: d.key }, title: `${d.key} — currently on leave` },
      }),
    );

  // Payroll exceptions
  if (payroll.unresolved > 0) {
    alerts.push({
      id: "payroll-unresolved",
      severity: "warning",
      title: "Payroll not finalised",
      detail: `${payroll.unresolved} payroll record(s) for ${payroll.period} are still draft or pending approval.`,
      metric: `${payroll.unresolved}`,
      drill: { kind: "payroll", filter: { unresolved: true }, title: `Unresolved payroll — ${payroll.period}` },
    });
  }
  if (payroll.missingGross > 0) {
    alerts.push({
      id: "payroll-missing-gross",
      severity: "critical",
      title: "Employees without a salary on file",
      detail: `${payroll.missingGross} active employee(s) have no annual gross set and will be skipped by payroll.`,
      metric: `${payroll.missingGross}`,
      drill: { kind: "employees", filter: { missingGross: true }, title: "Employees missing annual gross" },
    });
  }
  if (payroll.trend.pct !== null && Math.abs(payroll.trend.pct) >= 15) {
    alerts.push({
      id: "payroll-swing",
      severity: "info",
      title: "Payroll cost changed sharply",
      detail: `Total payroll ${payroll.trend.delta > 0 ? "rose" : "fell"} ${Math.abs(payroll.trend.pct).toFixed(1)}% versus the previous period.`,
      drill: { kind: "payroll", title: `Payroll records — ${payroll.period}` },
    });
  }

  // Missing employee data
  const incomplete = employeesMissingInfo(employees);
  if (incomplete.length > 0) {
    alerts.push({
      id: "missing-info",
      severity: "info",
      title: "Incomplete employee records",
      detail: `${incomplete.length} active employee record(s) are missing required information.`,
      metric: `${incomplete.length}`,
      drill: { kind: "employees", filter: { missingInfo: true }, title: "Employees with missing information" },
    });
  }

  // Headcount swing
  if (overview.exitedThisMonth >= 3) {
    alerts.push({
      id: "exits",
      severity: "warning",
      title: "Elevated exits this month",
      detail: `${overview.exitedThisMonth} employees have exited the organisation this month.`,
      metric: `${overview.exitedThisMonth}`,
      drill: { kind: "employees", filter: { exited: true }, title: "Employees who exited" },
    });
  }

  const weight: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };
  return alerts.sort((a, b) => weight[a.severity] - weight[b.severity]).slice(0, 10);
};

/* ------------------------------------------------------------------ */
/* Activity feed                                                       */
/* ------------------------------------------------------------------ */

export type ActivityItem = {
  id: string;
  date: Date;
  kind: "hire" | "exit" | "leave" | "payroll";
  title: string;
  detail: string;
};

export const buildActivity = (
  employees: Employee[],
  formerEmployees: Employee[],
  leave: LeaveRequest[],
  payroll: PayrollRecord[],
  period: string,
): ActivityItem[] => {
  const items: ActivityItem[] = [];

  employees.forEach((e) => {
    const d = parseDate(e.hire_date);
    if (d) {
      items.push({
        id: `hire-${e.id}`,
        date: d,
        kind: "hire",
        title: `${employeeName(e)} joined`,
        detail: `${e.job_title || "New hire"} · ${e.department || "Unassigned"}`,
      });
    }
  });

  formerEmployees.forEach((e: any) => {
    const d = parseDate(e.exit_date || e.resignation_date || e.last_working_day || e.updated_at);
    if (d) {
      items.push({
        id: `exit-${e.id}`,
        date: d,
        kind: "exit",
        title: `${employeeName(e)} exited`,
        detail: `${e.department || "Unassigned"}${e.exit_reason ? ` · ${e.exit_reason}` : ""}`,
      });
    }
  });

  leave
    .filter((r) => String(r.status || "").toLowerCase().includes("approved"))
    .forEach((r) => {
      const d = parseDate(r.approved_at || r.updated_at || r.created_at);
      if (d) {
        items.push({
          id: `leave-${r.id}`,
          date: d,
          kind: "leave",
          title: `Leave approved — ${r.days_requested} day(s)`,
          detail: `${r.start_date} → ${r.end_date}`,
        });
      }
    });

  if (payroll.length > 0) {
    const latest = payroll
      .map((r: any) => parseDate(r.updated_at || r.created_at))
      .filter(Boolean)
      .sort((a, b) => b!.getTime() - a!.getTime())[0];
    if (latest) {
      items.push({
        id: `payroll-${period}`,
        date: latest,
        kind: "payroll",
        title: `Payroll activity — ${period}`,
        detail: `${payroll.length} record(s) generated or updated`,
      });
    }
  }

  const now = Date.now();
  return items
    .filter((i) => i.date.getTime() <= now + 86400000)
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 12);
};
