import { useEffect, useState } from "react";
import apiService from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

/** Resolve the authenticated user's employee_id from the backend context. */
export function useCurrentEmployeeId(initial?: number | null) {
  const { user } = useAuth();
  const [employeeId, setEmployeeId] = useState<number | null>(initial ?? null);

  useEffect(() => {
    if (!user || employeeId) return;
    let cancelled = false;
    (async () => {
      try {
        const ctx: any = await apiService.getLeaveSubmitContext();
        const eid = ctx?.employee_id ?? ctx?.data?.employee_id;
        if (!cancelled && eid) setEmployeeId(Number(eid));
      } catch {
        /* non-fatal */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, employeeId]);

  return employeeId;
}

export default useCurrentEmployeeId;