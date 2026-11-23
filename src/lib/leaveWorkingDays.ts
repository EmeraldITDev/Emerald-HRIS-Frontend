/**
 * Inclusive Mon–Fri working-day count for leave duration previews.
 * Backend LeaveDurationService is the source of truth on submit.
 */
export function countLeaveWorkingDays(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
): number {
  if (!startDate || !endDate) return 0;

  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  if (!start || !end || end.getTime() < start.getTime()) return 0;

  let days = 0;
  const cursor = new Date(start.getTime());
  while (cursor.getTime() <= end.getTime()) {
    const weekday = cursor.getDay(); // 0=Sun … 6=Sat
    if (weekday !== 0 && weekday !== 6) {
      days += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
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
