import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle2, Circle, Loader2 } from "lucide-react";
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

function normalizeStatus(s?: string | null) {
  const v = String(s || "draft");
  return LEGACY[v] || v;
}

function renderBlock(value: any) {
  if (!value) return <p className="text-sm text-muted-foreground">Not provided yet.</p>;
  if (typeof value === "string") return <p className="text-sm whitespace-pre-wrap">{value}</p>;
  return (
    <div className="space-y-2">
      {Object.entries(value).map(([k, v]) => (
        <div key={k}>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{k.replace(/_/g, " ")}</p>
          <p className="text-sm whitespace-pre-wrap">
            {typeof v === "object" ? JSON.stringify(v, null, 2) : String(v ?? "—")}
          </p>
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
  const [notes, setNotes] = useState("");

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
    review &&
    (String(review.employee_id) === String((user as any)?.employee_id) ||
      String(review.employee?.id) === String((user as any)?.employee_id));

  const act = async (fn: () => Promise<any>, successMsg: string) => {
    setSaving(true);
    try {
      await fn();
      toast({ title: successMsg });
      setNotes("");
      await load();
    } catch (e: any) {
      toast({ title: "Action failed", description: e?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
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
            <Button variant="outline" size="sm" onClick={load}>Try again</Button>
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
            <CardContent>
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
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Employee self-assessment</CardTitle></CardHeader>
              <CardContent>{renderBlock(review.self_assessment)}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Line manager review</CardTitle></CardHeader>
              <CardContent>{renderBlock(review.manager_review)}</CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Next step</CardTitle>
              <CardDescription>Only the person responsible for the current stage can act.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {status === "self_assessment_requested" && isOwner && (
                <div className="space-y-2">
                  <p className="text-sm">Your self-assessment is waiting to be completed.</p>
                  <Button onClick={() => navigate("/performance?selfAssessment=1")}>Complete self-assessment</Button>
                </div>
              )}

              {status === "self_assessment_submitted" && (isManager || isHr) && (
                <div className="space-y-2">
                  <Label htmlFor="mgr">Line manager comments</Label>
                  <Textarea id="mgr" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
                  <Button
                    disabled={saving || !notes.trim()}
                    onClick={() => act(() => apiService.managerReview(review.id, { comments: notes }), "Sent to HR")}
                  >
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Submit review to HR
                  </Button>
                </div>
              )}

              {(status === "manager_review" || status === "hr_review") && isHr && (
                <div className="space-y-2">
                  <Label htmlFor="hr">HR comments</Label>
                  <Textarea id="hr" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
                  <Button
                    disabled={saving}
                    onClick={() =>
                      act(
                        () => apiService.completePerformanceReview(review.id, { hr_comments: notes }),
                        "Review completed",
                      )
                    }
                  >
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Approve and complete
                  </Button>
                </div>
              )}

              {status === "completed" && isOwner && !review.employee_signed_at && (
                <Button
                  disabled={saving}
                  onClick={() => act(() => apiService.signPerformance(review.id, "employee"), "Signed off")}
                >
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Sign off on my review
                </Button>
              )}

              {status === "completed" && review.employee_signed_at && (
                <p className="text-sm text-muted-foreground">This review is complete and signed off.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
