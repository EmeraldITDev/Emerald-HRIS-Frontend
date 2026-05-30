/**
 * Resolve a frontend route for a notification.
 * Normalizes/repairs known-bad backend links and falls back to type-based
 * inference. Payroll routing is role-aware.
 */
export function resolveNotificationLink(
  n: {
    link?: string | null;
    type?: string | null;
    data?: any;
    related_id?: number | string | null;
    leave_request_id?: number | string | null;
  },
  role?: string | null
): string | null {
  const type = (n?.type || "").toLowerCase();
  const isAdminPayroll = role === "hr_manager" || role === "corporate_hr";
  const isManager =
    role === "line_manager" ||
    role === "hr_manager" ||
    role === "corporate_hr" ||
    role === "executive";

  // Final-approved/rejected leave (employee-facing) → /attendance
  const isFinalLeaveDecision =
    type === "leave_finally_approved" ||
    type === "leave_finally_rejected" ||
    type === "leave_rejected_by_line_manager";

  // Leave needing action by manager/HR
  const isLeavePendingManager = type === "leave_request_submitted";
  const isLeavePendingHr = type === "leave_approved_by_line_manager";

  // Normalize backend-provided link if it points at obsolete routes.
  const raw = n?.link || "";
  if (isFinalLeaveDecision) {
    return "/attendance";
  }
  if (isLeavePendingManager) {
    return "/approvals/leave?stage=manager";
  }
  if (isLeavePendingHr) {
    return "/approvals/leave?stage=hr";
  }

  // Attendance approval workflows (late clock-in / early clock-out)
  if (type.startsWith("early_clockout_request_") || type.startsWith("late_clockin_request_")) {
    if (/_approved$|_rejected$/.test(type)) return "/attendance";
    // pending/submitted → approvers
    if (isManager) return "/attendance?tab=approvals";
    return "/attendance";
  }

  if (raw) {
    // Announcements: app only has a list page
    if (/^\/announcements(\/|$|\?)/i.test(raw)) {
      return "/announcements";
    }
    // /leaves/{id} (approved leave detail) → /attendance
    if (/^\/leaves\/\d+/i.test(raw)) {
      return "/attendance";
    }
    // Backend (Laravel) deep-links → /approvals/leave with correct stage
    if (/^\/leave-approvals(\/|$|\?)/i.test(raw)) {
      const stage = /pending-manager/i.test(raw)
        ? "manager"
        : /pending-hr|hr/i.test(raw)
        ? "hr"
        : null;
      const params = new URLSearchParams();
      if (stage) params.set("stage", stage);
      const qs = params.toString();
      return `/approvals/leave${qs ? `?${qs}` : ""}`;
    }
    // Payroll: send non-admin users to their personal payslips
    if (/^\/payroll\/payslips(\/|$|\?)/i.test(raw) && !isAdminPayroll) {
      return raw.replace(/^\/payroll\/payslips/i, "/payroll/my-payslips");
    }
    return raw;
  }

  const id =
    n?.data?.leave_request_id ??
    n?.data?.id ??
    n?.leave_request_id ??
    n?.related_id ??
    null;

  if (type.includes("leave")) {
    const stage =
      type.includes("hr")
        ? "hr"
        : type.includes("manager") || (isManager && /pending|submitted|requested/i.test(type))
        ? "manager"
        : null;
    const params = new URLSearchParams();
    if (id != null) params.set("id", String(id));
    if (stage) params.set("stage", stage);
    const qs = params.toString();
    return `/approvals/leave${qs ? `?${qs}` : ""}`;
  }

  if (type.includes("payroll") || type.includes("payslip")) {
    const period =
      n?.data?.pay_period || n?.data?.payPeriod || n?.data?.period || null;
    const base = isAdminPayroll ? "/payroll/payslips" : "/payroll/my-payslips";
    return period ? `${base}/${period}` : base;
  }

  if (type.startsWith("benefit_")) {
    return "/benefits";
  }

  if (type.startsWith("announcement_")) {
    return "/announcements";
  }

  if (type.includes("announcement")) {
    return "/announcements";
  }

  return null;
}