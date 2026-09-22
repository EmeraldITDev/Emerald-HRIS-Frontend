import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Loader2, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/lib/api";

const STAGES: Array<{ key: string; label: string }> = [
  { key: "draft", label: "Created" },
  { key: "self_assessment_requested", label: "Self-Assessment" },
  { key: "self_assessment_submitted", label: "Submitted" },
  { key: "manager_review", label: "Line Manager" },
  { key: "hr_review", label: "HR Review" },
  { key: "completed", label: "Completed" },
];

const LEGACY: Record<string, string> = {
  submitted: "self_assessment_submitted",
  under_review: "manager_review",
  pending_hr_review: "hr_review",
  hr_approved: "completed",
  closed: "completed",
};

/** Structured line-manager questions (mirrors the review framework fields). */
const MANAGER_FIELDS: Array<{ key: string; label: string; type?: "text" | "rating" }> = [
  { key: "performance_assessment", label: "Your assessment of the employee's reported performance" },
  { key: "self_rating_accuracy", label: "Is the employee's self-rating accurate against observed performance and KPIs?" },
  { key: "key_strengths", label: "Key strengths" },
  { key: "areas_for_improvement", label: "Areas requiring improvement" },
  { key: "development_actions", label: "Development actions or recommendations" },
  { key: "overall_rating", label: "Overall manager rating (1-5)", type: "rating" },
  { key: "overall_comments", label: "Overall manager comments" },
];

/** Structured HR final questions. */
const HR_FIELDS: Array<{ key: string; label: string; type?: "text" | "rating" }> = [
  { key: "hr_assessment", label: "HR's overall assessment of the employee's performance" },
  { key: "review_adequacy", label: "Does the review adequately reflect the employee and manager assessments?" },
  { key: "development_recommendations", label: "Recommended areas for development" },
  { key: "final_rating", label: "Final rating (1-5)", type: "rating" },
  { key: "hr_comments", label: "Final HR comments" },
];

function normalizeStatus(s?: string | null) {
  const v = String(s || "draft");
  return LEGACY[v] || v;
}

function prettyKey(k: string) {
  return k.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

function ReadOnlyBlock({ value, emptyText }: { value: any; emptyText: string }) {
  if (!value || (typeof value === "object" && Object.keys(value).length === 0)) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }
  if (typeof value === "string") return <p className="text-sm whitespace-pre-wrap">{value}</p>;
  return (
    <div className="space-y-3">
      {Object.entries(value).map(([k, v]) => (
        <div key={k}>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{prettyKey(k)}</p>
          <p className="text-sm whitespace-pre-wrap">
            {v === null || v === undefined || v === ""
              ? "—"
              : typeof v === "object"
                ? JSON.stringify(v, null, 2)
                : String(v)}
          </p>
        </div>
      ))}
    </div>
  );
}

