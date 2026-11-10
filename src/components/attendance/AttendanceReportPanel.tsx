import { useMemo, useState } from "react";
import { format, startOfMonth, startOfYear, subDays } from "date-fns";
import { Calendar, Download, FileText, Loader2, Search } from "lucide-react";
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

type PeriodPreset = "weekly" | "monthly" | "yearly" | "custom";

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

export default function AttendanceReportPanel() {
  const { toast } = useToast();
  const initial = periodForPreset("weekly");
  const [preset, setPreset] = useState<PeriodPreset>("weekly");
  const [startDate, setStartDate] = useState(initial.start);
  const [endDate, setEndDate] = useState(initial.end);
  const [department, setDepartment] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);
  const [report, setReport] = useState<any>(null);

  const rows: ReportRow[] = Array.isArray(report?.by_employee) ? report.by_employee : [];
  const summary = report?.summary ?? {};

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const haystack = [
        row.employee_name,
        row.employee_code,
        row.department,
      ]
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
        department: department.trim() || undefined,
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
      toast({
        title: "Report failed",
        description: error?.data?.message || error?.message || "Could not load the attendance report.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportFile = async (kind: "csv" | "pdf") => {
    setExporting(kind);
    try {
      const filters = { department: department.trim() || undefined };
      const blob =
        kind === "csv"
          ? await apiService.exportAttendanceReportCsv(startDate, endDate, filters)
          : await apiService.exportAttendanceReportPdf(startDate, endDate, filters);
      downloadBlob(blob, `attendance_report_${startDate}_${endDate}.${kind}`);
      toast({
        title: kind === "csv" ? "CSV downloaded" : "PDF downloaded",
        description: "Export uses the same calculated dataset as the on-screen preview.",
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Export failed",
        description: error?.message || `Could not download the ${kind.toUpperCase()} report.`,
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5" />
          Attendance Reports
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Preview weekly, monthly, yearly, or custom attendance before exporting CSV or PDF.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
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
                <SelectItem value="custom">Custom range</SelectItem>
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
            <Label htmlFor="att-report-dept">Department filter</Label>
            <Input
              id="att-report-dept"
              placeholder="All departments"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
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
                Period {report.period?.start} to {report.period?.end} ({report.period?.timezone || "Africa/Lagos"}).
                Calendar days: {report.period?.calendar_days ?? "—"}.
              </p>
              <p>
                Attendance rate uses eligible scheduled working days (scheduled − approved leave − unrecorded days),
                not raw calendar days. Clock-in without clock-out still counts as present.
              </p>
              {(summary.days_unrecorded ?? 0) > 0 && (
                <p>
                  {summary.days_unrecorded} scheduled day(s) fall before attendance tracking began and are excluded
                  from absences and the rate denominator.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Search employees"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  disabled={!!exporting}
                  onClick={() => exportFile("csv")}
                >
                  {exporting === "csv" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Download CSV
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  disabled={!!exporting}
                  onClick={() => exportFile("pdf")}
                >
                  {exporting === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  Download PDF
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
