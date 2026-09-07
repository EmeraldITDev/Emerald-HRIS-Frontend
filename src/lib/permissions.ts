import type { User } from "@/contexts/AuthContext";

/**
 * Unified HR payroll/leave-HR-approval/exports/delete privilege check.
 *
 * Do NOT gate solely on `role === 'hr_manager'`. Use this helper so users
 * elevated via flags, role_group or explicit permissions also pass.
 */
export function canHrPayroll(user: (User & Record<string, any>) | null | undefined): boolean {
  if (!user) return false;
  const u = user as any;
  if (u.is_hr_admin) return true;
  if (u.has_hr_payroll_access) return true;
  if (u.role_group === "hr_admin") return true;
  if (Array.isArray(u.permissions) && u.permissions.includes("payroll.manage")) return true;
  if (Array.isArray(u.equivalent_hr_roles) && u.equivalent_hr_roles.includes(user.role)) return true;
  if (user.role === "hr_manager") return true;
  if (user.role === "corporate_hr") return true;
  return false;
}

/** HR approval queue access (includes corporate_hr like before). */
export function canHrApproveLeave(user: (User & Record<string, any>) | null | undefined): boolean {
  if (!user) return false;
  const u = user as any;
  if (u.has_leave_hr_approval_access) return true;
  if (Array.isArray(u.permissions) && u.permissions.includes("leave.manage")) return true;
  if (canHrPayroll(user)) return true;
  return user.role === "corporate_hr";
}

/**
 * Who may view the payroll draft review screen.
 *
 * HR roles (executive, hr_manager, corporate_hr) get full read/write
 * access via `canHrPayroll`. Line managers get read-only access scoped
 * to their own department (backend enforces scope).
 */
export function canViewPayrollDrafts(
  user: (User & Record<string, any>) | null | undefined,
): boolean {
  if (!user) return false;
  if (canHrPayroll(user)) return true;
  return user.role === "line_manager";
}

/** Org-wide attendance dashboard: HR + executives only. */
export function canViewOrgDashboard(
  user: (User & Record<string, any>) | null | undefined,
): boolean {
  if (!user) return false;
  if (user.role === "executive") return true;
  return canHrPayroll(user);
}

/** Attendance approvals queue (late justifications, exceptions, WFH). */
export function canApproveAttendance(
  user: (User & Record<string, any>) | null | undefined,
): boolean {
  if (!user) return false;
  if (user.role === "line_manager") return true;
  return canViewOrgDashboard(user);
}

/** Every authenticated employee may request a work exception. */
export function canSubmitException(
  user: (User & Record<string, any>) | null | undefined,
): boolean {
  return !!user;
}

/** Only Hybrid employees may request WFH days. */
export function canSubmitWFH(
  user: (User & Record<string, any>) | null | undefined,
  profile?: { work_arrangement?: string } | null,
): boolean {
  if (!user) return false;
  const arrangement =
    profile?.work_arrangement ?? (user as any)?.work_arrangement ?? null;
  return String(arrangement || "").toLowerCase() === "hybrid";
}

/** Who may edit an employee's attendance profile. */
export function canEditAttendanceProfile(
  user: (User & Record<string, any>) | null | undefined,
): boolean {
  if (!user) return false;
  return user.role === "hr_manager" || user.role === "corporate_hr";
}

/** Chairman's executive view — executives and HR Managers only. */
export function canViewExecutiveView(
  user: (User & Record<string, any>) | null | undefined,
): boolean {
  if (!user) return false;
  return user.role === "executive" || user.role === "hr_manager";
}

/** Force-delete approved/paid payroll records — HR Manager only (audited on backend). */
export function canForceDeletePayroll(
  user: (User & Record<string, any>) | null | undefined,
): boolean {
  return user?.role === "hr_manager";
}