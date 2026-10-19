import { useEffect, useMemo, useRef, useState } from "react";
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
import { PERFORMANCE_RATING_OPTIONS, isNaRating } from "@/lib/performanceRatings";
import {
  EMPTY_MANAGER_ASSESSMENT,
  EMPTY_SELF_ASSESSMENT,
  MANAGER_SUBMIT_REQUIRED_KEYS,
  SELF_ASSESSMENT_FIELDS,
  SELF_ASSESSMENT_REQUIRED_KEYS,
  hydrateManagerAssessment,
  hydrateSelfAssessment,
  toManagerReviewPayload,
  type SelfAssessmentDraft,
} from "@/lib/performanceFormSchema";
import { Input } from "@/components/ui/input";

type JsonRecord = Record<string, unknown>;

type PerformanceObjective = {
  id: number;
  title?: string;
  success_measure?: string;
  target?: string;
  due_date?: string;
  support_requirements?: string;
  is_agreed?: boolean;
  status?: string;
};

type ChecklistItem = {
  status?: string;
  detail?: string;
  source?: string;
};

type QualityChecklist = {
  items?: Record<string, ChecklistItem>;
  blocking?: string[];
  pathway_blocked?: boolean;
};

type AuditEvent = {
  id: number | string;
  event_type?: string;
  description?: string;
  timestamp?: string;
  actor_name?: string;
  reason?: string;
  version_context?: string;
};

type AuditTimeline = {
  events?: AuditEvent[];
  reopen_count?: number;
};

/** Detail payload from GET /performance/:id (extends list shape with workflow extras). */
type ReviewDetail = {
  id: number;
  employee_id?: number | string;
  manager_id?: number | string;
  period?: string;
  status?: string;
  cycle_id?: number | null;
  employee?: { id?: number | string; first_name?: string; last_name?: string; department?: string };
  manager?: { id?: number | string; name?: string };
  self_assessment?: JsonRecord | string | null;
  manager_review?: JsonRecord | null;
  hr_review?: JsonRecord | null;
  self_assessment_sealed?: boolean;
  manager_review_sealed?: boolean;
  hr_review_sealed?: boolean;
  discussion_completed_at?: string | null;
  meeting_notes?: string | null;
  employee_acknowledgement?: {
    acknowledged?: boolean;
    comments?: string;
    disagrees?: boolean;
    disagreement_explanation?: string;
    acknowledged_at?: string;
  } | null;
  objectives?: PerformanceObjective[];
  workflow?: {
    can_manage_objectives?: boolean;
    can_record_discussion?: boolean;
    can_acknowledge?: boolean;
    can_hod_decide?: boolean;
    hod_pathway_blocked?: boolean;
    acknowledgement_statement?: string;
  };
  hod_status?: string | null;
  updated_at?: string;
  [key: string]: unknown;
};

function errorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (err && typeof err === "object" && "message" in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  if (typeof err === "string" && err.trim()) return err;
  return fallback;
}

const ACK_STATEMENT =
  "I confirm that I have received/discussed this review. This does not necessarily mean that I agree with every assessment or rating.";

const STAGES: Array<{ key: string; label: string }> = [
  { key: "draft", label: "Created" },
  { key: "self_assessment_requested", label: "Self-Assessment" },
  { key: "self_assessment_submitted", label: "Submitted" },
  { key: "manager_review", label: "Line Manager" },
  { key: "hod_review", label: "HOD Approval" },
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
const RATING_OPTIONS = PERFORMANCE_RATING_OPTIONS;

const YES_NO_NA = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
  { value: "Not Applicable", label: "Not Applicable" },
];

/**
 * Structured line-manager questions for independent assessment (guide §6).
 * Does not ask about the employee's self-assessment while that record is sealed.
 * `aliases` cover values saved by earlier versions so older reviews still display.
 */
type ManagerField = {
  key: string;
  label: string;
  type?: "text" | "rating" | "yes_no_na" | "yes_no" | "date";
  aliases?: string[];
  section?: string;
};

