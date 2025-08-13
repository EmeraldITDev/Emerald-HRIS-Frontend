import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, UserX, DollarSign } from "lucide-react"

const stats = [
  {
    title: "Total Employees",
    value: "247",
    change: "+12 this month",
    icon: Users,
    changeType: "positive" as const,
  },
  {
    title: "Contract Employees",
    value: "68",
    change: "27.5% of workforce",
    icon: UserCheck,
    changeType: "neutral" as const,
  },
  {
    title: "FTE (Full-Time Equivalents)",
    value: "179",
    change: "72.5% of workforce",
    icon: Users,
    changeType: "positive" as const,
  },
  {
    title: "Monthly Payroll",
    value: "₦47.2M",
    change: "+8.2% from last month",
    icon: NairaIcon,
    changeType: "positive" as const,
  },
  {
    title: "Onboarded Employees",
    value: "15",
    change: "This quarter",
    icon: UserCheck,
    changeType: "positive" as const,
  },
]

export function DashboardStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {stats.map((stat) => (
        <Card key={stat.title} className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            <p className={`text-xs ${
              stat.changeType === 'positive' ? 'text-success' : 
              'text-muted-foreground'
            }`}>
              {stat.change}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}