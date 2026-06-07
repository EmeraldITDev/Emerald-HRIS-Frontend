import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  CheckCircle2,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertTriangle,
} from "lucide-react";
import apiService from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { canHrPayroll } from "@/lib/permissions";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: any | null;
  onChanged?: () => void;
}

const numField = (v: any): number => {
  if (v == null || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export function PayrollEditDrawer({ open, onOpenChange, draft, onChanged }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const canEdit = canHrPayroll(user);

  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [audit, setAudit] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  useEffect(() => {
    if (draft) {
      setForm({
        basic_salary: draft.basic_salary ?? 0,
        housing_allowance: draft.housing_allowance ?? 0,
        transport_allowance: draft.transport_allowance ?? 0,
        meal_allowance: draft.meal_allowance ?? 0,
        other_allowance: draft.other_allowance ?? 0,
        bonus: draft.bonus ?? 0,
        commission: draft.commission ?? 0,
        overtime: draft.overtime ?? 0,
        other_deductions: draft.other_deductions ?? 0,
        deduction_notes: draft.deduction_notes ?? "",
        rent_relief_enabled: !!draft.rent_relief_enabled,
        annual_rent: draft.annual_rent ?? 0,
        include_nhf: draft.include_nhf !== false,
        notes: draft.notes ?? "",
      });
    }
  }, [draft]);

  useEffect(() => {
    if (!open || !draft?.id) return;
    let cancelled = false;
    (async () => {
      setLoadingAudit(true);
      try {
        const rows = await apiService.getPayrollAudit(draft.id);
        if (!cancelled) setAudit(rows);
      } finally {
        if (!cancelled) setLoadingAudit(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, draft?.id]);

  if (!draft) return null;

  const status: string = draft.status || "draft";
  const locked = status === "approved" || status === "paid";
  const readOnly = locked || !canEdit;

  const grossPay =
    numField(form.basic_salary) +
    numField(form.housing_allowance) +
    numField(form.transport_allowance) +
    numField(form.meal_allowance) +
    numField(form.other_allowance) +
    numField(form.bonus) +
    numField(form.commission) +
    numField(form.overtime);

  const totalDeductions =
    numField(draft.paye_tax) +
    numField(draft.pension_employee) +
    numField(draft.nhf) +
    numField(form.other_deductions);

  const netPay = grossPay - totalDeductions;

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleSaveDraft = async (close = false) => {
    if (!draft.id) return;
    setSaving(true);
    try {
      await apiService.saveDraftPayroll(draft.id, form);
      toast({ title: "Draft saved" });
      onChanged?.();
      if (close) onOpenChange(false);
    } catch (e: any) {
      toast({
        title: "Save failed",
        description: e?.message || "Could not save draft.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleMarkReady = async () => {
    if (!draft.id) return;
    setTransitioning(true);
    try {
      await apiService.saveDraftPayroll(draft.id, form);
      await apiService.markPayrollReady(draft.id);
      toast({ title: "Marked as ready" });
      onChanged?.();
      onOpenChange(false);
    } catch (e: any) {
      toast({
        title: "Action failed",
        description: e?.message || "Could not mark as ready.",
        variant: "destructive",
      });
    } finally {
      setTransitioning(false);
    }
  };

  const handleRevert = async () => {
    if (!draft.id) return;
    setTransitioning(true);
    try {
      await apiService.revertPayrollToDraft(draft.id);
      toast({ title: "Reverted to draft" });
      onChanged?.();
      onOpenChange(false);
    } catch (e: any) {
      toast({
        title: "Action failed",
        description: e?.message || "Could not revert.",
        variant: "destructive",
      });
    } finally {
      setTransitioning(false);
    }
  };

  const handleApprove = async () => {
    if (!draft.id) return;
    setTransitioning(true);
    try {
      await apiService.batchApprovePayroll({
        ids: [draft.id],
        acknowledge_warnings: true,
      });
      toast({ title: "Approved" });
      onChanged?.();
      onOpenChange(false);
    } catch (e: any) {
      toast({
        title: "Approval failed",
        description: e?.message || "Could not approve.",
        variant: "destructive",
      });
    } finally {
      setTransitioning(false);
    }
  };

  const warnings: Array<{ code: string; severity: string; message: string; field?: string }> =
    draft.warnings || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {draft.employee?.first_name || draft.first_name} {draft.employee?.last_name || draft.last_name}
            <Badge variant={
              status === "draft" ? "secondary" :
              status === "pending_review" ? "default" :
              status === "approved" ? "outline" : "outline"
            }>
              {status === "pending_review" ? "Pending Review" : status[0].toUpperCase() + status.slice(1)}
            </Badge>
          </SheetTitle>
          <SheetDescription>
            {draft.pay_period} · {draft.department || "—"}
          </SheetDescription>
        </SheetHeader>

        {warnings.length > 0 && (
          <div className="mt-4 space-y-2">
            {warnings.map((w, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 rounded-md border p-2 text-xs ${
                  w.severity === "error"
                    ? "border-destructive/40 bg-destructive/10 text-destructive"
                    : "border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300"
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">{w.code}</span> — {w.message}
                </div>
              </div>
            ))}
          </div>
        )}

        <Tabs defaultValue="form" className="mt-4">
          <TabsList>
            <TabsTrigger value="form">Payroll</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="space-y-4 mt-4">
            <Section title="Salary & Allowances">
              <Money label="Basic Salary" v={form.basic_salary} on={(v) => set("basic_salary", v)} disabled={readOnly} />
              <Money label="Housing Allowance" v={form.housing_allowance} on={(v) => set("housing_allowance", v)} disabled={readOnly} />
              <Money label="Transport Allowance" v={form.transport_allowance} on={(v) => set("transport_allowance", v)} disabled={readOnly} />
              <Money label="Meal Allowance" v={form.meal_allowance} on={(v) => set("meal_allowance", v)} disabled={readOnly} />
              <Money label="Other Allowance" v={form.other_allowance} on={(v) => set("other_allowance", v)} disabled={readOnly} />
            </Section>

            <Section title="Bonuses & Commission">
              <Money label="Bonus" v={form.bonus} on={(v) => set("bonus", v)} disabled={readOnly} />
              <Money label="Commission" v={form.commission} on={(v) => set("commission", v)} disabled={readOnly} />
              <Money label="Overtime" v={form.overtime} on={(v) => set("overtime", v)} disabled={readOnly} />
            </Section>

            <Section title="Deductions">
              <Money label="Other Deductions" v={form.other_deductions} on={(v) => set("other_deductions", v)} disabled={readOnly} />
              <div className="col-span-2">
                <Label>Deduction Notes</Label>
                <Textarea
                  value={form.deduction_notes}
                  onChange={(e) => set("deduction_notes", e.target.value)}
                  disabled={readOnly}
                  rows={2}
                />
              </div>
            </Section>

            <Section title="Reliefs">
              <div className="flex items-center justify-between col-span-2">
                <Label>Rent Relief</Label>
                <Switch
                  checked={!!form.rent_relief_enabled}
                  onCheckedChange={(v) => set("rent_relief_enabled", v)}
                  disabled={readOnly}
                />
              </div>
              <Money label="Annual Rent" v={form.annual_rent} on={(v) => set("annual_rent", v)} disabled={readOnly || !form.rent_relief_enabled} />
              <div className="flex items-center justify-between col-span-2">
                <Label>Include NHF</Label>
                <Switch
                  checked={!!form.include_nhf}
                  onCheckedChange={(v) => set("include_nhf", v)}
                  disabled={readOnly}
                />
              </div>
            </Section>

            <Section title="Notes">
              <div className="col-span-2">
                <Textarea
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  disabled={readOnly}
                  rows={3}
                />
              </div>
            </Section>

            <Separator />
            <div className="grid grid-cols-3 gap-3 text-sm">
              <Summary label="Gross Pay" v={grossPay} />
              <Summary label="Total Deductions" v={totalDeductions} />
              <Summary label="Net Pay" v={netPay} highlight />
            </div>
          </TabsContent>

          <TabsContent value="audit" className="mt-4">
            {loadingAudit ? (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading audit…
              </div>
            ) : audit.length === 0 ? (
              <div className="text-sm text-muted-foreground">No audit history yet.</div>
            ) : (
              <ul className="space-y-2">
                {audit.map((row, i) => {
                  const isSystem = String(row.changed_by) === "system";
                  return (
                    <li key={i} className="rounded-md border p-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{row.field}</span>
                        <span className="text-muted-foreground">
                          {new Date(row.changed_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-1 text-muted-foreground">
                        {String(row.old_value ?? "—")} → {String(row.new_value ?? "—")}
                      </div>
                      <div className="mt-1">
                        {isSystem ? (
                          <Badge variant="secondary" className="text-[10px]">
                            {row.note || "Auto-populated"}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">by {row.changed_by}</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </TabsContent>
        </Tabs>

        <SheetFooter className="mt-4 flex-wrap gap-2 sm:justify-between">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving || transitioning}>
            Close
          </Button>
          <div className="flex flex-wrap gap-2">
            {!readOnly && (status === "draft" || status === "pending_review") && (
              <>
                <Button variant="outline" onClick={() => handleSaveDraft(false)} disabled={saving || transitioning}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Draft
                </Button>
                <Button variant="outline" onClick={() => handleSaveDraft(true)} disabled={saving || transitioning}>
                  Save & Close
                </Button>
              </>
            )}
            {!readOnly && status === "draft" && (
              <Button onClick={handleMarkReady} disabled={transitioning}>
                {transitioning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <ArrowUpCircle className="h-4 w-4 mr-2" />
                Mark as Ready
              </Button>
            )}
            {!readOnly && status === "pending_review" && (
              <>
                <Button variant="outline" onClick={handleRevert} disabled={transitioning}>
                  <ArrowDownCircle className="h-4 w-4 mr-2" />
                  Revert to Draft
                </Button>
                <Button onClick={handleApprove} disabled={transitioning}>
                  {transitioning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
        {title}
      </div>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function Money({
  label,
  v,
  on,
  disabled,
}: {
  label: string;
  v: any;
  on: (n: number) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        type="number"
        value={v ?? 0}
        onChange={(e) => on(Number(e.target.value))}
        disabled={disabled}
      />
    </div>
  );
}

function Summary({ label, v, highlight }: { label: string; v: number; highlight?: boolean }) {
  return (
    <div className={`rounded-md border p-2 ${highlight ? "bg-primary/5 border-primary/30" : ""}`}>
      <div className="text-[11px] text-muted-foreground uppercase">{label}</div>
      <div className="text-base font-semibold">
        ₦{v.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </div>
    </div>
  );
}

export default PayrollEditDrawer;