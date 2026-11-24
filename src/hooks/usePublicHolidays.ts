import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import apiService, { type PublicHoliday } from "@/lib/api";

export const publicHolidaysQueryKey = (year: number) => ["public-holidays", year] as const;

/**
 * Public holidays for the given years, keyed by date (YYYY-MM-DD).
 * Used to leave holidays out of leave-day counts.
 */
export function usePublicHolidays(years: number[]) {
  const uniqueYears = useMemo(
    () => Array.from(new Set(years.filter((y) => Number.isInteger(y) && y >= 2000 && y <= 2100))).sort(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [years.join(",")],
  );

  const results = useQueries({
    queries: uniqueYears.map((year) => ({
      queryKey: publicHolidaysQueryKey(year),
      queryFn: () => apiService.getPublicHolidays(year),
      staleTime: 10 * 60 * 1000,
    })),
  });

  const dataKey = results.map((r) => r.dataUpdatedAt).join(",");
  const byDate = useMemo(() => {
    const map = new Map<string, PublicHoliday>();
    results.forEach((r) => r.data?.forEach((h) => map.set(h.date, h)));
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataKey]);

  const dates = useMemo(() => new Set(byDate.keys()), [byDate]);

  return {
    holidaysByDate: byDate,
    holidayDates: dates as ReadonlySet<string>,
    isLoading: results.some((r) => r.isLoading),
    /** True once every year loaded; counts made before then (or after an error) ignore holidays. */
    isReady: results.every((r) => r.isSuccess),
  };
}
