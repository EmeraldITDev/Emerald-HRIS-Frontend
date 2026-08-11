import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClipboardCheck, RefreshCw } from "lucide-react";
import apiService from "@/lib/api";
import { format } from "date-fns";

type Kind = "early_clockout";

interface Req {
  id: number | string;
  employee_id: number;
  reason: string;
  requested_at: string;
  status: string;
  approver_notes?: string | null;
  kind: Kind;
}

function normalize(rows: any, kind: Kind, employeeId: number): Req[] {
  const r = rows as any;
  let arr: any[] = [];
  if (Array.isArray(r)) arr = r;
  else if (r && typeof r === "object") {
    if (Array.isArray(r.data)) arr = r.data;
    else if (r.data && Array.isArray(r.data.data)) arr = r.data.data;
  }
  return arr
    .filter((x: any) => Number(x.employee_id) === Number(employeeId))
    .map((x: any) => ({ ...x, kind }));
}

function statusBadge(status: string) {
  const s = (status || "pending").toLowerCase();
  if (s === "approved") return <Badge className="bg-success/10 text-success border-success/20">Approved</Badge>;
  if (s === "rejected") return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Rejected</Badge>;
  return <Badge className="bg-warning/10 text-warning border-warning/20">Awaiting HR Approval</Badge>;
}

interface Props {
  employeeId: number | null;
}

export function MyAttendanceRequestsCard({ employeeId }: Props) {
  const [items, setItems] = useState<Req[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const early = await apiService
        .getEarlyClockoutRequests({ employee_id: employeeId })
        .catch(() => []);
      const merged = normalize(early, "early_clockout", employeeId).sort((a, b) =>
        a.requested_at < b.requested_at ? 1 : -1,
      );
      setItems(merged);
    } catch (e) {
      console.error("Failed to load my attendance requests", e);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!employeeId) return null;

  return (
    <Card className="border-border/50 shadow-sm mb-6">
      <CardHeader>
        <CardTitle className="text-primary flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            My Early Clock-Out Requests
            {items.some((i) => (i.status || "pending").toLowerCase() === "pending") && (
              <Badge variant="secondary" className="ml-2">
                {items.filter((i) => (i.status || "pending").toLowerCase() === "pending").length} pending
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Loading your requests…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You have no early clock-out approval requests.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Requested At</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>HR Notes</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((r) => (
                  <TableRow key={`${r.kind}-${r.id}`}>
                    <TableCell>
                      <Badge variant="outline">Early Clock-Out</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {(() => {
                        try { return format(new Date(r.requested_at), "MMM d, yyyy HH:mm"); }
                        catch { return r.requested_at; }
                      })()}
                    </TableCell>
                    <TableCell className="max-w-xs text-sm text-muted-foreground">{r.reason}</TableCell>
                    <TableCell className="max-w-xs text-sm text-muted-foreground">
                      {r.approver_notes || <span className="opacity-50">—</span>}
                    </TableCell>
                    <TableCell className="text-right">{statusBadge(r.status)}</TableCell>
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

export default MyAttendanceRequestsCard;