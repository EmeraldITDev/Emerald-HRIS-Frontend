import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/lib/api";
import { dateOnly } from "@/lib/attendanceUi";

interface Props {
  employeeId: number | null;
  todayStatus: any;
  onSubmitted?: () => void;
}

export function MissingClockoutBanner({ employeeId, todayStatus, onSubmitted }: Props) {
  const { toast } = useToast();
  const flaggedDate =
    dateOnly(todayStatus?.missing_clockout_date) ||
    (String(todayStatus?.attendance_status || "").toLowerCase() === "missing-clockout"
      ? dateOnly(todayStatus?.date)
      : "");
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(flaggedDate);
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const show =
    String(todayStatus?.attendance_status || "").toLowerCase() === "missing-clockout" ||
    !!todayStatus?.missing_clockout_date;

  if (!show) return null;

  const submit = async () => {
    if (!employeeId) return;
    if (!date || !time || !reason.trim()) {
      toast({
        title: "Missing details",
        description: "Date, clock-out time and reason are required.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      await apiService.submitMissingClockoutRequest({
        employee_id: employeeId,
        date,
        actual_clock_out: time,
        reason: reason.trim(),
      });
      toast({
        title: "Regularisation submitted",
        description: "HR will review your missing clock-out request.",
      });
      setOpen(false);
      setReason("");
      setTime("");
      onSubmitted?.();
    } catch (e: any) {
      toast({
        title: "Submission failed",
        description: e?.data?.message || e?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Card className="border-warning/40 bg-warning/5 mb-6">
        <CardContent className="flex flex-col sm:flex-row sm:items-center gap-3 py-4">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
          <p className="flex-1 text-sm">
            You did not clock out{flaggedDate ? ` on ${flaggedDate}` : " on your last workday"}.
            Please submit a regularisation request.
          </p>
          <Button
            onClick={() => {
              setDate(flaggedDate);
              setOpen(true);
            }}
          >
            Submit Missing Clock-Out
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Missing Clock-Out Regularisation</DialogTitle>
            <DialogDescription>
              Tell HR when you actually finished work on the flagged day.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="mco-date">Date</Label>
              <Input
                id="mco-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mco-time">Actual Clock-Out Time</Label>
              <Input
                id="mco-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mco-reason">Reason</Label>
              <Textarea
                id="mco-reason"
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why was the clock-out missed?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default MissingClockoutBanner;