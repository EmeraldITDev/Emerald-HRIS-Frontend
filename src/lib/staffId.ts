/** Staff ID helpers — mirrors backend `/^EMR \d{3,}$/` contract. */

export const STAFF_ID_PATTERN = /^EMR \d{3,}$/;

export function canEditStaffId(role?: string | null): boolean {
  return role === "corporate_hr" || role === "hr_manager";
}

/** Trim + uppercase prefix while typing; collapse only trailing spaces after EMR when valid-ish. */
export function formatStaffIdInput(raw: string): string {
  const upper = raw.toUpperCase();
  // Allow user to type; normalize EMR prefix casing and keep a single space after EMR when present.
  if (/^EMR\s/i.test(upper)) {
    return "EMR " + upper.slice(3).replace(/^\s*/, "");
  }
  return upper;
}

export function normalizeStaffId(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) return null;
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const m = trimmed.match(/^emr (\d{3,})$/i);
  if (m) return `EMR ${m[1]}`;
  return trimmed;
}

export function isValidStaffIdOrEmpty(raw: string | null | undefined): boolean {
  const n = normalizeStaffId(raw);
  if (n === null) return true;
  return STAFF_ID_PATTERN.test(n);
}

export function staffIdFromEmployee(emp: {
  staff_id?: string | null;
  staffId?: string | null;
} | null | undefined): string | null {
  const v = emp?.staff_id ?? emp?.staffId ?? null;
  if (v === null || v === undefined || String(v).trim() === "") return null;
  return String(v);
}

export function messageForStaffIdError(err: any): string | null {
  const code = err?.data?.error || err?.error;
  if (code === "STAFF_ID_TAKEN") return err?.data?.message || err?.message || "Staff ID is already assigned";
  if (code === "STAFF_ID_INVALID") return err?.data?.message || "Staff ID must look like EMR 001";
  if (code === "STAFF_ID_FORBIDDEN") return "You don't have permission to change Staff IDs";
  if (err?.status === 409 && String(err?.message || "").includes("Staff ID")) {
    return err.message;
  }
  if (err?.status === 422 && String(err?.data?.error) === "STAFF_ID_INVALID") {
    return err?.data?.message || err?.message;
  }
  if (err?.status === 403 && String(err?.data?.error) === "STAFF_ID_FORBIDDEN") {
    return "You don't have permission to change Staff IDs";
  }
  return null;
}
