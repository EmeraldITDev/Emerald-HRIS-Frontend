import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
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

const ACK_STATEMENT =
  "I confirm that I have received/discussed this review. This does not necessarily mean that I agree with every assessment or rating.";

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

/** Guide §7 rating scale — shared labels for manager/HR selects. */
const RATING_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "5", label: "5 – Exceptional" },
  { value: "4", label: "4 – Exceeds Expectations" },
  { value: "3", label: "3 – Meets Expectations" },
  { value: "2", label: "2 – Partially Meets Expectations" },
  { value: "1", label: "1 – Does Not Meet Expectations" },
  { value: "N/A", label: "N/A – Not Applicable" },
];

/**
 * Structured line-manager questions for independent assessment (guide §6).
 * Does not ask about the employee's self-assessment while that record is sealed.
 * `aliases` cover values saved by earlier versions so older reviews still display.
 */
const MANAGER_FIELDS: Array<{ key: string; label: string; type?: "text" | "rating"; aliases?: string[] }> = [
  { key: "performance_assessment", label: "Based on agreed objectives and observed performance, what is your assessment of the employee?", aliases: ["observations"] },
  { key: "strengths", label: "Key strengths and most valuable contributions", aliases: ["key_strengths"] },
  { key: "areas_for_improvement", label: "Most important performance gaps or improvement areas" },
  { key: "recommendations", label: "Development action recommended (action, owner, target date)", aliases: ["development_actions"] },
  { key: "ratings", label: "Overall manager rating", type: "rating", aliases: ["overall_rating", "rating"] },
  { key: "comments", label: "Overall rating rationale and supporting evidence", aliases: ["overall_comments", "observations"] },
];

/** Read-only display may still show legacy self_assessment_accuracy on older records. */
const MANAGER_DISPLAY_FIELDS: Array<{ key: string; label: string; aliases?: string[] }> = [
  ...MANAGER_FIELDS,
  { key: "self_assessment_accuracy", label: "Self-assessment accuracy (legacy)", aliases: ["self_rating_accuracy"] },
];

/** Read a manager/HR answer, tolerating older field names. */
function pickAnswer(
  source: any,
  field: { key: string; aliases?: string[] },
): string {
  if (!source || typeof source !== "object") return "";
  for (const k of [field.key, ...(field.aliases || [])]) {
    const v = source[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v);
  }
  return "";
}

