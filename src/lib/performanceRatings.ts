/** Guide §7 — single rating scale for all performance assessment UIs. */
export const PERFORMANCE_RATING_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "5", label: "5 – Exceptional" },
  { value: "4", label: "4 – Exceeds Expectations" },
  { value: "3", label: "3 – Meets Expectations" },
  { value: "2", label: "2 – Partially Meets Expectations" },
  { value: "1", label: "1 – Does Not Meet Expectations" },
  { value: "N/A", label: "N/A – Not Applicable" },
];

export const PERFORMANCE_RATING_VALUES = PERFORMANCE_RATING_OPTIONS.map((o) => o.value);

export function isValidPerformanceRating(value: unknown, allowNa = true): boolean {
  const v = String(value ?? "").trim();
  if (!v) return false;
  if (v.toUpperCase() === "N/A" || v.toUpperCase() === "NA") return allowNa;
  return ["1", "2", "3", "4", "5"].includes(v);
}

export function isNaRating(value: unknown): boolean {
  const v = String(value ?? "").trim().toUpperCase();
  return v === "N/A" || v === "NA" || v === "NOT APPLICABLE";
}

export function ratingLabel(value: unknown): string {
  const v = String(value ?? "").trim();
  const found = PERFORMANCE_RATING_OPTIONS.find(
    (o) => o.value === v || o.value.toUpperCase() === v.toUpperCase(),
  );
  return found?.label ?? v;
}
