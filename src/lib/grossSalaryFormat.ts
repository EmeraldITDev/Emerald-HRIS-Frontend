import { formatNairaAmount } from "@/lib/currency";

/** Display-only comma formatting for annual gross salary fields. */
export function formatGrossSalaryDisplay(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  const digits = String(value).replace(/[^\d]/g, "");
  if (!digits) return "";
  return formatNairaAmount(digits, 0);
}

/** Strip formatting for storage/submit (plain integer string). */
export function parseGrossSalaryInput(value: string): string {
  return value.replace(/[^\d]/g, "");
}
