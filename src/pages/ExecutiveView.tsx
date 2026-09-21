import { Navigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Cake,
  CalendarDays,
  Loader2,
  PartyPopper,
  RefreshCw,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { canViewExecutiveView } from "@/lib/permissions";
import { useChairmanDashboard } from "@/hooks/useChairmanDashboard";
import { MetricTile } from "@/components/executive/MetricTile";
import { formatNaira } from "@/lib/currency";

const chartTooltip = {
  contentStyle: {
    background: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "0.5rem",
    color: "hsl(var(--popover-foreground))",
    fontSize: "12px",
  },
};

function ChartFrame({
  title,
  description,
  empty,
  children,
}: {
  title: string;
  description: string;
  empty: boolean;
  children: React.ReactElement;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-[260px]">
        {empty ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No data for this period yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function CelebrationList({
  title,
  icon: Icon,
  items,
  emptyText,
  suffix,
}: {
  title: string;
  icon: typeof Cake;
  items: { id: number | string; name: string; date: string; department?: string | null; years?: number | null }[];
  emptyText: string;
  suffix?: (years?: number | null) => string | null;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 && <p className="py-4 text-sm text-muted-foreground">{emptyText}</p>}
        {items.slice(0, 8).map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{item.name}</p>
              {item.department && (
                <p className="truncate text-xs text-muted-foreground">{item.department}</p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-muted-foreground">{item.date}</p>
              {suffix?.(item.years) && (
                <Badge variant="secondary" className="mt-1">
                  {suffix(item.years)}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function ExecutiveView() {
  const { user } = useAuth();
  const { data, isLoading, isFetching, refetch, isError } = useChairmanDashboard();

  if (!canViewExecutiveView(user)) return <Navigate to="/dashboard" replace />;

  if (isLoading) {
    return (
      <div className="space-y-4 p-1">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-[260px] w-full" />
          <Skeleton className="h-[260px] w-full" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card className="mx-auto mt-10 max-w-lg">
        <CardHeader>
          <CardTitle>Executive summary unavailable</CardTitle>
          <CardDescription>
            The company overview could not be loaded right now. Please try again in a moment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const payrollDept = data.payrollByDepartment;

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Chairman's View</h1>
          <p className="text-sm text-muted-foreground">
            Company-wide trends as of {format(data.generatedAt, "d MMM yyyy, HH:mm")}
            {data.period ? ` · ${data.period}` : ""}
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching} className="gap-2">
          {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Total workforce"
          value={data.headcount.toLocaleString()}
          icon={Users}
          hint="Active employees"
        />
        <MetricTile
          label="New hires"
          value={data.newHires.toLocaleString()}
          icon={UserPlus}
          hint="This month"
        />
        <MetricTile
          label="Attendance rate"
          value={`${data.attendanceRate.toFixed(0)}%`}
          icon={TrendingUp}
          hint="Company average"
        />
        <MetricTile
          label="Monthly payroll"
          value={formatNaira(data.payrollTotal)}
          icon={Wallet}
          hint={data.period ? `Period ${data.period}` : "Current period"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartFrame
          title="Attendance trend"
          description="Company attendance rate over time"
          empty={data.attendanceTrend.length === 0}
        >
          <AreaChart data={data.attendanceTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip {...chartTooltip} />
            <Area
              type="monotone"
              dataKey="value"
              name="Attendance %"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary) / 0.18)"
            />
          </AreaChart>
        </ChartFrame>

        <ChartFrame
          title="Hiring trend"
          description="New employees joining each month"
          empty={data.hiringTrend.length === 0}
        >
          <BarChart data={data.hiringTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip {...chartTooltip} />
            <Bar dataKey="value" name="Hires" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartFrame>

        <ChartFrame
          title="Payroll trend"
          description="Total payroll cost per period"
          empty={data.payrollTrend.length === 0}
        >
          <LineChart data={data.payrollTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={(v) => `${Math.round(Number(v) / 1_000_000)}M`}
            />
            <Tooltip {...chartTooltip} formatter={(v: any) => formatNaira(Number(v))} />
            <Line type="monotone" dataKey="value" name="Payroll" stroke="hsl(var(--primary))" dot={false} />
          </LineChart>
        </ChartFrame>

        <ChartFrame
          title="Workforce trend"
          description="Headcount movement over time"
          empty={data.headcountTrend.length === 0}
        >
          <AreaChart data={data.headcountTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip {...chartTooltip} />
            <Area
              type="monotone"
              dataKey="value"
              name="Headcount"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary) / 0.18)"
            />
          </AreaChart>
        </ChartFrame>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-4 w-4 text-primary" />
            Monthly payroll overview
          </CardTitle>
          <CardDescription>
            {data.period ? `Period ${data.period} · ` : ""}
            {formatNaira(data.payrollTotal)} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payrollDept.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">
              No payroll breakdown available for this period.
            </p>
          ) : (
            <div className="space-y-1">
              <div className="grid grid-cols-12 px-3 pb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                <span className="col-span-6">Department</span>
                <span className="col-span-2 text-right">Staff</span>
                <span className="col-span-4 text-right">Payroll</span>
              </div>
              {payrollDept.map((row) => (
                <div
                  key={row.label}
                  className="grid grid-cols-12 items-center rounded-lg px-3 py-2 hover:bg-muted/60"
                >
                  <span className="col-span-6 truncate text-sm font-medium">{row.label}</span>
                  <span className="col-span-2 text-right text-sm tabular-nums text-muted-foreground">
                    {row.headcount || "—"}
                  </span>
                  <span className="col-span-4 text-right text-sm tabular-nums">
                    {formatNaira(row.value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <CelebrationList
          title="Birthdays"
          icon={Cake}
          items={data.birthdays}
          emptyText="No birthdays coming up."
        />
        <CelebrationList
          title="Work anniversaries"
          icon={PartyPopper}
          items={data.anniversaries}
          emptyText="No work anniversaries coming up."
          suffix={(years) => (years ? `${years} yr${Number(years) === 1 ? "" : "s"}` : null)}
        />
      </div>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <CalendarDays className="h-3.5 w-3.5" />
        Figures come straight from the company-wide executive summary.
      </p>
    </div>
  );
}
