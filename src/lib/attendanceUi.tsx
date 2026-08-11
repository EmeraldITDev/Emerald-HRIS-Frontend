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

/** Extract HH:mm from "YYYY-MM-DD HH:MM:SS" or ISO strings. */
export function formatTimeOnly(value?: string | null): string {
  if (!value) return "";
  const s = String(value);
  const d = new Date(s.includes("T") ? s : s.replace(" ", "T"));
  if (!isNaN(d.getTime())) {
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }
  return s.length >= 16 ? s.slice(11, 16) : s;
}

export function dateOnly(value?: string | null): string {
  if (!value) return "";
  const raw = String(value);
  const match = raw.match(/^\d{4}-\d{2}-\d{2}/);
  if (match) return match[0];
  const d = new Date(raw);
  return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

/** Short label for the viewer's timezone, e.g. "WAT", "GMT+1", "EST". */
export function timezoneLabel(): string {
  try {
    const parts = new Intl.DateTimeFormat(undefined, {
      timeZoneName: "short",
    }).formatToParts(new Date());
    const tz = parts.find((p) => p.type === "timeZoneName")?.value;
    if (tz) return tz;
  } catch {
    /* fall through */
  }
  return "Local";
}

/** "15:49 (WAT)" — time plus the viewer's timezone abbreviation. */
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
  if (v === "exempt") return "Exempt";
  if (v === "not required") return "Not Required";
  return value ? String(value) : "N/A";
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
export function todayDayNameWAT(): string {
  const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const now = new Date();
  const wat = new Date(now.getTime() + (60 + now.getTimezoneOffset()) * 60000);
  return names[wat.getDay()];
}