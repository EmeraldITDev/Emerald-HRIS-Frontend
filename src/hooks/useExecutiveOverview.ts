import { useQuery } from "@tanstack/react-query";
import apiService, { Employee, LeaveRequest, PayrollRecord } from "@/lib/api";
import { extractRows, todayWAT } from "@/lib/attendanceUi";
import {
  AttendanceRow,
  buildActivity,
  buildAlerts,
  buildLeaveOverview,
  buildPayrollOverview,
  buildWorkforceOverview,
  byDepartment,
  byEmploymentType,
  byLocation,
  currentPeriod,
  makeTrend,
  previousPeriod,
} from "@/lib/executiveMetrics";

const safe = async <T,>(p: Promise<T>, fallback: T): Promise<T> => {
  try {
    return await p;
  } catch {
    return fallback;
  }
};

const asArray = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  return [];
};

/**
 * Single aggregated fetch for the executive view.
 *
 * All requests run in parallel, failures degrade gracefully, and the result is
 * cached for 5 minutes so navigating in and out does not re-hit the API.
 */
export function useExecutiveOverview() {
  return useQuery({
    queryKey: ["executive-overview"],
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const period = currentPeriod();
      const prevPeriod = previousPeriod();
      const date = todayWAT();

      const [
        employeesRaw,
        formerRaw,
        orgRaw,
        leaveRaw,
        payrollRaw,
        prevPayrollRaw,
        attendanceMetricsRaw,
        hiringRaw,
      ] = await Promise.all([
        safe<Employee[]>(apiService.getEmployees(), []),
        safe<any>(apiService.getFormerEmployees(), []),
        safe<any>(apiService.getOrgAttendanceDashboard({ date }), null),
        safe<any>(apiService.getLeaveRequests(), []),
        safe<any>(apiService.getPayrollRecords({ pay_period: period }), []),
        safe<any>(apiService.getPayrollRecords({ pay_period: prevPeriod }), []),
        safe<any>(apiService.getAttendanceMetrics(), []),
        safe<any>(apiService.getHiringTrends(), []),
      ]);

      const employees = asArray(employeesRaw) as Employee[];
      const formerEmployees = asArray(formerRaw) as Employee[];
      const orgPayload = (orgRaw as any)?.data ?? orgRaw;
      const rows = extractRows(orgPayload?.rows ? orgPayload.rows : orgRaw) as AttendanceRow[];
      const leaveRequests = asArray(leaveRaw) as LeaveRequest[];
      const payrollRecords = asArray(payrollRaw) as PayrollRecord[];
      const prevPayrollRecords = asArray(prevPayrollRaw) as PayrollRecord[];

      const leave = buildLeaveOverview(leaveRequests);
      const overview = buildWorkforceOverview(
        employees,
        formerEmployees,
        rows,
        leave.currentlyOnLeave.length,
      );
      const departments = byDepartment(employees, rows, leave.onLeaveEmployeeIds);
      const locations = byLocation(employees, rows, leave.onLeaveEmployeeIds);
      const employmentTypes = byEmploymentType(employees);
      const payroll = buildPayrollOverview(
        payrollRecords,
        prevPayrollRecords,
        employees,
        period,
      );

      const attendanceTrend = asArray(attendanceMetricsRaw).map((item: any) => ({
        month: item.month,
        rate: Number(item.attendance_rate ?? item.present ?? 0),
      }));
      const hiringTrend = asArray(hiringRaw).map((item: any) => ({
        month: item.month,
        hires: Number(item.hired ?? item.hires ?? 0),
      }));

      const alerts = buildAlerts({
        overview,
        departments,
        locations,
        leave,
        payroll,
        employees,
        rows,
      });

      return {
        generatedAt: new Date(),
        period,
        date,
        employees,
        formerEmployees,
        rows,
        leaveRequests,
        payrollRecords,
        overview,
        headcountTrend: makeTrend(
          overview.newThisMonth,
          overview.newLastMonth,
          "new hires vs last month",
        ),
        departments,
        locations,
        employmentTypes,
        leave,
        payroll,
        alerts,
        attendanceTrend,
        hiringTrend,
        activity: buildActivity(
          employees,
          formerEmployees,
          leaveRequests,
          payrollRecords,
          period,
        ),
      };
    },
  });
}

export type ExecutiveOverview = NonNullable<ReturnType<typeof useExecutiveOverview>["data"]>;
