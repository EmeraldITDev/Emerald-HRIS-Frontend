import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import apiService from "@/lib/api";

interface EmployeeLike {
  id: number | string;
  first_name?: string;
  last_name?: string;
  employee_code?: string;
  department?: string;
}

interface Balance {
  limit: number;
  used: number;
  remaining: number;
}

const PAGE_SIZE = 12;

/**
 * Employee leave balances sourced from the same authoritative endpoint the
 * employee's own balance card uses (GET /leave/balance/{id}), so HR sees the
 * exact same numbers the employee sees. Balances are fetched only for the
 * employees currently on screen to avoid hammering the API.
 */
export function EmployeeLeaveBalancesCard({ employees }: { employees: EmployeeLike[] }) {
  const [search, setSearch] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [balances, setBalances] = useState<Record<string, Balance | "error">>({});
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) =>
      [`${e.first_name ?? ""} ${e.last_name ?? ""}`, e.employee_code, e.department, String(e.id)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [employees, search]);

  const shown = filtered.slice(0, visible);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    const missing = shown.filter((e) => balances[String(e.id)] === undefined && !loadingIds.has(String(e.id)));
    if (missing.length === 0) return;

    setLoadingIds((prev) => {
      const next = new Set(prev);
      missing.forEach((e) => next.add(String(e.id)));
      return next;
    });

    (async () => {
      for (const emp of missing) {
        const key = String(emp.id);
        try {
          const b: any = await apiService.getLeaveBalance(emp.id);
          if (cancelled) return;
          setBalances((prev) => ({
            ...prev,
            [key]: {
              limit: Number(b?.limit ?? 0),
              used: Number(b?.used ?? 0),
              remaining: Number(b?.remaining ?? Math.max(0, Number(b?.limit ?? 0) - Number(b?.used ?? 0))),
            },
          }));
        } catch {
          if (cancelled) return;
          setBalances((prev) => ({ ...prev, [key]: "error" }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown.map((e) => e.id).join(",")]);

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-primary">Employee Leave Balances</CardTitle>
        <CardDescription>Annual leave entitlement, days taken and days remaining.</CardDescription>
        <div className="relative pt-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID or department"
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        {shown.length === 0 ? (
          <p className="text-sm text-muted-foreground">No employees match that search.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {shown.map((emp) => {
                const b = balances[String(emp.id)];
                return (
                  <div key={emp.id} className="p-4 border rounded-lg bg-card">
                    <div className="font-medium text-sm">
                      {emp.first_name} {emp.last_name}
                    </div>
                    <div className="text-xs text-muted-foreground">{emp.employee_code || emp.id}</div>
                    <div className="mt-3 space-y-1">
                      {b === undefined ? (
                        <>
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-2/3" />
                        </>
                      ) : b === "error" ? (
                        <p className="text-xs text-muted-foreground">Balance unavailable right now.</p>
                      ) : b.limit <= 0 ? (
                        <p className="text-xs text-muted-foreground">No annual leave allocation recorded yet.</p>
                      ) : (
                        <>
                          <div className="flex justify-between text-xs">
                            <span>Total:</span>
                            <span>{b.limit} days</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>Used:</span>
                            <span>{b.used} days</span>
                          </div>
                          <div className="flex justify-between text-xs font-medium">
                            <span>Remaining:</span>
                            <span className="text-primary">{b.remaining} days</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {filtered.length > shown.length && (
              <div className="mt-4 flex justify-center">
                <Button variant="outline" size="sm" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                  Show more ({filtered.length - shown.length} remaining)
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default EmployeeLeaveBalancesCard;
