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

  // Normalize backend-provided link if it points at obsolete routes.
  const raw = n?.link || "";
  if (raw) {
    // Old leave-approvals paths → /approvals/leave
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
      type.includes("hr") ? "hr" : type.includes("manager") ? "manager" : null;
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

  return null;
}