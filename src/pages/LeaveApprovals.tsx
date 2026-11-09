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
import { canApproveAsLineManager, canHrApproveLeave } from "@/lib/permissions";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const API_BASE = (import.meta.env.VITE_API_URL as string) || "";

const formatDocType = (t?: string) =>
  (t || "document")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

type Stage = "manager" | "hr";

export default function LeaveApprovals() {
  const { user } = useAuth();
  const isHR = canHrApproveLeave(user);
  // Anyone with direct reports gets the line-manager queue, not only the line_manager role.
  const isLineManager = canApproveAsLineManager(user);
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

  // History (approved/rejected) state
  const [historyTab, setHistoryTab] = useState<"all" | "approved" | "rejected" | "pending">("all");
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const HISTORY_PAGE_SIZE = 10;

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data: any = await apiService.getLeaveRequests();
      const list: any[] = Array.isArray(data) ? data : (data?.data || []);
      setHistory(list);
    } catch (e) {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => { if (isHR || isLineManager) loadHistory(); /* eslint-disable-next-line */ }, [isHR, isLineManager]);

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
                            const rawPath = d.path || d.s3_path || "";
                            const url =
                              d.url ||
                              d.file_url ||
                              d.download_url ||
                              d.s3_url ||
                              (rawPath
                                ? `${API_BASE}/leave-documents/${encodeURIComponent(rawPath)}`
                                : undefined);
                            const filename =
                              d.filename ||
                              d.file_name ||
                              d.name ||
                              d.original_name ||
                              `Attachment ${i + 1}`;
                            const label = d.type
                              ? `${formatDocType(d.type)} — ${filename}`
                              : filename;
                            return url ? (
                              <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-primary hover:underline truncate"
                                title={label}
                              >
                                <Paperclip className="h-3 w-3 shrink-0" />
                                <span className="truncate">{label}</span>
                              </a>
                            ) : (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 text-muted-foreground truncate"
                                title={label}
                              >
                                <Paperclip className="h-3 w-3 shrink-0" />
                                <span className="truncate">{label}</span>
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

  const filteredHistory = history.filter((r) => {
    const status = String(r.workflow_status || r.status || "").toLowerCase();
    if (historyTab === "approved" && !status.includes("approved")) return false;
    if (historyTab === "rejected" && !status.includes("rejected")) return false;
    if (historyTab === "pending" && (status.includes("approved") || status.includes("rejected"))) return false;
    if (historySearch) {
      const hay = `${r.employee_display || r.employee_name || ""} ${r.reason || ""}`.toLowerCase();
      if (!hay.includes(historySearch.toLowerCase())) return false;
    }
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / HISTORY_PAGE_SIZE));
  const pageItems = filteredHistory.slice((historyPage - 1) * HISTORY_PAGE_SIZE, historyPage * HISTORY_PAGE_SIZE);

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

      {/* Leave History (approved / rejected / pending) */}
      {(isLineManager || isHR) && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="text-base">Leave Request History</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  placeholder="Search employee or reason…"
                  value={historySearch}
                  onChange={(e) => { setHistorySearch(e.target.value); setHistoryPage(1); }}
                  className="h-9 w-56"
                />
                <Select value={historyTab} onValueChange={(v: any) => { setHistoryTab(v); setHistoryPage(1); }}>
                  <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={loadHistory}>Refresh</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <p className="text-sm text-muted-foreground">Loading history…</p>
            ) : pageItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No requests match the current filters.</p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Approved By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageItems.map((r: any) => {
                      const status = String(r.workflow_status || r.status || "").toLowerCase();
                      const variant = status.includes("approved")
                        ? "default"
                        : status.includes("rejected")
                        ? "destructive"
                        : "outline";
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.employee_display || r.employee_name || `Employee ${r.employee_id}`}</TableCell>
                          <TableCell className="text-sm">{r.start_date} → {r.end_date}</TableCell>
                          <TableCell>{r.days_requested}</TableCell>
                          <TableCell className="max-w-[240px] truncate text-sm">{r.reason || "—"}</TableCell>
                          <TableCell><Badge variant={variant as any}>{r.workflow_status || r.status}</Badge></TableCell>
                          <TableCell className="text-sm text-muted-foreground">{r.hr_approver_name || r.manager_approver_name || r.approved_by || "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Showing {(historyPage - 1) * HISTORY_PAGE_SIZE + 1}–{Math.min(historyPage * HISTORY_PAGE_SIZE, filteredHistory.length)} of {filteredHistory.length}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={historyPage === 1} onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}>Prev</Button>
                    <span className="px-2 py-1">Page {historyPage} / {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={historyPage >= totalPages} onClick={() => setHistoryPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
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