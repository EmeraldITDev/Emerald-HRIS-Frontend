import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Award } from "lucide-react"
import apiService from "@/lib/api"

interface Anniversary {
  employeeId: string
  name: string
  avatarUrl: string | null
  startDate: string
  yearsOfService: number
  anniversaryDate: string
  daysUntil: number
}

export function UpcomingAnniversariesCard({ days = 7 }: { days?: number }) {
  const [items, setItems] = useState<Anniversary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    apiService
      .getUpcomingAnniversaries(days)
      .then((data) => {
        if (!cancelled) setItems(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!cancelled) setItems([])
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [days])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Award className="h-4 w-4 text-primary" />
          Upcoming Work Anniversaries
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No anniversaries in the next {days} days.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((a) => (
              <li key={`${a.employeeId}-${a.anniversaryDate}`} className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  {a.avatarUrl ? <AvatarImage src={a.avatarUrl} alt={a.name} /> : null}
                  <AvatarFallback>{a.name?.[0] ?? "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.yearsOfService} year{a.yearsOfService === 1 ? "" : "s"} of service
                  </p>
                </div>
                <Badge variant={a.daysUntil === 0 ? "default" : "secondary"}>
                  {a.daysUntil === 0 ? "Today" : `in ${a.daysUntil} day${a.daysUntil === 1 ? "" : "s"}`}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export default UpcomingAnniversariesCard