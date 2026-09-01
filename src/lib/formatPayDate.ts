/** Format API pay_date / payDate (ISO or pre-formatted) for display, e.g. "31 Aug 2026". */
export function formatPayDate(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  const raw = String(value).trim();
  if (!raw) return "—";
  // Already human-readable from backend PayslipService::formatPayDate
  if (!raw.includes("T") && !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const d = new Date(raw.includes("T") ? raw : `${raw}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
