import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck } from "lucide-react"
import apiService, { Employee } from "@/lib/api"

export function DashboardStats() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await apiService.getEmployees()
        setEmployees(data)
      } catch (error) {
        console.error('Failed to fetch employees:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchEmployees()
  }, [])

  const totalEmployees = employees.length
  const contractEmployees = employees.filter(emp => emp.employment_type === 'Contract').length
  const fteEmployees = employees.filter(emp => emp.employment_type === 'Full-time').length
  // Total Salary Budget - Sum of all employees' gross salaries
  const totalSalaryBudget = employees.reduce((sum, emp) => sum + (emp.gross_salary || 0), 0)
  
  const onboardToday = employees.filter(emp => {
    if (!emp.hire_date) return false
    const hireDate = new Date(emp.hire_date)
    const today = new Date()
    return hireDate.toDateString() === today.toDateString()
  }).length

  const contractPercentage = totalEmployees > 0 ? ((contractEmployees / totalEmployees) * 100).toFixed(1) : '0'
  const ftePercentage = totalEmployees > 0 ? ((fteEmployees / totalEmployees) * 100).toFixed(1) : '0'

  const stats = [
    {
      title: "Total Employees",
      value: isLoading ? "..." : totalEmployees.toString(),
      change: `${fteEmployees} FTE + ${contractEmployees} Contract`,
      icon: Users,
      changeType: "positive" as const,
    },
    {
      title: "Contract Employees",
      value: isLoading ? "..." : contractEmployees.toString(),
      change: `${contractPercentage}% of workforce`,
      icon: UserCheck,
      changeType: "neutral" as const,
    },
    {
      title: "FTE (Full-Time Employees)",
      value: isLoading ? "..." : fteEmployees.toString(),
      change: `${ftePercentage}% of workforce`,
      icon: Users,
      changeType: "positive" as const,
    },
    {
      title: "Total Salary Budget",
      value: isLoading ? "..." : `₦${(totalSalaryBudget / 1000000).toFixed(1)}M`,
      change: "Sum of all gross salaries",
      icon: null,
      changeType: "positive" as const,
    },
    {
      title: "Onboard Employees",
      value: isLoading ? "..." : onboardToday.toString(),
      change: "Today",
      icon: UserCheck,
      changeType: "positive" as const,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {stats.map((stat) => (
        <Card key={stat.title} className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            {stat.icon && <stat.icon className="h-4 w-4 text-primary" />}
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