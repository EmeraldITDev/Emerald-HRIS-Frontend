import { formatNairaAmount } from "@/lib/currency";

/** Display-only comma formatting for annual gross salary fields. Supports any number of decimal places. */
export function formatGrossSalaryDisplay(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  const raw = String(value).replace(/[^\d.]/g, "");
  if (!raw) return "";
  // Keep only the first decimal point; do not cap decimal places
  const [intPart, ...rest] = raw.split(".");
  const decPart = rest.join("");
  const hasDecimal = raw.includes(".");
  const formattedInt = intPart ? formatNairaAmount(intPart, 0) : "";
  if (hasDecimal) return `${formattedInt || "0"}.${decPart}`;
  return formattedInt;
}

/** Strip formatting for storage/submit (plain numeric string, decimals preserved as typed). */
export function parseGrossSalaryInput(value: string): string {
  const raw = value.replace(/[^\d.]/g, "");
  const [intPart, ...rest] = raw.split(".");
  if (rest.length === 0) return intPart;
  return `${intPart}.${rest.join("")}`;
}
