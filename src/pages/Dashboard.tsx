import { useState, useEffect, useRef } from "react"
import { DashboardStats } from "@/components/DashboardStats"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Download, 
  Upload, 
  FileText,
  Users,
  Building2,
  Calendar,
  BarChart3,
  DollarSign,
  Users as UsersIcon,
  Building,
  TrendingUp,
  User,
  UserCheck,
  UserPlus,
  Shield,
  Settings,
  Timer,
  ArrowRight,
  ArrowLeft
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import apiService, { Employee } from "@/lib/api"
import { 
  parseCSVFileForAPI, 
  generateCSVTemplate, 
  type EmployeeData 
} from "@/utils/csvImport"
import { 
  exportEmployeeDirectory, 
  exportPayrollData, 
  exportComplianceData, 
  exportDepartmentAnalytics,
  downloadCSV 
} from '@/utils/csvExport'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import ApiTest from "@/components/ApiTest"
import { useAuth } from "@/contexts/AuthContext"
import RoleBasedComponent from "@/components/RoleBasedComponent"

export default function Dashboard() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user, hasPermission } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [allEmployees, setAllEmployees] = useState<Employee[]>([])
  const [recentEmployees, setRecentEmployees] = useState<Employee[]>([])
  const [departmentStats, setDepartmentStats] = useState<{ [key: string]: number }>({})
  const [isLoading, setIsLoading] = useState(true)

  const getRoleSpecificTitle = () => {
    switch (user?.role) {
      case 'executive':
        return 'Executive Dashboard'
      case 'hr_manager':
        return 'HR Manager Dashboard'
      case 'corporate_hr':
        return 'Corporate HR Dashboard'
      case 'line_manager':
        return 'Line Manager Dashboard'
      case 'it_power_user':
        return 'IT Power User Dashboard'
      case 'it_admin':
        return 'Employee Self-Service'
      case 'general_employee':
        return 'Employee Self-Service'
      default:
        return 'HRIS Dashboard'
    }
  }

  const getRoleSpecificActions = () => {
    const actions = []
    
    if (hasPermission('employees.create')) {
      actions.push({
        label: 'Add Employee',
        icon: UserPlus,
        onClick: handleAddEmployee,
        variant: 'default' as const
      })
    }
    
    if (hasPermission('csv.import')) {
      actions.push({
        label: 'Import CSV',
        icon: Upload,
        onClick: () => fileInputRef.current?.click(),
        variant: 'outline' as const
      })
    }
    
    if (hasPermission('reports.view')) {
      actions.push({
        label: 'View Reports',
        icon: BarChart3,
        onClick: () => navigate('/reports'),
        variant: 'outline' as const
      })
    }
    
    if (user?.role === 'it_power_user') {
      actions.push({
        label: 'System Settings',
        icon: Settings,
        onClick: () => navigate('/settings'),
        variant: 'outline' as const
      })
    }
    
    return actions
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const employees = await apiService.getEmployees()
        
        // Store all employees for stats calculations
        setAllEmployees(employees)
        
        // Get recent employees (last 5 hired) for the recent activities section
        const sortedEmployees = employees
          .filter(emp => emp.hire_date)
          .sort((a, b) => new Date(b.hire_date!).getTime() - new Date(a.hire_date!).getTime())
          .slice(0, 5)
        
        setRecentEmployees(sortedEmployees)

        // Calculate department stats
        const deptStats: { [key: string]: number } = {}
        employees.forEach(emp => {
          if (emp.department) {
            deptStats[emp.department] = (deptStats[emp.department] || 0) + 1
          }
        })
        setDepartmentStats(deptStats)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const handleAddEmployee = () => {
    // Navigate to employees page and open the add employee dialog
    navigate('/employees', { state: { openAddDialog: true } })
  }

  // CSV Import functionality
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a CSV file",
        variant: "destructive"
      })
      return
    }

    try {
      // Get existing employees for duplicate checking
      const existingEmployees = await apiService.getEmployees()
      const existingEmployeeData: EmployeeData[] = existingEmployees.map(emp => ({
        id: emp.id?.toString() || '',
        firstName: emp.first_name,
        lastName: emp.last_name,
        email: emp.email,
        department: emp.department || '',
        position: emp.job_title || '',
        salary: emp.gross_salary?.toString() || '₦0',
        status: emp.employment_status || 'Active',
        joinDate: emp.hire_date || new Date().toISOString().split('T')[0],
        phone: emp.phone_number || '',
        vacationDays: emp.vacation_days || 25,
        employmentType: emp.employment_type || 'Full-time'
      }))
      
      const result = await parseCSVFileForAPI(file, existingEmployeeData)
      
      if (result.success && result.data.length > 0) {
        // Create employees in the database via API
        let successCount = 0
        let errorCount = 0
        
        for (const employeeData of result.data) {
          try {
            // Convert EmployeeData to Employee format
            const employeeForAPI: Employee = {
              first_name: employeeData.firstName,
              last_name: employeeData.lastName,
              email: employeeData.email,
              job_title: employeeData.position,
              department: employeeData.department,
              employment_type: employeeData.employmentType,
              employment_status: employeeData.status,
              hire_date: employeeData.joinDate,
              phone_number: employeeData.phone,
              vacation_days: employeeData.vacationDays,
              gross_salary: parseFloat(employeeData.salary.replace(/[₦,]/g, '')) || 0
            }
            await apiService.createEmployee(employeeForAPI)
            successCount++
          } catch (error) {
            console.error('Failed to create employee:', error)
            errorCount++
          }
        }
        
        if (successCount > 0) {
          toast({
            title: "Import Successful",
            description: `Successfully imported ${successCount} employees${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
          })
          // Refresh dashboard data
          window.location.reload()
        } else {
          toast({
            title: "Import Failed",
            description: "Failed to import any employees. Please check your CSV format.",
            variant: "destructive"
          })
        }
      } else if (result.errors.length > 0) {
        toast({
          title: "Import Failed",
          description: result.errors.join(', '),
          variant: "destructive"
        })
      } else {
        toast({
          title: "No Data Found",
          description: "No valid employee data found in the CSV file",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('CSV import error:', error)
      toast({
        title: "Import Error",
        description: "An error occurred while importing the CSV file",
        variant: "destructive"
      })
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDownloadTemplate = () => {
    generateCSVTemplate()
    toast({
      title: "Template Downloaded",
      description: "CSV template has been downloaded. Fill it with your employee data and import.",
    })
  }

  // CSV Export functionality
  const handleExportDirectory = async () => {
    try {
      const employees = await apiService.getEmployees()
      const csvData = exportEmployeeDirectory(employees)
      downloadCSV(csvData, `employee_directory_${new Date().toISOString().split('T')[0]}.csv`)
      toast({
        title: "Export Successful",
        description: "Employee directory has been exported",
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export employee directory",
        variant: "destructive"
      })
    }
  }

  const handleExportPayroll = async () => {
    try {
      const employees = await apiService.getEmployees()
      const csvData = exportPayrollData(employees)
      downloadCSV(csvData, `payroll_data_${new Date().toISOString().split('T')[0]}.csv`)
      toast({
        title: "Export Successful",
        description: "Payroll data has been exported",
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export payroll data",
        variant: "destructive"
      })
    }
  }

  const handleExportCompliance = async () => {
    try {
      const employees = await apiService.getEmployees()
      const csvData = exportComplianceData(employees)
      downloadCSV(csvData, `compliance_data_${new Date().toISOString().split('T')[0]}.csv`)
      toast({
        title: "Export Successful",
        description: "Compliance data has been exported",
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export compliance data",
        variant: "destructive"
      })
    }
  }

  const handleExportAnalytics = async () => {
    try {
      const employees = await apiService.getEmployees()
      const csvData = exportDepartmentAnalytics(employees)
      downloadCSV(csvData, `department_analytics_${new Date().toISOString().split('T')[0]}.csv`)
      toast({
        title: "Export Successful",
        description: "Department analytics has been exported",
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export department analytics",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-success/10 text-success border-success/20 text-xs">Active</Badge>
      case "On Leave":
        return <Badge className="bg-warning/10 text-warning border-warning/20 text-xs">On Leave</Badge>
      case "Terminated":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-xs">Terminated</Badge>
      case "Resigned":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-xs">Resigned</Badge>
      default:
        return <Badge className="bg-muted/10 text-muted-foreground border-muted/20 text-xs">{status}</Badge>
    }
  }

  // Add this test function
  const handleTestCreateEmployee = async () => {
    try {
      const testEmployee = {
        first_name: "Test",
        last_name: "Employee",
        email: `test.employee.${Date.now()}@example.com`, // Unique email
        dob: "1990-01-01",
        job_title: "Software Developer",
        gross_salary: 500000,
        department: "Engineering",
        employment_type: "Full-time",
        employment_status: "Active",
        hire_date: new Date().toISOString().split('T')[0],
        phone_number: "+234 801 234 5678",
        address: "123 Test Street, Lagos",
        gender: "Male",
        marital_status: "Single",
        nationality: "Nigerian",
        grade_level: "Level 5",
        supervisor_name: "John Manager",
        work_location: "Lagos Office",
        probation_period: "3 months",
        vacation_days: 25,
        meal_allowance: 50000,
        housing_allowance: 100000,
        transport_allowance: 30000,
        bank_account: "1234567890",
        employee_code: `EMP${Date.now()}`,
        national_id: "12345678901",
        bvn: "12345678901",
        tin: "12345678901",
        pension_pin: "12345678901",
        nhf_number: "12345678901",
        tax_id: "12345678901"
      };

      await apiService.createEmployee(testEmployee);
      
      toast({
        title: "Test Employee Created!",
        description: "Test employee has been successfully added to the database.",
      });

      // Refresh the dashboard data
      window.location.reload();
    } catch (error) {
      console.error('Failed to create test employee:', error);
      toast({
        title: "Test Failed",
        description: "Failed to create test employee. Check console for details.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{getRoleSpecificTitle()}</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {user?.role === 'general_employee' 
              ? `Welcome ${user.firstName}! Access your payroll, benefits, and leave requests here.`
              : user?.role === 'line_manager'
              ? 'Manage your team, view reports, and handle approvals'
              : 'Welcome to Emerald HRIS - Your complete HR management solution'
            }
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <RoleBasedComponent allowedRoles={['executive', 'hr_manager', 'corporate_hr', 'line_manager']}>
            {/* Export Reports Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs md:text-sm">
                  <Download className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                  Export Reports
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleExportDirectory}>
                  <Users className="mr-2 h-4 w-4" />
                  Employee Directory
                </DropdownMenuItem>
                <RoleBasedComponent allowedRoles={['executive', 'hr_manager']}>
                  <DropdownMenuItem onClick={handleExportPayroll}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Payroll Data
                  </DropdownMenuItem>
                </RoleBasedComponent>
                <DropdownMenuItem onClick={handleExportCompliance}>
                  <FileText className="mr-2 h-4 w-4" />
                  Compliance Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportAnalytics}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Department Analytics
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </RoleBasedComponent>
        </div>
      </div>

      {/* Hidden file input for CSV import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Hide aggregate stats for general_employee, corporate_hr, line_manager, it_admin */}
      {!['general_employee', 'corporate_hr', 'line_manager', 'it_admin'].includes(user?.role || '') && (
        <div className="grid gap-4 md:gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-8 bg-muted rounded animate-pulse"></div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{allEmployees.length}</div>
                  <p className="text-xs text-muted-foreground">
                    +{allEmployees.filter(emp => {
                      if (!emp.hire_date) return false
                      const hireDate = new Date(emp.hire_date)
                      const now = new Date()
                      return hireDate.getMonth() === now.getMonth() && hireDate.getFullYear() === now.getFullYear()
                    }).length} this month
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contract Employees</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-8 bg-muted rounded animate-pulse"></div>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {allEmployees.filter(emp => emp.employment_type === 'Contract').length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {allEmployees.length > 0 ? Math.round((allEmployees.filter(emp => emp.employment_type === 'Contract').length / allEmployees.length) * 100) : 0}% of workforce
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">FTE</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-8 bg-muted rounded animate-pulse"></div>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {allEmployees.filter(emp => emp.employment_type === 'Full-time').length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {allEmployees.length > 0 ? Math.round((allEmployees.filter(emp => emp.employment_type === 'Full-time').length / allEmployees.length) * 100) : 0}% of workforce
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {['it_power_user', 'executive'].includes(user?.role || '') ? 'Personal Payroll' : 'Monthly Payroll'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-8 bg-muted rounded animate-pulse"></div>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {['it_power_user', 'executive'].includes(user?.role || '') 
                      ? '₦450,000' 
                      : `₦${(allEmployees.reduce((sum, emp) => sum + (emp.gross_salary || 0), 0) / 1000000).toFixed(1)}M`
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {['it_power_user', 'executive'].includes(user?.role || '') ? 'Monthly salary' : `${allEmployees.length} employees`}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Onboard Employees</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-8 bg-muted rounded animate-pulse"></div>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {allEmployees.filter(emp => {
                      if (!emp.hire_date) return false
                      const hireDate = new Date(emp.hire_date)
                      const now = new Date()
                      return hireDate.getMonth() === now.getMonth() && hireDate.getFullYear() === now.getFullYear()
                    }).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This month
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-8 bg-muted rounded animate-pulse"></div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{allEmployees.filter(emp => emp.employment_status === 'Active').length}</div>
                  <p className="text-xs text-muted-foreground">
                    {allEmployees.length > 0 ? Math.round((allEmployees.filter(emp => emp.employment_status === 'Active').length / allEmployees.length) * 100) : 0}% of total
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Grid sections */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-primary">
              <FileText className="mr-2 h-5 w-5" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-16 animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {recentEmployees.length > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span>New employee onboarded</span>
                    <span className="text-muted-foreground">
                      {recentEmployees[0]?.hire_date ? 
                        format(new Date(recentEmployees[0].hire_date), 'MMM dd') : 
                        'Recently'
                      }
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span>Total employees: {allEmployees.length}</span>
                  <span className="text-muted-foreground">Current</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Active employees: {allEmployees.filter(emp => emp.employment_status === 'Active').length}</span>
                  <span className="text-muted-foreground">Today</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Departments: {Object.keys(departmentStats).length}</span>
                  <span className="text-muted-foreground">Active</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-primary">Pending Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-16 animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : ['general_employee', 'corporate_hr', 'line_manager', 'it_admin'].includes(user?.role || '') ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Performance Review Form</span>
                  <span className="bg-warning/10 text-warning px-2 py-1 rounded text-xs font-medium">
                    Due Soon
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Complete Training Module</span>
                  <span className="bg-info/10 text-info px-2 py-1 rounded text-xs font-medium">
                    Assigned
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Update Emergency Contact</span>
                  <span className="bg-success/10 text-success px-2 py-1 rounded text-xs font-medium">
                    Optional
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Submit Timesheet</span>
                  <span className="bg-warning/10 text-warning px-2 py-1 rounded text-xs font-medium">
                    Weekly
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Employees on leave</span>
                  <span className="bg-warning/10 text-warning px-2 py-1 rounded text-xs font-medium">
                    {allEmployees.filter(emp => emp.employment_status === 'On Leave').length} active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">New hires this month</span>
                  <span className="bg-success/10 text-success px-2 py-1 rounded text-xs font-medium">
                    {allEmployees.filter(emp => {
                      if (!emp.hire_date) return false
                      const hireDate = new Date(emp.hire_date)
                      const now = new Date()
                      return hireDate.getMonth() === now.getMonth() && hireDate.getFullYear() === now.getFullYear()
                    }).length} new
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Departments with staff</span>
                  <span className="bg-success/10 text-success px-2 py-1 rounded text-xs font-medium">
                    {Object.keys(departmentStats).length} active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total salary budget</span>
                  <span className="bg-info/10 text-info px-2 py-1 rounded text-xs font-medium">
                    ₦{(allEmployees.reduce((sum, emp) => sum + (emp.gross_salary || 0), 0) / 1000000).toFixed(1)}M
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {!['general_employee', 'corporate_hr', 'line_manager', 'it_admin'].includes(user?.role || '') && (
          <RoleBasedComponent allowedRoles={['executive', 'hr_manager']}>
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-primary">Nigerian Compliance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
                        <div className="h-4 bg-muted rounded w-16 animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Employees with NIN</span>
                      <span className="bg-success/10 text-success px-2 py-1 rounded text-xs font-medium">
                        {allEmployees.filter(emp => emp.national_id).length} of {allEmployees.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Employees with BVN</span>
                      <span className="bg-success/10 text-success px-2 py-1 rounded text-xs font-medium">
                        {allEmployees.filter(emp => emp.bvn).length} of {allEmployees.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Pension PIN registered</span>
                      <span className="bg-warning/10 text-warning px-2 py-1 rounded text-xs font-medium">
                        {allEmployees.filter(emp => emp.pension_pin).length} of {allEmployees.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">NHF registered</span>
                      <span className="bg-success/10 text-success px-2 py-1 rounded text-xs font-medium">
                        {allEmployees.filter(emp => emp.nhf_number).length} of {allEmployees.length}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </RoleBasedComponent>
        )}

        {/* Personal Benefits & Payroll for specific roles */}
        {['general_employee', 'corporate_hr', 'line_manager', 'it_admin'].includes(user?.role || '') && (
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-primary">My Benefits & Payroll</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Personal Payroll</span>
                  <span className="bg-success/10 text-success px-2 py-1 rounded text-xs font-medium">
                    ₦450,000
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Health Insurance</span>
                  <span className="bg-info/10 text-info px-2 py-1 rounded text-xs font-medium">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pension Plan</span>
                  <span className="bg-info/10 text-info px-2 py-1 rounded text-xs font-medium">
                    7.5% contribution
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Annual Leave</span>
                  <span className="bg-warning/10 text-warning px-2 py-1 rounded text-xs font-medium">
                    18 days remaining
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Clock In/Out Widget for General Employees and IT Admin */}
        {['general_employee', 'it_admin'].includes(user?.role || '') && (
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
            <CardTitle className="flex items-center text-primary">
              <Timer className="mr-2 h-5 w-5" />
              Time Clock
            </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {format(new Date(), 'HH:mm:ss')}
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(), 'EEEE, MMMM do, yyyy')}
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => {
                    toast({
                      title: "Clocked In",
                      description: `Successfully clocked in at ${format(new Date(), 'HH:mm')}`,
                    })
                  }}
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Clock In
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    toast({
                      title: "Clocked Out",
                      description: `Successfully clocked out at ${format(new Date(), 'HH:mm')}`,
                    })
                  }}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Clock Out
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-primary">
              <Building2 className="mr-2 h-5 w-5" />
              Department Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-8 animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : Object.keys(departmentStats).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(departmentStats)
                  .sort(([,a], [,b]) => b - a)
                  .map(([dept, count]) => (
                    <div key={dept} className="flex items-center justify-between">
                      <span className="text-sm">{dept}</span>
                      <Badge variant="secondary" className="text-xs">{count} employees</Badge>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground text-sm py-4">
                No department data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-primary">
              <Calendar className="mr-2 h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {['general_employee', 'corporate_hr', 'line_manager', 'it_power_user'].includes(user?.role || '') ? (
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-sm"
                  onClick={() => navigate('/payroll')}
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  View My Payroll
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-sm"
                  onClick={() => navigate('/benefits')}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  View My Benefits
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-sm"
                  onClick={() => navigate('/attendance')}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Submit Leave Request
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-sm"
                  onClick={() => navigate('/employees')}
                >
                  <Users className="mr-2 h-4 w-4" />
                  View All Employees
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-sm"
                  onClick={handleAddEmployee}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Employee
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-sm"
                  onClick={() => navigate('/reports')}
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Reports
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Test/Debug Component for IT Power Users */}
      <RoleBasedComponent allowedRoles={['it_power_user']}>
        <ApiTest />
      </RoleBasedComponent>
    </div>
  )
}