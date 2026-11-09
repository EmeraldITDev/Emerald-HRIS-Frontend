import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, LogIn, LogOut, Timer, MapPin, Home, AlertTriangle, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import apiService from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  AttendanceStatusBadge,
  deriveAttendanceLifecycle,
  formatPunchAmPm,
  formatTimeWithZone,
  needsLocationReview,
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
  city?: string;
  address?: string;
  latitude: number;
  longitude: number;
  radiusMetres: number;
};

type LocationIssue = {
  officeName: string;
  distanceMetres: number;
  accuracyMetres: number;
  allowedMetres: number;
  reason: "outside";
};

/** Soft check only — outside radius still clocks in (backend flags HR). */
const MAX_ACCURACY_ALLOWANCE_METRES = 500;
/** Extra metres added on top of the office radius for phone GPS drift. */
const CLIENT_RADIUS_BUFFER_METRES = 500;
/** If the first GPS fix is this coarse, take a second reading. */
const RETRY_ACCURACY_METRES = 120;

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

function readGpsOnce(options: PositionOptions): Promise<{ coords: Coords; error: LocationError }> {
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
      options,
    );
  });
}

async function captureGps(): Promise<{ coords: Coords; error: LocationError }> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return { coords: null, error: "unsupported" };
  }

  // Prefer a fresh high-accuracy fix; allow a short-lived cache so phones that
  // already have a good GPS lock are not forced onto a worse Wi-Fi/IP estimate.
  // Cap waits so a slow GPS fix does not make clock-in feel like a hang (was 20s×2).
  const first = await readGpsOnce({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 30_000,
  });
  if (!first.coords) return first;

  const firstAccuracy = first.coords.accuracy ?? Number.POSITIVE_INFINITY;
  if (firstAccuracy <= RETRY_ACCURACY_METRES) {
    return first;
  }

  const second = await readGpsOnce({
    enableHighAccuracy: true,
    timeout: 8000,
    maximumAge: 0,
  });
  if (!second.coords) return first;

  const secondAccuracy = second.coords.accuracy ?? Number.POSITIVE_INFINITY;
  return secondAccuracy <= firstAccuracy ? second : first;
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
      city: row?.city ? String(row.city) : undefined,
      address: row?.address ? String(row.address) : undefined,
      latitude,
      longitude,
      radiusMetres,
    }];
  });
}