const MANAGER_FIELDS: ManagerField[] = [
  {
    key: "behaviour_ownership_rating",
    label: "Ownership, professionalism, integrity and compliance",
    type: "rating",
    section: "C. Role effectiveness and behaviours",
  },
  {
    key: "behaviour_ownership_example",
    label: "Supporting example — ownership and professionalism",
    section: "C. Role effectiveness and behaviours",
  },
  {
    key: "behaviour_learning_rating",
    label: "Response to feedback, learning and development",
    type: "rating",
    section: "C. Role effectiveness and behaviours",
  },
  {
    key: "behaviour_learning_example",
    label: "Supporting example — learning and development",
    section: "C. Role effectiveness and behaviours",
  },
  {
    key: "strengths",
    label: "Key strengths and valuable contributions",
    aliases: ["key_strengths"],
    section: "D. Overall review and next steps",
  },
  {
    key: "areas_for_improvement",
    label: "Important performance gaps or improvement areas",
    section: "D. Overall review and next steps",
  },
  {
    key: "ratings",
    label: "Overall manager rating (1–5; N/A only with explanation)",
    type: "rating",
    aliases: ["overall_rating", "rating"],
    section: "D. Overall review and next steps",
  },
  {
    key: "comments",
    label: "Overall rating rationale and supporting evidence",
    aliases: ["overall_comments", "observations"],
    section: "D. Overall review and next steps",
  },
  {
    key: "next_priorities",
    label: "Priorities for the next six months",
    section: "D. Overall review and next steps",
  },
  {
    key: "development_action",
    label: "Recommended development action",
    aliases: ["recommendations", "development_actions"],
    section: "D. Overall review and next steps",
  },
  {
    key: "development_owner",
    label: "Development action owner",
    section: "D. Overall review and next steps",
  },
  {
    key: "development_target_date",
    label: "Development action target date",
    type: "date",
    section: "D. Overall review and next steps",
  },
  {
    key: "manager_support",
    label: "Support or action the manager will provide",
    section: "D. Overall review and next steps",
  },
  {
    key: "pip_recommended",
    label: "Recommend a formal performance improvement plan?",
    type: "yes_no",
    section: "D. Overall review and next steps",
  },
  {
    key: "pip_reason",
    label: "Reason for PIP recommendation (required if Yes)",
    section: "D. Overall review and next steps",
  },
];

/** Read-only display may still show legacy self_assessment_accuracy on older records. */
const MANAGER_DISPLAY_FIELDS: ManagerField[] = [
  ...MANAGER_FIELDS,
  { key: "performance_assessment", label: "Performance assessment (legacy)", aliases: ["observations"] },
  { key: "recommendations", label: "Recommendations (legacy)", aliases: ["development_actions"] },
  { key: "self_assessment_accuracy", label: "Self-assessment accuracy (legacy)", aliases: ["self_rating_accuracy"] },
];

