import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  ChevronRight,
  Info,
  Loader2,
  MapPin,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Wallet,
} from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { canViewExecutiveView } from "@/lib/permissions";
import { useExecutiveOverview } from "@/hooks/useExecutiveOverview";
import { DrillDownSheet, DrillRequest } from "@/components/executive/DrillDownSheet";
import { MetricTile } from "@/components/executive/MetricTile";
import { formatNaira } from "@/lib/currency";
import type { AlertSeverity, BreakdownRow } from "@/lib/executiveMetrics";

const CHART_COLORS = ["#10b981", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ef4444", "#14b8a6"];

const severityStyles: Record<AlertSeverity, { badge: string; icon: typeof AlertTriangle }> = {
  critical: { badge: "bg-destructive/10 text-destructive border-destructive/30", icon: ShieldAlert },
  warning: { badge: "bg-amber-500/10 text-amber-600 border-amber-500/30", icon: AlertTriangle },
  info: { badge: "bg-sky-500/10 text-sky-600 border-sky-500/30", icon: Info },
};

function BreakdownTable({
  rows,
  label,
  onDrill,
}: {
  rows: BreakdownRow[];
  label: string;
  onDrill: (key: string) => void;
}) {
  const max = Math.max(1, ...rows.map((r) => r.headcount));
  return (
    <div className="space-y-1">
      <div className="grid grid-cols-12 px-3 pb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
        <span className="col-span-5">{label}</span>
        <span className="col-span-2 text-right">Staff</span>
        <span className="col-span-2 text-right">On leave</span>
        <span className="col-span-3 text-right">Attendance today</span>
      </div>
      {rows.map((r) => (
        <button
          key={r.key}
          onClick={() => onDrill(r.key)}
          className="grid w-full grid-cols-12 items-center rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted/60"
        >
          <span className="col-span-5 min-w-0">
            <span className="block truncate text-sm font-medium">{r.key}</span>
            <span className="mt-1 block h-1 rounded-full bg-primary/20">
              <span
                className="block h-1 rounded-full bg-primary"
                style={{ width: `${(r.headcount / max) * 100}%` }}
              />
            </span>
          </span>
          <span className="col-span-2 text-right text-sm tabular-nums">{r.headcount}</span>
          <span className="col-span-2 text-right text-sm tabular-nums text-muted-foreground">
            {r.onLeave}
          </span>
          <span className="col-span-3 text-right text-sm tabular-nums">
            {r.attendanceRate === null ? (
              <span className="text-muted-foreground">—</span>
            ) : (
              <span
                className={
                  r.attendanceRate < 70
                    ? "text-destructive"
                    : r.attendanceRate < 85
                      ? "text-amber-600"
                      : "text-emerald-600"
                }
              >
                {r.attendanceRate.toFixed(0)}%
              </span>
            )}
          </span>
        </button>
      ))}
      {rows.length === 0 && (
        <p className="px-3 py-6 text-sm text-muted-foreground">No data available.</p>
      )}
    </div>
  );
}

export default function ExecutiveView() {
  const { user } = useAuth();
  const { data, isLoading, isFetching, refetch } = useExecutiveOverview();
  const [drill, setDrill] = useState<DrillRequest | null>(null);

  const employmentChart = useMemo(
    () =>
      (data?.employmentTypes || []).map((t, i) => ({
        ...t,
        color: CHART_COLORS[i % CHART_COLORS.length],
      })),
    [data?.employmentTypes],
  );

  if (!canViewExecutiveView(user)) {
    return <Navigate to="/" replace />;
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  const o = data.overview;
  const attendanceSplit = [
    { name: "Present", value: o.present },
    { name: "Absent", value: o.absent },
    { name: "On leave", value: o.onLeave },
  ];

  return (
    <div className="space-y-6">
      {/* Command header */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Executive command centre
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Chairman's View</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Organisation-wide state of play for {format(new Date(data.date), "EEEE, d MMMM yyyy")} —
              workforce, attendance, leave and payroll in one place.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Attendance today
              </p>
              <p className="text-3xl font-semibold tabular-nums">
                {o.attendanceRate === null ? "—" : `${o.attendanceRate.toFixed(1)}%`}
              </p>
            </div>
            <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 1. Executive overview */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <MetricTile
          label="Total employees"
          value={o.total}
          sub="On record"
          onClick={() => setDrill({ kind: "employees", title: "All employees" })}
        />
        <MetricTile
          label="Active employees"
          value={o.active}
          sub={`${o.total - o.active} inactive`}
          onClick={() => setDrill({ kind: "employees", title: "Active employees" })}
        />
        <MetricTile
          label="New this month"
          value={o.newThisMonth}
          delta={data.headcountTrend.delta}
          deltaLabel="vs last month"
          onClick={() =>
            setDrill({ kind: "employees", filter: { newThisMonth: true }, title: "New hires this month" })
          }
        />
        <MetricTile
          label="Exited"
          value={o.exited}
          sub={`${o.exitedThisMonth} this month`}
          accent={o.exitedThisMonth >= 3 ? "warning" : "default"}
          onClick={() =>
            setDrill({ kind: "employees", filter: { exited: true }, title: "Employees who exited" })
          }
        />
        <MetricTile
          label="On leave"
          value={o.onLeave}
          sub="Approved leave today"
          onClick={() => setDrill({ kind: "leave", title: "Currently on leave" })}
        />
        <MetricTile
          label="Present today"
          value={o.present}
          sub="Clocked in"
          accent="positive"
          onClick={() =>
            setDrill({ kind: "attendance", filter: { presentOnly: true }, title: "Present today" })
          }
        />
        <MetricTile
          label="Absent today"
          value={o.absent}
          sub="No clock-in"
          accent={o.absent > 0 ? "warning" : "default"}
          onClick={() =>
            setDrill({ kind: "attendance", filter: { absentOnly: true }, title: "Absent today" })
          }
        />
        <MetricTile
          label="Late clock-ins"
          value={o.late}
          sub="Today"
          onClick={() =>
            setDrill({ kind: "attendance", filter: { lateOnly: true }, title: "Late clock-ins today" })
          }
        />
        <MetricTile label="Departments" value={o.departments} sub="Active units" />
        <MetricTile label="Locations" value={o.locations} sub="Sites in use" />
      </section>

      {/* 3. Executive alerts */}
      <Card className="border-amber-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Requires attention
          </CardTitle>
          <CardDescription>
            Prioritised exceptions across HR, attendance, leave and payroll. Select an item to
            investigate.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.alerts.length === 0 && (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Nothing requires executive attention right now.
            </p>
          )}
          {data.alerts.map((a) => {
            const s = severityStyles[a.severity];
            const Icon = s.icon;
            return (
              <button
                key={a.id}
                onClick={() => setDrill(a.drill as DrillRequest)}
                className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/60"
              >
                <span className={`rounded-md border p-2 ${s.badge}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{a.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{a.detail}</span>
                </span>
                {a.metric && <Badge variant="outline">{a.metric}</Badge>}
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* 2. Workforce breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Workforce distribution</CardTitle>
            <CardDescription>Compare departments and locations at a glance.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="department">
              <TabsList>
                <TabsTrigger value="department">
                  <Building2 className="mr-2 h-4 w-4" /> By department
                </TabsTrigger>
                <TabsTrigger value="location">
                  <MapPin className="mr-2 h-4 w-4" /> By location
                </TabsTrigger>
              </TabsList>
              <TabsContent value="department" className="mt-4">
                <BreakdownTable
                  rows={data.departments}
                  label="Department"
                  onDrill={(key) =>
                    setDrill({ kind: "employees", filter: { department: key }, title: `${key} — employees` })
                  }
                />
              </TabsContent>
              <TabsContent value="location" className="mt-4">
                <BreakdownTable
                  rows={data.locations}
                  label="Location"
                  onDrill={(key) =>
                    setDrill({ kind: "employees", filter: { location: key }, title: `${key} — employees` })
                  }
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Employment type</CardTitle>
            <CardDescription>Composition of the workforce.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={employmentChart}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {employmentChart.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1">
              {employmentChart.map((t) => (
                <button
                  key={t.name}
                  onClick={() =>
                    setDrill({
                      kind: "employees",
                      filter: { employmentType: t.name },
                      title: `${t.name} employees`,
                    })
                  }
                  className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted/60"
                >
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.color }} />
                    {t.name}
                  </span>
                  <span className="tabular-nums text-muted-foreground">{t.value}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Attendance overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Attendance trend</CardTitle>
            <CardDescription>Monthly attendance rate across the organisation.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.attendanceTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={data.attendanceTrend}>
                  <defs>
                    <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis domain={[0, 100]} fontSize={12} tickFormatter={(v) => `${v}%`} />
                  <Tooltip formatter={(v) => [`${Number(v).toFixed(1)}%`, "Attendance"]} />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#attGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">
                No historical attendance data available yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Today at a glance</CardTitle>
            <CardDescription>Workforce activity right now.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {attendanceSplit.map((s) => {
              const total = Math.max(1, o.present + o.absent + o.onLeave);
              return (
                <div key={s.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{s.name}</span>
                    <span className="tabular-nums font-medium">{s.value}</span>
                  </div>
                  <Progress value={(s.value / total) * 100} className="h-2" />
                </div>
              );
            })}
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to="/attendance/org-dashboard">Open org attendance</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 5 & 6. Leave + payroll */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDays className="h-5 w-5" /> Leave overview
            </CardTitle>
            <CardDescription>Coverage risk across the organisation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricTile
                label="On leave"
                value={data.leave.currentlyOnLeave.length}
                sub="Today"
                onClick={() => setDrill({ kind: "leave", title: "Currently on leave" })}
              />
              <MetricTile
                label="Pending"
                value={data.leave.pending.length}
                sub="Awaiting approval"
                accent={data.leave.stalePending.length > 0 ? "warning" : "default"}
                onClick={() =>
                  setDrill({ kind: "leave", filter: { pending: true }, title: "Pending leave requests" })
                }
              />
              <MetricTile
                label="Approved"
                value={data.leave.approved.length}
                sub="All time"
                onClick={() => setDrill({ kind: "leave", title: "Approved leave" })}
              />
              <MetricTile
                label="Upcoming"
                value={data.leave.upcoming.length}
                sub="Next 14 days"
                onClick={() =>
                  setDrill({ kind: "leave", filter: { upcoming: true }, title: "Upcoming leave" })
                }
              />
            </div>
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                Departments most affected
              </p>
              {data.departments
                .filter((d) => d.onLeave > 0)
                .slice(0, 4)
                .map((d) => (
                  <button
                    key={d.key}
                    onClick={() =>
                      setDrill({
                        kind: "leave",
                        filter: { department: d.key },
                        title: `${d.key} — currently on leave`,
                      })
                    }
                    className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted/60"
                  >
                    <span>{d.key}</span>
                    <span className="text-muted-foreground">
                      {d.onLeave} of {d.headcount}
                    </span>
                  </button>
                ))}
              {data.departments.every((d) => d.onLeave === 0) && (
                <p className="text-sm text-muted-foreground">No one is on leave today.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wallet className="h-5 w-5" /> Payroll overview
            </CardTitle>
            <CardDescription>Period {data.payroll.period}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <button
              onClick={() =>
                setDrill({ kind: "payroll", title: `Payroll records — ${data.payroll.period}` })
              }
              className="w-full rounded-xl border bg-muted/30 p-4 text-left transition-colors hover:border-primary/60"
            >
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Total payroll cost
              </p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">
                {formatNaira(data.payroll.totalCost)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {data.payroll.trend.pct === null
                  ? "No comparable previous period"
                  : `${data.payroll.trend.pct > 0 ? "+" : ""}${data.payroll.trend.pct.toFixed(1)}% vs ${data.payroll.period}`}
                {" · "}
                {data.payroll.employeesIncluded} employees included
              </p>
            </button>
            <div className="grid grid-cols-2 gap-3">
              <MetricTile
                label="Unresolved"
                value={data.payroll.unresolved}
                sub="Draft / pending"
                accent={data.payroll.unresolved > 0 ? "warning" : "default"}
                onClick={() =>
                  setDrill({
                    kind: "payroll",
                    filter: { unresolved: true },
                    title: `Unresolved payroll — ${data.payroll.period}`,
                  })
                }
              />
              <MetricTile
                label="Missing salary"
                value={data.payroll.missingGross}
                sub="Active employees"
                accent={data.payroll.missingGross > 0 ? "critical" : "default"}
                onClick={() =>
                  setDrill({
                    kind: "employees",
                    filter: { missingGross: true },
                    title: "Employees missing annual gross",
                  })
                }
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(data.payroll.statusCounts).map(([status, count]) => (
                <Badge key={status} variant="outline" className="capitalize">
                  {status}: {count}
                </Badge>
              ))}
              {Object.keys(data.payroll.statusCounts).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No payroll has been generated for this period yet.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hiring trend + activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Hiring trend</CardTitle>
            <CardDescription>New hires by month.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.hiringTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.hiringTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="hires" fill="#0ea5e9" name="Hires" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">
                No hiring history available.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Recent organisational activity</CardTitle>
            <CardDescription>Meaningful changes across the HRIS.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="relative space-y-4 border-l pl-5">
              {data.activity.map((item) => (
                <li key={item.id} className="relative">
                  <span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.detail} · {format(item.date, "d MMM yyyy")}
                  </p>
                </li>
              ))}
              {data.activity.length === 0 && (
                <li className="text-sm text-muted-foreground">No recent activity recorded.</li>
              )}
            </ol>
          </CardContent>
        </Card>
      </div>

      <p className="pb-2 text-center text-xs text-muted-foreground">
        Snapshot generated {format(data.generatedAt, "d MMM yyyy, HH:mm")} · cached for 5 minutes
      </p>

      <DrillDownSheet request={drill} data={data} onOpenChange={(open) => !open && setDrill(null)} />
    </div>
  );
}
