import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  const [scheduleModes, setScheduleModes] = useState<Record<string, any>>({});

  const loadSchedule = useCallback(async (location?: string) => {
    if (!location) {
      setScheduleModes({});
      return;
    }
    try {
      const entries = await Promise.all(
        WEEK_DAYS.map(async (day) => {
          try {
            const res: any = await apiService.getAttendanceScheduleConfig(location, day);
            return [day, res?.data ?? res ?? null] as const;
          } catch {
            return [day, null] as const;
          }
        }),
      );
      setScheduleModes(Object.fromEntries(entries));
    } catch (e) {
      console.error("Failed to load attendance schedule config:", e);
      setScheduleModes({});
    }
  }, []);

  const load = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const res: any = await apiService.getEmployeeAttendanceProfile(employeeId);
      const data = res?.data ?? res ?? null;
      setProfile(data);
      await loadSchedule(data?.assigned_location);
    } catch (e) {
      console.error("Failed to load attendance profile:", e);
      setProfile(null);
      setScheduleModes({});
    } finally {
      setLoading(false);
    }
  }, [employeeId, loadSchedule]);

  useEffect(() => {
    load();
  }, [load]);

  const startEdit = () => {
    setDraft({
      assigned_location: profile?.assigned_location || "",
      work_arrangement: profile?.work_arrangement || "",
      supervisor_id: profile?.supervisor_id ?? null,
    });
    setEditing(true);
  };

  const save = async () => {
    if (!employeeId || !draft) return;
    setSaving(true);
    try {
      await apiService.updateEmployeeAttendanceProfile(employeeId, {
        work_arrangement: draft.work_arrangement || null,
        assigned_location: draft.assigned_location || null,
        supervisor_id: draft.supervisor_id ?? null,
      });
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

  const rawModeFor = (day: string) => {
    const cfg = scheduleModes[day];
    return cfg?.expected_mode || cfg?.mode || cfg?.work_mode || "";
  };

  const effectiveModeFor = (day: string) => {
    const arrangement = (view?.work_arrangement || profile?.work_arrangement || "").trim();
    if (arrangement === "Fully Remote") return "WFH";
    if (arrangement === "Fully Onsite") return "Physical";
    // Hybrid, null, or empty -> use the schedule data as returned by the API
    return rawModeFor(day);
  };

  const timesFor = (day: string) => {
    const cfg = scheduleModes[day];
    if (!cfg) return "";
    const inT = cfg.clock_in_time || cfg.expected_clock_in;
    const outT = cfg.clock_out_time || cfg.expected_clock_out;
    return inT && outT ? `${inT} – ${outT}` : "";
  };

  const workdays: string[] =
    profile?.expected_workdays || WEEK_DAYS.filter((d) => rawModeFor(d));

  const view = editing ? { ...profile, ...draft } : profile;

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
                    onValueChange={(v) => {
                      setDraft({ ...draft, assigned_location: v });
                      loadSchedule(v);
                    }}
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
              <p className="mb-2 text-xs text-muted-foreground">
                Set centrally by the location schedule configuration — read-only here.
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Day</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Expected Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {WEEK_DAYS.map((day) => (
                    <TableRow key={day}>
                      <TableCell className="font-medium">{day}</TableCell>
                      <TableCell className="text-sm">{modeFor(day) || "—"}</TableCell>
                      <TableCell className="text-sm">{timesFor(day) || "—"}</TableCell>
                    </TableRow>
                  ))}
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
