import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, LogIn, LogOut, Timer, MapPin, Home, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import apiService from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  AttendanceStatusBadge,
  formatTimeWithZone,
  parseAttendanceInstant,
  todayWAT,
  todayDayNameWAT,
} from "@/lib/attendanceUi";

interface TimeClockCardProps {
  employeeId: number | null;
  todayStatus: any;
  refresh: () => Promise<any>;
  className?: string;
}

type Coords = { lat: number; lng: number; accuracy?: number } | null;

type OfficeLocation = {
  id?: number | string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  radiusMetres: number;
};

type LocationIssue = {
  officeName: string;
  distanceMetres: number;
  accuracyMetres: number;
  reason: "outside" | "imprecise";
};

const MAX_LOCATION_ATTEMPTS = 3;
const MAX_ACCEPTABLE_ACCURACY_METRES = 200;

// Distinct states the backend recognises, mapped from the browser's own errors.
type LocationError = "permission_denied" | "position_unavailable" | "timeout" | "unsupported" | null;

const LOCATION_ERROR_COPY: Record<Exclude<LocationError, null>, { title: string; body: string }> = {
  permission_denied: {
    title: "Location permission is blocked",
    body: "Allow location for this site in your browser settings, then try again. Office clock-in cannot be recorded without it.",
  },
  position_unavailable: {
    title: "Your location could not be determined",
    body: "Your device could not get a GPS fix. Move near a window or switch on device location, then try again.",
  },
  timeout: {
    title: "Getting your location took too long",
    body: "The location request timed out. Check your connection and try again.",
  },
  unsupported: {
    title: "This browser cannot share your location",
    body: "Open the HRIS in a browser that supports location, or ask HR to record today's attendance for you.",
  },
};

async function captureGps(): Promise<{ coords: Coords; error: LocationError }> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return { coords: null, error: "unsupported" };
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          coords: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          },
          error: null,
        }),
      (err) => {
        const error: LocationError =
          err.code === err.PERMISSION_DENIED
            ? "permission_denied"
            : err.code === err.TIMEOUT
              ? "timeout"
              : "position_unavailable";
        resolve({ coords: null, error });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}

function normaliseLocation(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function unwrapOfficeLocations(raw: any): OfficeLocation[] {
  const rows = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.data?.data)
        ? raw.data.data
        : [];

  return rows.flatMap((row: any) => {
    const latitude = Number(row?.latitude);
    const longitude = Number(row?.longitude);
    const radiusMetres = Number(row?.radius_meters ?? row?.radius_metres ?? row?.radius);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(radiusMetres)) {
      return [];
    }
    return [{
      id: row?.id,
      name: String(row?.name ?? row?.location ?? "Office"),
      address: row?.address ? String(row.address) : undefined,
      latitude,
      longitude,
      radiusMetres,
    }];
  });
}

function findAssignedOffice(offices: OfficeLocation[], assignedLocation: unknown): OfficeLocation | null {
  const assigned = normaliseLocation(assignedLocation);
  if (!assigned) return null;

  const city = assigned.includes("calabar")
    ? "calabar"
    : assigned.includes("lagos") || assigned.includes("victoria island")
      ? "lagos"
      : "";

  return offices.find((office) => {
    const searchable = normaliseLocation(`${office.name} ${office.address ?? ""}`);
    return searchable.includes(assigned) || assigned.includes(normaliseLocation(office.name)) || (!!city && searchable.includes(city));
  }) ?? null;
}

