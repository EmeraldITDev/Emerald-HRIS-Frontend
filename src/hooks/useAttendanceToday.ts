import { useCallback, useEffect, useState } from "react";
import apiService from "@/lib/api";
import { extractRecord, todayWAT } from "@/lib/attendanceUi";

/** Normalise the /attendance/today status shape into a full attendance record. */
function normalize(raw: any): any | null {
  if (!raw) return null;
  if (raw.clock_in || raw.break_start || raw.id || raw.attendance_state) {
    return {
      ...raw,
      clock_in: raw.clock_in ?? raw.clock_in_time ?? null,
      clock_out: raw.clock_out ?? raw.clock_out_time ?? null,
    };
  }
  if ("is_clocked_in" in raw || "clock_in_time" in raw) {
    if (!raw.clock_in_time && !raw.is_clocked_out) return null;
    return {
      ...raw,
      clock_in: raw.clock_in_time,
      clock_out: raw.clock_out_time ?? null,
    };
  }
  return raw;
}

/**
 * Shared "today's attendance record" state.
 *
 * Uses GET /attendance/today so there is no pagination problem and both the
 * Dashboard and the Attendance page read the exact same record.
 */
export function useAttendanceToday(enabled: boolean = true, employeeId?: number | null) {
  const [todayStatus, setTodayStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);

  const refresh = useCallback(async () => {
    if (!enabled) return null;
    setIsLoading(true);
    try {
      let record: any = null;

      // Prefer /attendance/today for machine-readable state codes, then merge
      // any richer fields from the range endpoint when available.
      const todayRes = await apiService.getAttendanceToday(employeeId ?? undefined);
      record = normalize(extractRecord(todayRes));

      if (employeeId) {
        try {
          const day = todayWAT();
          const res: any = await apiService.getAttendanceRange({
            start_date: day,
            end_date: day,
            employee_id: employeeId,
          });
          const ranged = extractRecord(res);
          if (ranged) {
            record = {
              ...ranged,
              ...record,
              clock_in: record?.clock_in ?? ranged.clock_in ?? null,
              clock_out: record?.clock_out ?? ranged.clock_out ?? null,
              break_start: ranged.break_start ?? record?.break_start ?? null,
              break_end: ranged.break_end ?? record?.break_end ?? null,
            };
          }
        } catch {
          /* today endpoint alone is sufficient */
        }
      }

      setTodayStatus(record ?? null);
      return record ?? null;
    } catch (e) {
      console.error("Failed to load today's attendance:", e);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [enabled, employeeId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { todayStatus, isLoading, refresh };
}

export default useAttendanceToday;