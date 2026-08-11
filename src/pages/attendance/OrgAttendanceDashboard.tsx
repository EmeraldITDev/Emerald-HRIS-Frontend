import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Eye, Flag, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { canViewOrgDashboard } from "@/lib/permissions";
import { DEPARTMENTS } from "@/constants/departments";
import apiService from "@/lib/api";
import {
  AttendanceStatusBadge,
  extractRows,
  formatTimeWithZone,
  locationStatusLabel,
  todayWAT,
} from "@/lib/attendanceUi";
import { useToast } from "@/hooks/use-toast";

const LOCATIONS = ["Lagos", "Calabar", "Abuja"];
const MODES = ["Physical", "WFH", "Exception"];
const STATUSES = ["Present", "Absent", "Late", "Mismatch"];

type ChipKey =
  | "total"
  | "present_physical"
  | "present_wfh"
  | "absent"
  | "exception"
  | "unapproved_wfh"
  | "location_mismatch";

function matchesChip(row: any, chip: ChipKey): boolean {
  const status = String(row.attendance_status || "").toLowerCase();
  const mode = String(row.actual_mode || row.work_mode || "").toLowerCase();
  switch (chip) {
    case "present_physical":
      return status === "present-physical" || (status.startsWith("present") && mode === "physical");
    case "present_wfh":
      return status === "present-wfh" || (status.startsWith("present") && mode === "wfh");
    case "absent":
      return status === "absent" || (!row.clock_in && status !== "present-wfh");
    case "exception":
      return mode === "exception" || !!row.exception;
    case "unapproved_wfh":
      return status === "unapproved-wfh";
    case "location_mismatch":
      return status === "location-mismatch" || String(row.location_status || "").toLowerCase() === "mismatch";
    default:
      return true;
  }
}

