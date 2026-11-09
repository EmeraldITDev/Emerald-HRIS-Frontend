import { Badge } from "@/components/ui/badge";

/** Rows out of any of the backend's response shapes. */
export function extractRows(response: any): any[] {
  if (Array.isArray(response)) return response;
  if (response?.data) {
    return Array.isArray(response.data) ? response.data : response.data.data || [];
  }
  return [];
}

/** Single record out of any of the backend's response shapes. */
export function extractRecord(response: any): any | null {
  if (!response) return null;
  if (Array.isArray(response)) return response[0] ?? null;
  const d = (response as any).data;
  if (d === null) return null;
  if (Array.isArray(d)) return d[0] ?? null;
  if (d && typeof d === "object") {
    if (Array.isArray((d as any).data)) return (d as any).data[0] ?? null;
    return d;
  }
  if (typeof response === "object" && ("clock_in" in response || "attendance_status" in response)) {
    return response;
  }
  return null;
}

const WAT_TZ = "Africa/Lagos";

/** Extract HH:mm in West Africa Time from TIME, datetime, or ISO strings. */
export function formatTimeOnly(value?: string | null): string {
  if (!value) return "";
  const s = String(value).trim();
  const timeOnly = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (timeOnly) {
    return `${timeOnly[1].padStart(2, "0")}:${timeOnly[2]}`;
  }
  const ms = parseAttendanceInstant(s);
  if (Number.isNaN(ms)) {
    return s.length >= 16 ? s.slice(11, 16) : s;
  }
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: WAT_TZ,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(ms));
    const hh = parts.find((p) => p.type === "hour")?.value ?? "00";
    const mm = parts.find((p) => p.type === "minute")?.value ?? "00";
    return `${hh}:${mm}`;
  } catch {
    return s.length >= 16 ? s.slice(11, 16) : s;
  }
}

