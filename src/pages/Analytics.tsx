import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CalendarDays, Users, TrendingUp, Briefcase, Award, Clock } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts"

// Sample data for analytics
const vacationData = [
  { employee: "Adebayo Johnson", assigned: 25, taken: 12, remaining: 13 },
  { employee: "Fatima Abdul", assigned: 30, taken: 20, remaining: 10 },
  { employee: "Chinedu Okafor", assigned: 20, taken: 8, remaining: 12 },
  { employee: "Kemi Adeleke", assigned: 25, taken: 15, remaining: 10 }
]

const hiringData = [
  { month: "Jan", hires: 2 },
  { month: "Feb", hires: 1 },
  { month: "Mar", hires: 3 },
  { month: "Apr", hires: 0 },
  { month: "May", hires: 2 },
  { month: "Jun", hires: 1 }
]

const attendanceData = [
  { month: "Jan", present: 95, absent: 5 },
  { month: "Feb", present: 92, absent: 8 },
  { month: "Mar", present: 98, absent: 2 },
  { month: "Apr", present: 90, absent: 10 },
  { month: "May", present: 96, absent: 4 },
  { month: "Jun", present: 94, absent: 6 }
]

const employmentTypeData = [
  { name: "Full-Time Employees", value: 3, color: "#10b981" },
  { name: "Consultants", value: 1, color: "#f59e0b" }
]

const salaryData = [
  { month: "Jan", totalSalary: 6500000 },
  { month: "Feb", totalSalary: 6500000 },
  { month: "Mar", totalSalary: 6500000 },
  { month: "Apr", totalSalary: 6500000 },
  { month: "May", totalSalary: 6500000 },
  { month: "Jun", totalSalary: 6650000 }
]

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444']

export default function Analytics() {
  const totalEmployees = 4
  const totalVacationAssigned = vacationData.reduce((sum, emp) => sum + emp.assigned, 0)
  const totalVacationTaken = vacationData.reduce((sum, emp) => sum + emp.taken, 0)
  const vacationUtilization = (totalVacationTaken / totalVacationAssigned) * 100

  const totalHires = hiringData.reduce((sum, month) => sum + month.hires, 0)
  const avgAttendance = attendanceData.reduce((sum, month) => sum + month.present, 0) / attendanceData.length
  const totalSalaryExpense = salaryData[salaryData.length - 1].totalSalary

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">People Analytics</h1>
        <p className="text-muted-foreground">View comprehensive HR reports and insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">Active workforce</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Hires (6M)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalHires}</div>
            <p className="text-xs text-muted-foreground">+50% from last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{avgAttendance.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Monthly average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vacation Used</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{vacationUtilization.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Of allocated days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Salary Expense</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">₦{(totalSalaryExpense / 1000000).toFixed(1)}M</div>
            <p className="text-xs text-muted-foreground">Monthly payroll</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vacation Tracking */}
        <Card>
          <CardHeader>
            <CardTitle>Vacation Days Tracker</CardTitle>
            <CardDescription>Vacation days assigned vs taken by employee</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vacationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="employee" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="assigned" fill="#e5e7eb" name="Assigned" />
                <Bar dataKey="taken" fill="#10b981" name="Taken" />
                <Bar dataKey="remaining" fill="#f59e0b" name="Remaining" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Employment Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Employment Type Distribution</CardTitle>
            <CardDescription>FTE vs Consultant breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={employmentTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {employmentTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center space-x-4">
                {employmentTypeData.map((entry, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm">{entry.name}: {entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hiring Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Hiring Trends</CardTitle>
            <CardDescription>New hires by month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hiringData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="hires" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Attendance Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance & Leave Trends</CardTitle>
            <CardDescription>Monthly attendance vs absence rates</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="present" fill="#10b981" name="Present %" />
                <Bar dataKey="absent" fill="#ef4444" name="Absent %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Salary Expense Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Salary Expense Trends</CardTitle>
            <CardDescription>Monthly salary expenses in millions</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salaryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `₦${(value / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(value) => [`₦${(Number(value) / 1000000).toFixed(2)}M`, 'Salary Expense']} />
                <Bar dataKey="totalSalary" fill="#6366f1" name="Total Salary" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Vacation Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Vacation Details</CardTitle>
          <CardDescription>Individual vacation day allocation and usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vacationData.map((employee, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{employee.employee}</h4>
                    <Badge variant="outline">
                      {employee.taken}/{employee.assigned} days used
                    </Badge>
                  </div>
                  <Progress 
                    value={(employee.taken / employee.assigned) * 100} 
                    className="h-2"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {employee.remaining} days remaining
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}