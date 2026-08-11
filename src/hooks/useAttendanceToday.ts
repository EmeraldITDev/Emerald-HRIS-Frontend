import { useCallback, useEffect, useState } from "react";
import apiService from "@/lib/api";
import { extractRecord } from "@/lib/attendanceUi";

/**
 * Shared "today's attendance record" state.
 *
 * Uses GET /attendance/today so there is no pagination problem and both the
 * Dashboard and the Attendance page read the exact same record.
 */
export function useAttendanceToday(enabled: boolean = true) {
  const [todayStatus, setTodayStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);

  const refresh = useCallback(async () => {
    if (!enabled) return null;
    setIsLoading(true);
    try {
      const res = await apiService.getAttendanceToday();
      const record = extractRecord(res);
      setTodayStatus(record);
      return record;
    } catch (e) {
      console.error("Failed to load today's attendance:", e);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { todayStatus, isLoading, refresh };
}

export default useAttendanceToday;