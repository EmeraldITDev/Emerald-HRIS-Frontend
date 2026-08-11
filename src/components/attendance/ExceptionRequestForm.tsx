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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/lib/api";

export const EXCEPTION_TYPES = [
  "Official Duty",
  "Business Travel",
  "Training",
  "Site Assignment",
  "Client Assignment",
  "Temporary Location",
  "Other",
];

interface Props {
  employeeId: number | null;
  onSubmitted?: () => void;
}

export function ExceptionRequestForm({ employeeId, onSubmitted }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setType("");
    setStartDate("");
    setEndDate("");
    setDescription("");
    setFile(null);
  };

  const submit = async () => {
    if (!employeeId) {
      toast({ title: "Error", description: "Employee record not found.", variant: "destructive" });
      return;
    }
    if (!type || !startDate || !endDate || !description.trim()) {
      toast({
        title: "Missing details",
        description: "Type, dates and description are required.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      let payload: any;
      if (file) {
        const fd = new FormData();
        fd.append("employee_id", String(employeeId));
        fd.append("exception_type", type);
        fd.append("start_date", startDate);
        fd.append("end_date", endDate);
        fd.append("description", description.trim());
        fd.append("supporting_document", file);
        payload = fd;
      } else {
        payload = {
          employee_id: employeeId,
          exception_type: type,
          start_date: startDate,
          end_date: endDate,
          description: description.trim(),
        };
      }
      await apiService.submitExceptionRequest(payload);
      toast({
        title: "Exception request submitted",
        description: "It is now pending your line manager's approval.",
      });
      setOpen(false);
      reset();
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
          <Briefcase className="h-4 w-4" />
          Request Work Exception
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Work Exception</DialogTitle>
          <DialogDescription>
            Use this for official duty, travel, training or any approved work away from your
            assigned location.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Exception Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                {EXCEPTION_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="exc-start">Start Date</Label>
              <Input
                id="exc-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exc-end">End Date</Label>
              <Input
                id="exc-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="exc-desc">Description</Label>
            <Textarea
              id="exc-desc"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the assignment or duty…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="exc-doc">Supporting Document (optional)</Label>
            <Input
              id="exc-doc"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
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

export default ExceptionRequestForm;