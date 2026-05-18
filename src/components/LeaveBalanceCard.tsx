import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CalendarCheck } from "lucide-react"
import apiService from "@/lib/api"

interface Balance {
  used: number
  limit: number
  remaining: number
  year: number
}

export function LeaveBalanceCard({ employeeId }: { employeeId?: number | string }) {
  const [balance, setBalance] = useState<Balance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!employeeId) {
      setLoading(false)
      return
    }
    let cancelled = false
    apiService
      .getLeaveBalance(employeeId)
      .then((data) => !cancelled && setBalance(data))
      .catch((e) => !cancelled && setError(e?.message || "Unable to load balance"))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [employeeId])

  if (!employeeId) return null

  const pct = balance ? Math.min(100, (balance.used / Math.max(balance.limit, 1)) * 100) : 0
  const lowRemaining = balance && balance.remaining < 5

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-primary" />
          Annual Leave Balance {balance ? `(${balance.year})` : ""}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : error || !balance ? (
          <p className="text-xs text-muted-foreground">Balance unavailable</p>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{balance.used} / {balance.limit} days used</span>
              <span className={lowRemaining ? "text-destructive font-medium" : "text-muted-foreground"}>
                {balance.remaining} remaining
              </span>
            </div>
            <Progress value={pct} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default LeaveBalanceCard