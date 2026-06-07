import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
  AlertTriangle,
  ArrowUpCircle,
  ArrowDownCircle,
  Trash2,
  Eye,
  Download,
  Plus,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  CheckCircle2,
  Inbox,
} from "lucide-react";
import apiService from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { canHrPayroll, canViewPayrollDrafts } from "@/lib/permissions";
import { useToast } from "@/hooks/use-toast";
import { BulkGenerateDialog } from "@/components/payroll/BulkGenerateDialog";
import { PayrollEditDrawer } from "@/components/payroll/PayrollEditDrawer";

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_MS = 60_000;

const fmtMoney = (n: any) =>
  `₦${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

const shiftMonth = (period: string, delta: number) => {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(y, (m - 1) + delta, 1);
  return d.toISOString().slice(0, 7);
};

const fmtPeriodLabel = (period: string) => {
  try {
    const [y, m] = period.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleString(undefined, {
      month: "long",
      year: "numeric",
    });
  } catch {
    return period;
  }
};

export default function PayrollReview() {
  const { payPeriod = new Date().toISOString().slice(0, 7) } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const canEdit = canHrPayroll(user);
  const canView = canViewPayrollDrafts(user);

  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "pending_review">("all");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [warningsOnly, setWarningsOnly] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const [bulkOpen, setBulkOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [acknowledge, setAcknowledge] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approveProgress, setApproveProgress] = useState<string | null>(null);

  const loadDrafts = async () => {
    setLoading(true);
    try {
      const rows = await apiService.listPayrollDrafts(payPeriod);
      setDrafts(rows);
      setSelected(new Set());
    } catch (e: any) {
      toast({
        title: "Failed to load drafts",
        description: e?.message || String(e),
        variant: "destructive",
      });
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPeriods = async () => {
    const list = await apiService.listDraftPeriods();
    setPeriods(list);
  };

  useEffect(() => {
    if (!canView) return;
    loadDrafts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payPeriod, canView]);

  useEffect(() => {
    if (!canView) return;
    loadPeriods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView]);

  const departments = useMemo(() => {
    const s = new Set<string>();
    drafts.forEach((d) => s.add(d.department || d.employee?.department || "Unassigned"));
    return Array.from(s).sort();
  }, [drafts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return drafts.filter((d) => {
      const name = `${d.employee?.first_name || d.first_name || ""} ${d.employee?.last_name || d.last_name || ""}`.toLowerCase();
      const code = (d.employee?.employee_code || d.employee_code || "").toLowerCase();
      const dept = d.department || d.employee?.department || "Unassigned";
      if (q && !name.includes(q) && !code.includes(q)) return false;
      if (deptFilter !== "all" && dept !== deptFilter) return false;
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (warningsOnly && !(d.warnings || []).length) return false;
      return true;
    });
  }, [drafts, search, deptFilter, statusFilter, warningsOnly]);

  const summary = useMemo(() => {
    let gross = 0,
      net = 0,
      draftCount = 0,
      pendingCount = 0;
    filtered.forEach((d) => {
      gross += Number(d.gross_pay || 0);
      net += Number(d.net_pay || 0);
      if (d.status === "draft") draftCount += 1;
      if (d.status === "pending_review") pendingCount += 1;
    });
    return { employees: filtered.length, gross, net, draftCount, pendingCount };
  }, [filtered]);

  const toggleAll = () => {
    const eligible = filtered.filter((d) => d.status === "draft" || d.status === "pending_review");
    if (eligible.every((d) => selected.has(d.id))) {
      setSelected(new Set());
    } else {
      setSelected(new Set(eligible.map((d) => d.id)));
    }
  };

  const selectedRows = drafts.filter((d) => selected.has(d.id));
  const selectedHasWarn = selectedRows.some((d) =>
    (d.warnings || []).some((w: any) => w.severity === "warn"),
  );
  const selectedHasError = selectedRows.some((d) =>
    (d.warnings || []).some((w: any) => w.severity === "error"),
  );
  const selectedHasDraft = selectedRows.some((d) => d.status === "draft");

  // ---- actions ----

  const handleMarkReady = async (ids: number[]) => {
    try {
      await Promise.all(ids.map((id) => apiService.markPayrollReady(id)));
      toast({ title: "Marked as ready", description: `${ids.length} record(s) moved to Pending Review.` });
      await loadDrafts();
    } catch (e: any) {
      toast({ title: "Action failed", description: e?.message || String(e), variant: "destructive" });
    }
  };

  const handleRevert = async (id: number) => {
    try {
      await apiService.revertPayrollToDraft(id);
      toast({ title: "Reverted to draft" });
      await loadDrafts();
    } catch (e: any) {
      toast({ title: "Action failed", description: e?.message || String(e), variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiService.deletePayroll(deleteTarget.id);
      toast({ title: "Draft deleted" });
      setDeleteTarget(null);
      await loadDrafts();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message || String(e), variant: "destructive" });
    }
  };

  const runApprove = async () => {
    const readyRows = selectedRows.filter((d) => d.status === "pending_review");
    if (readyRows.length === 0) {
      toast({
        title: "Nothing to approve",
        description: "All records must be marked as ready before approval. Move draft records to pending_review first.",
        variant: "destructive",
      });
      return;
    }
    setApproving(true);
    setApproveProgress("Approving…");
    try {
      const resp: any = await apiService.batchApprovePayroll({
        ids: readyRows.map((r) => r.id),
        acknowledge_warnings: acknowledge,
      });

      if (resp?.batch_id && resp?.status && resp.status !== "done") {
        const start = Date.now();
        let timedOut = true;
        while (Date.now() - start < MAX_POLL_MS) {
          await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
          try {
            const s = await apiService.getBatchApproveStatus(resp.batch_id);
            if (s?.processed != null && s?.total != null) {
              setApproveProgress(`Approving… ${s.processed}/${s.total}`);
            }
            if (s?.status === "done") {
              timedOut = false;
              break;
            }
            if (s?.status === "failed") {
              throw new Error(s.error || "Approval failed");
            }
          } catch (e: any) {
            if (Date.now() - start > MAX_POLL_MS - POLL_INTERVAL_MS) break;
          }
        }
        if (timedOut) {
          toast({
            title: "Approval running long",
            description:
              "Approval is taking longer than expected. Please refresh the page to check the status.",
          });
          setApproveOpen(false);
          return;
        }
      }

      toast({ title: "Approved", description: `${readyRows.length} record(s) finalised.` });
      setApproveOpen(false);
      setAcknowledge(false);
      await loadDrafts();
    } catch (e: any) {
      toast({
        title: "Approval failed",
        description: e?.message || String(e),
        variant: "destructive",
      });
    } finally {
      setApproving(false);
      setApproveProgress(null);
    }
  };

  const handleExport = async (format: "pdf" | "csv") => {
    try {
      const status = statusFilter === "all" ? "all" : statusFilter;
      const blob =
        format === "pdf"
          ? await apiService.exportPayrollBulkPdfWithStatus(payPeriod, status)
          : await apiService.exportPayrollBulkCsvWithStatus(payPeriod, status);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `payroll-${payPeriod}-${status}.${format}`;
      a.click();
    } catch (e: any) {
      toast({ title: "Export failed", description: e?.message || String(e), variant: "destructive" });
    }
  };

  if (!canView) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        You do not have permission to view payroll drafts.
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            {periods.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigate(`/payroll/review/${shiftMonth(payPeriod, -1)}`)}
                  aria-label="Previous period"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Select
                  value={payPeriod}
                  onValueChange={(v) => navigate(`/payroll/review/${v}`)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {periods.map((p) => (
                      <SelectItem key={p} value={p}>
                        {fmtPeriodLabel(p)}
                      </SelectItem>
                    ))}
                    {!periods.includes(payPeriod) && (
                      <SelectItem value={payPeriod}>
                        {fmtPeriodLabel(payPeriod)}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigate(`/payroll/review/${shiftMonth(payPeriod, 1)}`)}
                  aria-label="Next period"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
            {periods.length === 0 && (
              <h1 className="text-2xl font-bold">{fmtPeriodLabel(payPeriod)}</h1>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {canEdit && (
              <Button onClick={() => setBulkOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Generate Payroll
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" /> Export All
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport("pdf")}>
                  Export PDF ({statusFilter === "all" ? "All" : statusFilter === "draft" ? "Drafts" : "Pending"})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("csv")}>
                  Export CSV ({statusFilter === "all" ? "All" : statusFilter === "draft" ? "Drafts" : "Pending"})
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatChip label="Employees" value={summary.employees} />
          <StatChip label="Drafts" value={summary.draftCount} />
          <StatChip label="Pending Review" value={summary.pendingCount} />
          <StatChip label="Total Gross" value={fmtMoney(summary.gross)} />
          <StatChip label="Total Net" value={fmtMoney(summary.net)} />
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="md:w-[200px]">
                <SelectValue placeholder="All departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="md:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending_review">Pending Review</SelectItem>
              </SelectContent>
            </Select>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={warningsOnly}
                onCheckedChange={(v) => setWarningsOnly(!!v)}
              />
              Warnings only
            </label>
          </CardContent>
        </Card>

        {/* Bulk action bar */}
        {selected.size > 0 && canEdit && (
          <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-md border bg-background/95 backdrop-blur p-3">
            <div className="text-sm">{selected.size} selected</div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => handleMarkReady(selectedRows.filter((r) => r.status === "draft").map((r) => r.id))}>
                <ArrowUpCircle className="h-4 w-4 mr-2" /> Mark Ready
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (selectedHasDraft) {
                    toast({
                      title: "Cannot approve drafts",
                      description:
                        "All records must be marked as ready before approval. Move draft records to pending_review first.",
                      variant: "destructive",
                    });
                    return;
                  }
                  setApproveOpen(true);
                }}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" /> Approve Selected
              </Button>
            </div>
          </div>
        )}

        {/* Table / empty state */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payroll drafts</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Loading…
              </div>
            ) : drafts.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <Inbox className="h-10 w-10 mx-auto text-muted-foreground" />
                <div className="text-sm text-muted-foreground">
                  No drafts found for this period
                </div>
                {canEdit && (
                  <Button onClick={() => setBulkOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Generate Payroll
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {canEdit && (
                          <TableHead className="w-[40px]">
                            <Checkbox
                              checked={
                                filtered.length > 0 &&
                                filtered
                                  .filter((d) => d.status === "draft" || d.status === "pending_review")
                                  .every((d) => selected.has(d.id))
                              }
                              onCheckedChange={toggleAll}
                            />
                          </TableHead>
                        )}
                        <TableHead>Employee</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Gross</TableHead>
                        <TableHead className="text-right">Deductions</TableHead>
                        <TableHead className="text-right">Bonuses</TableHead>
                        <TableHead className="text-right">Reliefs</TableHead>
                        <TableHead className="text-right">Net Pay</TableHead>
                        <TableHead>Variance</TableHead>
                        <TableHead>Warnings</TableHead>
                        <TableHead className="w-[60px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((d) => (
                        <DraftRow
                          key={d.id}
                          d={d}
                          selected={selected.has(d.id)}
                          onToggle={() =>
                            setSelected((prev) => {
                              const next = new Set(prev);
                              if (next.has(d.id)) next.delete(d.id);
                              else next.add(d.id);
                              return next;
                            })
                          }
                          canEdit={canEdit}
                          onEdit={() => setEditing(d)}
                          onMarkReady={() => handleMarkReady([d.id])}
                          onRevert={() => handleRevert(d.id)}
                          onDelete={() => setDeleteTarget(d)}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-3">
                  {filtered.map((d) => (
                    <DraftCard
                      key={d.id}
                      d={d}
                      selected={selected.has(d.id)}
                      onToggle={() =>
                        setSelected((prev) => {
                          const next = new Set(prev);
                          if (next.has(d.id)) next.delete(d.id);
                          else next.add(d.id);
                          return next;
                        })
                      }
                      canEdit={canEdit}
                      onEdit={() => setEditing(d)}
                      onMarkReady={() => handleMarkReady([d.id])}
                      onRevert={() => handleRevert(d.id)}
                      onDelete={() => setDeleteTarget(d)}
                    />
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Dialogs */}
        <BulkGenerateDialog open={bulkOpen} onOpenChange={setBulkOpen} initialPayPeriod={payPeriod} />

        <PayrollEditDrawer
          open={!!editing}
          onOpenChange={(v) => !v && setEditing(null)}
          draft={editing}
          onChanged={loadDrafts}
        />

        <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this draft?</AlertDialogTitle>
              <AlertDialogDescription>
                Delete draft for {deleteTarget?.employee?.first_name || deleteTarget?.first_name}{" "}
                {deleteTarget?.employee?.last_name || deleteTarget?.last_name}? This cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={approveOpen} onOpenChange={(v) => !approving && setApproveOpen(v)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve selected payroll</DialogTitle>
              <DialogDescription>
                You are about to approve {selectedRows.filter((r) => r.status === "pending_review").length} record(s).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <div>Total gross: {fmtMoney(selectedRows.reduce((s, r) => s + Number(r.gross_pay || 0), 0))}</div>
              <div>Total net: {fmtMoney(selectedRows.reduce((s, r) => s + Number(r.net_pay || 0), 0))}</div>
              {selectedHasError && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-destructive text-xs">
                  Some records have errors and cannot be approved.
                </div>
              )}
              {selectedHasWarn && (
                <label className="flex items-start gap-2 text-xs">
                  <Checkbox
                    checked={acknowledge}
                    onCheckedChange={(v) => setAcknowledge(!!v)}
                  />
                  I acknowledge the warnings on these records and want to proceed.
                </label>
              )}
              {approveProgress && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> {approveProgress}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setApproveOpen(false)} disabled={approving}>
                Cancel
              </Button>
              <Button
                onClick={runApprove}
                disabled={approving || selectedHasError || (selectedHasWarn && !acknowledge)}
              >
                {approving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

function StatChip({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="text-base font-semibold">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "pending_review")
    return <Badge className="bg-amber-500 hover:bg-amber-500 text-white">Pending Review</Badge>;
  if (status === "draft") return <Badge variant="secondary">Draft</Badge>;
  if (status === "approved") return <Badge variant="outline">Approved</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

function VarianceBadge({ d }: { d: any }) {
  const prev = Number(d.last_approved_snapshot?.gross_pay || 0);
  const curr = Number(d.gross_pay || 0);
  if (!prev) return <span className="text-xs text-muted-foreground">—</span>;
  const delta = ((curr - prev) / prev) * 100;
  if (Math.abs(delta) < 0.5) return <span className="text-xs text-muted-foreground">≈</span>;
  const Icon = delta > 0 ? TrendingUp : TrendingDown;
  const color = delta > 0 ? "text-emerald-600" : "text-destructive";
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${color}`}>
      <Icon className="h-3 w-3" />
      {delta > 0 ? "+" : ""}
      {delta.toFixed(1)}%
    </span>
  );
}

