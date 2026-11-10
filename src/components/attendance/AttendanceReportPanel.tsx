import { useEffect, useMemo, useState } from "react";
import { format, startOfMonth, startOfYear, subDays } from "date-fns";
import { Calendar, Download, FileSpreadsheet, FileText, Loader2, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useToast } from "@/hooks/use-toast";
import apiService from "@/lib/api";
import { todayWAT } from "@/lib/attendanceUi";
import { DEPARTMENTS } from "@/constants/departments";

export type PeriodPreset = "weekly" | "monthly" | "yearly" | "custom";

type ReportRow = {
  employee_id?: number;
  employee_code?: string;
  employee_name?: string;
  department?: string;
  scheduled_working_days?: number;
  days_present?: number;
  days_absent?: number;
  days_unrecorded?: number;
  days_on_leave?: number;
  late_arrivals?: number;
  wfh_days?: number;
  onsite_days?: number;
  hours_worked?: number;
  eligible_working_days?: number;
  attendance_rate?: number | null;
  location_review_days?: number;
};

type ExportKind = "pdf" | "xlsx" | "csv";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function periodForPreset(preset: PeriodPreset): { start: string; end: string } {
  const end = todayWAT();
  const endDate = new Date(`${end}T12:00:00`);
  if (preset === "weekly") {
    return { start: format(subDays(endDate, 7), "yyyy-MM-dd"), end };
  }
  if (preset === "monthly") {
    return { start: format(startOfMonth(endDate), "yyyy-MM-dd"), end };
  }
  if (preset === "yearly") {
    return { start: format(startOfYear(endDate), "yyyy-MM-dd"), end };
  }
  return { start: format(startOfMonth(endDate), "yyyy-MM-dd"), end };
}

function rateLabel(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "N/A";
  return `${value}%`;
}

function friendlyError(error: any, fallback: string): string {
  const message = String(error?.data?.message || error?.message || "").trim();
  if (!message) return fallback;
  if (/SQLSTATE|Undefined column|pgsql|relation |stack trace/i.test(message)) {
    return fallback;
  }
  return message;
}

type Props = {
  initialPreset?: PeriodPreset;
  standalone?: boolean;
};

