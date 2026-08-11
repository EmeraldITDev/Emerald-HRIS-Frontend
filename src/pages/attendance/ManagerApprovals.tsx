import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, FileText, RefreshCw, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { canApproveAttendance, canHrPayroll } from "@/lib/permissions";
import apiService from "@/lib/api";
import { extractRows } from "@/lib/attendanceUi";

type Kind = "late" | "exception" | "wfh";

interface Row {
  id: number | string;
  kind: Kind;
  employee: string;
  employeeId?: string | number;
  typeLabel: string;
  dates: string;
  reason: string;
  document?: string | null;
}

function employeeLabel(r: any): string {
  if (r.employee_name) return r.employee_name;
  const e = r.employee;
  if (e) {
    const name = [e.first_name, e.last_name].filter(Boolean).join(" ").trim();
    return name || e.employee_id || `Employee #${r.employee_id}`;
  }
  return `Employee #${r.employee_id}`;
}

export default function ManagerApprovals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isHr = canHrPayroll(user) || user?.role === "executive";
  const [late, setLate] = useState<Row[]>([]);
  const [exceptions, setExceptions] = useState<Row[]>([]);
  const [wfh, setWfh] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [action, setAction] = useState<"approve" | "reject">("approve");
  const [active, setActive] = useState<Row | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [lateRes, excRes, wfhRes] = await Promise.all([
        apiService.getLateClockinRequests({ status: "pending" }).catch(() => []),
        apiService
          .getExceptionRequests(isHr ? { scope: "pending-hr" } : { scope: "pending-manager" })
          .catch(() => []),
        apiService.getWFHRequests({ status: "pending" }).catch(() => []),
      ]);
      setLate(
        extractRows(lateRes).map((r: any) => ({
          id: r.id,
          kind: "late" as Kind,
          employee: employeeLabel(r),
          employeeId: r.employee?.employee_id || r.employee_id,
          typeLabel: "Late Clock-In",
          dates: r.requested_at || r.created_at || "",
          reason: r.reason,
        })),
      );
      setExceptions(
        extractRows(excRes).map((r: any) => ({
          id: r.id,
          kind: "exception" as Kind,
          employee: employeeLabel(r),
          employeeId: r.employee?.employee_id || r.employee_id,
          typeLabel: r.exception_type || "Exception",
          dates: [r.start_date, r.end_date].filter(Boolean).join(" → "),
          reason: r.description || r.reason || "",
          document: r.supporting_document_url || r.supporting_document || null,
        })),
      );
      setWfh(
        extractRows(wfhRes).map((r: any) => ({
          id: r.id,
          kind: "wfh" as Kind,
          employee: employeeLabel(r),
          employeeId: r.employee?.employee_id || r.employee_id,
          typeLabel: "Work From Home",
          dates: r.date || "",
          reason: r.reason || "",
        })),
      );
    } finally {
      setLoading(false);
    }
  }, [isHr]);

  useEffect(() => {
    load();
  }, [load]);

  if (!canApproveAttendance(user)) return <Navigate to="/" replace />;

  const openDialog = (row: Row, act: "approve" | "reject") => {
    setActive(row);
    setAction(act);
    setNotes("");
    setDialogOpen(true);
  };

  const submit = async () => {
    if (!active) return;
    if (action === "reject" && !notes.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a rejection reason.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      if (active.kind === "late") {
        if (action === "approve") await apiService.approveLateClockinRequest(active.id, notes || undefined);
        else await apiService.rejectLateClockinRequest(active.id, notes);
      } else if (active.kind === "exception") {
        if (isHr) {
          if (action === "approve") await apiService.approveExceptionHR(active.id, notes || undefined);
          else await apiService.rejectExceptionHR(active.id, notes);
        } else {
          if (action === "approve") await apiService.approveExceptionManager(active.id, notes || undefined);
          else await apiService.rejectExceptionManager(active.id, notes);
        }
      } else {
        if (action === "approve") await apiService.approveWFHRequest(active.id, notes || undefined);
        else await apiService.rejectWFHRequest(active.id, notes);
      }
      toast({
        title: action === "approve" ? "Request approved" : "Request rejected",
        description: `${active.employee} has been notified.`,
      });
      setDialogOpen(false);
      setActive(null);
      await load();
    } catch (e: any) {
      toast({
        title: "Action failed",
        description: e?.data?.message || e?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderTable = (rows: Row[], emptyText: string) =>
    rows.length === 0 ? (
      <p className="text-sm text-muted-foreground py-4">
        {loading ? "Loading requests…" : emptyText}
      </p>
    ) : (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date(s)</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Document</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={`${r.kind}-${r.id}`}>
                <TableCell className="font-medium">
                  {r.employee}
                  {r.employeeId && (
                    <div className="text-xs text-muted-foreground">{r.employeeId}</div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{r.typeLabel}</Badge>
                </TableCell>
                <TableCell className="text-sm">{r.dates}</TableCell>
                <TableCell className="max-w-xs text-sm text-muted-foreground">{r.reason}</TableCell>
                <TableCell>
                  {r.document ? (
                    <a
                      className="text-sm text-primary inline-flex items-center gap-1 underline"
                      href={r.document}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <FileText className="h-4 w-4" /> View
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" onClick={() => openDialog(r, "approve")}>
                      <Check className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => openDialog(r, "reject")}>
                      <X className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Attendance Approvals</h1>
          <p className="text-sm text-muted-foreground">
            Review late justifications, work exceptions and WFH requests from your team.
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-primary">Pending Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="late">
            <TabsList>
              <TabsTrigger value="late">Late Justifications ({late.length})</TabsTrigger>
              <TabsTrigger value="exception">Exception Requests ({exceptions.length})</TabsTrigger>
              <TabsTrigger value="wfh">WFH Requests ({wfh.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="late">
              {renderTable(late, "No pending late justifications.")}
            </TabsContent>
            <TabsContent value="exception">
              {renderTable(exceptions, "No pending exception requests.")}
            </TabsContent>
            <TabsContent value="wfh">{renderTable(wfh, "No pending WFH requests.")}</TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "approve" ? "Approve" : "Reject"} {active?.typeLabel}
            </DialogTitle>
            <DialogDescription>
              {active ? `${active.employee} — ${active.reason}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Notes {action === "reject" ? "(required)" : "(optional)"}
            </label>
            <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
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
    </div>
  );
}