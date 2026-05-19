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