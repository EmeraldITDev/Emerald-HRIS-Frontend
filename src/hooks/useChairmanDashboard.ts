import { useQuery } from "@tanstack/react-query";
import apiService from "@/lib/api";

/**
 * Chairman (executive) dashboard.
 *
 * The executive role is blocked from the org attendance dashboard and every
 * leave endpoint, so this hook calls exactly one endpoint:
 *   GET /analytics/chairman-dashboard
 *
 * The payload is normalised defensively because the backend may nest it under
 * `data` and name collections slightly differently between releases.
 */

export interface TrendPoint {
  label: string;
  value: number;
}

export interface Celebration {
  id: number | string;
  name: string;
  date: string;
  department?: string | null;
  years?: number | null;
}

const pick = (source: any, keys: string[]): any => {
  for (const key of keys) {
    const value = key.split(".").reduce((acc: any, k) => (acc == null ? acc : acc[k]), source);
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
};

const asArray = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
};

const num = (value: any): number => {
  const n = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const toTrend = (raw: any, labelKeys: string[], valueKeys: string[]): TrendPoint[] =>
  asArray(raw).map((item: any) => ({
    label: String(pick(item, labelKeys) ?? ""),
    value: num(pick(item, valueKeys)),
  }));

const toCelebrations = (raw: any, dateKeys: string[]): Celebration[] =>
  asArray(raw).map((item: any, index: number) => ({
    id: item.id ?? item.employee_id ?? index,
    name:
      pick(item, ["name", "full_name", "employee_name"]) ??
      [item.first_name, item.last_name].filter(Boolean).join(" ") ??
      "Employee",
    date: String(pick(item, dateKeys) ?? ""),
    department: pick(item, ["department", "department_name"]) ?? null,
    years: pick(item, ["years", "years_of_service", "anniversary_years"]) ?? null,
  }));

export function useChairmanDashboard() {
  return useQuery({
    queryKey: ["chairman-dashboard"],
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const res: any = await apiService.getChairmanDashboard();
      const d = res?.data ?? res ?? {};

      return {
        generatedAt: new Date(),
        period: pick(d, ["period", "pay_period", "current_period"]) ?? "",
        headcount: num(pick(d, ["headcount", "total_employees", "workforce.total", "summary.headcount"])),
        newHires: num(pick(d, ["new_hires", "hires_this_month", "summary.new_hires"])),
        exits: num(pick(d, ["exits", "separations", "summary.exits"])),
        attendanceRate: num(
          pick(d, ["attendance_rate", "attendance.rate", "summary.attendance_rate"]),
        ),
        payrollTotal: num(
          pick(d, ["payroll_total", "payroll.total", "monthly_payroll_total", "summary.payroll_total"]),
        ),
        payrollChangePct: num(pick(d, ["payroll_change_pct", "payroll.change_pct"])),
        payrollByDepartment: asArray(
          pick(d, ["payroll_by_department", "payroll.by_department"]),
        ).map((item: any) => ({
          label: String(pick(item, ["department", "name", "label"]) ?? "Unassigned"),
          value: num(pick(item, ["total", "amount", "value", "gross"])),
          headcount: num(pick(item, ["headcount", "employees", "count"])),
        })),
        attendanceTrend: toTrend(
          pick(d, ["attendance_trend", "trends.attendance", "attendance_metrics"]),
          ["month", "label", "period"],
          ["attendance_rate", "rate", "value", "present"],
        ),
        hiringTrend: toTrend(
          pick(d, ["hiring_trend", "trends.hiring", "hiring_trends"]),
          ["month", "label", "period"],
          ["hires", "hired", "value", "count"],
        ),
        payrollTrend: toTrend(
          pick(d, ["payroll_trend", "trends.payroll", "salary_trends"]),
          ["month", "label", "period"],
          ["total", "amount", "value", "gross"],
        ),
        headcountTrend: toTrend(
          pick(d, ["headcount_trend", "trends.headcount", "headcount_trends"]),
          ["month", "label", "period"],
          ["headcount", "total", "value", "count"],
        ),
        birthdays: toCelebrations(pick(d, ["birthdays", "celebrations.birthdays"]), [
          "dob",
          "date_of_birth",
          "date",
          "birthday",
        ]),
        anniversaries: toCelebrations(
          pick(d, ["work_anniversaries", "anniversaries", "celebrations.anniversaries"]),
          ["hire_date", "date", "anniversary_date"],
        ),
        raw: d,
      };
    },
  });
}

export type ChairmanDashboard = NonNullable<ReturnType<typeof useChairmanDashboard>["data"]>;