export function dateOnly(value?: string | null): string {
  if (!value) return "";
  const raw = String(value);
  const match = raw.match(/^\d{4}-\d{2}-\d{2}/);
  if (match) return match[0];
  const d = new Date(raw);
  return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

/** Company display timezone label (West Africa Time). */
export function timezoneLabel(): string {
  return "WAT";
}

/** "15:49 (WAT)" — punch times are always shown in Africa/Lagos. */
export function formatTimeWithZone(value?: string | null): string {
  const t = formatTimeOnly(value);
  return t ? `${t} (${timezoneLabel()})` : "";
}

/** Company lunch break window (WAT business hours). */
export const LUNCH_BREAK = {
  start: "13:00",
  end: "14:00",
  label: "1:00 PM – 2:00 PM",
  durationMinutes: 60,
};

/** Is the given date inside the 13:00–14:00 lunch window? */
export function isWithinLunchWindow(date: Date = new Date()): boolean {
  const minutes = date.getHours() * 60 + date.getMinutes();
  return minutes >= 13 * 60 && minutes < 14 * 60;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  "present-physical": {
    label: "✅ Clocked in — Physical",
    className: "bg-success/10 text-success border-success/20",
  },
  "present-wfh": {
    label: "✅ Clocked in — WFH",
    className: "bg-success/10 text-success border-success/20",
  },
  late: {
    label: "⚠️ Clocked in — Late",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  "unapproved-wfh": {
    label: "🔴 Attendance Exception — Unapproved WFH",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  "location-mismatch": {
    label: "🔴 Location mismatch flagged",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  "missing-clockout": {
    label: "⚠️ Missing clock-out",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  absent: {
    label: "Absent",
    className: "bg-muted text-muted-foreground border-border",
  },
};

export function attendanceStatusMeta(status?: string | null) {
  const key = String(status || "").toLowerCase();
  return (
    STATUS_LABELS[key] || {
      label: status ? String(status) : "Not clocked in",
      className: "bg-muted text-muted-foreground border-border",
    }
  );
}

/** Badge driven entirely by the backend-provided attendance_status. */
export function AttendanceStatusBadge({
  status,
  compact = false,
}: {
  status?: string | null;
  compact?: boolean;
}) {
  const meta = attendanceStatusMeta(status);
  const label = compact ? (status ? String(status) : "—") : meta.label;
  return <Badge className={meta.className}>{label}</Badge>;
}

export function locationStatusLabel(value?: string | null): string {
  const v = String(value || "").toLowerCase();
  if (v === "verified") return "Verified ✅";
  if (v === "mismatch") return "Mismatch 🔴";
  if (v === "inconclusive") return "Location inconclusive ⚠️";
  if (v === "exempt") return "Exempt";
  if (v === "not required") return "Not Required";
  return value ? String(value) : "N/A";
}

/** Machine-readable attendance lifecycle from /attendance/today or punch responses. */
export type AttendanceLifecycleState =
  | "not_confirmed"
  | "clocked_in"
  | "on_break"
  | "end_of_day_pending"
  | "completed"
  | "location_review_required"
  | "location_verification_unavailable";

export function deriveAttendanceLifecycle(record: any): AttendanceLifecycleState {
  if (!record) return "not_confirmed";
  const explicit = String(record.attendance_state || "").toLowerCase();
  if (
    explicit === "completed" ||
    explicit === "clocked_in" ||
    explicit === "on_break" ||
    explicit === "not_confirmed" ||
    explicit === "location_verification_unavailable"
  ) {
    return explicit as AttendanceLifecycleState;
  }
  if (record.clock_out || record.clock_out_time) return "completed";
  if (record.break_start && !record.break_end) return "on_break";
  if (record.clock_in || record.clock_in_time) return "clocked_in";
  return "not_confirmed";
}

export function needsLocationReview(record: any): boolean {
  if (!record) return false;
  if (record.hr_location_review) return true;
  const status = String(record.location_status || "").toLowerCase();
  return status === "mismatch" || status === "inconclusive" || status === "outside radius";
}

/** 12-hour punch label for buttons, e.g. "9:50 AM". */
export function formatPunchAmPm(value?: string | null): string {
  const hhmm = formatTimeOnly(value);
  if (!hhmm) return "";
  const [hRaw, m] = hhmm.split(":");
  let h = Number(hRaw);
  if (!Number.isFinite(h)) return hhmm;
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${suffix}`;
}

/** Today's date in the WAT (UTC+1) business timezone. */
export function todayWAT(): string {
  const now = new Date();
  const wat = new Date(now.getTime() + (60 + now.getTimezoneOffset()) * 60000);
  const y = wat.getFullYear();
  const m = String(wat.getMonth() + 1).padStart(2, "0");
  const d = String(wat.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Weekday name (Monday…Sunday) in WAT. */
export function parseAttendanceInstant(value?: string | null, dateHint?: string | null): number {
  if (!value) return NaN;
  const raw = String(value).trim();
  // Time-only value from the backend (e.g. "14:36:00") — anchor to the WAT day.
  const timeOnly = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (timeOnly) {
    const day = dateOnly(dateHint) || todayWAT();
    const hh = timeOnly[1].padStart(2, "0");
    return new Date(`${day}T${hh}:${timeOnly[2]}:${timeOnly[3] ?? "00"}+01:00`).getTime();
  }
  // "YYYY-MM-DD HH:MM:SS" without zone — treat wall clock as WAT.
  const localDt = raw.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})/);
  if (localDt && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(raw)) {
    return new Date(`${localDt[1]}T${localDt[2]}+01:00`).getTime();
  }
  const d = new Date(raw.includes("T") ? raw : raw.replace(" ", "T"));
  return d.getTime();
}

export function todayDayNameWAT(): string {
  const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const now = new Date();
  const wat = new Date(now.getTime() + (60 + now.getTimezoneOffset()) * 60000);
  return names[wat.getDay()];
}