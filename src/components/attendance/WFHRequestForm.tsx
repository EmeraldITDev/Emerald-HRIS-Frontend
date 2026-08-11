import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/lib/api";

interface Props {
  employeeId: number | null;
  onSubmitted?: () => void;
}

export function WFHRequestForm({ employeeId, onSubmitted }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!employeeId) {
      toast({ title: "Error", description: "Employee record not found.", variant: "destructive" });
      return;
    }
    if (!date || !reason.trim()) {
      toast({
        title: "Missing details",
        description: "Date and reason are required.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      await apiService.submitWFHRequest({ employee_id: employeeId, date, reason: reason.trim() });
      toast({
        title: "WFH request submitted",
        description: "It is now pending your line manager's approval.",
      });
      setOpen(false);
      setDate("");
      setReason("");
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Home className="h-4 w-4" />
          Request WFH
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Work From Home</DialogTitle>
          <DialogDescription>
            Hybrid employees can request an additional work-from-home day.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="wfh-date">Date</Label>
            <Input
              id="wfh-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wfh-reason">Reason</Label>
            <Textarea
              id="wfh-reason"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why do you need to work from home on this day?"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default WFHRequestForm;