/** Read a manager/HR answer, tolerating older field names. */
function pickAnswer(
  source: unknown,
  field: { key: string; aliases?: string[] },
): string {
  if (!source || typeof source !== "object") return "";
  const record = source as JsonRecord;
  for (const k of [field.key, ...(field.aliases || [])]) {
    const v = record[k];
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
  source: unknown;
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

function ReadOnlyBlock({ value, emptyText }: { value: unknown; emptyText: string }) {
  if (!value || (typeof value === "object" && Object.keys(value as object).length === 0)) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }
  if (typeof value === "string") return <p className="text-sm whitespace-pre-wrap">{value}</p>;
  if (typeof value !== "object") {
    return <p className="text-sm whitespace-pre-wrap">{String(value)}</p>;
  }
  return (
    <div className="space-y-3">
      {Object.entries(value as JsonRecord).map(([k, v]) => (
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
  fields: ManagerField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  let lastSection = "";
  return (
    <div className="space-y-5">
      {fields.map((f) => {
        const showSection = f.section && f.section !== lastSection;
        if (f.section) lastSection = f.section;
        return (
          <div key={f.key} className="space-y-2">
            {showSection && (
              <h3 className="text-sm font-semibold text-foreground border-b pb-1 pt-2">{f.section}</h3>
            )}
            <Label htmlFor={f.key}>{f.label}</Label>
            {f.type === "rating" ? (
              <Select
                value={values[f.key] ? values[f.key] : undefined}
                onValueChange={(v) => onChange(f.key, v)}
              >
                <SelectTrigger id={f.key} className="max-w-md" data-testid={`mgr-${f.key}`}>
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
            ) : f.type === "yes_no_na" ? (
              <Select
                value={values[f.key] ? values[f.key] : undefined}
                onValueChange={(v) => onChange(f.key, v)}
              >
                <SelectTrigger id={f.key} className="max-w-xs" data-testid={`mgr-${f.key}`}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {YES_NO_NA.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : f.type === "yes_no" ? (
              <Select
                value={values[f.key] ? values[f.key] : undefined}
                onValueChange={(v) => onChange(f.key, v)}
              >
                <SelectTrigger id={f.key} className="max-w-xs" data-testid={`mgr-${f.key}`}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            ) : f.type === "date" ? (
              <Input
                id={f.key}
                type="date"
                className="max-w-xs"
                data-testid={`mgr-${f.key}`}
                value={values[f.key] || ""}
                onChange={(e) => onChange(f.key, e.target.value)}
              />
            ) : (
              <Textarea
                id={f.key}
                rows={3}
                data-testid={`mgr-${f.key}`}
                value={values[f.key] || ""}
                onChange={(e) => onChange(f.key, e.target.value)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function PerformanceReviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [review, setReview] = useState<ReviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);
  const [managerValues, setManagerValues] = useState<Record<string, string>>({});
  const [selfValues, setSelfValues] = useState<SelfAssessmentDraft>({ ...EMPTY_SELF_ASSESSMENT });
  const [hrValues, setHrValues] = useState<Record<string, string>>({});
  const [newObjective, setNewObjective] = useState({
    title: "",
    success_measure: "",
    target: "",
    support_requirements: "",
  });
  const autoLandedReviewId = useRef<string | number | null>(null);
  const [amendDraft, setAmendDraft] = useState<Record<number, { title: string; change_reason: string }>>({});
  const [discussionHeld, setDiscussionHeld] = useState(false);
  const [discussionSummary, setDiscussionSummary] = useState("");
  const [agreedActions, setAgreedActions] = useState("");
  const [ackChecked, setAckChecked] = useState(false);
  const [ackComments, setAckComments] = useState("");
  const [disagrees, setDisagrees] = useState<"yes" | "no" | "">("");
  const [disagreementExplanation, setDisagreementExplanation] = useState("");
  const [checklist, setChecklist] = useState<QualityChecklist | null>(null);
  const [hodNotes, setHodNotes] = useState("");
  const [hodNewRating, setHodNewRating] = useState("");
  const [hodRatingReason, setHodRatingReason] = useState("");
  const [reopenReason, setReopenReason] = useState("");
  const [reopenTarget, setReopenTarget] = useState("manager_review");
  const [auditTimeline, setAuditTimeline] = useState<AuditTimeline | null>(null);
  const [auditFilter, setAuditFilter] = useState("");

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);
    try {
      const data = (await apiService.getPerformanceReview(id)) as ReviewDetail;
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
    } catch (e: unknown) {
      setReview(null);
      setLoadError(errorMessage(e, "We couldn't reach the server."));
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
    (String(review.employee_id) === String(user?.employee_id) ||
      String(review.employee?.id) === String(user?.employee_id));

  const selfSealed = !!review?.self_assessment_sealed;
  const managerSealed = !!review?.manager_review_sealed;
  const hrSealed = !!review?.hr_review_sealed;
  // Draft manager_review JSON must not lock the form — only post-submit stages do.
  const managerDone =
    status === "hod_review" || status === "hr_review" || status === "completed";
  const hrDone = status === "completed";

  const discussionRecorded = !!review?.discussion_completed_at;
  const canEditSelf =
    isOwner && status === "self_assessment_requested" && !selfSealed;
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
    (isOwner &&
      discussionRecorded &&
      (status === "hr_review" || status === "completed") &&
      !review?.employee_acknowledgement?.acknowledged);
  const canHodDecide = !!review?.workflow?.can_hod_decide && status === "hod_review";

  const steps = useMemo(
    () => [
      { key: "self", label: "Employee self-assessment" },
      { key: "manager", label: "Line manager assessment" },
      { key: "discussion", label: "Discussion" },
      { key: "ack", label: "Acknowledgement" },
      { key: "hr", label: "HR quality & finalise" },
    ],
    [],
  );

  // Land once per review on the step the current user needs to act on.
  // Do not re-force after the user manually switches tabs.
  useEffect(() => {
    if (!review?.id) return;
    if (autoLandedReviewId.current === review.id) return;
    autoLandedReviewId.current = review.id;
    if (canEditManager) setStep(1);
    else if (canRecordDiscussion && !discussionRecorded) setStep(2);
    else if (canAcknowledge) setStep(3);
    else if (canEditHr) setStep(4);
    else if (hrDone) setStep(4);
    else if (status === "hod_review") setStep(1);
    else setStep(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [review?.id]);

  // Prefill any answers already saved, so reopening the review keeps them.
  useEffect(() => {
    if (!review) return;
    if (!review.self_assessment_sealed) {
      setSelfValues(hydrateSelfAssessment(review.self_assessment));
    }
    const mr =
      typeof review.manager_review === "object" && review.manager_review
        ? review.manager_review
        : {};
    const hr = typeof review.hr_review === "object" && review.hr_review ? review.hr_review : review;
    setManagerValues(hydrateManagerAssessment(mr));
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

  const act = async (fn: () => Promise<unknown>, successMsg: string) => {
    setSaving(true);
    try {
      await fn();
      toast({ title: successMsg });
      await load();
    } catch (e: unknown) {
      toast({
        title: "Action failed",
        description: errorMessage(e),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveSelfDraft = () => {
    act(
      () =>
        apiService.submitSelfAssessment(review.id, {
          draft: true,
          self_assessment: selfValues,
        }),
      "Self-assessment draft saved",
    );
  };

  const submitSelf = () => {
    const missing = SELF_ASSESSMENT_REQUIRED_KEYS.filter(
      (k) => !String(selfValues[k] || "").trim(),
    );
    if (missing.length) {
      toast({
        title: "Please complete every question",
        description: `Still to answer: ${missing.length} required field(s).`,
        variant: "destructive",
      });
      return;
    }
    act(
      () =>
        apiService.submitSelfAssessment(review.id, {
          self_assessment: selfValues,
        }),
      "Self-assessment submitted to your line manager",
    );
  };

  const saveManagerDraft = () => {
    const payload = {
      ...toManagerReviewPayload({
        ...EMPTY_MANAGER_ASSESSMENT,
        ...managerValues,
      }),
    };
    act(
      () => apiService.managerReview(review.id, payload, { draft: true }),
      "Manager assessment draft saved",
    );
  };

  const submitManager = () => {
    const missing = MANAGER_SUBMIT_REQUIRED_KEYS.filter(
      (k) => !String(managerValues[k] || "").trim(),
    );
    if (missing.length) {
      toast({
        title: "Please complete every question",
        description: `Still to answer: ${missing.length} required field(s).`,
        variant: "destructive",
      });
      return;
    }
    if (isNaRating(managerValues.ratings)) {
      const explanation = String(
        managerValues.comments || managerValues.objective_assessments_narrative || "",
      ).trim();
      if (!explanation) {
        toast({
          title: "N/A requires an explanation",
          description: "Provide a short rationale when a rating does not apply.",
          variant: "destructive",
        });
        return;
      }
    }
    for (const [ratingKey, exampleKey] of [
      ["behaviour_ownership_rating", "behaviour_ownership_example"],
      ["behaviour_learning_rating", "behaviour_learning_example"],
    ] as const) {
      if (isNaRating(managerValues[ratingKey]) && !String(managerValues[exampleKey] || "").trim()) {
        toast({
          title: "N/A requires an explanation",
          description: "Provide a supporting example when a behaviour rating is N/A.",
          variant: "destructive",
        });
        return;
      }
    }
    if (
      String(managerValues.pip_recommended || "").toLowerCase() === "yes" &&
      !String(managerValues.pip_reason || "").trim()
    ) {
      toast({
        title: "PIP reason required",
        description: "Explain why a formal performance improvement plan is recommended.",
        variant: "destructive",
      });
      return;
    }
    const payload = {
      ...toManagerReviewPayload({
        ...EMPTY_MANAGER_ASSESSMENT,
        ...managerValues,
      }),
    };
    act(() => apiService.managerReview(review.id, payload), "Sent to HR for final review");
  };

  const canManageObjectives =
    !!review?.workflow?.can_manage_objectives ||
    ((isManager || isHr) && status !== "completed");

  const createObjective = async () => {
    if (!newObjective.title.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await apiService.createPerformanceObjective(review.id, {
        title: newObjective.title.trim(),
        success_measure: newObjective.success_measure.trim() || undefined,
        target: newObjective.target || undefined,
        support_requirements: newObjective.support_requirements.trim() || undefined,
      });
      setNewObjective({
        title: "",
        success_measure: "",
        target: "",
        support_requirements: "",
      });
      toast({ title: "KPI added" });
      await load();
    } catch (e: unknown) {
      toast({ title: "Action failed", description: errorMessage(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const agreeObjective = (objectiveId: number) => {
    act(() => apiService.agreePerformanceObjective(review.id, objectiveId), "Agreement recorded");
  };

  const amendObjective = (objectiveId: number) => {
    const draft = amendDraft[objectiveId];
    if (!draft?.change_reason?.trim()) {
      toast({ title: "Change reason required", variant: "destructive" });
      return;
    }
    act(
      () =>
        apiService.amendPerformanceObjective(review.id, objectiveId, {
          title: draft.title || undefined,
          change_reason: draft.change_reason,
          change_agreed: true,
        }),
      "Objective amended — history retained",
    );
  };

  const loadChecklist = async () => {
    if (!isHr || !review?.id) return;
    try {
      const res = await apiService.getPerformanceQualityChecklist(review.id);
      setChecklist(res?.data ?? res);
    } catch {
      setChecklist(null);
    }
  };

  useEffect(() => {
    if (canEditHr || (isHr && status === "hr_review")) {
      void loadChecklist();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [review?.id, status, review?.employee_acknowledgement, review?.discussion_completed_at]);

  useEffect(() => {
    if (!review?.id) return;
    void (async () => {
      try {
        const res = await apiService.getPerformanceAuditTimeline(review.id);
        setAuditTimeline(res?.data ?? res);
      } catch {
        setAuditTimeline(null);
      }
    })();
  }, [review?.id, review?.status, review?.reopen_count]);

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
    if (!review?.employee_acknowledgement?.acknowledged) {
      toast({
        title: "Acknowledgement required",
        description: "The employee must acknowledge the review before finalisation.",
        variant: "destructive",
      });
      setStep(3);
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
    act(async () => {
      await apiService.savePerformanceQualityChecklist(review.id, { checklist_reviewed: true });
      try {
        await apiService.completePerformanceReview(review.id, hrValues);
      } catch (e: unknown) {
        await loadChecklist();
        throw e;
      }
    }, "Review finalised");
  };

  const submitHodDecision = (decision: "approved" | "returned") => {
    if (hodNewRating && hodNewRating !== String(review?.manager_review?.ratings || "") && !hodRatingReason.trim()) {
      toast({
        title: "Reason required",
        description: "Provide a reason when changing the rating during calibration.",
        variant: "destructive",
      });
      return;
    }
    act(
      () =>
        apiService.hodDecidePerformance(review.id, {
          decision,
          notes: hodNotes || undefined,
          new_rating: hodNewRating || undefined,
          rating_change_reason: hodRatingReason || undefined,
        }),
      decision === "approved" ? "HOD approval recorded" : "Review returned to manager",
    );
  };

  const submitReopen = () => {
    if (!reopenReason.trim() || reopenReason.trim().length < 5) {
      toast({
        title: "Reason required",
        description: "Provide a meaningful reopening reason (at least 5 characters).",
        variant: "destructive",
      });
      return;
    }
    act(
      () =>
        apiService.reopenPerformanceReview(review.id, {
          reason: reopenReason.trim(),
          return_to_status: reopenTarget,
        }),
      "Review reopened for correction",
    );
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

          {/* Key Performance Indicators — shared planning (not sealed assessments) */}
          <Card data-testid="objectives-panel">
            <CardHeader>
              <CardTitle className="text-base">Key Performance Indicators</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(review.objectives || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {review.cycle_id
                    ? "No KPIs yet."
                    : "Legacy review without structured objectives — narrative assessments still apply."}
                </p>
              ) : (
                (review.objectives || []).map((o: PerformanceObjective) => (
                  <div key={o.id} className="border rounded-md p-3 space-y-2" data-testid={`objective-${o.id}`}>
                    <div className="flex flex-wrap justify-between gap-2">
                      <p className="font-medium text-sm">{o.title}</p>
                      <Badge variant={o.is_agreed ? "secondary" : "outline"}>
                        {o.is_agreed ? "Agreed" : o.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                      {[
                        o.success_measure && `Measure: ${o.success_measure}`,
                        o.target &&
                          `Rating: ${
                            PERFORMANCE_RATING_OPTIONS.find((r) => r.value === String(o.target))
                              ?.label || o.target
                          }`,
                        o.support_requirements && `Support: ${o.support_requirements}`,
                      ]
                        .filter(Boolean)
                        .join("\n")}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(isOwner || ((isManager || isHr) && String(review.manager_id) === String(user?.id)) || isHr) &&
                        !o.is_agreed && (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={saving}
                            data-testid={`agree-objective-${o.id}`}
                            onClick={() => agreeObjective(o.id)}
                          >
                            Record my agreement
                          </Button>
                        )}
                      {canManageObjectives && o.is_agreed && (
                        <div className="w-full space-y-2 pt-2 border-t">
                          <Label className="text-xs">Material amendment</Label>
                          <Input
                            placeholder="Updated title (optional)"
                            value={amendDraft[o.id]?.title ?? o.title}
                            onChange={(e) =>
                              setAmendDraft((p) => ({
                                ...p,
                                [o.id]: { ...(p[o.id] || { change_reason: "" }), title: e.target.value },
                              }))
                            }
                          />
                          <Textarea
                            placeholder="Why this change? (required)"
                            rows={2}
                            data-testid={`amend-reason-${o.id}`}
                            value={amendDraft[o.id]?.change_reason || ""}
                            onChange={(e) =>
                              setAmendDraft((p) => ({
                                ...p,
                                [o.id]: {
                                  title: p[o.id]?.title ?? o.title,
                                  change_reason: e.target.value,
                                },
                              }))
                            }
                          />
                          <Button
                            size="sm"
                            disabled={saving}
                            data-testid={`amend-objective-${o.id}`}
                            onClick={() => amendObjective(o.id)}
                          >
                            Save amendment with history
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {canManageObjectives && (
                <div className="space-y-2 border-t pt-4">
                  <p className="text-sm font-medium">Propose Key Performance Indicator</p>
                  <Input
                    data-testid="new-objective-title"
                    placeholder="key Deliverable"
                    value={newObjective.title}
                    onChange={(e) => setNewObjective({ ...newObjective, title: e.target.value })}
                  />
                  <Textarea
                    data-testid="new-objective-measure"
                    placeholder="Success measure / evidence"
                    rows={2}
                    value={newObjective.success_measure}
                    onChange={(e) =>
                      setNewObjective({ ...newObjective, success_measure: e.target.value })
                    }
                  />
                  <div className="space-y-2">
                    <Label htmlFor="new-kpi-rating">Rating</Label>
                    <Select
                      value={newObjective.target || undefined}
                      onValueChange={(value) =>
                        setNewObjective({ ...newObjective, target: value })
                      }
                    >
                      <SelectTrigger id="new-kpi-rating" data-testid="new-objective-target">
                        <SelectValue placeholder="Select rating (1–5)" />
                      </SelectTrigger>
                      <SelectContent>
                        {PERFORMANCE_RATING_OPTIONS.filter((o) => o.value !== "N/A").map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    placeholder="Support, resources or dependencies (optional)"
                    rows={2}
                    value={newObjective.support_requirements}
                    onChange={(e) =>
                      setNewObjective({ ...newObjective, support_requirements: e.target.value })
                    }
                  />
                  <Button disabled={saving} onClick={createObjective} data-testid="create-objective">
                    Add KPI
                  </Button>
                </div>
              )}
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
                ) : canEditSelf ? (
                  <div className="space-y-5" data-testid="self-assessment-form">
                    <p className="text-sm text-muted-foreground">
                      Answer each question for this review period. You can save a draft and return later.
                    </p>
                    {(review.objectives || []).length > 0 && (
                      <div className="space-y-2 rounded-md border p-3" data-testid="self-objectives-list">
                        <p className="text-sm font-medium">Agreed / proposed objectives</p>
                        <ul className="text-sm space-y-2">
                          {(review.objectives || []).map((o: PerformanceObjective) => (
                            <li key={o.id}>
                              <span className="font-medium">{o.title}</span>
                              {o.target ? ` — target: ${o.target}` : ""}
                              {o.is_agreed ? " (agreed)" : " (proposed)"}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {SELF_ASSESSMENT_FIELDS.map((field, index) => (
                      <div key={field.key} className="space-y-2">
                        <Label htmlFor={field.key}>
                          {index + 1}. {field.label}
                        </Label>
                        <Textarea
                          id={field.key}
                          data-testid={`self-${field.key}`}
                          value={selfValues[field.key] || ""}
                          onChange={(e) =>
                            setSelfValues((prev) => ({
                              ...prev,
                              [field.key]: e.target.value,
                            }))
                          }
                          className="min-h-[80px]"
                        />
                      </div>
                    ))}
                    <div className="flex flex-wrap gap-2 justify-end pt-2">
                      <Button
                        variant="secondary"
                        disabled={saving}
                        onClick={saveSelfDraft}
                        data-testid="save-self-draft"
                      >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Save draft
                      </Button>
                      <Button
                        disabled={saving}
                        onClick={submitSelf}
                        data-testid="submit-self-assessment"
                      >
                        Submit to Manager
                      </Button>
                    </div>
                  </div>
                ) : (
                  <ReadOnlyBlock value={review.self_assessment} emptyText="Not submitted yet." />
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
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        disabled={saving}
                        onClick={saveManagerDraft}
                        data-testid="save-manager-draft"
                      >
                        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save draft
                      </Button>
                      <Button disabled={saving} onClick={submitManager} data-testid="submit-manager-assessment">
                        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Submit assessment to HR
                      </Button>
                    </div>
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
                    Next: acknowledgement <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
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
                        value={disagrees || undefined}
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
                    Acknowledgement opens after the discussion has been recorded, and before HR finalises the review.
                  </p>
                )}
                <div className="flex justify-between">
                  <Button variant="outline" size="sm" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => setStep(4)}>
                    Next: HR quality &amp; finalise <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">HR quality check &amp; finalisation</CardTitle>
                <CardDescription>
                  {canEditHr
                    ? "Confirm derived quality checks, complete the HR assessment, then finalise."
                    : hrDone
                      ? "HR's final assessment."
                      : "Available once discussion and acknowledgement are complete."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {status === "hod_review" && (
                  <p className="text-sm text-amber-700 dark:text-amber-400 rounded-md border border-dashed p-3">
                    HOD approval is outstanding
                    {review.hod_status === "blocked_pending_policy"
                      ? " (pathway blocked until HR authorises confidential-access policy)."
                      : "."}
                  </p>
                )}
                {!discussionRecorded && status === "hr_review" && (
                  <p className="text-sm text-amber-700 dark:text-amber-400 rounded-md border border-dashed p-3">
                    Discussion must be recorded before HR can finalise this review.
                  </p>
                )}
                {isHr && checklist?.items && (
                  <div className="space-y-2 rounded-md border p-3">
                    <p className="text-sm font-medium">Quality checklist (derived from records)</p>
                    <ul className="space-y-1 text-sm">
                      {Object.entries(checklist.items).map(([key, item]) => (
                        <li key={key} className="flex gap-2">
                          <span className="uppercase text-xs tracking-wide text-muted-foreground w-24 shrink-0">
                            {String(item.status)}
                          </span>
                          <span>
                            <span className="font-medium">{key.replace(/_/g, " ")}</span>
                            {item.detail ? ` — ${item.detail}` : ""}
                            {item.source === "manual" ? " (manual confirmation)" : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {Array.isArray(checklist.blocking) && checklist.blocking.length > 0 && (
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        Blocking: {checklist.blocking.join("; ")}
                      </p>
                    )}
                  </div>
                )}
                {canEditHr && discussionRecorded ? (
                  <>
                    <StructuredForm
                      fields={HR_FIELDS}
                      values={hrValues}
                      onChange={(k, v) => setHrValues((p) => ({ ...p, [k]: v }))}
                    />
                    <Button disabled={saving} onClick={submitHr}>
                      {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Confirm checklist &amp; finalise
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

                {isHr && (status === "completed" || status === "hr_review") && (
                  <div className="space-y-3 rounded-md border border-dashed p-3">
                    <p className="text-sm font-medium">HR-only reopen</p>
                    <Textarea
                      rows={2}
                      value={reopenReason}
                      onChange={(e) => setReopenReason(e.target.value)}
                      placeholder="Mandatory reason for reopening…"
                    />
                    <Select value={reopenTarget} onValueChange={setReopenTarget}>
                      <SelectTrigger className="max-w-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="self_assessment_requested">Return to employee self-assessment</SelectItem>
                        <SelectItem value="self_assessment_submitted">Return after self-assessment</SelectItem>
                        <SelectItem value="manager_review">Return to manager assessment</SelectItem>
                        <SelectItem value="hr_review">Return to HR review</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" disabled={saving} onClick={submitReopen}>
                      Reopen for correction
                    </Button>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" size="sm" onClick={() => setStep(3)}>
                    Back
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {canHodDecide && (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base">HOD approval / calibration</CardTitle>
                <CardDescription>
                  Self-assessment remains sealed. Approve or return the manager assessment. Rating changes require a reason.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Current manager rating: {String(review?.manager_review?.ratings ?? "—")}
                </p>
                <div className="space-y-2">
                  <Label>New rating (optional calibration)</Label>
                  <Select value={hodNewRating || "__keep"} onValueChange={(v) => setHodNewRating(v === "__keep" ? "" : v)}>
                    <SelectTrigger className="max-w-xs">
                      <SelectValue placeholder="Keep current" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__keep">Keep current</SelectItem>
                      {RATING_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Rating change reason</Label>
                  <Textarea rows={2} value={hodRatingReason} onChange={(e) => setHodRatingReason(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea rows={2} value={hodNotes} onChange={(e) => setHodNotes(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <Button disabled={saving} onClick={() => submitHodDecision("approved")}>
                    Approve
                  </Button>
                  <Button variant="outline" disabled={saving} onClick={() => submitHodDecision("returned")}>
                    Return to manager
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {status === "hod_review" && review.hod_status === "blocked_pending_policy" && isHr && (
            <p className="text-sm text-amber-700 dark:text-amber-400">
              HOD pathway blocked: set <code>hod_confidential_access_authorised</code> on the cycle only after HR
              confirms whether HODs may see manager assessments without self-assessment contents (current least-privilege).
            </p>
          )}

          {auditTimeline?.events && (
            <Card data-testid="performance-audit-timeline">
              <CardHeader>
                <CardTitle className="text-base">Audit history</CardTitle>
                <CardDescription>
                  Workflow events for this review
                  {auditTimeline.reopen_count > 0
                    ? ` · reopened ${auditTimeline.reopen_count} time(s); historical snapshots marked separately`
                    : ""}
                  . Assessment narratives are redacted for non-HR viewers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  data-testid="audit-event-filter"
                  placeholder="Filter by event type…"
                  value={auditFilter}
                  onChange={(e) => setAuditFilter(e.target.value)}
                />
                <ul className="space-y-2 max-h-80 overflow-y-auto text-sm">
                  {(auditTimeline.events || [])
                    .filter((ev) =>
                      !auditFilter
                        || String(ev.event_type || "").toLowerCase().includes(auditFilter.toLowerCase())
                        || String(ev.description || "").toLowerCase().includes(auditFilter.toLowerCase()),
                    )
                    .map((ev) => (
                      <li key={ev.id} className="border-b border-dashed pb-2" data-testid="audit-event-row">
                        <p className="font-medium">{ev.event_type}</p>
                        <p className="text-muted-foreground">{ev.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {ev.timestamp?.slice?.(0, 19)?.replace("T", " ") || "—"}
                          {ev.actor_name ? ` · ${ev.actor_name}` : ""}
                          {ev.reason ? ` · reason: ${ev.reason}` : ""}
                          {ev.version_context ? ` · ${ev.version_context}` : ""}
                        </p>
                      </li>
                    ))}
                </ul>
                {(auditTimeline.events || []).length === 0 && (
                  <p className="text-sm text-muted-foreground">No audit events recorded yet.</p>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