export default function OrgAttendanceDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(todayWAT());
  const [locations, setLocations] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [mode, setMode] = useState("All");
  const [status, setStatus] = useState("All");
  const [chip, setChip] = useState<ChipKey>("total");
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.getOrgAttendanceDashboard({
        date,
        mode,
        status,
      });
      const payload: any = (res as any)?.data ?? res;
      setRows(extractRows(payload?.rows ? payload.rows : res));
    } catch (e) {
      console.error("Failed to load org attendance dashboard:", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [date, mode, status]);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-refresh every 5 minutes while the page is open.
  useEffect(() => {
    const id = window.setInterval(load, 5 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [load]);

  const filteredRows = useMemo(
    () =>
      rows.filter((r) => {
        if (locations.length > 0 && !locations.includes(String(r.assigned_location || ""))) {
          return false;
        }
        if (departments.length > 0 && !departments.includes(String(r.department || ""))) {
          return false;
        }
        return true;
      }),
    [rows, locations, departments],
  );

  const counts = useMemo(
    () => ({
      total: filteredRows.length,
      present_physical: filteredRows.filter((r) => matchesChip(r, "present_physical")).length,
      present_wfh: filteredRows.filter((r) => matchesChip(r, "present_wfh")).length,
      absent: filteredRows.filter((r) => matchesChip(r, "absent")).length,
      exception: filteredRows.filter((r) => matchesChip(r, "exception")).length,
      unapproved_wfh: filteredRows.filter((r) => matchesChip(r, "unapproved_wfh")).length,
      location_mismatch: filteredRows.filter((r) => matchesChip(r, "location_mismatch")).length,
    }),
    [filteredRows],
  );

  const visibleRows = useMemo(
    () => (chip === "total" ? filteredRows : filteredRows.filter((r) => matchesChip(r, chip))),
    [filteredRows, chip],
  );

  const rowKey = (r: any, i: number) => String(r.employee_id ?? r.id ?? i);

  const isLate = (r: any) =>
    String(r.attendance_status || r.status || "").toLowerCase().includes("late");

  const toggleValue = (
    setter: (fn: (prev: string[]) => string[]) => void,
    value: string,
  ) =>
    setter((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );

  const downloadCsv = () => {
    const headers = [
      "Employee",
      "Employee ID",
      "Department",
      "Assigned Location",
      "Work Arrangement",
      "Expected Mode",
      "Actual Mode",
      "Clock-In",
      "Clock-Out",
      "Late",
      "Location Status",
      "Status",
      "Exception",
    ];
    const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = visibleRows.map((r: any) =>
      [
        r.employee_name ||
          [r.first_name, r.last_name].filter(Boolean).join(" ") ||
          `Employee #${r.employee_id}`,
        r.employee_code || r.employee_display || r.employee_id,
        r.department,
        r.assigned_location,
        r.work_arrangement,
        r.expected_mode,
        r.actual_mode || r.work_mode,
        formatTimeWithZone(r.clock_in),
        formatTimeWithZone(r.clock_out),
        isLate(r) ? "Late" : "On time",
        locationStatusLabel(r.location_status),
        r.attendance_status || "Absent",
        r.exception?.exception_type || r.exception_type,
      ]
        .map(esc)
        .join(","),
    );
    const csv = [headers.map(esc).join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `org-attendance-${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!canViewOrgDashboard(user)) return <Navigate to="/" replace />;

  const chips: { key: ChipKey; label: string; value: number }[] = [
    { key: "total", label: "Total Employees", value: counts.total },
    { key: "present_physical", label: "Present Physical", value: counts.present_physical },
    { key: "present_wfh", label: "Present WFH", value: counts.present_wfh },
    { key: "absent", label: "Absent", value: counts.absent },
    { key: "exception", label: "On Exception", value: counts.exception },
    { key: "unapproved_wfh", label: "Unapproved WFH", value: counts.unapproved_wfh },
    { key: "location_mismatch", label: "Location Mismatch", value: counts.location_mismatch },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Org-Wide Attendance
          </h1>
          <p className="text-sm text-muted-foreground">
            Every employee for {date} — including those who never clocked in.
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <button key={c.key} type="button" onClick={() => setChip(c.key)}>
            <Badge
              variant={chip === c.key ? "default" : "outline"}
              className="px-3 py-2 text-sm cursor-pointer"
            >
              {c.label}: {c.value}
            </Badge>
          </button>
        ))}
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-primary">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-5">
          <div className="space-y-1">
            <Label htmlFor="org-date">Date</Label>
            <Input
              id="org-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Location</Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                {LOCATIONS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Department</Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Work Mode</Label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                {MODES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-primary">
            Attendance ({visibleRows.length} employees)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {visibleRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {loading ? "Loading attendance…" : "No employees match the current filters."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Assigned Location</TableHead>
                    <TableHead>Expected Mode</TableHead>
                    <TableHead>Actual Mode</TableHead>
                    <TableHead>Clock-In</TableHead>
                    <TableHead>Clock-Out</TableHead>
                    <TableHead>Location Status</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Exception</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleRows.map((r: any, i: number) => (
                    <TableRow key={r.employee_id ?? r.id ?? i}>
                      <TableCell className="font-medium">
                        {r.employee_name ||
                          [r.first_name, r.last_name].filter(Boolean).join(" ") ||
                          `Employee #${r.employee_id}`}
                        <div className="text-xs text-muted-foreground">
                          {r.employee_code || r.employee_display || r.employee_id}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{r.department || "—"}</TableCell>
                      <TableCell className="text-sm">{r.assigned_location || "—"}</TableCell>
                      <TableCell className="text-sm">{r.expected_mode || "—"}</TableCell>
                      <TableCell className="text-sm">{r.actual_mode || r.work_mode || "—"}</TableCell>
                      <TableCell className="text-sm">{formatTimeWithZone(r.clock_in) || "—"}</TableCell>
                      <TableCell className="text-sm">{formatTimeWithZone(r.clock_out) || "—"}</TableCell>
                      <TableCell className="text-sm">
                        {locationStatusLabel(r.location_status)}
                      </TableCell>
                      <TableCell>
                        <AttendanceStatusBadge status={r.attendance_status || "Absent"} compact />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[12rem]">
                        {r.exception?.exception_type || r.exception_type || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              toast({
                                title:
                                  r.employee_name ||
                                  `Employee #${r.employee_id}` ,
                                description: `${r.attendance_status || "Absent"} · ${
                                  r.actual_mode || r.work_mode || "No mode"
                                } · In ${formatTimeWithZone(r.clock_in) || "—"} · Out ${
                                  formatTimeWithZone(r.clock_out) || "—"
                                }`,
                              })
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              toast({
                                title: "Flagged for review",
                                description: `${
                                  r.employee_name || `Employee #${r.employee_id}`
                                } was flagged for HR follow-up.`,
                              })
                            }
                          >
                            <Flag className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}