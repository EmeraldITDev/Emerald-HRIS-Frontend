import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, ChevronDown, Clock, LogIn, LogOut } from "lucide-react";
import { format } from "date-fns";
import apiService from "@/lib/api";
import { AttendanceStatusBadge, dateOnly, extractRows, formatTimeOnly } from "@/lib/attendanceUi";

interface Props {
  employeeId: number | null;
  /** bump to force a refetch (e.g. after clocking in) */
  refreshKey?: number | string;
}

const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export function WeeklyAttendanceCard({ employeeId, refreshKey }: Props) {
  const [open, setOpen] = useState(true);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { monday, days } = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay();
    const mon = new Date(today);
    mon.setDate(today.getDate() - ((currentDay === 0 ? 7 : currentDay) - 1));
    const list = WEEK_DAYS.map((name, i) => {
      const d = new Date(mon);
      d.setDate(mon.getDate() + i);
      return { name, date: d, key: format(d, "yyyy-MM-dd") };
    });
    return { monday: mon, days: list };
  }, []);

  useEffect(() => {
    if (!employeeId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await apiService.getAttendanceRange({
          start_date: format(monday, "yyyy-MM-dd"),
          end_date: days[days.length - 1].key,
          employee_id: employeeId,
        });
        if (!cancelled) setRecords(extractRows(res));
      } catch (e) {
        console.error("Failed to load weekly attendance:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [employeeId, monday, days, refreshKey]);

  const byDate = useMemo(() => {
    const map: Record<string, any> = {};
    records
      .filter((r) => !employeeId || Number(r.employee_id) === Number(employeeId))
      .forEach((r) => {
        map[dateOnly(r.date)] = r;
      });
    return map;
  }, [records, employeeId]);

  const todayKey = format(new Date(), "yyyy-MM-dd");

  return (
    <Card className="border-border/50 shadow-sm mb-6">
      <CardHeader className="cursor-pointer" onClick={() => setOpen(!open)}>
        <CardTitle className="text-primary flex items-center justify-between">
          <div className="flex items-center">
            <CalendarDays className="mr-2 h-5 w-5" />
            My Weekly Attendance (Mon - Fri)
          </div>
          <ChevronDown className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`} />
        </CardTitle>
      </CardHeader>
      {open && (
        <CardContent>
          {loading && records.length === 0 ? (
            <p className="text-sm text-muted-foreground">Loading your week…</p>
          ) : (
            <div className="space-y-3">
              {days.map(({ name, date, key }) => {
                const rec = byDate[key];
                const isToday = key === todayKey;
                const isPast = key < todayKey;
                const isFuture = key > todayKey;
                return (
                  <div
                    key={name}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      isToday ? "bg-primary/5 border-primary/30" : "bg-card"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          rec?.clock_in && rec?.clock_out
                            ? "bg-success/20 border-2 border-success"
                            : rec?.clock_in
                            ? "bg-warning/20 border-2 border-warning"
                            : "bg-muted/20 border-2 border-muted"
                        }`}
                      >
                        {rec?.clock_in ? (
                          <Clock className="w-5 h-5 text-warning" />
                        ) : (
                          <span className="text-xs font-medium text-muted-foreground">
                            {date.getDate()}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-sm flex items-center gap-2">
                          {name}
                          {isToday && <Badge variant="default" className="text-xs">Today</Badge>}
                          {rec?.work_mode && (
                            <Badge variant="outline" className="text-xs">
                              {rec.work_mode}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(date, "MMM dd, yyyy")}
                        </div>
                        {rec ? (
                          <div className="mt-1 space-y-0.5">
                            {rec.clock_in && (
                              <div className="text-xs flex items-center gap-1">
                                <LogIn className="w-3 h-3 text-success" />
                                <span className="font-medium">In:</span> {formatTimeOnly(rec.clock_in)}
                              </div>
                            )}
                            {rec.clock_out && (
                              <div className="text-xs flex items-center gap-1">
                                <LogOut className="w-3 h-3 text-destructive" />
                                <span className="font-medium">Out:</span>{" "}
                                {formatTimeOnly(rec.clock_out)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground mt-1">
                            {isFuture ? "Upcoming" : "No record"}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      {rec?.attendance_status ? (
                        <AttendanceStatusBadge status={rec.attendance_status} compact />
                      ) : !rec && isPast ? (
                        <Badge variant="outline" className="text-muted-foreground">
                          Absent
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default WeeklyAttendanceCard;