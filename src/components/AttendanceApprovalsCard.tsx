import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bell, Check, X, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { canHrPayroll } from "@/lib/permissions";
import apiService from "@/lib/api";
import { format } from "date-fns";

type RequestKind = "late_clockin" | "early_clockout";

interface PendingRequest {
  id: number | string;
  employee_id: number;
  employee_name?: string;
  employee?: { first_name?: string; last_name?: string; employee_id?: string; department?: string };
  reason: string;
  requested_at: string;
  status: string;
  kind: RequestKind;
}

function normalize(rows: any, kind: RequestKind): PendingRequest[] {
  const r = rows as any;
  let arr: any[] = [];
  if (Array.isArray(r)) arr = r;
  else if (r && typeof r === "object") {
    if (Array.isArray(r.data)) arr = r.data;
    else if (r.data && Array.isArray(r.data.data)) arr = r.data.data;
  }
  return arr
    .filter((x: any) => (x.status || "pending") === "pending")
    .map((x: any) => ({ ...x, kind }));
}

function employeeLabel(r: PendingRequest): string {
  if (r.employee_name) return r.employee_name;
  const e = r.employee;
  if (e) {
    const name = [e.first_name, e.last_name].filter(Boolean).join(" ").trim();
    return name || e.employee_id || `Employee #${r.employee_id}`;
  }
  return `Employee #${r.employee_id}`;
}

export function AttendanceApprovalsCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [action, setAction] = useState<"approve" | "reject">("approve");
  const [active, setActive] = useState<PendingRequest | null>(null);
  const [notes, setNotes] = useState("");

  const visible = canHrPayroll(user);

  const load = useCallback(async () => {
    if (!visible) return;
    setLoading(true);
    try {
      const [late, early] = await Promise.all([
        apiService.getLateClockinRequests({ status: "pending" }).catch(() => []),
        apiService.getEarlyClockoutRequests({ status: "pending" }).catch(() => []),
      ]);
      const merged = [
        ...normalize(late, "late_clockin"),
        ...normalize(early, "early_clockout"),
      ].sort((a, b) => (a.requested_at < b.requested_at ? 1 : -1));
      setRequests(merged);
    } catch (e: any) {
      console.error("Failed to load attendance approvals", e);
    } finally {
      setLoading(false);
    }
  }, [visible]);

  useEffect(() => {
    load();
  }, [load]);

  if (!visible) return null;

  const open = (req: PendingRequest, act: "approve" | "reject") => {
    setActive(req);
    setAction(act);
    setNotes("");
    setDialogOpen(true);
  };

  const submit = async () => {
    if (!active) return;
    if (action === "reject" && !notes.trim()) {
      toast({ title: "Reason required", description: "Please provide a reason for rejection.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      if (active.kind === "late_clockin") {
        if (action === "approve") await apiService.approveLateClockinRequest(active.id, notes || undefined);
        else await apiService.rejectLateClockinRequest(active.id, notes);
      } else {
        if (action === "approve") await apiService.approveEarlyClockoutRequest(active.id, notes || undefined);
        else await apiService.rejectEarlyClockoutRequest(active.id, notes);
      }
      toast({
        title: action === "approve" ? "Request approved" : "Request rejected",
        description: `${employeeLabel(active)} has been notified.`,
      });
      setDialogOpen(false);
      setActive(null);
      setNotes("");
      await load();
    } catch (e: any) {
      toast({ title: "Action failed", description: e?.message || "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-border/50 shadow-sm mb-6" id="attendance-approvals">
      <CardHeader>
        <CardTitle className="text-primary flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Attendance Approvals
            {requests.length > 0 && (
              <Badge variant="destructive" className="ml-2">{requests.length} pending</Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">Loading pending requests…</p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending late clock-in or early clock-out requests.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Requested At</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => (
                  <TableRow key={`${r.kind}-${r.id}`}>
                    <TableCell className="font-medium">{employeeLabel(r)}</TableCell>
                    <TableCell>
                      <Badge variant={r.kind === "late_clockin" ? "secondary" : "outline"}>
                        {r.kind === "late_clockin" ? "Late Clock-In" : "Early Clock-Out"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {(() => {
                        try { return format(new Date(r.requested_at), "MMM d, yyyy HH:mm"); }
                        catch { return r.requested_at; }
                      })()}
                    </TableCell>
                    <TableCell className="max-w-xs text-sm text-muted-foreground">{r.reason}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="default" onClick={() => open(r, "approve")}>
                          <Check className="h-4 w-4 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => open(r, "reject")}>
                          <X className="h-4 w-4 mr-1" /> Reject
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "approve" ? "Approve" : "Reject"}{" "}
              {active?.kind === "late_clockin" ? "Late Clock-In" : "Early Clock-Out"} Request
            </DialogTitle>
            <DialogDescription>
              {active ? `${employeeLabel(active)} — ${active.reason}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Notes {action === "reject" ? "(required)" : "(optional)"}
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={action === "approve" ? "Add an optional note…" : "Explain why this is being rejected…"}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant={action === "approve" ? "default" : "destructive"}
              onClick={submit}
              disabled={submitting}
            >
              {submitting ? "Submitting…" : action === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default AttendanceApprovalsCard;