function WarningBadge({ warnings }: { warnings: any[] }) {
  if (!warnings?.length) return <span className="text-xs text-muted-foreground">—</span>;
  const hasError = warnings.some((w) => w.severity === "error");
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant={hasError ? "destructive" : "secondary"}
          className="cursor-help"
        >
          <AlertTriangle className="h-3 w-3 mr-1" />
          {warnings.length}
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <ul className="space-y-1 text-xs">
          {warnings.map((w, i) => (
            <li key={i}>
              <span className="font-medium">{w.code}</span>: {w.message}
            </li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
}

function ActionsMenu({
  d,
  canEdit,
  onEdit,
  onMarkReady,
  onRevert,
  onDelete,
}: {
  d: any;
  canEdit: boolean;
  onEdit: () => void;
  onMarkReady: () => void;
  onRevert: () => void;
  onDelete: () => void;
}) {
  const editable = d.status === "draft" || d.status === "pending_review";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>
          <Eye className="h-4 w-4 mr-2" /> View / Edit
        </DropdownMenuItem>
        {canEdit && d.status === "draft" && (
          <DropdownMenuItem onClick={onMarkReady}>
            <ArrowUpCircle className="h-4 w-4 mr-2" /> Mark Ready
          </DropdownMenuItem>
        )}
        {canEdit && d.status === "pending_review" && (
          <DropdownMenuItem onClick={onRevert}>
            <ArrowDownCircle className="h-4 w-4 mr-2" /> Revert to Draft
          </DropdownMenuItem>
        )}
        {canEdit && editable && (
          <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DraftRow({
  d,
  selected,
  onToggle,
  canEdit,
  onEdit,
  onMarkReady,
  onRevert,
  onDelete,
}: any) {
  const reliefs = Number(d.rent_relief || 0);
  return (
    <TableRow className="cursor-pointer" onClick={onEdit}>
      {canEdit && (
        <TableCell onClick={(e) => e.stopPropagation()}>
          <Checkbox checked={selected} onCheckedChange={onToggle} />
        </TableCell>
      )}
      <TableCell className="font-medium">
        {d.employee?.first_name || d.first_name} {d.employee?.last_name || d.last_name}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {d.employee?.employee_code || d.employee_code || "—"}
      </TableCell>
      <TableCell className="text-xs">
        {d.department || d.employee?.department || "—"}
      </TableCell>
      <TableCell>
        <StatusBadge status={d.status} />
      </TableCell>
      <TableCell className="text-right">{fmtMoney(d.gross_pay)}</TableCell>
      <TableCell className="text-right">{fmtMoney(d.total_deductions)}</TableCell>
      <TableCell className="text-right">{fmtMoney(d.bonus)}</TableCell>
      <TableCell className="text-right">{fmtMoney(reliefs)}</TableCell>
      <TableCell className="text-right font-medium">{fmtMoney(d.net_pay)}</TableCell>
      <TableCell>
        <VarianceBadge d={d} />
      </TableCell>
      <TableCell>
        <WarningBadge warnings={d.warnings || []} />
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <ActionsMenu
          d={d}
          canEdit={canEdit}
          onEdit={onEdit}
          onMarkReady={onMarkReady}
          onRevert={onRevert}
          onDelete={onDelete}
        />
      </TableCell>
    </TableRow>
  );
}

function DraftCard({
  d,
  selected,
  onToggle,
  canEdit,
  onEdit,
  onMarkReady,
  onRevert,
  onDelete,
}: any) {
  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0" onClick={onEdit}>
          {canEdit && (
            <span onClick={(e) => e.stopPropagation()}>
              <Checkbox checked={selected} onCheckedChange={onToggle} />
            </span>
          )}
          <div className="min-w-0">
            <div className="font-medium truncate">
              {d.employee?.first_name || d.first_name} {d.employee?.last_name || d.last_name}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {(d.employee?.employee_code || d.employee_code || "—")} ·{" "}
              {d.department || d.employee?.department || "—"}
            </div>
          </div>
        </div>
        <ActionsMenu
          d={d}
          canEdit={canEdit}
          onEdit={onEdit}
          onMarkReady={onMarkReady}
          onRevert={onRevert}
          onDelete={onDelete}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={d.status} />
        <VarianceBadge d={d} />
        <WarningBadge warnings={d.warnings || []} />
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <div className="text-muted-foreground">Gross</div>
          <div className="font-medium">{fmtMoney(d.gross_pay)}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Deductions</div>
          <div className="font-medium">{fmtMoney(d.total_deductions)}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Net</div>
          <div className="font-medium">{fmtMoney(d.net_pay)}</div>
        </div>
      </div>
    </div>
  );
}