export default function AttendanceReportPanel({
  initialPreset = "weekly",
  standalone = false,
}: Props) {
  const { toast } = useToast();
  const initial = periodForPreset(initialPreset);
  const [preset, setPreset] = useState<PeriodPreset>(initialPreset);
  const [startDate, setStartDate] = useState(initial.start);
  const [endDate, setEndDate] = useState(initial.end);
  const [department, setDepartment] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [exportKind, setExportKind] = useState<ExportKind>("pdf");
  const [exporting, setExporting] = useState(false);
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    const range = periodForPreset(initialPreset);
    setPreset(initialPreset);
    setStartDate(range.start);
    setEndDate(range.end);
    setReport(null);
  }, [initialPreset]);

  const rows: ReportRow[] = Array.isArray(report?.by_employee) ? report.by_employee : [];
  const summary = report?.summary ?? {};

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const haystack = [row.employee_name, row.employee_code, row.department]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, search]);

  const applyPreset = (next: PeriodPreset) => {
    setPreset(next);
    if (next === "custom") return;
    const range = periodForPreset(next);
    setStartDate(range.start);
    setEndDate(range.end);
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await apiService.getAttendanceReport(startDate, endDate, {
        department: department === "all" ? undefined : department,
      });
      setReport(data);
      if (!Array.isArray(data?.by_employee) || data.by_employee.length === 0) {
        toast({
          title: "No employees in scope",
          description: "No employees matched this period and filters.",
        });
      }
    } catch (error: any) {
      console.error(error);
      setReport(null);
      toast({
        title: "Report failed",
        description: friendlyError(
          error,
          "Could not load the attendance report. Please try again.",
        ),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportFile = async () => {
    if (!report) {
      toast({
        title: "Preview required",
        description: "Preview the report before downloading.",
        variant: "destructive",
      });
      return;
    }
    setExporting(true);
    try {
      const filters = { department: department === "all" ? undefined : department };
      let blob: Blob;
      let ext: string;
      if (exportKind === "pdf") {
        blob = await apiService.exportAttendanceReportPdf(startDate, endDate, filters);
        ext = "pdf";
      } else if (exportKind === "xlsx") {
        blob = await apiService.exportAttendanceReportXlsx(startDate, endDate, filters);
        ext = "xlsx";
      } else {
        blob = await apiService.exportAttendanceReportCsv(startDate, endDate, filters);
        ext = "csv";
      }
      downloadBlob(blob, `attendance_report_${startDate}_${endDate}.${ext}`);
      toast({
        title: `${ext.toUpperCase()} downloaded`,
        description: "Export uses the same calculated dataset as the on-screen preview.",
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Export failed",
        description: friendlyError(
          error,
          `Could not download the ${exportKind.toUpperCase()} report.`,
        ),
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card className="border-border/50">
      {!standalone && (
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Attendance Reports
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={standalone ? "pt-6 space-y-6" : "space-y-6"}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-2">
            <Label>Period</Label>
            <Select value={preset} onValueChange={(v) => applyPreset(v as PeriodPreset)}>
              <SelectTrigger>
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
                <SelectItem value="custom">Custom date range</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="att-report-start">Start date</Label>
            <Input
              id="att-report-start"
              type="date"
              value={startDate}
              onChange={(e) => {
                setPreset("custom");
                setStartDate(e.target.value);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="att-report-end">End date</Label>
            <Input
              id="att-report-end"
              type="date"
              value={endDate}
              onChange={(e) => {
                setPreset("custom");
                setEndDate(e.target.value);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Department</Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="All departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={loadReport} disabled={loading} className="w-full gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
              Preview report
            </Button>
          </div>
        </div>

        {report && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryTile label="Employees" value={String(summary.employee_count ?? rows.length)} />
              <SummaryTile label="Days present" value={String(summary.days_present ?? 0)} />
              <SummaryTile label="Days absent" value={String(summary.days_absent ?? 0)} />
              <SummaryTile label="Attendance rate" value={rateLabel(summary.attendance_rate)} />
              <SummaryTile label="WFH days" value={String(summary.wfh_days ?? 0)} />
              <SummaryTile label="On-site days" value={String(summary.onsite_days ?? 0)} />
              <SummaryTile label="Hours worked" value={String(summary.hours_worked ?? 0)} />
              <SummaryTile label="Eligible working days" value={String(summary.eligible_working_days ?? 0)} />
            </div>

            <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
              <p>
                Period {report.period?.start} to {report.period?.end} (
                {report.period?.timezone || "Africa/Lagos"}). Calendar days:{" "}
                {report.period?.calendar_days ?? "—"}.
              </p>
              <p>
                Attendance rate uses eligible scheduled working days (scheduled − approved leave −
                unrecorded days). Clock-in without clock-out still counts as present.
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Search employees"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <div className="space-y-1">
                  <Label>Export format</Label>
                  <Select value={exportKind} onValueChange={(v) => setExportKind(v as ExportKind)}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                      <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                      <SelectItem value="csv">CSV (optional)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="gap-2" disabled={exporting} onClick={exportFile}>
                  {exporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : exportKind === "xlsx" ? (
                    <FileSpreadsheet className="h-4 w-4" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Download
                </Button>
              </div>
            </div>

            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Dept</TableHead>
                    <TableHead className="text-right">Sched.</TableHead>
                    <TableHead className="text-right">Present</TableHead>
                    <TableHead className="text-right">Absent</TableHead>
                    <TableHead className="text-right">Leave</TableHead>
                    <TableHead className="text-right">Late</TableHead>
                    <TableHead className="text-right">WFH</TableHead>
                    <TableHead className="text-right">On-site</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                        No attendance rows match the current search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRows.map((row) => (
                      <TableRow key={`${row.employee_id}-${row.employee_code}`}>
                        <TableCell>
                          <div className="font-medium">{row.employee_name}</div>
                          <div className="text-xs text-muted-foreground">{row.employee_code}</div>
                        </TableCell>
                        <TableCell>{row.department || "—"}</TableCell>
                        <TableCell className="text-right">{row.scheduled_working_days ?? 0}</TableCell>
                        <TableCell className="text-right">{row.days_present ?? 0}</TableCell>
                        <TableCell className="text-right">{row.days_absent ?? 0}</TableCell>
                        <TableCell className="text-right">{row.days_on_leave ?? 0}</TableCell>
                        <TableCell className="text-right">{row.late_arrivals ?? 0}</TableCell>
                        <TableCell className="text-right">{row.wfh_days ?? 0}</TableCell>
                        <TableCell className="text-right">{row.onsite_days ?? 0}</TableCell>
                        <TableCell className="text-right">{row.hours_worked ?? 0}</TableCell>
                        <TableCell className="text-right">{rateLabel(row.attendance_rate)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-background px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}
