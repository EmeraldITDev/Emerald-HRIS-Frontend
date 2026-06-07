import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Search, AlertCircle, Users, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import apiService, { Employee } from "@/lib/api";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPayPeriod?: string;
}

const currentMonthIso = () => new Date().toISOString().slice(0, 7);

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_MS = 60_000;

export function BulkGenerateDialog({ open, onOpenChange, initialPayPeriod }: Props) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [payPeriod, setPayPeriod] = useState(initialPayPeriod || currentMonthIso());
  const [mode, setMode] = useState<"all" | "selected">("all");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [progressLabel, setProgressLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setProgressLabel(null);
    setSubmitting(false);
    setPayPeriod(initialPayPeriod || currentMonthIso());
  }, [open, initialPayPeriod]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingEmployees(true);
        const list = await apiService.getEmployees();
        if (!cancelled) setEmployees(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error("Failed to load employees for bulk generate", e);
      } finally {
        if (!cancelled) setLoadingEmployees(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const maxMonth = currentMonthIso();

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = employees.filter((e) => {
      if (!q) return true;
      const name = `${e.first_name ?? ""} ${e.last_name ?? ""}`.toLowerCase();
      return (
        name.includes(q) ||
        (e.employee_code ?? "").toLowerCase().includes(q) ||
        (e.email ?? "").toLowerCase().includes(q)
      );
    });
    const byDept = new Map<string, Employee[]>();
    filtered.forEach((e) => {
      const dept = e.department || "Unassigned";
      if (!byDept.has(dept)) byDept.set(dept, []);
      byDept.get(dept)!.push(e);
    });
    return Array.from(byDept.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [employees, search]);

  const toggle = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllInDept = (deptEmployees: Employee[]) => {
    const ids = deptEmployees.map((e) => e.id!).filter(Boolean) as number[];
    const allSelected = ids.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  const targetCount = mode === "all" ? employees.length : selectedIds.size;

  const handleSubmit = async () => {
    setError(null);
    if (payPeriod > maxMonth) {
      setError("Future pay periods are not allowed.");
      return;
    }
    if (mode === "selected" && selectedIds.size === 0) {
      setError("Select at least one employee.");
      return;
    }

    setSubmitting(true);
    setProgressLabel(`Generating drafts for ${targetCount} employees…`);
    try {
      const payload: { pay_period: string; employee_ids?: number[] } = {
        pay_period: payPeriod,
      };
      if (mode === "selected") payload.employee_ids = Array.from(selectedIds);

      const resp = (await apiService.bulkGeneratePayroll(payload)) as any;

      // Async path
      if (resp?.batch_id && resp?.status && resp.status !== "done") {
        const start = Date.now();
        while (Date.now() - start < MAX_POLL_MS) {
          await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
          let s: any;
          try {
            s = await apiService.getBulkGenerateStatus(resp.batch_id);
          } catch (e) {
            console.warn("Status poll failed", e);
            continue;
          }
          if (s?.processed != null && s?.total != null) {
            setProgressLabel(`Generating drafts… ${s.processed}/${s.total}`);
          }
          if (s?.status === "done") break;
          if (s?.status === "failed") {
            throw new Error(s.error || "Bulk generation failed");
          }
        }
      }

      if (resp?.already_exists) {
        toast({
          title: "Drafts already exist",
          description: "Redirecting to existing drafts for this period.",
        });
      } else {
        toast({
          title: "Drafts generated",
          description: `Created ${resp?.created_count ?? targetCount} drafts.`,
        });
      }

      onOpenChange(false);
      navigate(`/payroll/review/${payPeriod}`);
    } catch (e: any) {
      console.error("Bulk generate failed", e);
      setError(e?.message || "Failed to generate drafts. Please try again.");
    } finally {
      setSubmitting(false);
      setProgressLabel(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && onOpenChange(v)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate Payroll Drafts</DialogTitle>
          <DialogDescription>
            Generate draft payroll records for a pay period. Recurring values
            are auto-populated from the last approved cycle.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="bulk-period">Pay Period</Label>
            <Input
              id="bulk-period"
              type="month"
              max={maxMonth}
              value={payPeriod}
              onChange={(e) => setPayPeriod(e.target.value)}
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Future months are disabled.
            </p>
          </div>

          <div>
            <Label>Employees</Label>
            <RadioGroup
              value={mode}
              onValueChange={(v) => setMode(v as "all" | "selected")}
              className="mt-2 grid grid-cols-2 gap-3"
            >
              <label
                htmlFor="mode-all"
                className="flex items-center gap-2 rounded-md border p-3 cursor-pointer"
              >
                <RadioGroupItem id="mode-all" value="all" />
                <Users className="h-4 w-4" />
                <span className="text-sm">All active employees</span>
              </label>
              <label
                htmlFor="mode-selected"
                className="flex items-center gap-2 rounded-md border p-3 cursor-pointer"
              >
                <RadioGroupItem id="mode-selected" value="selected" />
                <span className="text-sm">Selected employees</span>
              </label>
            </RadioGroup>
          </div>

          {mode === "selected" && (
            <div>
              <div className="relative mb-2">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <ScrollArea className="h-64 rounded-md border">
                {loadingEmployees ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                    Loading employees…
                  </div>
                ) : grouped.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    No employees match your search.
                  </div>
                ) : (
                  <div className="divide-y">
                    {grouped.map(([dept, deptEmployees]) => {
                      const ids = deptEmployees
                        .map((e) => e.id!)
                        .filter(Boolean) as number[];
                      const allSelected = ids.every((id) => selectedIds.has(id));
                      return (
                        <div key={dept}>
                          <div className="flex items-center justify-between px-3 py-2 bg-muted/40 text-xs font-medium">
                            <span>{dept}</span>
                            <button
                              type="button"
                              className="text-primary text-xs hover:underline"
                              onClick={() => toggleAllInDept(deptEmployees)}
                            >
                              {allSelected ? "Clear" : "Select all"}
                            </button>
                          </div>
                          {deptEmployees.map((e) => (
                            <label
                              key={e.id}
                              className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer"
                            >
                              <Checkbox
                                checked={selectedIds.has(e.id!)}
                                onCheckedChange={() => toggle(e.id!)}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm truncate">
                                  {e.first_name} {e.last_name}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {e.employee_code || e.email}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedIds.size} selected
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1">{error}</div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSubmit}
                disabled={submitting}
              >
                <RefreshCw className="h-3 w-3 mr-1" /> Retry
              </Button>
            </div>
          )}

          {progressLabel && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {progressLabel}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || targetCount === 0}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Generate Drafts
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BulkGenerateDialog;