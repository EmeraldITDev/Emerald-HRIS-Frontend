/**
 * Single source of truth for Naira display formatting.
 * Values are never mutated — only their presentation.
 */

export const toNumberSafe = (value: unknown): number => {
  if (value === null || value === undefined || value === "") return NaN
  const normalized = typeof value === "string" ? value.replace(/[₦,\s]/g, "") : value
  const n = Number(normalized)
  return Number.isFinite(n) ? n : NaN
}

/** e.g. 1350000 -> "1,350,000.00" (no currency symbol). */
export const formatNairaAmount = (
  value: unknown,
  decimals: number = 2,
): string => {
  const n = toNumberSafe(value)
  if (!Number.isFinite(n)) return ""
  return n.toLocaleString("en-NG", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/** e.g. 1350000 -> "₦1,350,000.00". */
export const formatNaira = (
  value: unknown,
  options?: { decimals?: number; fallback?: string },
): string => {
  const decimals = options?.decimals ?? 2
  const fallback = options?.fallback ?? "₦0.00"
  const n = toNumberSafe(value)
  if (!Number.isFinite(n)) return fallback
  return `₦${formatNairaAmount(n, decimals)}`
}

export default formatNaira