function distanceMetres(a: Coords, office: OfficeLocation): number {
  if (!a) return Number.POSITIVE_INFINITY;
  const earthRadius = 6_371_000;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latDelta = toRadians(office.latitude - a.lat);
  const lngDelta = toRadians(office.longitude - a.lng);
  const startLat = toRadians(a.lat);
  const officeLat = toRadians(office.latitude);
  const haversine =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(startLat) * Math.cos(officeLat) * Math.sin(lngDelta / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function checkOfficeLocation(coords: Coords, office: OfficeLocation | null): LocationIssue | null {
  if (!coords || !office) return null;
  const accuracyMetres = Math.max(0, coords.accuracy ?? 0);
  const distance = distanceMetres(coords, office);
  const isImprecise = accuracyMetres > MAX_ACCEPTABLE_ACCURACY_METRES;
  const accuracyAllowance = Math.min(accuracyMetres, MAX_ACCEPTABLE_ACCURACY_METRES);
  const isOutside = distance > office.radiusMetres + accuracyAllowance;
  if (!isImprecise && !isOutside) return null;
  return {
    officeName: office.name,
    distanceMetres: Math.round(distance),
    accuracyMetres: Math.round(accuracyMetres),
    reason: isImprecise ? "imprecise" : "outside",
  };
}

export function TimeClockCard({ employeeId, todayStatus, refresh, className }: TimeClockCardProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [scheduleConfig, setScheduleConfig] = useState<any>(null);
  const [officeLocations, setOfficeLocations] = useState<OfficeLocation[]>([]);
  const [isPunching, setIsPunching] = useState(false);
  const [locationError, setLocationError] = useState<LocationError>(null);
  const [locationIssue, setLocationIssue] = useState<LocationIssue | null>(null);
  const [locationAttempt, setLocationAttempt] = useState(0);
  const [selectedMode, setSelectedMode] = useState<"Physical" | "WFH" | null>(null);
  // The mode picker only appears after the user presses Clock In.
  const [choosingMode, setChoosingMode] = useState(false);

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

  useEffect(() => {
    let cancelled = false;
    apiService.getOfficeLocations()
      .then((res) => {
        if (!cancelled) setOfficeLocations(unwrapOfficeLocations(res));
      })
      .catch(() => {
        if (!cancelled) setOfficeLocations([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  const assignedOffice = useMemo(
    () => findAssignedOffice(officeLocations, profile?.assigned_location ?? profile?.work_location),
    [officeLocations, profile?.assigned_location, profile?.work_location],
  );

  const resetLocationAttempt = useCallback(() => {
    setLocationError(null);
    setLocationIssue(null);
    setLocationAttempt(0);
  }, []);

  const [justClockedOut, setJustClockedOut] = useState(false);

  // Reset the local override once a new clock-in session starts.
  useEffect(() => {
    if (!todayStatus?.clock_in) setJustClockedOut(false);
  }, [todayStatus?.clock_in]);

  const clockedIn = !!todayStatus?.clock_in && !todayStatus?.clock_out && !justClockedOut;

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!clockedIn) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [clockedIn]);

  // The backend is the source of truth for when the shift started: prefer its
  // ISO clock_in_at, then its elapsed_seconds, and only then the local time string.
  const startedAt = useMemo(() => {
    if (!todayStatus) return NaN;
    if (todayStatus.clock_in_at) {
      const t = Date.parse(todayStatus.clock_in_at);
      if (!Number.isNaN(t)) return t;
    }
    if (typeof todayStatus.elapsed_seconds === "number") {
      return Date.now() - todayStatus.elapsed_seconds * 1000;
    }
    if (todayStatus.clock_in) return parseAttendanceInstant(todayStatus.clock_in, todayStatus?.date);
    return NaN;
  }, [todayStatus]);

  const elapsed = useMemo(() => {
    if (!clockedIn) return null;
    const start = startedAt;
    if (Number.isNaN(start)) return null;
    const diff = Math.max(0, Math.floor((now - start) / 1000));
    const h = String(Math.floor(diff / 3600)).padStart(2, "0");
    const m = String(Math.floor((diff % 3600) / 60)).padStart(2, "0");
    const s = String(diff % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }, [clockedIn, now, startedAt]);

  const handleClockIn = useCallback(async () => {
    if (!employeeId) {
      toast({
        title: "Error",
        description: "Employee record not found for your account.",
        variant: "destructive",
      });
      return;
    }
    const mode = selectedMode ?? expectedMode;
    setIsPunching(true);
    setLocationError(null);
    try {
      let coords: Coords = null;
      let currentLocationIssue: LocationIssue | null = null;
      if (mode === "Physical") {
        // Location is mandatory for office clock-in — never bypass it.
        const gps = await captureGps();
        if (!gps.coords) {
          setLocationError(gps.error);
          toast({
            title: LOCATION_ERROR_COPY[gps.error ?? "position_unavailable"].title,
            description: LOCATION_ERROR_COPY[gps.error ?? "position_unavailable"].body,
            variant: "destructive",
          });
          return;
        }
        coords = gps.coords;
        const nextAttempt = locationAttempt + 1;
        currentLocationIssue = checkOfficeLocation(coords, assignedOffice);
        if (currentLocationIssue && nextAttempt < MAX_LOCATION_ATTEMPTS) {
          setLocationAttempt(nextAttempt);
          setLocationIssue(currentLocationIssue);
          toast({
            title: "Office location not confirmed",
            description: `Move near a window or open area, then retry. ${MAX_LOCATION_ATTEMPTS - nextAttempt} ${MAX_LOCATION_ATTEMPTS - nextAttempt === 1 ? "retry" : "retries"} remaining before HR review.`,
            variant: "destructive",
          });
          return;
        }
        setLocationAttempt(nextAttempt);
        setLocationIssue(currentLocationIssue);
      }
      const payload: Record<string, any> = {
        employee_id: employeeId,
        date: todayWAT(),
        work_mode: mode,
      };
      if (coords) {
        payload.location_lat = coords.lat;
        payload.location_lng = coords.lng;
        if (coords.accuracy != null) payload.location_accuracy = Math.round(coords.accuracy);
        payload.location_attempt = Math.max(1, locationAttempt + 1);
        if (currentLocationIssue) {
          payload.force_location_review = true;
          payload.location_review_reason = "Location remained outside the accuracy-aware office boundary after three attempts.";
        }
      }

      const res: any = await apiService.createAttendance(payload);
      setJustClockedOut(false);
      setChoosingMode(false);
      setSelectedMode(null);
      resetLocationAttempt();
      const record = (await refresh()) ?? res;
      const responseRecord = res?.data ?? res;
      const flagged =
        record?.hr_location_review ||
        responseRecord?.hr_location_review ||
        ["Mismatch", "Outside Radius"].includes(String(record?.location_status ?? responseRecord?.location_status ?? "")) ||
        /outside|review/i.test(String(res?.message || ""));
      toast({
        title: "Clocked in",
        description: flagged
          ? "Recorded outside the office radius — sent to HR for review."
          : res?.message || res?.attendance_status || "Clock-in recorded.",
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
  }, [assignedOffice, employeeId, expectedMode, locationAttempt, resetLocationAttempt, selectedMode, refresh, toast]);

  const handleClockOut = useCallback(async () => {
    if (!employeeId) return;
    setIsPunching(true);
    try {
      const payload = { employee_id: employeeId, date: todayWAT() };
      let res: any;
      try {
        res = await apiService.clockOut(payload);
      } catch (err: any) {
        const msg = String(err?.data?.message || err?.message || "");
        // An open break left over from earlier blocks clock-out — close it and retry.
        if (/break/i.test(msg)) {
          try {
            await apiService.endBreak(payload);
          } catch {
            /* break may already be closed */
          }
          res = await apiService.clockOut(payload);
        } else {
          throw err;
        }
      }
      let record: any = await refresh();

      // Some backends toggle a break instead of closing the day — detect the
      // half-open break, close it, and clock out for real.
      const brokeInstead =
        /break/i.test(String(res?.message || "")) ||
        (record?.break_start && !record?.break_end && !record?.clock_out);
      if (brokeInstead) {
        try {
          await apiService.endBreak(payload);
        } catch {
          /* break may already be closed */
        }
        try {
          await apiService.clockOut(payload);
        } catch {
          /* surfaced below via the refreshed record */
        }
        record = await refresh();
      }

      if (record?.clock_out) {
        setJustClockedOut(true);
        toast({
          title: "Clocked out",
          description: `Clock-out recorded at ${formatTimeWithZone(record.clock_out)}.`,
        });
      } else {
        toast({
          title: "Clock-out failed",
          description: "Your clock-out was not recorded. Please try again.",
          variant: "destructive",
        });
      }
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
                    <span>Clocked in at {formatTimeWithZone(todayStatus.clock_in)}</span>
                  </div>
                  {todayStatus?.clock_out && (
                    <div className="flex items-center gap-2">
                      <LogOut className="h-4 w-4 text-destructive" />
                      <span>Clocked out at {formatTimeWithZone(todayStatus.clock_out)}</span>
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
            {/* Flags raised by the backend on today's record */}
            {(todayStatus?.hr_location_review || todayStatus?.location_status === "Outside Radius") && (
              <p className="flex items-start gap-2 text-xs text-warning">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                You clocked in away from your office location — HR has been asked to review it.
              </p>
            )}
            {todayStatus?.schedule_mismatch && (
              <p className="flex items-start gap-2 text-xs text-warning">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Today's clock-in does not match your expected work mode ({expectedMode}).
              </p>
            )}
            {locationError && !clockedIn && (
              <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs">
                <p className="font-medium text-destructive">{LOCATION_ERROR_COPY[locationError].title}</p>
                <p className="mt-1 text-muted-foreground">{LOCATION_ERROR_COPY[locationError].body}</p>
              </div>
            )}
            {locationIssue && !clockedIn && (
              <div className="rounded-md border border-warning/40 bg-warning/5 p-3 text-xs">
                <p className="font-medium text-warning">Office location not confirmed</p>
                <p className="mt-1 text-muted-foreground">
                  {locationIssue.reason === "imprecise"
                    ? `Your device location is only accurate to about ${locationIssue.accuracyMetres} metres.`
                    : `Your device currently appears outside ${locationIssue.officeName}.`}
                  {" "}Move near a window or open area, then try again.
                </p>
                <p className="mt-1 font-medium text-foreground">
                  Attempt {locationAttempt} of {MAX_LOCATION_ATTEMPTS}. The third attempt will be recorded and flagged for HR review.
                </p>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {!clockedIn ? (
              !choosingMode ? (
                <Button onClick={() => setChoosingMode(true)} disabled={!employeeId} className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Clock In
                </Button>
              ) : (
                <div className="space-y-2">
                  {/* Mode is picked here — geolocation only runs after this choice */}
                  <p className="text-xs text-muted-foreground">Where are you working from today?</p>
                  <div className="flex gap-2">
                    {(["Physical", "WFH"] as const).map((mode) => {
                      const active = (selectedMode ?? expectedMode) === mode;
                      return (
                        <Button
                          key={mode}
                          type="button"
                          size="sm"
                          variant={active ? "secondary" : "outline"}
                          onClick={() => {
                            setSelectedMode(mode);
                            resetLocationAttempt();
                          }}
                          className="gap-2"
                        >
                          {mode === "WFH" ? <Home className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                          {mode === "WFH" ? "Working from home" : "At the office"}
                        </Button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleClockIn}
                      disabled={isPunching || !employeeId}
                      className="flex-1 gap-2"
                    >
                      <LogIn className="h-4 w-4" />
                      {isPunching
                        ? (selectedMode ?? expectedMode) === "Physical"
                          ? "Checking your location…"
                          : "Clocking in…"
                        : locationError || locationIssue
                          ? `Retry location (${locationAttempt + 1} of ${MAX_LOCATION_ATTEMPTS})`
                          : "Confirm Clock In"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isPunching}
                      onClick={() => {
                        setChoosingMode(false);
                        setSelectedMode(null);
                        resetLocationAttempt();
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                  {(selectedMode ?? expectedMode) === "Physical" && (
                    <p className="text-[11px] text-muted-foreground">
                      Your location is required to confirm office attendance.
                    </p>
                  )}
                </div>
              )
            ) : (
              <Button
                onClick={handleClockOut}
                disabled={isPunching}
                variant="destructive"
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Clock Out
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default TimeClockCard;