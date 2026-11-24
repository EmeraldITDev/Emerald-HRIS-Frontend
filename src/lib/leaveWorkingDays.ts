/**
 * Inclusive working-day count for leave: Monday to Friday, leaving out public holidays.
 * Mirrors the backend LeaveDurationService, which is the source of truth on submit.
 *
 * @param holidayDates public holiday dates as YYYY-MM-DD (see usePublicHolidays)
 */
export function countLeaveWorkingDays(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  holidayDates?: ReadonlySet<string>,
): number {
  return leaveDayBreakdown(startDate, endDate, holidayDates).workingDays;
}

/** Working days plus the weekday public holidays that were left out. */
export function leaveDayBreakdown(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  holidayDates?: ReadonlySet<string>,
): { workingDays: number; holidayDates: string[] } {
  const empty = { workingDays: 0, holidayDates: [] };
  if (!startDate || !endDate) return empty;

  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  if (!start || !end || end.getTime() < start.getTime()) return empty;

  let workingDays = 0;
  const skipped: string[] = [];
  const cursor = new Date(start.getTime());
  while (cursor.getTime() <= end.getTime()) {
    const weekday = cursor.getDay(); // 0=Sun … 6=Sat
    if (weekday !== 0 && weekday !== 6) {
      const key = toDateKey(cursor);
      if (holidayDates?.has(key)) {
        skipped.push(key);
      } else {
        workingDays += 1;
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return { workingDays, holidayDates: skipped };
}

/** Calendar years touched by a date range, e.g. 2026-12-28 → 2027-01-02 gives [2026, 2027]. */
export function yearsInRange(startDate: string | null | undefined, endDate: string | null | undefined): number[] {
  const start = startDate ? parseDateOnly(startDate) : null;
  const end = endDate ? parseDateOnly(endDate) : null;
  if (!start) return [];
  const last = end && end.getTime() >= start.getTime() ? end.getFullYear() : start.getFullYear();
  const years: number[] = [];
  for (let y = start.getFullYear(); y <= last && years.length < 3; y++) years.push(y);
  return years;
}

function toDateKey(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

function parseDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}
