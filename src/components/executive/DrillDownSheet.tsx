import { Link } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink } from "lucide-react";
import { formatNaira } from "@/lib/currency";
import { getAnnualGrossSalary } from "@/lib/payrollCalc";
import type { ExecutiveOverview } from "@/hooks/useExecutiveOverview";
import {
  employeeName,
  employeesMissingInfo,
  isAbsent,
  isActiveEmployee,
  isLateRow,
  isMismatchRow,
  isOnLeaveRow,
  isPresent,
  missingFieldsFor,
  parseDate,
} from "@/lib/executiveMetrics";

export type DrillRequest = {
  kind: "employees" | "attendance" | "leave" | "payroll";
  title: string;
  filter?: Record<string, any>;
};

const linkFor: Record<DrillRequest["kind"], string> = {
  employees: "/employees",
  attendance: "/attendance/org-dashboard",
  leave: "/approvals/leave",
  payroll: "/payroll",
};

interface Props {
  request: DrillRequest | null;
  data?: ExecutiveOverview;
  onOpenChange: (open: boolean) => void;
}

export function DrillDownSheet({ request, data, onOpenChange }: Props) {
  const f = request?.filter || {};

  const employeeById = new Map(
    (data?.employees || []).map((e) => [Number(e.id), e]),
  );

  const renderBody = () => {
    if (!request || !data) return null;

    if (request.kind === "employees") {
      let list = data.employees;
      if (f.exited) list = data.formerEmployees;
      if (f.missingGross) list = list.filter((e) => isActiveEmployee(e) && getAnnualGrossSalary(e) < 12);
      if (f.missingInfo) list = employeesMissingInfo(list);
      if (f.department) list = list.filter((e) => (e.department || "Unassigned") === f.department);
      if (f.location) list = list.filter((e) => (e.work_location || "Unassigned") === f.location);
      if (f.employmentType)
        list = list.filter((e) => (e.employment_type || "Unspecified") === f.employmentType);
      if (f.newThisMonth) {
        const now = new Date();
        list = list.filter((e) => {
          const d = parseDate(e.hire_date);
          return !!d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
      }

      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">
                {f.missingInfo ? "Missing" : f.missingGross ? "Annual gross" : "Status"}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">
                  {employeeName(e)}
                  <div className="text-xs text-muted-foreground">{e.job_title || "—"}</div>
                </TableCell>
                <TableCell>{e.department || "—"}</TableCell>
                <TableCell>{e.work_location || "—"}</TableCell>
                <TableCell className="text-right text-sm">
                  {f.missingInfo
                    ? missingFieldsFor(e).join(", ")
                    : f.missingGross
                      ? formatNaira(getAnnualGrossSalary(e))
                      : e.employment_status || "Active"}
                </TableCell>
              </TableRow>
            ))}
            {list.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  Nothing to show.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      );
    }

    if (request.kind === "attendance") {
      let rows = data.rows;
      if (f.department) rows = rows.filter((r) => String(r.department || "Unassigned") === f.department);
      if (f.location)
        rows = rows.filter(
          (r) => String(r.assigned_location || r.work_location || "Unassigned") === f.location,
        );
      if (f.absentOnly) rows = rows.filter((r) => isAbsent(r) && !isOnLeaveRow(r));
      if (f.presentOnly) rows = rows.filter(isPresent);
      if (f.lateOnly) rows = rows.filter(isLateRow);
      if (f.mismatchOnly) rows = rows.filter(isMismatchRow);

      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={`${r.employee_id || i}-${i}`}>
                <TableCell className="font-medium">
                  {r.employee_name || r.name || `Employee ${r.employee_id ?? ""}`}
                </TableCell>
                <TableCell>{r.department || "—"}</TableCell>
                <TableCell>{r.assigned_location || r.work_location || "—"}</TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline">{r.attendance_status || (isPresent(r) ? "Present" : "Absent")}</Badge>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  No attendance records match this view.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      );
    }

    if (request.kind === "leave") {
      let list = data.leave.currentlyOnLeave;
      if (f.stale) list = data.leave.stalePending;
      else if (f.pending) list = data.leave.pending;
      else if (f.upcoming) list = data.leave.upcoming;
      if (f.department)
        list = list.filter(
          (r) => (employeeById.get(Number(r.employee_id))?.department || "Unassigned") === f.department,
        );

      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead className="text-right">Days</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((r) => {
              const emp = employeeById.get(Number(r.employee_id));
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    {emp ? employeeName(emp) : `Employee ${r.employee_id}`}
                    <div className="text-xs text-muted-foreground">{emp?.department || "—"}</div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {r.start_date} → {r.end_date}
                  </TableCell>
                  <TableCell className="text-right">{r.days_requested}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">{r.status}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
            {list.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  No leave records match this view.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      );
    }

    // payroll
    let records = data.payrollRecords;
    if (f.unresolved)
      records = records.filter((r: any) =>
        ["draft", "pending", "ready"].includes(String(r.status || "").toLowerCase()),
      );

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Period</TableHead>
            <TableHead className="text-right">Net pay</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((r: any) => {
            const emp = employeeById.get(Number(r.employee_id));
            return (
              <TableRow key={r.id}>
                <TableCell className="font-medium">
                  {emp ? employeeName(emp) : `Employee ${r.employee_id}`}
                </TableCell>
                <TableCell>{r.pay_period}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNaira(Number(r.net_pay ?? r.gross_pay ?? 0))}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline">{r.status || "—"}</Badge>
                </TableCell>
              </TableRow>
            );
          })}
          {records.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                No payroll records match this view.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    );
  };

  return (
    <Sheet open={!!request} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{request?.title}</SheetTitle>
          <SheetDescription>
            Drill-down from the executive view — read-only snapshot.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4">{renderBody()}</div>
        {request && (
          <div className="mt-6">
            <Button asChild variant="outline" size="sm">
              <Link to={linkFor[request.kind]}>
                Open full module <ExternalLink className="ml-2 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default DrillDownSheet;
