import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ClipboardList, RefreshCw } from "lucide-react";
import apiService from "@/lib/api";
import { extractRows } from "@/lib/attendanceUi";

interface Props {
  employeeId: number | null;
  refreshKey?: number | string;
}

function statusBadge(status?: string) {
  const s = String(status || "").toLowerCase();
  if (s.includes("pending_manager") || s === "pending manager approval" || s === "pending") {
    return <Badge className="bg-warning/10 text-warning border-warning/20">Pending Manager Approval</Badge>;
  }
  if (s.includes("pending_hr") || s.includes("hr")) {
    return <Badge className="bg-warning/10 text-warning border-warning/20">Pending HR Approval</Badge>;
  }
  if (s.includes("approved")) {
    return <Badge className="bg-success/10 text-success border-success/20">Approved</Badge>;
  }
  if (s.includes("reject")) {
    return <Badge variant="destructive">Rejected</Badge>;
  }
  return <Badge variant="secondary">{status || "Unknown"}</Badge>;
}

export function MyWorkRequestsCard({ employeeId, refreshKey }: Props) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const [exceptions, wfh] = await Promise.all([
        apiService.getExceptionRequests({ employee_id: employeeId }).catch(() => []),
        apiService.getWFHRequests({ employee_id: employeeId }).catch(() => []),
      ]);
      const merged = [
        ...extractRows(exceptions).map((r: any) => ({
          ...r,
          _kind: "Exception",
          _label: r.exception_type || "Exception",
          _dates: [r.start_date, r.end_date].filter(Boolean).join(" → "),
          _reason: r.description || r.reason,
        })),
        ...extractRows(wfh).map((r: any) => ({
          ...r,
          _kind: "WFH",
          _label: "Work From Home",
          _dates: r.date,
          _reason: r.reason,
        })),
      ].sort((a, b) =>
        String(b.created_at || b.start_date || b.date || "").localeCompare(
          String(a.created_at || a.start_date || a.date || ""),
        ),
      );
      setRows(merged);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  if (!employeeId) return null;

  return (
    <Card className="border-border/50 shadow-sm mb-6">
      <CardHeader>
        <CardTitle className="text-primary flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            My Work Exception & WFH Requests
          </span>
          <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading your requests…" : "You have not submitted any requests yet."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Date(s)</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={`${r._kind}-${r.id}`}>
                    <TableCell className="font-medium">{r._label}</TableCell>
                    <TableCell className="text-sm">{r._dates}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs">
                      {r._reason}
                    </TableCell>
                    <TableCell>{statusBadge(r.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MyWorkRequestsCard;