function findAssignedOffice(offices: OfficeLocation[], assignedLocation: unknown): OfficeLocation | null {
  const assigned = normaliseLocation(assignedLocation);
  if (!assigned || offices.length === 0) return null;

  const cityHint = assigned.includes("calabar")
    ? "calabar"
    : assigned.includes("lagos") || assigned.includes("victoria") || assigned.includes("sapetro")
      ? "lagos"
      : assigned.includes("abuja")
        ? "abuja"
        : "";

  const exact = offices.find((office) => {
    const name = normaliseLocation(office.name);
    const city = normaliseLocation(office.city);
    return name === assigned || city === assigned;
  });
  if (exact) return exact;

  if (cityHint) {
    const byCity = offices.find((office) => normaliseLocation(office.city) === cityHint);
    if (byCity) return byCity;
  }

  return offices.find((office) => {
    const searchable = normaliseLocation(`${office.name} ${office.city ?? ""} ${office.address ?? ""}`);
    return searchable.includes(assigned) || assigned.includes(normaliseLocation(office.name));
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

function allowedRadiusMetres(office: OfficeLocation, accuracyMetres: number): number {
  return office.radiusMetres + CLIENT_RADIUS_BUFFER_METRES + Math.min(accuracyMetres, MAX_ACCURACY_ALLOWANCE_METRES);
}

/**
 * Soft client-side check: accept the assigned office or any nearer company
 * office inside its geofence. Low GPS accuracy alone is not treated as off-site.
 */
function evaluateOfficePresence(
  coords: Coords,
  offices: OfficeLocation[],
  preferred: OfficeLocation | null,
): { matched: OfficeLocation | null; issue: LocationIssue | null } {
  if (!coords || offices.length === 0) {
    return { matched: preferred, issue: null };
  }

  const accuracyMetres = Math.max(0, coords.accuracy ?? 0);
  let bestInside: { office: OfficeLocation; distance: number; allowed: number } | null = null;
  let nearest: { office: OfficeLocation; distance: number; allowed: number } | null = null;

  for (const office of offices) {
    const distance = distanceMetres(coords, office);
    const allowed = allowedRadiusMetres(office, accuracyMetres);
    const row = { office, distance, allowed };
    if (!nearest || distance < nearest.distance) nearest = row;
    if (distance > allowed) continue;
    const isPreferred = preferred != null && String(preferred.id) === String(office.id);
    if (
      !bestInside ||
      isPreferred ||
      (preferred == null || String(bestInside.office.id) !== String(preferred.id)) &&
        distance < bestInside.distance
    ) {
      bestInside = row;
      if (isPreferred) break;
    }
  }

  if (bestInside) {
    return { matched: bestInside.office, issue: null };
  }

  const fallback = preferred
    ? {
        office: preferred,
        distance: distanceMetres(coords, preferred),
        allowed: allowedRadiusMetres(preferred, accuracyMetres),
      }
    : nearest;

  if (!fallback) return { matched: null, issue: null };

  return {
    matched: fallback.office,
    issue: {
      officeName: fallback.office.name,
      distanceMetres: Math.round(fallback.distance),
      accuracyMetres: Math.round(accuracyMetres),
      allowedMetres: Math.round(fallback.allowed),
      reason: "outside",
    },
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

  /** Profile work location drives the remote label (e.g. Remote — Lagos). */
  const remoteWorkLabel = useMemo(() => {
    const loc = String(profile?.work_location || profile?.assigned_location || "").trim();
    return loc ? `Remote — ${loc}` : "Remote — assigned location";
  }, [profile?.work_location, profile?.assigned_location]);

  const remoteWorkPlaceName = useMemo(() => {
    return String(profile?.work_location || profile?.assigned_location || "assigned location").trim();
  }, [profile?.work_location, profile?.assigned_location]);

  const resetLocationState = useCallback(() => {
    setLocationError(null);
    setLocationIssue(null);
  }, []);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const lifecycle = useMemo(() => deriveAttendanceLifecycle(todayStatus), [todayStatus]);
  const locationReview = useMemo(() => needsLocationReview(todayStatus), [todayStatus]);
  const hrWasNotified = Boolean(todayStatus?.hr_notified);
  const clockedIn = lifecycle === "clocked_in" || lifecycle === "on_break";
  const attendanceCompleted = lifecycle === "completed";
  const clockInLabel = formatPunchAmPm(todayStatus?.clock_in ?? todayStatus?.clock_in_time);
  const clockOutLabel = formatPunchAmPm(todayStatus?.clock_out ?? todayStatus?.clock_out_time);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!clockedIn) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [clockedIn]);

  // Prefer the API's UTC ISO clock_in_at (built from the WAT TIME column), then
  // reconstruct from the stored punch + attendance date, then elapsed_seconds.
  const startedAt = useMemo(() => {
    if (!todayStatus) return NaN;
    if (todayStatus.clock_in_at) {
      const t = Date.parse(todayStatus.clock_in_at);
      if (!Number.isNaN(t)) return t;
    }
    if (todayStatus.clock_in) {
      const t = parseAttendanceInstant(todayStatus.clock_in, todayStatus?.date);
      if (!Number.isNaN(t)) return t;
    }
    if (typeof todayStatus.elapsed_seconds === "number") {
      return Date.now() - todayStatus.elapsed_seconds * 1000;
    }
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
      let matchedOffice: OfficeLocation | null = assignedOffice;
      if (mode === "Physical") {
        // Location is captured for audit; outside radius no longer blocks clock-in.
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
        const presence = evaluateOfficePresence(coords, officeLocations, assignedOffice);
        matchedOffice = presence.matched;
        currentLocationIssue = presence.issue;
        setLocationIssue(currentLocationIssue);
      } else {
        // Working from home: no location is requested or required.
        setLocationIssue(null);
        resetLocationState();
      }
      const payload: Record<string, any> = {
        employee_id: employeeId,
        date: todayWAT(),
        work_mode: mode,
      };
      if (mode === "WFH") {
        // Backend still uses work_from_home; store the profile place for HR visibility.
        payload.location = remoteWorkPlaceName;
        payload.remote_work_location = remoteWorkPlaceName;
      }
      if (coords) {
        payload.location_lat = coords.lat;
        payload.location_lng = coords.lng;
        if (coords.accuracy != null) payload.location_accuracy = Math.round(coords.accuracy);
        if (matchedOffice?.id != null) payload.office_location_id = matchedOffice.id;
        if (mode === "Physical" && currentLocationIssue) {
          payload.force_location_review = true;
          payload.location_review_reason = "Clock-in coordinates were outside the office geofence.";
        }
      }

      const res: any = await apiService.createAttendance(payload);
      setChoosingMode(false);
      setSelectedMode(null);
      resetLocationState();
      const record = (await refresh()) ?? res;
      const responseRecord = res?.data ?? res;
      const reason = String(res?.reason_code || "");
      const flagged =
        Boolean(res?.hr_location_review) ||
        Boolean(record?.hr_location_review) ||
        Boolean(responseRecord?.hr_location_review) ||
        ["Mismatch", "Inconclusive", "Outside Radius"].includes(
          String(record?.location_status ?? responseRecord?.location_status ?? ""),
        ) ||
        ["outside_office_radius", "location_verification_inconclusive"].includes(
          String(res?.location_state || ""),
        );

      if (reason === "ATTENDANCE_COMPLETED" || res?.attendance_state === "completed") {
        toast({
          title: "Attendance completed",
          description: res?.message || "Your attendance for today is already complete.",
        });
      } else if (reason === "ALREADY_CLOCKED_IN" || res?.idempotent) {
        toast({
          title: "Already clocked in",
          description:
            res?.message ||
            `Your attendance was already confirmed at ${formatTimeWithZone(record?.clock_in)}.`,
        });
      } else if (flagged) {
        toast({
          title: "Attendance confirmed",
          description:
            res?.message ||
            "Your attendance has been recorded, but we couldn't verify your office location. HR may review the location details.",
        });
      } else {
        toast({
          title: "Attendance confirmed",
          description: res?.message || "Attendance recorded.",
        });
      }
    } catch (e: any) {
      const msg = String(e?.data?.message || e?.message || "");
      const reason = String(e?.data?.reason_code || "");
      // A previous attempt may have saved the punch before the response failed
      // (e.g. serialization error). Refresh so the UI matches the database.
      if (
        reason === "ALREADY_CLOCKED_IN" ||
        reason === "ATTENDANCE_COMPLETED" ||
        /already working|already clocked|already complete|4\/4/i.test(msg)
      ) {
        const record = await refresh();
        setChoosingMode(false);
        setSelectedMode(null);
        resetLocationState();
        if (record?.clock_out) {
          toast({
            title: "Attendance completed",
            description:
              e?.data?.message ||
              `Your attendance for today is complete. Clock-in: ${formatPunchAmPm(record.clock_in)}. Clock-out: ${formatPunchAmPm(record.clock_out)}.`,
          });
          return;
        }
        if (record?.clock_in) {
          toast({
            title: "Already clocked in",
            description:
              e?.data?.message ||
              `Your attendance was already confirmed at ${formatPunchAmPm(record.clock_in)} today.`,
          });
          return;
        }
      }
      toast({
        title: "Attendance confirmation failed",
        description: msg || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPunching(false);
    }
  }, [
    assignedOffice,
    employeeId,
    expectedMode,
    officeLocations,
    remoteWorkPlaceName,
    resetLocationState,
    selectedMode,
    refresh,
    toast,
  ]);

  const handleClockOut = useCallback(async () => {
    if (!employeeId) return;
    setIsPunching(true);
    try {
      const payload = { employee_id: employeeId, date: todayWAT() };
      const res: any = await apiService.clockOut(payload);
      const record: any = await refresh();

      if (record?.clock_out || res?.attendance_state === "completed") {
        toast({
          title: res?.idempotent ? "Attendance completed" : "End-of-day confirmed",
          description:
            res?.message ||
            `End-of-day confirmed at ${formatTimeWithZone(record?.clock_out)}.`,
        });
      } else {
        toast({
          title: "End-of-day confirmation failed",
          description: "Your end-of-day confirmation was not recorded. Please try again.",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      const reason = String(e?.data?.reason_code || "");
      const msg = String(e?.data?.message || e?.message || "");
      if (reason === "ATTENDANCE_COMPLETED" || /already complete|4\/4/i.test(msg)) {
        await refresh();
        toast({
          title: "Attendance completed",
          description: msg || "Your attendance for today is already complete.",
        });
        return;
      }
      toast({
        title: "End-of-day confirmation failed",
        description: msg || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPunching(false);
    }
  }, [employeeId, refresh, toast]);

  const handleRefreshStatus = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refresh();
      toast({
        title: "Attendance status refreshed",
        description: "Showing the latest attendance status from the server.",
      });
    } catch {
      toast({
        title: "Refresh failed",
        description: "Could not refresh attendance status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh, toast]);

  return (
    <Card className={cn("border-border/50 shadow-sm bg-gradient-to-r from-primary/5 to-primary/10", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 text-primary">
          <span className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Daily Attendance
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
                    <span>Attendance confirmed at {formatTimeWithZone(todayStatus.clock_in)}</span>
                  </div>
                  {todayStatus?.clock_out && (
                    <div className="flex items-center gap-2">
                      <LogOut className="h-4 w-4 text-destructive" />
                      <span>End-of-day confirmed at {formatTimeWithZone(todayStatus.clock_out)}</span>
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
                <span>Attendance Not Yet Confirmed</span>
              )}
            </div>
            {/* Flags raised by the backend on today's record */}
            {locationReview && (
              <p className="flex items-start gap-2 text-xs text-warning">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {String(todayStatus?.location_status || "").toLowerCase() === "inconclusive"
                  ? "Your attendance was recorded, but we couldn't verify your office location from GPS."
                  : "Your attendance was recorded, but your location could not be verified against the office."}
                {hrWasNotified
                  ? " HR has been asked to review it."
                  : " HR may review the location details."}
              </p>
            )}
            {todayStatus?.schedule_mismatch && (
              <p className="flex items-start gap-2 text-xs text-warning">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Today's clock-in does not match your expected work mode ({expectedMode}).
              </p>
            )}
            {locationError && !clockedIn && !attendanceCompleted && (
              <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs">
                <p className="font-medium text-destructive">{LOCATION_ERROR_COPY[locationError].title}</p>
                <p className="mt-1 text-muted-foreground">{LOCATION_ERROR_COPY[locationError].body}</p>
              </div>
            )}
            {locationIssue && !clockedIn && !attendanceCompleted && (
              <div className="rounded-md border border-warning/40 bg-warning/5 p-3 text-xs">
                <p className="font-medium text-warning">Location looks off-site</p>
                <p className="mt-1 text-muted-foreground">
                  Your device currently appears about {locationIssue.distanceMetres} metres from{" "}
                  {locationIssue.officeName} (allowed about {locationIssue.allowedMetres} metres
                  {locationIssue.accuracyMetres > 0
                    ? `, GPS accuracy ±${locationIssue.accuracyMetres} m`
                    : ""}
                  ). You can still confirm attendance — HR may review the location later.
                </p>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 items-start">
            {attendanceCompleted ? (
              <Button disabled variant="secondary" className="gap-2">
                <LogOut className="h-4 w-4" />
                Attendance Completed
                {clockInLabel && clockOutLabel ? ` — ${clockInLabel} to ${clockOutLabel}` : ""}
              </Button>
            ) : !clockedIn ? (
              !choosingMode ? (
                <Button onClick={() => setChoosingMode(true)} disabled={!employeeId} className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Confirm Attendance
                </Button>
              ) : (
                <div className="space-y-2">
                  {/* Mode is picked here — geolocation only runs after this choice */}
                  <p className="text-xs text-muted-foreground">Where are you working today?</p>
                  <div className="flex flex-wrap gap-2">
                    {(["Physical", "WFH"] as const).map((mode) => {
                      const active = (selectedMode ?? expectedMode) === mode;
                      const isOffice = mode === "Physical";
                      return (
                        <Button
                          key={mode}
                          type="button"
                          size="sm"
                          variant="outline"
                          aria-pressed={active}
                          onClick={() => {
                            setSelectedMode(mode);
                            resetLocationState();
                          }}
                          className={cn(
                            "gap-2 border-2 font-medium transition-colors",
                            active
                              ? isOffice
                                ? "bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-600 hover:text-white shadow-sm"
                                : "bg-sky-600 text-white border-sky-500 hover:bg-sky-600 hover:text-white shadow-sm"
                              : "bg-background text-muted-foreground border-muted-foreground/30 hover:bg-muted/60",
                          )}
                        >
                          {isOffice ? <MapPin className="h-4 w-4" /> : <Home className="h-4 w-4" />}
                          {isOffice ? "Office" : remoteWorkLabel}
                          {active ? " ✓" : ""}
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
                          : "Confirming…"
                        : "Confirm Attendance"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isPunching}
                      onClick={() => {
                        setChoosingMode(false);
                        setSelectedMode(null);
                        resetLocationState();
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                  {(selectedMode ?? expectedMode) === "Physical" && (
                    <p className="text-[11px] text-muted-foreground">
                      Location is recorded for office days. Being slightly off-site will not block confirmation.
                    </p>
                  )}
                </div>
              )
            ) : (
              <div className="flex flex-col gap-2 items-stretch sm:items-end">
                <Button disabled variant="secondary" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  {clockInLabel ? `Clocked In — ${clockInLabel}` : "Clocked In"}
                </Button>
                <Button
                  onClick={handleClockOut}
                  disabled={isPunching}
                  variant="destructive"
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  {isPunching ? "Confirming…" : "Confirm End of Day"}
                </Button>
              </div>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              disabled={isRefreshing || isPunching}
              onClick={handleRefreshStatus}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
              Refresh Attendance Status
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default TimeClockCard;