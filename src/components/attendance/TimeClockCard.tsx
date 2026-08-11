import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, LogIn, LogOut, Timer, MapPin, Home } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import apiService from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  AttendanceStatusBadge,
  formatTimeOnly,
  todayWAT,
  todayDayNameWAT,
} from "@/lib/attendanceUi";

interface TimeClockCardProps {
  employeeId: number | null;
  todayStatus: any;
  refresh: () => Promise<any>;
  className?: string;
}

type Coords = { lat: number; lng: number } | null;

async function captureGps(): Promise<{ coords: Coords; denied: boolean }> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return { coords: null, denied: true };
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          denied: false,
        }),
      () => resolve({ coords: null, denied: true }),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  });
}

export function TimeClockCard({ employeeId, todayStatus, refresh, className }: TimeClockCardProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [scheduleConfig, setScheduleConfig] = useState<any>(null);
  const [isPunching, setIsPunching] = useState(false);
  const [gpsBlocked, setGpsBlocked] = useState(false);

  const dayName = todayDayNameWAT();

  useEffect(() => {
    if (!employeeId) return;
    let cancelled = false;
    (async () => {
      try {
        const res: any = await apiService.getEmployeeAttendanceProfile(employeeId);
        const p = res?.data ?? res;
        if (cancelled) return;
        setProfile(p || null);
        const location = p?.assigned_location;
        if (location) {
          try {
            const cfg: any = await apiService.getAttendanceScheduleConfig(location, dayName);
            if (!cancelled) setScheduleConfig(cfg?.data ?? cfg ?? null);
          } catch {
            /* schedule config is optional context */
          }
        }
      } catch {
        /* profile may not exist yet — clock-in still works */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [employeeId, dayName]);

  const expectedMode: "Physical" | "WFH" = useMemo(() => {
    const arrangement = String(profile?.work_arrangement || "").toLowerCase();
    if (arrangement === "fully remote") return "WFH";
    const fromSchedule =
      scheduleConfig?.expected_mode ??
      scheduleConfig?.work_mode ??
      profile?.expected_modes?.[dayName] ??
      profile?.expected_mode;
    if (String(fromSchedule || "").toUpperCase() === "WFH") return "WFH";
    if (String(fromSchedule || "").toLowerCase() === "physical") return "Physical";
    return arrangement === "fully onsite" ? "Physical" : "Physical";
  }, [profile, scheduleConfig, dayName]);

  const contextLine = useMemo(() => {
    if (!profile) return null;
    if (expectedMode === "WFH") return "Today is a WFH day";
    const loc = profile.assigned_location ? `${profile.assigned_location} Office` : "office";
    return `Today is a Physical day — ${loc}`;
  }, [profile, expectedMode]);

  const onBreak = !!(todayStatus?.break_start && !todayStatus?.break_end);
  const clockedIn = !!todayStatus?.clock_in && !todayStatus?.clock_out;

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!clockedIn) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [clockedIn]);

  const elapsed = useMemo(() => {
    if (!clockedIn || !todayStatus?.clock_in) return null;
    const start = new Date(String(todayStatus.clock_in).replace(" ", "T")).getTime();
    if (Number.isNaN(start)) return null;
    const diff = Math.max(0, Math.floor((now - start) / 1000));
    const h = String(Math.floor(diff / 3600)).padStart(2, "0");
    const m = String(Math.floor((diff % 3600) / 60)).padStart(2, "0");
    const s = String(diff % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }, [clockedIn, todayStatus?.clock_in, now]);

  const handleClockIn = useCallback(async () => {
    if (!employeeId) {
      toast({
        title: "Error",
        description: "Employee record not found for your account.",
        variant: "destructive",
      });
      return;
    }
    setIsPunching(true);
    try {
      let coords: Coords = null;
      let locationStatus: string | undefined;
      if (expectedMode === "Physical") {
        const gps = await captureGps();
        coords = gps.coords;
        setGpsBlocked(gps.denied);
        if (!coords) locationStatus = "Not Required";
      }
      const payload: Record<string, any> = {
        employee_id: employeeId,
        date: todayWAT(),
        work_mode: expectedMode,
      };
      if (coords) {
        payload.location_lat = coords.lat;
        payload.location_lng = coords.lng;
      }
      if (locationStatus) payload.location_status = locationStatus;

      const res: any = await apiService.createAttendance(payload);
      await refresh();
      toast({
        title: "Clocked in",
        description: res?.message || res?.attendance_status || "Clock-in recorded.",
      });
    } catch (e: any) {
      toast({
        title: "Clock-in failed",
        description: e?.data?.message || e?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPunching(false);
    }
  }, [employeeId, expectedMode, refresh, toast]);

  const handleClockOut = useCallback(async () => {
    if (!employeeId) return;
    setIsPunching(true);
    try {
      const res: any = await apiService.clockOut({ employee_id: employeeId, date: todayWAT() });
      await refresh();
      toast({ title: "Clocked out", description: res?.message || "Clock-out recorded." });
    } catch (e: any) {
      toast({
        title: "Clock-out failed",
        description: e?.data?.message || e?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPunching(false);
    }
  }, [employeeId, refresh, toast]);

  const handleBreak = useCallback(async () => {
    if (!employeeId) return;
    setIsPunching(true);
    try {
      const payload = { employee_id: employeeId, date: todayWAT() };
      const res: any = onBreak
        ? await apiService.endBreak(payload)
        : await apiService.startBreak(payload);
      await refresh();
      toast({
        title: onBreak ? "Welcome back" : "Break started",
        description:
          res?.message ||
          (onBreak ? "Your break has ended." : "Remember to end your break when you return."),
      });
    } catch (e: any) {
      toast({
        title: onBreak ? "Could not end break" : "Could not start break",
        description: e?.data?.message || e?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPunching(false);
    }
  }, [employeeId, onBreak, refresh, toast]);

  return (
    <Card className={cn("border-border/50 shadow-sm bg-gradient-to-r from-primary/5 to-primary/10", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 text-primary">
          <span className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Time Clock
          </span>
          {todayStatus?.attendance_status && (
            <AttendanceStatusBadge status={todayStatus.attendance_status} />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 space-y-2">
            <div className="text-lg font-semibold">{format(new Date(), "EEEE, MMMM d, yyyy")}</div>
            {contextLine && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {expectedMode === "WFH" ? (
                  <Home className="h-4 w-4" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
                <span>{contextLine}</span>
                <Badge variant="outline">{expectedMode}</Badge>
              </div>
            )}
            <div className="text-sm text-muted-foreground space-y-1">
              {todayStatus?.clock_in ? (
                <>
                  <div className="flex items-center gap-2">
                    <LogIn className="h-4 w-4 text-success" />
                    <span>Clocked in at {formatTimeOnly(todayStatus.clock_in)}</span>
                  </div>
                  {todayStatus?.clock_out && (
                    <div className="flex items-center gap-2">
                      <LogOut className="h-4 w-4 text-destructive" />
                      <span>Clocked out at {formatTimeOnly(todayStatus.clock_out)}</span>
                    </div>
                  )}
                  {elapsed && (
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-primary" />
                      <span className="font-mono tabular-nums">{elapsed} worked today</span>
                    </div>
                  )}
                </>
              ) : (
                <span>Not clocked in today</span>
              )}
            </div>
            {gpsBlocked && expectedMode === "Physical" && (
              <p className="text-xs text-warning">
                Location access is blocked. Enable location permission in your browser so your
                office presence can be verified — your clock-in was still recorded.
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {!clockedIn ? (
              <Button onClick={handleClockIn} disabled={isPunching || !employeeId} className="gap-2">
                <LogIn className="h-4 w-4" />
                Clock In
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleBreak}
                  disabled={isPunching}
                  variant={onBreak ? "default" : "outline"}
                  className={cn("gap-2", onBreak && "bg-success hover:bg-success/90 text-white")}
                >
                  <Timer className="h-4 w-4" />
                  {onBreak ? "On Lunch Break" : "Lunch Break"}
                </Button>
                <Button
                  onClick={handleClockOut}
                  disabled={isPunching}
                  variant="destructive"
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Clock Out
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default TimeClockCard;