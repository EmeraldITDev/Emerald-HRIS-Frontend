import { useCallback, useEffect, useState } from "react";
import apiService from "@/lib/api";
import { extractRecord, todayWAT } from "@/lib/attendanceUi";

/** Normalise the /attendance/today status shape into a full attendance record. */
function normalize(raw: any): any | null {
  if (!raw) return null;
  if (raw.clock_in || raw.break_start || raw.id) return raw;
  if ("is_clocked_in" in raw || "clock_in_time" in raw) {
    if (!raw.clock_in_time) return null;
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

      // Full attendance row (includes break_start / break_end) when we know the employee.
      if (employeeId) {
        try {
          const day = todayWAT();
          const res: any = await apiService.getAttendanceRange({
            start_date: day,
            end_date: day,
            employee_id: employeeId,
          });
          record = extractRecord(res);
        } catch {
          /* fall through to the status endpoint */
        }
      }

      if (!record?.clock_in) {
        const res = await apiService.getAttendanceToday(employeeId ?? undefined);
        record = normalize(extractRecord(res)) ?? record;
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