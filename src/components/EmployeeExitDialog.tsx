import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiService, type Employee, type EmployeeExitPreview, type EmployeeExitType } from "@/lib/api";

const EXIT_TYPES: EmployeeExitType[] = ["Resigned", "Terminated", "Retired"];
const NO_REPLACEMENT = "none";

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? "" : "s"}`;

interface Props {
  /** The employee leaving; the dialog is open while this is set. */
  employee: Employee | null;
  /** Current staff who could take over their approvals and direct reports. */
  candidates: Employee[];
  onClose: () => void;
  onCompleted: () => void | Promise<void>;
}

export function EmployeeExitDialog({ employee, candidates, onClose, onCompleted }: Props) {
  const { toast } = useToast();
  const today = format(new Date(), "yyyy-MM-dd");

  const [exitType, setExitType] = useState<EmployeeExitType>("Resigned");
  const [lastWorkingDay, setLastWorkingDay] = useState(today);
  const [reason, setReason] = useState("");
  const [endAccessNow, setEndAccessNow] = useState(false);
  const [replacementId, setReplacementId] = useState(NO_REPLACEMENT);
  const [preview, setPreview] = useState<EmployeeExitPreview | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const employeeId = employee?.id;
  const scheduledType = employee?.scheduled_exit?.exit_type;
  const scheduledDate = employee?.scheduled_exit?.resignation_date;

  useEffect(() => {
    if (!employeeId) return;

    setExitType(scheduledType ?? "Resigned");
    setLastWorkingDay(scheduledDate ? String(scheduledDate).slice(0, 10) : format(new Date(), "yyyy-MM-dd"));
    setReason("");
    setEndAccessNow(false);
    setReplacementId(NO_REPLACEMENT);
    setPreview(null);

    let stale = false;
    apiService
      .getEmployeeExitPreview(employeeId)
      .then((result) => {
        if (!stale) setPreview(result);
      })
      .catch((error) => {
        // The exit still works without the summary, so this must not block HR.
        console.error("Failed to load exit preview:", error);
      });

    return () => {
      stale = true;
    };
  }, [employeeId, scheduledType, scheduledDate]);

  const isPastDate = lastWorkingDay !== "" && lastWorkingDay < today;
  const endsNow = endAccessNow || isPastDate;
  const needsHandover = !!preview && (preview.direct_reports > 0 || preview.pending_approvals > 0);
  const replacementOptions = candidates.filter((c) => c.id && c.id !== employeeId);
  const name = employee ? `${employee.first_name} ${employee.last_name}` : "";

  const handleSubmit = async () => {
    if (!employeeId || !lastWorkingDay) return;

    try {
      setSubmitting(true);
      const result = await apiService.startEmployeeExit(employeeId, {
        exit_type: exitType,
        last_working_day: lastWorkingDay,
        reason: reason.trim() || null,
        end_access_now: endAccessNow,
        replacement_employee_id: replacementId === NO_REPLACEMENT ? null : Number(replacementId),
      });

      await onCompleted();
      onClose();
      toast({
        title: result.exit_state === "scheduled" ? "Exit Scheduled" : "Employment Ended",
        description:
          result.exit_state === "scheduled"
            ? `${name} keeps access until the end of ${lastWorkingDay}.`
            : `${name} no longer has access. Their records have been kept.`,
      });
    } catch (error) {
      console.error("Failed to end employment:", error);
      toast({
        title: "Could Not End Employment",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!employee} onOpenChange={(open) => !open && !submitting && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>End Employment</DialogTitle>
          <DialogDescription>
            {name} will leave the active employee list and lose login access. Their records are kept, and this can be
            undone by reinstating them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="exitType">Exit type</Label>
              <Select value={exitType} onValueChange={(value) => setExitType(value as EmployeeExitType)}>
                <SelectTrigger id="exitType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-lg">
                  {EXIT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastWorkingDay">Last working day</Label>
              <Input
                id="lastWorkingDay"
                type="date"
                value={lastWorkingDay}
                onChange={(e) => setLastWorkingDay(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exitReason">Reason (optional)</Label>
            <Textarea
              id="exitReason"
              value={reason}
              maxLength={255}
              rows={2}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="flex items-start justify-between gap-4 rounded-md border p-3">
            <div className="space-y-1">
              <Label htmlFor="endAccessNow">End access immediately</Label>
              <p className="text-xs text-muted-foreground">
                {isPastDate
                  ? "The last working day has passed, so access ends now."
                  : "Otherwise access continues until the end of the last working day."}
              </p>
            </div>
            <Switch id="endAccessNow" checked={endsNow} disabled={isPastDate} onCheckedChange={setEndAccessNow} />
          </div>

          {needsHandover && (
            <div className="space-y-2">
              <Label htmlFor="replacement">Hand over to</Label>
              <Select value={replacementId} onValueChange={setReplacementId}>
                <SelectTrigger id="replacement">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-lg max-h-64">
                  <SelectItem value={NO_REPLACEMENT}>No one (HR will handle it)</SelectItem>
                  {replacementOptions.map((candidate) => (
                    <SelectItem key={candidate.id} value={String(candidate.id)}>
                      {candidate.first_name} {candidate.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {replacementId === NO_REPLACEMENT && !!preview?.direct_reports && (
                <p className="text-xs text-muted-foreground">
                  Without a replacement, {plural(preview.direct_reports, "direct report")} will have no supervisor and
                  may not be able to request leave until HR assigns one.
                </p>
              )}
            </div>
          )}

          {preview && (
            <Alert>
              <AlertDescription>
                <ul className="list-disc space-y-1 pl-4 text-sm">
                  <li>
                    {preview.own_pending_requests > 0
                      ? `${plural(preview.own_pending_requests, "pending request")} of theirs will be cancelled when employment ends.`
                      : "They have no pending requests."}
                  </li>
                  {preview.pending_approvals > 0 && (
                    <li>{plural(preview.pending_approvals, "request")} waiting on their approval.</li>
                  )}
                  {preview.direct_reports > 0 && <li>{plural(preview.direct_reports, "direct report")}.</li>}
                  {preview.open_reviews + preview.open_reviews_as_manager > 0 && (
                    <li>
                      {plural(preview.open_reviews + preview.open_reviews_as_manager, "open performance review")} will
                      stay open for HR to decide.
                    </li>
                  )}
                  <li>Their full final month goes on payroll. Add any deduction to the draft.</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={submitting || !lastWorkingDay}>
            {submitting ? "Saving..." : endsNow ? "End Employment Now" : "Schedule Exit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
