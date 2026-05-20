import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Check, X, ShieldCheck, UserCheck, Paperclip } from "lucide-react";
import { apiService } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { canHrApproveLeave } from "@/lib/permissions";

type Stage = "manager" | "hr";

export default function LeaveApprovals() {
  const { user } = useAuth();
  const isHR = canHrApproveLeave(user);
  const isLineManager = user?.role === "line_manager";
  const [searchParams, setSearchParams] = useSearchParams();
  const stageParam = searchParams.get("stage") as Stage | null;
  const focusId = searchParams.get("id");
  const defaultStage: Stage =
    stageParam === "manager" || stageParam === "hr"
      ? stageParam
      : isLineManager && !isHR
      ? "manager"
      : "hr";

  const [stage, setStage] = useState<Stage>(defaultStage);
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<{ open: boolean; action: "approve" | "reject"; row: any | null }>({
    open: false, action: "approve", row: null,
  });
  const [notes, setNotes] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res: any =
        stage === "manager"
          ? await apiService.getPendingLeaveForLineManager()
          : await apiService.getPendingLeaveForHR();
      const raw: any[] = res?.data || [];
      // Defensive dedupe: backend JOINs (e.g. on leave_documents) can produce
      // duplicate rows for the same leave request. Collapse by request id.
      const seen = new Set<string>();
      const deduped = raw.filter((r) => {
        const key = String(r?.id ?? `${r?.employee_id}-${r?.start_date}-${r?.end_date}`);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setItems(deduped);
    } catch (e: any) {
      toast({ title: "Failed to load", description: e?.message, variant: "destructive" });
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [stage]);

  // Scroll to / highlight the focused request after items load
  useEffect(() => {
    if (!focusId || loading) return;
    const el = rowRefs.current[String(focusId)];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [focusId, loading, items]);

  const openDialog = (row: any, action: "approve" | "reject") => {
    setNotes("");
    setDialog({ open: true, action, row });
  };

  const submit = async () => {
    if (!dialog.row) return;
    const id = dialog.row.id;
    try {
      if (dialog.action === "reject" && !notes.trim()) {
        toast({ title: "Rejection reason required", variant: "destructive" });
        return;
      }
      if (stage === "manager") {
        if (dialog.action === "approve") await apiService.approveLeaveByLineManager(id, notes);
        else await apiService.rejectLeaveByLineManager(id, notes);
      } else {
        if (dialog.action === "approve") await apiService.approveLeaveByHR(id, notes);
        else await apiService.rejectLeaveByHR(id, notes);
      }
      // On FINAL approval (HR stage) the backend automatically deducts the
      // requested days from EmployeeLeaveBalance AND syncs the value back to
      // employees.vacation_days (see HRIS doc § Leave balance).
      // Hit /leave/balance/{id} once so the server recalculates and so we can
      // surface the new remaining figure in the toast and refresh views.
      let balanceMsg: string | undefined;
      if (stage === "hr" && dialog.action === "approve") {
        try {
          const empId = Number(dialog.row.employee_id);
          if (empId) {
            const bal: any = await apiService.getLeaveBalance(empId);
            const remaining =
              bal?.remaining ??
              bal?.summary?.vacation_days_remaining ??
              bal?.vacation_days_remaining;
            if (typeof remaining === "number") {
              balanceMsg = `Remaining balance: ${remaining} days`;
            }
          }
        } catch (err: any) {
          balanceMsg = `Balance sync failed: ${err?.message || "unknown error"}`;
        }
      }
      toast({
        title: `Leave ${dialog.action === "approve" ? "approved" : "rejected"}`,
        description: balanceMsg,
      });
      setDialog({ open: false, action: "approve", row: null });
      load();
    } catch (e: any) {
      toast({ title: "Action failed", description: e?.message, variant: "destructive" });
    }
  };

  const renderTable = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {stage === "manager" ? "Awaiting line-manager approval" : "Awaiting HR approval"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending requests</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Attachments</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((r) => (
                <TableRow
                  key={r.id}
                  ref={(el) => (rowRefs.current[String(r.id)] = el)}
                  className={focusId && String(r.id) === String(focusId) ? "bg-primary/10" : undefined}
                >
                  <TableCell className="font-medium">{r.employee_display || r.employee_name || `Employee ${r.employee_id}`}</TableCell>
                  <TableCell className="text-sm">{r.start_date} → {r.end_date}</TableCell>
                  <TableCell>{r.days_requested}</TableCell>
                  <TableCell className="max-w-[240px] truncate text-sm">{r.reason || "—"}</TableCell>
                  <TableCell className="text-sm">
                    {(() => {
                      const docs: any[] =
                        r.documents ||
                        r.attachments ||
                        r.leave_documents ||
                        [];
                      if (!Array.isArray(docs) || docs.length === 0) {
                        return <span className="text-muted-foreground">—</span>;
                      }
                      return (
                        <div className="flex flex-col gap-1 max-w-[200px]">
                          {docs.map((d: any, i: number) => {
                            const url =
                              d.url || d.file_url || d.download_url || d.path || d.s3_url;
                            const name =
                              d.name ||
                              d.file_name ||
                              d.original_name ||
                              d.document_type ||
                              `Attachment ${i + 1}`;
                            return url ? (
                              <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-primary hover:underline truncate"
                                title={name}
                              >
                                <Paperclip className="h-3 w-3 shrink-0" />
                                <span className="truncate">{name}</span>
                              </a>
                            ) : (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 text-muted-foreground truncate"
                                title={name}
                              >
                                <Paperclip className="h-3 w-3 shrink-0" />
                                <span className="truncate">{name}</span>
                              </span>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{r.workflow_status || r.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="default" className="mr-2" onClick={() => openDialog(r, "approve")}>
                      <Check className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => openDialog(r, "reject")}>
                      <X className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  const showTabs = isLineManager && isHR;

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Leave Approvals</h1>
      </div>

      {(isLineManager || isHR) ? (
        showTabs ? (
          <Tabs value={stage} onValueChange={(v) => setStage(v as Stage)}>
            <TabsList>
              <TabsTrigger value="manager"><UserCheck className="h-4 w-4 mr-2" />Line Manager Queue</TabsTrigger>
              <TabsTrigger value="hr"><ShieldCheck className="h-4 w-4 mr-2" />HR Queue</TabsTrigger>
            </TabsList>
            <TabsContent value={stage} className="mt-4">{renderTable()}</TabsContent>
          </Tabs>
        ) : (
          renderTable()
        )
      ) : (
        <Card><CardContent className="py-6 text-sm text-muted-foreground">You don't have access to leave approvals.</CardContent></Card>
      )}

      <Dialog open={dialog.open} onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog.action === "approve" ? "Approve" : "Reject"} leave request</DialogTitle>
            <DialogDescription>
              {dialog.row?.employee_display || dialog.row?.employee_name} · {dialog.row?.start_date} → {dialog.row?.end_date} ({dialog.row?.days_requested} days)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>
              {dialog.action === "approve" ? "Notes (optional)" : "Rejection reason (required)"}
            </Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog((d) => ({ ...d, open: false }))}>Cancel</Button>
            <Button variant={dialog.action === "approve" ? "default" : "destructive"} onClick={submit}>
              {dialog.action === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}