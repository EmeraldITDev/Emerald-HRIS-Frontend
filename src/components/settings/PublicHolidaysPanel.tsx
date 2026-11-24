import { useState } from "react";
import { format } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { publicHolidaysQueryKey } from "@/hooks/usePublicHolidays";
import apiService, { type PublicHoliday } from "@/lib/api";

const HR_ROLES = ["hr_manager", "corporate_hr"];

const displayDate = (date: string) => format(new Date(`${date}T12:00:00`), "EEE, d MMM yyyy");
const isWeekend = (date: string) => [0, 6].includes(new Date(`${date}T12:00:00`).getDay());

type EditState = { id?: number; date: string; name: string } | null;

/**
 * Public holidays are not charged as leave. Standard Nigerian holidays are filled in
 * automatically for each year; HR can add, change or remove them here.
 */
export default function PublicHolidaysPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canManage = HR_ROLES.includes(user?.role ?? "");

  const [year, setYear] = useState(new Date().getFullYear());
  const [editing, setEditing] = useState<EditState>(null);
  const [removing, setRemoving] = useState<PublicHoliday | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: holidays = [], isLoading, isError, refetch } = useQuery({
    queryKey: publicHolidaysQueryKey(year),
    queryFn: () => apiService.getPublicHolidays(year),
  });

  const estimatedCount = holidays.filter((h) => h.is_estimated).length;

  const refresh = (...years: number[]) =>
    Promise.all(
      Array.from(new Set([year, ...years])).map((y) =>
        queryClient.invalidateQueries({ queryKey: publicHolidaysQueryKey(y) }),
      ),
    );

  // Leave requests awaiting approval are recounted on the server when a holiday changes.
  const recountNote = (count?: number) =>
    count ? ` ${count} leave request${count === 1 ? "" : "s"} awaiting approval ${count === 1 ? "was" : "were"} recounted.` : "";

  const showError = (title: string, error: unknown) =>
    toast({ title, description: (error as Error)?.message || "Please try again.", variant: "destructive" });

  const save = async () => {
    if (!editing) return;
    const name = editing.name.trim();
    if (!editing.date || !name) {
      toast({ title: "Enter a date and a name", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const result = editing.id
        ? await apiService.updatePublicHoliday(editing.id, { date: editing.date, name })
        : await apiService.createPublicHoliday({ date: editing.date, name });
      await refresh(Number(editing.date.slice(0, 4)));
      toast({
        title: editing.id ? "Holiday updated" : "Holiday added",
        description: `${name}, ${displayDate(editing.date)}.${recountNote(result?.pending_requests_recounted)}`,
      });
      setEditing(null);
    } catch (error) {
      showError("Could not save holiday", error);
    } finally {
      setSaving(false);
    }
  };

  const confirmDate = async (holiday: PublicHoliday) => {
    try {
      const result = await apiService.updatePublicHoliday(holiday.id, { date: holiday.date, name: holiday.name });
      await refresh();
      toast({
        title: "Date confirmed",
        description: `${holiday.name}, ${displayDate(holiday.date)}.${recountNote(result?.pending_requests_recounted)}`,
      });
    } catch (error) {
      showError("Could not confirm date", error);
    }
  };

  const remove = async () => {
    if (!removing) return;
    try {
      const result = await apiService.deletePublicHoliday(removing.id);
      await refresh();
      toast({
        title: "Holiday removed",
        description: `${removing.name} will now be counted as a working day.${recountNote(result?.pending_requests_recounted)}`,
      });
    } catch (error) {
      showError("Could not remove holiday", error);
    } finally {
      setRemoving(null);
    }
  };

  const restore = async () => {
    try {
      const result = await apiService.restoreStandardPublicHolidays(year);
      const restored = result?.restored ?? 0;
      await refresh();
      toast({
        title: restored > 0 ? "Standard holidays restored" : "Nothing to restore",
        description:
          restored > 0
            ? `${restored} standard holiday${restored === 1 ? "" : "s"} added back for ${year}.${recountNote(result?.pending_requests_recounted)}`
            : `All standard holidays for ${year} are already on the list.`,
      });
    } catch (error) {
      showError("Could not restore holidays", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Public Holidays
            </CardTitle>
            <CardDescription>
              Public holidays are not counted as leave days. Nigeria's standard holidays are filled in for each year
              {canManage ? "; add, change or remove any of them here." : "."}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={() => setYear((y) => y - 1)} aria-label="Previous year">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="w-16 text-center font-semibold tabular-nums">{year}</span>
            <Button variant="outline" size="icon" onClick={() => setYear((y) => y + 1)} aria-label="Next year">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {canManage && estimatedCount > 0 && (
          <Alert>
            <AlertDescription>
              {estimatedCount} date{estimatedCount === 1 ? " is an estimate" : "s are estimates"}. Islamic holidays depend
              on the moon and are announced by the Federal Government shortly before. Once announced, edit the date or
              mark it confirmed.
            </AlertDescription>
          </Alert>
        )}

        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setEditing({ date: "", name: "" })}>
              <Plus className="mr-2 h-4 w-4" />
              Add holiday
            </Button>
            <Button variant="outline" onClick={restore}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Restore removed standard holidays
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex items-center gap-3 text-sm text-destructive">
            Could not load public holidays.
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : holidays.length === 0 ? (
          <p className="text-sm text-muted-foreground">No public holidays for {year}.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Holiday</TableHead>
                  <TableHead />
                  {canManage && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {holidays.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="whitespace-nowrap">
                      {displayDate(h.date)}
                      {isWeekend(h.date) && <div className="text-xs text-muted-foreground">Weekend, no effect on leave</div>}
                    </TableCell>
                    <TableCell className="font-medium">{h.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {h.is_estimated && (
                          <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-400">
                            Estimated
                          </Badge>
                        )}
                        {!h.is_standard && <Badge variant="secondary">Added by HR</Badge>}
                      </div>
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {h.is_estimated && (
                            <Button variant="ghost" size="sm" onClick={() => confirmDate(h)} title="Mark this date as confirmed">
                              <CheckCircle2 className="mr-1 h-4 w-4" />
                              Confirm
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditing({ id: h.id, date: h.date, name: h.name })}
                            aria-label={`Edit ${h.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setRemoving(h)} aria-label={`Remove ${h.name}`}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit public holiday" : "Add public holiday"}</DialogTitle>
            <DialogDescription>
              New leave, and leave still awaiting approval, will not be charged for this date. Leave already approved
              is not changed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="holidayName">Name</Label>
              <Input
                id="holidayName"
                value={editing?.name ?? ""}
                onChange={(e) => setEditing((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                placeholder="e.g. Eid-el-Fitr"
                maxLength={255}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="holidayDate">Date</Label>
              <Input
                id="holidayDate"
                type="date"
                value={editing?.date ?? ""}
                onChange={(e) => setEditing((prev) => (prev ? { ...prev, date: e.target.value } : prev))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={removing !== null} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removing?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {removing && displayDate(removing.date)} will be counted as a working day for new leave and for leave
              still awaiting approval. Leave already approved is not changed.
              {removing?.is_standard && " You can bring it back with “Restore removed standard holidays”."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