function StructuredForm({
  fields,
  values,
  onChange,
}: {
  fields: typeof MANAGER_FIELDS;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="space-y-5">
      {fields.map((f) => (
        <div key={f.key} className="space-y-2">
          <Label htmlFor={f.key}>{f.label}</Label>
          {f.type === "rating" ? (
            <Select value={values[f.key] || ""} onValueChange={(v) => onChange(f.key, v)}>
              <SelectTrigger id={f.key} className="max-w-xs">
                <SelectValue placeholder="Select a rating" />
              </SelectTrigger>
              <SelectContent>
                {["1", "2", "3", "4", "5"].map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Textarea
              id={f.key}
              rows={3}
              value={values[f.key] || ""}
              onChange={(e) => onChange(f.key, e.target.value)}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function PerformanceReviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [review, setReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);
  const [managerValues, setManagerValues] = useState<Record<string, string>>({});
  const [hrValues, setHrValues] = useState<Record<string, string>>({});

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);
    try {
      const data = await apiService.getPerformanceReview(id);
      setReview(data);
    } catch (e: any) {
      setReview(null);
      setLoadError(e?.message || "We couldn't reach the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const status = normalizeStatus(review?.status);
  const stageIndex = Math.max(0, STAGES.findIndex((s) => s.key === status));

  const isHr = user?.role === "hr_manager" || user?.role === "corporate_hr" || user?.role === "executive";
  const isManager = user?.role === "line_manager";
  const isOwner =
    !!review &&
    (String(review.employee_id) === String((user as any)?.employee_id) ||
      String(review.employee?.id) === String((user as any)?.employee_id));

  const managerDone = !!review?.manager_review;
  const hrDone = status === "completed";

  const canEditManager = (isManager || isHr) && !managerDone && status === "self_assessment_submitted";
  const canEditHr = isHr && !hrDone && (managerDone || status === "manager_review" || status === "hr_review");

  const steps = useMemo(
    () => [
      { key: "self", label: "Employee self-assessment" },
      { key: "manager", label: "Line manager assessment" },
      { key: "hr", label: "HR final review" },
    ],
    [],
  );

  // Land on the step the current user needs to act on.
  useEffect(() => {
    if (!review) return;
    if (canEditManager) setStep(1);
    else if (canEditHr) setStep(2);
    else setStep(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [review?.id, status]);

  const act = async (fn: () => Promise<any>, successMsg: string) => {
    setSaving(true);
    try {
      await fn();
      toast({ title: successMsg });
      await load();
    } catch (e: any) {
      toast({ title: "Action failed", description: e?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const submitManager = () => {
    const missing = MANAGER_FIELDS.filter((f) => !String(managerValues[f.key] || "").trim());
    if (missing.length) {
      toast({
        title: "Please complete every question",
        description: `Still to answer: ${missing.map((m) => m.label).join(", ")}`,
        variant: "destructive",
      });
      return;
    }
    act(() => apiService.managerReview(review.id, managerValues), "Sent to HR for final review");
  };

  const submitHr = () => {
    const missing = HR_FIELDS.filter((f) => !String(hrValues[f.key] || "").trim());
    if (missing.length) {
      toast({
        title: "Please complete every question",
        description: `Still to answer: ${missing.map((m) => m.label).join(", ")}`,
        variant: "destructive",
      });
      return;
    }
    act(() => apiService.completePerformanceReview(review.id, hrValues), "Review completed");
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/performance")} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Performance
      </Button>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading review…</p>
      ) : loadError || !review ? (
        <Card>
          <CardContent className="py-10 text-center space-y-3">
            <p className="text-sm font-medium">We couldn't open this review</p>
            <p className="text-xs text-muted-foreground">{loadError || "It may have been removed."}</p>
            <Button variant="outline" size="sm" onClick={load}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-primary">
                    {review.employee
                      ? `${review.employee.first_name ?? ""} ${review.employee.last_name ?? ""}`.trim()
                      : `Review #${review.id}`}
                  </CardTitle>
                  <CardDescription>
                    {review.period ? `Review period ${review.period}` : "Performance review"}
                    {review.employee?.department ? ` · ${review.employee.department}` : ""}
                  </CardDescription>
                </div>
                <Badge variant="secondary">{STAGES[stageIndex]?.label ?? status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                {STAGES.map((s, i) => (
                  <div key={s.key} className="flex items-center gap-2">
                    {i <= stageIndex ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={i <= stageIndex ? "text-sm font-medium" : "text-sm text-muted-foreground"}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
              <Separator />
              <p className="text-sm text-muted-foreground">
                {status === "self_assessment_requested"
                  ? "Waiting for the employee to complete their self-assessment."
                  : status === "self_assessment_submitted"
                    ? "Waiting for the line manager's assessment."
                    : managerDone && !hrDone
                      ? "Waiting for HR's final assessment."
                      : hrDone
                        ? "This review is complete."
                        : "Review in progress."}
              </p>
            </CardContent>
          </Card>

          {/* Step switcher */}
          <div className="flex flex-wrap gap-2">
            {steps.map((s, i) => (
              <Button
                key={s.key}
                size="sm"
                variant={step === i ? "default" : "outline"}
                onClick={() => setStep(i)}
              >
                {i + 1}. {s.label}
              </Button>
            ))}
          </div>

          {step === 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  Employee self-assessment
                  {!isOwner && <Lock className="h-4 w-4 text-muted-foreground" />}
                </CardTitle>
                <CardDescription>
                  {isOwner
                    ? "Your own responses."
                    : "The employee's own responses. View only — they cannot be edited here."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ReadOnlyBlock value={review.self_assessment} emptyText="Not submitted yet." />
                {status === "self_assessment_requested" && isOwner && (
                  <Button onClick={() => navigate("/performance?selfAssessment=1")}>
                    Complete my self-assessment
                  </Button>
                )}
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => setStep(1)}>
                    Next: line manager <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Line manager assessment</CardTitle>
                <CardDescription>
                  {canEditManager
                    ? "Answer each question, then send the review to HR."
                    : "Submitted by the line manager. View only."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {canEditManager ? (
                  <>
                    <StructuredForm
                      fields={MANAGER_FIELDS}
                      values={managerValues}
                      onChange={(k, v) => setManagerValues((p) => ({ ...p, [k]: v }))}
                    />
                    <Button disabled={saving} onClick={submitManager}>
                      {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Submit assessment to HR
                    </Button>
                  </>
                ) : (
                  <ReadOnlyBlock value={review.manager_review} emptyText="Not submitted yet." />
                )}
                <div className="flex justify-between">
                  <Button variant="outline" size="sm" onClick={() => setStep(0)}>
                    Back
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => setStep(2)}>
                    Next: HR review <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">HR final review</CardTitle>
                <CardDescription>
                  {canEditHr
                    ? "Complete the final assessment and close the review."
                    : hrDone
                      ? "HR's final assessment."
                      : "Available once the line manager has submitted."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {canEditHr ? (
                  <>
                    <StructuredForm
                      fields={HR_FIELDS}
                      values={hrValues}
                      onChange={(k, v) => setHrValues((p) => ({ ...p, [k]: v }))}
                    />
                    <Button disabled={saving} onClick={submitHr}>
                      {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Complete review
                    </Button>
                  </>
                ) : (
                  <ReadOnlyBlock
                    value={review.hr_review ?? review.hr_assessment ?? review.hr_comments}
                    emptyText="Not completed yet."
                  />
                )}

                {hrDone && isOwner && !review.employee_signed_at && (
                  <Button
                    disabled={saving}
                    onClick={() => act(() => apiService.signPerformance(review.id, "employee"), "Signed off")}
                  >
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Sign off on my review
                  </Button>
                )}
                {hrDone && review.employee_signed_at && (
                  <p className="text-sm text-muted-foreground">This review is complete and signed off.</p>
                )}

                <div className="flex justify-start">
                  <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                    Back
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
