import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/lib/api";
import { DEPARTMENTS } from "@/constants/departments";
import { ArrowLeft, Loader2 } from "lucide-react";

/**
 * Batch 4 — HR review cycle administration.
 * Dates are HR-configured (no hardcoded Emerald calendar months).
 * HOD flag and reminder_schedule are configuration only.
 */
export default function PerformanceCycles() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isHr = user?.role === "hr_manager" || user?.role === "corporate_hr";

  const [cycles, setCycles] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [cycle, setCycle] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    period_label: "",
    coverage_start_date: "",
    coverage_end_date: "",
    opens_at: "",
    self_assessment_deadline: "",
    manager_assessment_deadline: "",
    discussion_deadline: "",
    eligible_departments: [] as string[],
    hod_approval_required: false,
    reminder_schedule_note: "",
  });

  const loadList = async () => {
    setLoading(true);
    try {
      const res = await apiService.getPerformanceCycles();
      setCycles(Array.isArray(res?.data) ? res.data : []);
    } catch (e: any) {
      toast({ title: "Failed to load cycles", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadCycle = async (id: number) => {
    setLoading(true);
    try {
      const res = await apiService.getPerformanceCycle(id);
      setCycle(res?.data ?? res);
      setSelectedId(id);
    } catch (e: any) {
      toast({ title: "Failed to load cycle", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isHr) void loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHr]);

  if (!isHr) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Only HR can administer performance review cycles.
        </CardContent>
      </Card>
    );
  }

  const toggleDept = (dept: string) => {
    setForm((f) => ({
      ...f,
      eligible_departments: f.eligible_departments.includes(dept)
        ? f.eligible_departments.filter((d) => d !== dept)
        : [...f.eligible_departments, dept],
    }));
  };

  const createCycle = async () => {
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        name: form.name,
        period_label: form.period_label,
        coverage_start_date: form.coverage_start_date,
        coverage_end_date: form.coverage_end_date,
        opens_at: form.opens_at || null,
        self_assessment_deadline: form.self_assessment_deadline || null,
        manager_assessment_deadline: form.manager_assessment_deadline || null,
        discussion_deadline: form.discussion_deadline || null,
        eligible_departments: form.eligible_departments,
        hod_approval_required: form.hod_approval_required,
        reminder_schedule: form.reminder_schedule_note
          ? { note: form.reminder_schedule_note, execution: "not_claimed_batch4" }
          : null,
      };
      const res = await apiService.createPerformanceCycle(payload);
      toast({ title: "Cycle created" });
      await loadList();
      const id = res?.data?.id;
      if (id) await loadCycle(id);
    } catch (e: any) {
      toast({ title: "Create failed", description: e?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const preview = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      const res = await apiService.previewPerformanceCycle(selectedId);
      setCycle(res?.data ?? res);
      toast({
        title: "Roster built",
        description: `OK: ${res?.summary?.ok ?? 0}, missing managers: ${res?.summary?.missing_manager ?? 0}, conflicts: ${res?.summary?.conflict ?? 0}`,
      });
    } catch (e: any) {
      toast({ title: "Preview failed", description: e?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const openCycle = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      const res = await apiService.openPerformanceCycle(selectedId);
      setCycle(res?.data ?? res);
      toast({
        title: "Cycle opened",
        description: `Created ${res?.launch?.created ?? 0} review(s). HOD workflow is not operational in this batch.`,
      });
      await loadList();
    } catch (e: any) {
      toast({ title: "Open blocked", description: e?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="performance-cycles-page">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/performance">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Review cycle administration</h1>
          <p className="text-sm text-muted-foreground">
            Configure dates, eligible employees, and open cycles. No calendar months are hardcoded.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create cycle</CardTitle>
            <CardDescription>
              HOD approval and reminder fields are stored as configuration only — they do not run
              workflows in Batch 4.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="cycle-name">Cycle name</Label>
              <Input
                id="cycle-name"
                data-testid="cycle-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Mid-Year Review"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="period-label">Period label</Label>
              <Input
                id="period-label"
                data-testid="cycle-period"
                value={form.period_label}
                onChange={(e) => setForm({ ...form, period_label: e.target.value })}
                placeholder="H1 2026"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Coverage start</Label>
                <Input
                  type="date"
                  data-testid="cycle-coverage-start"
                  value={form.coverage_start_date}
                  onChange={(e) => setForm({ ...form, coverage_start_date: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Coverage end</Label>
                <Input
                  type="date"
                  data-testid="cycle-coverage-end"
                  value={form.coverage_end_date}
                  onChange={(e) => setForm({ ...form, coverage_end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Self-assessment deadline</Label>
                <Input
                  type="date"
                  data-testid="cycle-self-deadline"
                  value={form.self_assessment_deadline}
                  onChange={(e) => setForm({ ...form, self_assessment_deadline: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Manager deadline</Label>
                <Input
                  type="date"
                  data-testid="cycle-mgr-deadline"
                  value={form.manager_assessment_deadline}
                  onChange={(e) => setForm({ ...form, manager_assessment_deadline: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Discussion deadline</Label>
              <Input
                type="date"
                data-testid="cycle-discussion-deadline"
                value={form.discussion_deadline}
                onChange={(e) => setForm({ ...form, discussion_deadline: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Eligible departments</Label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {(DEPARTMENTS as readonly string[]).map((d) => (
                  <label key={d} className="flex items-center gap-1 text-xs border rounded px-2 py-1">
                    <Checkbox
                      checked={form.eligible_departments.includes(d)}
                      onCheckedChange={() => toggleDept(d)}
                    />
                    {d}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                id="hod-flag"
                checked={form.hod_approval_required}
                onCheckedChange={(v) => setForm({ ...form, hod_approval_required: v === true })}
              />
              <Label htmlFor="hod-flag" className="text-sm font-normal leading-snug">
                HOD approval required for this cycle (operational only after confidential-access policy is authorised)
              </Label>
            </div>
            <div className="space-y-1">
              <Label>Reminder schedule note (config only)</Label>
              <Textarea
                data-testid="cycle-reminder-note"
                value={form.reminder_schedule_note}
                onChange={(e) => setForm({ ...form, reminder_schedule_note: e.target.value })}
                placeholder="e.g. Remind 7 and 3 days before deadlines"
                rows={2}
              />
            </div>
            <Button data-testid="create-cycle" disabled={saving} onClick={createCycle}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Create cycle
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Existing cycles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading && !cycle ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : cycles.length === 0 ? (
              <p className="text-sm text-muted-foreground">No cycles yet.</p>
            ) : (
              cycles.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="w-full text-left border rounded p-3 hover:bg-muted/50"
                  data-testid={`cycle-row-${c.id}`}
                  onClick={() => loadCycle(c.id)}
                >
                  <div className="flex justify-between gap-2">
                    <span className="font-medium text-sm">{c.name}</span>
                    <Badge variant="secondary">{c.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.period_label}</p>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {cycle && (
        <Card data-testid="cycle-detail">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">{cycle.name}</CardTitle>
                <CardDescription>
                  {cycle.period_label} · status {cycle.status}
                  {cycle.hod_approval_required ? " · HOD flag on" : ""}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {cycle.status !== "open" && cycle.status !== "closed" && (
                  <Button variant="secondary" disabled={saving} onClick={preview} data-testid="preview-cycle">
                    Build / refresh roster
                  </Button>
                )}
                {(cycle.status === "ready" || cycle.status === "open") && (
                  <Button disabled={saving} onClick={openCycle} data-testid="open-cycle">
                    {cycle.status === "open" ? "Re-run open (idempotent)" : "Open cycle"}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Reminder execution is not claimed. Correct missing managers before opening. HOD self-assessment
              access remains denied until HR documents a confidential-review policy decision.
            </p>
            {cycle.hod_approval_required && (
              <div className="flex flex-wrap items-center gap-3 rounded-md border border-dashed p-3">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="hod-policy"
                    checked={!!cycle.hod_confidential_access_authorised}
                    onCheckedChange={async (v) => {
                      try {
                        setSaving(true);
                        await apiService.updatePerformanceCycle(cycle.id, {
                          hod_confidential_access_authorised: v === true,
                        });
                        toast({
                          title: v === true ? "HOD pathway authorised" : "HOD pathway locked",
                        });
                        await loadCycle(cycle.id);
                      } catch (e: any) {
                        toast({
                          title: "Policy update failed",
                          description: e?.message,
                          variant: "destructive",
                        });
                      } finally {
                        setSaving(false);
                      }
                    }}
                  />
                  <Label htmlFor="hod-policy" className="text-sm font-normal leading-snug">
                    Authorise HOD confidential pathway (manager assessment only — self-assessment stays sealed)
                  </Label>
                </div>
                <Badge variant={cycle.hod_confidential_access_authorised ? "secondary" : "destructive"}>
                  {cycle.hod_confidential_access_authorised ? "Authorised" : "Blocked pending policy"}
                </Badge>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="cycle-roster">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-2">Employee</th>
                    <th className="py-2 pr-2">Department</th>
                    <th className="py-2 pr-2">Manager</th>
                    <th className="py-2 pr-2">Status</th>
                    <th className="py-2">Review</th>
                  </tr>
                </thead>
                <tbody>
                  {(cycle.roster || []).map((row: any) => (
                    <tr key={row.id} className="border-b border-dashed">
                      <td className="py-2 pr-2">
                        {row.employee
                          ? `${row.employee.first_name} ${row.employee.last_name}`
                          : row.employee_id}
                      </td>
                      <td className="py-2 pr-2">{row.employee?.department ?? "—"}</td>
                      <td className="py-2 pr-2">{row.manager?.name ?? "—"}</td>
                      <td className="py-2 pr-2">
                        <Badge
                          variant={row.assignment_status === "ok" ? "secondary" : "destructive"}
                        >
                          {row.assignment_status}
                        </Badge>
                        {row.conflict_note && (
                          <p className="text-xs text-muted-foreground mt-1">{row.conflict_note}</p>
                        )}
                      </td>
                      <td className="py-2">
                        {row.review_id ? (
                          <Link className="text-primary underline" to={`/performance/${row.review_id}`}>
                            #{row.review_id}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(cycle.roster || []).length === 0 && (
                <p className="text-sm text-muted-foreground py-4">
                  No roster yet — build the roster after configuring eligible departments.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