/** Render saved answers against a known question list, with labels. */
function AnswerList({
  fields,
  source,
  emptyText,
}: {
  fields: Array<{ key: string; label: string; aliases?: string[] }>;
  source: any;
  emptyText: string;
}) {
  const rows = fields
    .map((f) => ({ label: f.label, value: pickAnswer(source, f) }))
    .filter((r) => r.value);
  if (!rows.length) return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.label}>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{r.label}</p>
          <p className="text-sm whitespace-pre-wrap">{r.value}</p>
        </div>
      ))}
    </div>
  );
}

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
                {RATING_OPTIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
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
  const [discussionHeld, setDiscussionHeld] = useState(false);
  const [discussionSummary, setDiscussionSummary] = useState("");
  const [agreedActions, setAgreedActions] = useState("");
  const [ackChecked, setAckChecked] = useState(false);
  const [ackComments, setAckComments] = useState("");
  const [disagrees, setDisagrees] = useState<"yes" | "no" | "">("");
  const [disagreementExplanation, setDisagreementExplanation] = useState("");

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);
    try {
      const data = await apiService.getPerformanceReview(id);
      setReview(data);
      if (data?.discussion_completed_at) {
        setDiscussionHeld(true);
        const notes = String(data.meeting_notes || "");
        const parts = notes.split(/\n\nAgreed actions:\n/);
        setDiscussionSummary(parts[0] || "");
        setAgreedActions(parts[1] || "");
      }
      const ack = data?.employee_acknowledgement;
      if (ack && typeof ack === "object") {
        setAckChecked(!!ack.acknowledged);
        setAckComments(String(ack.comments || ""));
        setDisagrees(ack.disagrees ? "yes" : "no");
        setDisagreementExplanation(String(ack.disagreement_explanation || ""));
      }
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

  const selfSealed = !!review?.self_assessment_sealed;
  const managerSealed = !!review?.manager_review_sealed;
  const hrSealed = !!review?.hr_review_sealed;
  const managerDone =
    status === "hr_review" ||
    status === "completed" ||
    (!!review?.manager_review && !managerSealed);
  const hrDone = status === "completed";

  const discussionRecorded = !!review?.discussion_completed_at;
  const canEditManager =
    (isManager || isHr) &&
    !managerDone &&
    (status === "self_assessment_submitted" || status === "manager_review");
  const canRecordDiscussion =
    !!review?.workflow?.can_record_discussion ||
    ((isManager || isHr) && (status === "hr_review" || status === "completed") && !discussionRecorded);
  const canEditHr = isHr && !hrDone && status === "hr_review";
  const canAcknowledge =
    !!review?.workflow?.can_acknowledge ||
    (hrDone && isOwner && discussionRecorded && !review?.employee_acknowledgement?.acknowledged);

  const steps = useMemo(
    () => [
      { key: "self", label: "Employee self-assessment" },
      { key: "manager", label: "Line manager assessment" },
      { key: "discussion", label: "Discussion" },
      { key: "hr", label: "HR final review" },
      { key: "ack", label: "Acknowledgement" },
    ],
    [],
  );

  // Land on the step the current user needs to act on.
  useEffect(() => {
    if (!review) return;
    if (canEditManager) setStep(1);
    else if (canRecordDiscussion && !discussionRecorded) setStep(2);
    else if (canEditHr) setStep(3);
    else if (canAcknowledge) setStep(4);
    else if (hrDone) setStep(4);
    else setStep(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [review?.id, status, discussionRecorded]);

  // Prefill any answers already saved, so reopening the review keeps them.
  useEffect(() => {
    if (!review) return;
    const mr = typeof review.manager_review === "object" ? review.manager_review : review;
    const hr = typeof review.hr_review === "object" && review.hr_review ? review.hr_review : review;
    setManagerValues((prev) => {
      const next = { ...prev };
      MANAGER_FIELDS.forEach((f) => {
        if (!next[f.key]) {
          const v = pickAnswer(mr, f);
          if (v) next[f.key] = v;
        }
      });
      return next;
    });
    setHrValues((prev) => {
      const next = { ...prev };
      HR_FIELDS.forEach((f) => {
        if (!next[f.key]) {
          const v = pickAnswer(hr, f);
          if (v) next[f.key] = v;
        }
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [review?.id, review?.manager_review, review?.hr_review]);

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
    const rating = String(managerValues.ratings || "").trim().toUpperCase();
    if (rating === "N/A" || rating === "NA") {
      const explanation = String(managerValues.comments || managerValues.performance_assessment || "").trim();
      if (!explanation) {
        toast({
          title: "N/A requires an explanation",
          description: "Provide a short rationale when a rating does not apply.",
          variant: "destructive",
        });
        return;
      }
    }
    act(() => apiService.managerReview(review.id, managerValues), "Sent to HR for final review");
  };

  const submitHr = () => {
    if (!discussionRecorded) {
      toast({
        title: "Discussion required",
        description: "Record the performance discussion before HR finalisation.",
        variant: "destructive",
      });
      setStep(2);
      return;
    }
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

  const submitDiscussion = () => {
    if (!discussionHeld) {
      toast({
        title: "Confirm discussion",
        description: "Mark that the performance discussion has taken place.",
        variant: "destructive",
      });
      return;
    }
    if (!discussionSummary.trim()) {
      toast({
        title: "Summary required",
        description: "Provide a summary of the discussion and agreed actions.",
        variant: "destructive",
      });
      return;
    }
    act(
      () =>
        apiService.markPerformanceDiscussed(review.id, {
          discussion_held: true,
          discussion_summary: discussionSummary.trim(),
          agreed_actions: agreedActions.trim() || undefined,
        }),
      "Discussion recorded",
    );
  };

  const submitAcknowledgement = () => {
    if (!ackChecked) {
      toast({
        title: "Acknowledgement required",
        description: "Confirm that you have received/discussed this review.",
        variant: "destructive",
      });
      return;
    }
    if (!disagrees) {
      toast({
        title: "Disagreement choice required",
        description: "Select Yes or No for recording a disagreement.",
        variant: "destructive",
      });
      return;
    }
    act(
      () =>
        apiService.signPerformance(review.id, "employee", {
          acknowledged: true,
          comments: ackComments.trim() || undefined,
          disagrees: disagrees === "yes",
          disagreement_explanation:
            disagrees === "yes" ? disagreementExplanation.trim() || undefined : undefined,
        }),
      "Acknowledgement saved",
    );
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
                  {(selfSealed || !isOwner) && <Lock className="h-4 w-4 text-muted-foreground" />}
                </CardTitle>
                <CardDescription>
                  {isOwner
                    ? "Your own responses."
                    : selfSealed
                      ? "Sealed until you submit your independent manager assessment. This protects assessment independence."
                      : "The employee's own responses. View only — they cannot be edited here."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selfSealed ? (
                  <p className="text-sm text-muted-foreground rounded-md border border-dashed p-4">
                    Employee ratings and comments are hidden until your manager assessment is submitted.
                    Complete your assessment on the next step without referring to the self-assessment.
                  </p>
                ) : (
                  <ReadOnlyBlock value={review.self_assessment} emptyText="Not submitted yet." />
                )}
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
                    ? selfSealed
                      ? "Complete your independent assessment. The employee self-assessment stays sealed until you submit."
                      : "Answer each question, then send the review to HR."
                    : managerSealed
                      ? "The manager assessment is not available until the line manager submits."
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
                ) : managerSealed ? (
                  <p className="text-sm text-muted-foreground rounded-md border border-dashed p-4">
                    Manager assessment and proposed rating are sealed until the line manager submits.
                  </p>
                ) : (
                  <AnswerList
                    fields={MANAGER_DISPLAY_FIELDS}
                    source={
                      typeof review.manager_review === "object" && review.manager_review
                        ? review.manager_review
                        : review
                    }
                    emptyText="Not submitted yet."
                  />
                )}
                <div className="flex justify-between">
                  <Button variant="outline" size="sm" onClick={() => setStep(0)}>
                    Back
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => setStep(2)}>
                    Next: discussion <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Review discussion</CardTitle>
                <CardDescription>
                  {canRecordDiscussion && !discussionRecorded
                    ? "Record whether the performance discussion has taken place and summarise agreed actions."
                    : discussionRecorded
                      ? "Discussion record saved."
                      : "Available after both assessments have been submitted."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {canRecordDiscussion && !discussionRecorded ? (
                  <>
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="discussion-held"
                        checked={discussionHeld}
                        onCheckedChange={(v) => setDiscussionHeld(v === true)}
                      />
                      <Label htmlFor="discussion-held" className="leading-snug">
                        Has the performance discussion taken place? (Yes)
                      </Label>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discussion-summary">Manager summary of the discussion</Label>
                      <Textarea
                        id="discussion-summary"
                        rows={4}
                        value={discussionSummary}
                        onChange={(e) => setDiscussionSummary(e.target.value)}
                        placeholder="Summarise the discussion outcomes…"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="agreed-actions">Agreed next steps / actions</Label>
                      <Textarea
                        id="agreed-actions"
                        rows={3}
                        value={agreedActions}
                        onChange={(e) => setAgreedActions(e.target.value)}
                        placeholder="Agreed actions, owners, dates…"
                      />
                    </div>
                    <Button disabled={saving} onClick={submitDiscussion}>
                      {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save discussion record
                    </Button>
                  </>
                ) : discussionRecorded ? (
                  <div className="space-y-3">
                    <p className="text-sm whitespace-pre-wrap">{review.meeting_notes || "Discussion recorded."}</p>
                    {review.discussion_completed_at && (
                      <p className="text-xs text-muted-foreground">
                        Recorded {String(review.discussion_completed_at).slice(0, 19).replace("T", " ")}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground rounded-md border border-dashed p-4">
                    Both assessments must be submitted before the discussion can be recorded.
                  </p>
                )}
                <div className="flex justify-between">
                  <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => setStep(3)}>
                    Next: HR review <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">HR final review</CardTitle>
                <CardDescription>
                  {canEditHr
                    ? discussionRecorded
                      ? "Complete the final assessment and close the review."
                      : "Record the discussion first, then complete the HR review."
                    : hrDone
                      ? "HR's final assessment."
                      : "Available once the line manager has submitted and the discussion is recorded."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {!discussionRecorded && status === "hr_review" && (
                  <p className="text-sm text-amber-700 dark:text-amber-400 rounded-md border border-dashed p-3">
                    Discussion must be recorded before HR can finalise this review.
                  </p>
                )}
                {canEditHr && discussionRecorded ? (
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
                ) : hrSealed ? (
                  <p className="text-sm text-muted-foreground rounded-md border border-dashed p-4">
                    The final HR review is available after HR completes and finalises the review.
                  </p>
                ) : (
                  <AnswerList
                    fields={HR_FIELDS}
                    source={
                      typeof review.hr_review === "object" && review.hr_review
                        ? review.hr_review
                        : review
                    }
                    emptyText="Not completed yet."
                  />
                )}

                <div className="flex justify-between">
                  <Button variant="outline" size="sm" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => setStep(4)}>
                    Next: acknowledgement <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Employee acknowledgement</CardTitle>
                <CardDescription>
                  Acknowledgement confirms receipt or discussion of the review — not agreement with every rating.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {canAcknowledge ? (
                  <>
                    <div className="flex items-start gap-3 rounded-md border p-3">
                      <Checkbox
                        id="ack-check"
                        checked={ackChecked}
                        onCheckedChange={(v) => setAckChecked(v === true)}
                      />
                      <Label htmlFor="ack-check" className="leading-snug font-normal">
                        {review.workflow?.acknowledgement_statement || ACK_STATEMENT}
                      </Label>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ack-comments">Employee comments or clarification (optional)</Label>
                      <Textarea
                        id="ack-comments"
                        rows={3}
                        value={ackComments}
                        onChange={(e) => setAckComments(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Do you wish to record a disagreement with any part of the assessment?</Label>
                      <Select
                        value={disagrees}
                        onValueChange={(v) => setDisagrees(v as "yes" | "no")}
                      >
                        <SelectTrigger className="max-w-xs">
                          <SelectValue placeholder="Select Yes or No" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no">No</SelectItem>
                          <SelectItem value="yes">Yes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {disagrees === "yes" && (
                      <div className="space-y-2">
                        <Label htmlFor="disagreement-explanation">
                          Explain the disagreement (optional)
                        </Label>
                        <Textarea
                          id="disagreement-explanation"
                          rows={3}
                          value={disagreementExplanation}
                          onChange={(e) => setDisagreementExplanation(e.target.value)}
                        />
                      </div>
                    )}
                    <Button disabled={saving} onClick={submitAcknowledgement}>
                      {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Submit acknowledgement
                    </Button>
                  </>
                ) : review.employee_acknowledgement?.acknowledged ? (
                  <div className="space-y-3">
                    <p className="text-sm">{ACK_STATEMENT}</p>
                    <p className="text-sm text-muted-foreground">
                      Acknowledged
                      {review.employee_signed_at
                        ? ` ${String(review.employee_signed_at).slice(0, 19).replace("T", " ")}`
                        : ""}
                      . This is not agreement with the rating.
                    </p>
                    {review.employee_acknowledgement.comments && (
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Comments</p>
                        <p className="text-sm whitespace-pre-wrap">
                          {review.employee_acknowledgement.comments}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Disagreement</p>
                      <p className="text-sm">
                        {review.employee_acknowledgement.disagrees ? "Yes" : "No"}
                      </p>
                      {review.employee_acknowledgement.disagrees &&
                        review.employee_acknowledgement.disagreement_explanation && (
                          <p className="text-sm whitespace-pre-wrap mt-1">
                            {review.employee_acknowledgement.disagreement_explanation}
                          </p>
                        )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground rounded-md border border-dashed p-4">
                    Acknowledgement opens after HR finalises the review and the discussion has been recorded.
                  </p>
                )}
                <div className="flex justify-start">
                  <Button variant="outline" size="sm" onClick={() => setStep(3)}>
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
