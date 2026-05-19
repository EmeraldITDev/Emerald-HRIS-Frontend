/**
 * Resolve a frontend route for a notification.
 * Prefers an explicit `link` from the backend, otherwise infers from `type`
 * (so leave-related notifications always land on the approvals page).
 */
export function resolveNotificationLink(n: {
  link?: string | null;
  type?: string | null;
  data?: any;
  related_id?: number | string | null;
  leave_request_id?: number | string | null;
}): string | null {
  if (n?.link) return n.link;
  const type = (n?.type || "").toLowerCase();
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
    return "/payroll/my-payslips";
  }

  return null;
}