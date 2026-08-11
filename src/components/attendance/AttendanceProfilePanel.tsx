import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MapPin, Pencil, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { canEditAttendanceProfile } from "@/lib/permissions";
import apiService from "@/lib/api";

export const LOCATIONS = ["Lagos", "Calabar", "Abuja"];
export const ARRANGEMENTS = ["Hybrid", "Fully Onsite", "Fully Remote"];
const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

interface Props {
  employeeId: number | string | null;
}

export function AttendanceProfilePanel({ employeeId }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const canEdit = canEditAttendanceProfile(user);
  const [profile, setProfile] = useState<any>(null);
  const [draft, setDraft] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const res: any = await apiService.getEmployeeAttendanceProfile(employeeId);
      setProfile(res?.data ?? res ?? null);
    } catch (e) {
      console.error("Failed to load attendance profile:", e);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    load();
  }, [load]);

  const startEdit = () => {
    setDraft({
      assigned_location: profile?.assigned_location || "",
      work_arrangement: profile?.work_arrangement || "",
      clock_in_time: profile?.clock_in_time || "",
      clock_out_time: profile?.clock_out_time || "",
      effective_date: profile?.effective_date || "",
      expected_modes: { ...(profile?.expected_modes || {}) },
    });
    setEditing(true);
  };

  const save = async () => {
    if (!employeeId || !draft) return;
    setSaving(true);
    try {
      await apiService.updateEmployeeAttendanceProfile(employeeId, draft);
      toast({ title: "Attendance profile updated" });
      setEditing(false);
      await load();
    } catch (e: any) {
      toast({
        title: "Update failed",
        description: e?.data?.message || e?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const workdays: string[] =
    profile?.expected_workdays ||
    WEEK_DAYS.filter((d) => (profile?.expected_modes || {})[d]);

  const view = editing ? draft : profile;

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 text-primary">
          <span className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Attendance Profile
          </span>
          {canEdit &&
            (editing ? (
              <span className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                  <X className="h-4 w-4 mr-1" /> Cancel
                </Button>
                <Button size="sm" onClick={save} disabled={saving}>
                  <Save className="h-4 w-4 mr-1" /> {saving ? "Saving…" : "Save"}
                </Button>
              </span>
            ) : (
              <Button size="sm" variant="outline" onClick={startEdit}>
                <Pencil className="h-4 w-4 mr-1" /> Edit
              </Button>
            ))}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && !profile ? (
          <p className="text-sm text-muted-foreground">Loading attendance profile…</p>
        ) : !profile && !editing ? (
          <p className="text-sm text-muted-foreground">
            No attendance profile configured for this employee.
          </p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Assigned Location</Label>
                {editing ? (
                  <Select
                    value={draft?.assigned_location || ""}
                    onValueChange={(v) => setDraft({ ...draft, assigned_location: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATIONS.map((l) => (
                        <SelectItem key={l} value={l}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm">{view?.assigned_location || "—"}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Work Arrangement</Label>
                {editing ? (
                  <Select
                    value={draft?.work_arrangement || ""}
                    onValueChange={(v) => setDraft({ ...draft, work_arrangement: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select arrangement" />
                    </SelectTrigger>
                    <SelectContent>
                      {ARRANGEMENTS.map((a) => (
                        <SelectItem key={a} value={a}>
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm">{view?.work_arrangement || "—"}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Clock-In Time</Label>
                {editing ? (
                  <Input
                    type="time"
                    value={draft?.clock_in_time || ""}
                    onChange={(e) => setDraft({ ...draft, clock_in_time: e.target.value })}
                  />
                ) : (
                  <p className="text-sm">{view?.clock_in_time || "—"}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Clock-Out Time</Label>
                {editing ? (
                  <Input
                    type="time"
                    value={draft?.clock_out_time || ""}
                    onChange={(e) => setDraft({ ...draft, clock_out_time: e.target.value })}
                  />
                ) : (
                  <p className="text-sm">{view?.clock_out_time || "—"}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Effective Date</Label>
                {editing ? (
                  <Input
                    type="date"
                    value={draft?.effective_date || ""}
                    onChange={(e) => setDraft({ ...draft, effective_date: e.target.value })}
                  />
                ) : (
                  <p className="text-sm">{view?.effective_date || "—"}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Expected Workdays</Label>
                <div className="flex flex-wrap gap-1">
                  {workdays.length ? (
                    workdays.map((d: string) => (
                      <Badge key={d} variant="outline">
                        {d.slice(0, 3)}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Expected Work Mode per Day</Label>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Day</TableHead>
                    <TableHead>Mode</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {WEEK_DAYS.map((day) => {
                    const value = (view?.expected_modes || {})[day] || "";
                    return (
                      <TableRow key={day}>
                        <TableCell className="font-medium">{day}</TableCell>
                        <TableCell>
                          {editing ? (
                            <Select
                              value={value}
                              onValueChange={(v) =>
                                setDraft({
                                  ...draft,
                                  expected_modes: { ...(draft?.expected_modes || {}), [day]: v },
                                })
                              }
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue placeholder="Select mode" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Physical">Physical</SelectItem>
                                <SelectItem value="WFH">WFH</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-sm">{value || "—"}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default AttendanceProfilePanel;