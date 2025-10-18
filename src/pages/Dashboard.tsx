import { useState, useEffect, useRef } from "react"
import { DashboardStats } from "@/components/DashboardStats"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
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
  ArrowLeft,
  Clock,
  LogIn,
  LogOut
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
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
  const [todayStatus, setTodayStatus] = useState<any>(null)
  const [isPunching, setIsPunching] = useState(false)
  const [showClockOutDialog, setShowClockOutDialog] = useState(false)
  const [clockOutReason, setClockOutReason] = useState("")
  const [isLunchBreak, setIsLunchBreak] = useState(false)

  const getRoleSpecificTitle = () => {
    const isLineManager = user?.role === 'line_manager'
    const department = user?.department
    
    switch (user?.role) {
      case 'executive':
        return 'Executive Dashboard'
      case 'hr_manager':
        return 'HR Manager Dashboard'
      case 'corporate_hr':
        return 'Corporate HR Dashboard'
      case 'line_manager':
        return `${department} - Line Manager Dashboard`
      case 'it_power_user':
        return 'IT Power User Dashboard'
      case 'it_admin':
        return 'Employee Self-Service'
      case 'finance':
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

  const loadTodayStatus = () => {
    if (!user) return
    const today = format(new Date(), 'yyyy-MM-dd')
    const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]')
    const todayRecord = attendanceRecords.find(
      (record: any) => record.employee_id === user.id && record.date === today
    )
    setTodayStatus(todayRecord || null)
  }

  useEffect(() => {
    loadTodayStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        let employees = await apiService.getEmployees()
        
        // Filter by department for line managers
        const isLineManager = user?.role === 'line_manager'
        const userDepartment = user?.department
        
        if (isLineManager && userDepartment) {
          employees = employees.filter(emp => emp.department === userDepartment)
        }
        
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
  }, [user])

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

  const handleClockIn = () => {
    if (!user) {
      toast({ title: "Error", description: "No user logged in.", variant: "destructive" })
      return
    }
    try {
      setIsPunching(true)
      const today = format(new Date(), 'yyyy-MM-dd')
      const now = format(new Date(), 'HH:mm:ss')
      const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]')
      
      const existingRecord = attendanceRecords.find(
        (record: any) => record.employee_id === user.id && record.date === today
      )
      
      if (existingRecord && existingRecord.clock_in_time) {
        toast({ title: "Already Clocked In", description: "You have already clocked in today.", variant: "destructive" })
        setIsPunching(false)
        return
      }

      const newRecord = {
        id: Date.now(),
        employee_id: user.id,
        employee_name: `${user.firstName} ${user.lastName}`,
        date: today,
        clock_in_time: now,
        clock_out_time: null,
        is_clocked_in: true,
        location: 'office'
      }

      const updatedRecords = existingRecord 
        ? attendanceRecords.map((r: any) => r.id === existingRecord.id ? newRecord : r)
        : [...attendanceRecords, newRecord]
      
      localStorage.setItem('attendanceRecords', JSON.stringify(updatedRecords))
      loadTodayStatus()
      toast({ title: "Success", description: "Clocked in successfully!" })
    } catch (error) {
      console.error('Clock in error:', error)
      toast({ title: "Error", description: "Failed to clock in.", variant: "destructive" })
    } finally {
      setIsPunching(false)
    }
  }

  const handleClockOut = () => {
    if (!user) {
      toast({ title: "Error", description: "No user logged in.", variant: "destructive" })
      return
    }

    const now = new Date()
    const currentHour = now.getHours()
    
    if (currentHour < 17) {
      setShowClockOutDialog(true)
      setIsLunchBreak(false)
      return
    }
    
    performClockOut()
  }

  const handleLunchBreak = () => {
    if (!user) {
      toast({ title: "Error", description: "No user logged in.", variant: "destructive" })
      return
    }

    const now = new Date()
    const currentHour = now.getHours()
    
    if (currentHour >= 11 && currentHour < 14) {
      setShowClockOutDialog(true)
      setIsLunchBreak(true)
    } else {
      toast({ 
        title: "Invalid Time", 
        description: "Lunch break is only available between 11:00 AM and 2:00 PM.", 
        variant: "destructive" 
      })
    }
  }

  const performClockOut = (reason?: string, isLunch?: boolean) => {
    if (!user) return
    
    try {
      setIsPunching(true)
      const today = format(new Date(), 'yyyy-MM-dd')
      const now = format(new Date(), 'HH:mm:ss')
      const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]')
      
      const existingRecordIndex = attendanceRecords.findIndex(
        (record: any) => record.employee_id === user.id && record.date === today && record.is_clocked_in
      )
      
      if (existingRecordIndex === -1) {
        toast({ title: "Not Clocked In", description: "You need to clock in first.", variant: "destructive" })
        setIsPunching(false)
        return
      }

      if (isLunch) {
        attendanceRecords[existingRecordIndex] = {
          ...attendanceRecords[existingRecordIndex],
          lunch_break_start: now,
          lunch_break_reason: reason || "Lunch break"
        }
        toast({ title: "Success", description: "Lunch break started. Don't forget to clock back in!" })
      } else {
        attendanceRecords[existingRecordIndex] = {
          ...attendanceRecords[existingRecordIndex],
          clock_out_time: now,
          is_clocked_in: false,
          early_departure_reason: reason || ""
        }
        toast({ title: "Success", description: "Clocked out successfully!" })
      }
      
      localStorage.setItem('attendanceRecords', JSON.stringify(attendanceRecords))
      loadTodayStatus()
      setShowClockOutDialog(false)
      setClockOutReason("")
    } catch (error) {
      console.error('Clock out error:', error)
      toast({ title: "Error", description: "Failed to clock out.", variant: "destructive" })
    } finally {
      setIsPunching(false)
    }
  }

  const handleConfirmClockOut = () => {
    if (!clockOutReason.trim() && new Date().getHours() < 17) {
      toast({ 
        title: "Reason Required", 
        description: "Please provide a reason for early departure.", 
        variant: "destructive" 
      })
      return
    }
    performClockOut(clockOutReason, isLunchBreak)
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{getRoleSpecificTitle()}</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {['general_employee', 'finance'].includes(user?.role || '')
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

      {/* Clock In/Out Card - Visible to Everyone */}
      <Card className="border-border/50 shadow-sm bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center text-primary">
            <Clock className="mr-2 h-5 w-5" />
            Time Clock
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 space-y-2">
              <div className="text-sm text-muted-foreground">
                {todayStatus?.clock_in_time ? (
                  <>
                    <div className="flex items-center gap-2">
                      <LogIn className="h-4 w-4 text-success" />
                      <span>Clocked in at {todayStatus.clock_in_time}</span>
                    </div>
                    {todayStatus?.clock_out_time && (
                      <div className="flex items-center gap-2 mt-1">
                        <LogOut className="h-4 w-4 text-destructive" />
                        <span>Clocked out at {todayStatus.clock_out_time}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <span>Not clocked in today</span>
                )}
              </div>
              <div className="text-lg font-semibold">
                {format(new Date(), 'EEEE, MMMM d, yyyy')}
              </div>
            </div>
            <div className="flex gap-2">
              {!todayStatus?.is_clocked_in ? (
                <Button 
                  onClick={handleClockIn}
                  disabled={isPunching}
                  className="gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  Clock In
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={handleLunchBreak}
                    disabled={isPunching || todayStatus?.clock_out_time}
                    variant="outline"
                    className="gap-2"
                  >
                    <Timer className="h-4 w-4" />
                    Lunch Break
                  </Button>
                  <Button 
                    onClick={handleClockOut}
                    disabled={isPunching || todayStatus?.clock_out_time}
                    variant="destructive"
                    className="gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Clock Out
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clock Out Dialog */}
      <Dialog open={showClockOutDialog} onOpenChange={setShowClockOutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isLunchBreak ? "Lunch Break" : "Early Clock Out"}
            </DialogTitle>
            <DialogDescription>
              {isLunchBreak 
                ? "Please provide a reason for your lunch break."
                : "You are clocking out before 5:00 PM. Please provide a reason."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder={isLunchBreak ? "e.g., Lunch break" : "e.g., Doctor's appointment, Personal emergency"}
                value={clockOutReason}
                onChange={(e) => setClockOutReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowClockOutDialog(false)
              setClockOutReason("")
            }}>
              Cancel
            </Button>
            <Button onClick={handleConfirmClockOut} disabled={isPunching}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hide aggregate stats for general_employee, finance, corporate_hr, line_manager, it_admin */}
      {!['general_employee', 'finance', 'corporate_hr', 'line_manager', 'it_admin'].includes(user?.role || '') && (
        <div className="grid gap-3 md:gap-4 lg:gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0">
              {isLoading ? (
                <div className="h-6 md:h-8 bg-muted rounded animate-pulse"></div>
              ) : (
                <>
                  <div className="text-xl md:text-2xl font-bold">{allEmployees.length}</div>
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
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Contract</CardTitle>
              <UserCheck className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0">
              {isLoading ? (
                <div className="h-6 md:h-8 bg-muted rounded animate-pulse"></div>
              ) : (
                <>
                  <div className="text-xl md:text-2xl font-bold">
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
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">FTE</CardTitle>
              <Users className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0">
              {isLoading ? (
                <div className="h-6 md:h-8 bg-muted rounded animate-pulse"></div>
              ) : (
                <>
                  <div className="text-xl md:text-2xl font-bold">
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
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Total Salary Budget</CardTitle>
              <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0">
              {isLoading ? (
                <div className="h-6 md:h-8 bg-muted rounded animate-pulse"></div>
              ) : (
                <>
                  <div className="text-xl md:text-2xl font-bold">
                    ₦{(allEmployees.reduce((sum, emp) => sum + (emp.gross_salary || 0), 0) / 1000000).toFixed(1)}M
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total monthly payroll
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Onboard</CardTitle>
              <UserPlus className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0">
              {isLoading ? (
                <div className="h-6 md:h-8 bg-muted rounded animate-pulse"></div>
              ) : (
                <>
                  <div className="text-xl md:text-2xl font-bold">
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
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">NIN Registered</CardTitle>
              <Shield className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0">
              {isLoading ? (
                <div className="h-6 md:h-8 bg-muted rounded animate-pulse"></div>
              ) : (
                <>
                  <div className="text-xl md:text-2xl font-bold">
                    {allEmployees.filter(emp => emp.national_id).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {allEmployees.length > 0 ? Math.round((allEmployees.filter(emp => emp.national_id).length / allEmployees.length) * 100) : 0}% registered
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">BVN Registered</CardTitle>
              <Shield className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0">
              {isLoading ? (
                <div className="h-6 md:h-8 bg-muted rounded animate-pulse"></div>
              ) : (
                <>
                  <div className="text-xl md:text-2xl font-bold">
                    {allEmployees.filter(emp => emp.bvn).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {allEmployees.length > 0 ? Math.round((allEmployees.filter(emp => emp.bvn).length / allEmployees.length) * 100) : 0}% registered
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Pension PIN</CardTitle>
              <Shield className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0">
              {isLoading ? (
                <div className="h-6 md:h-8 bg-muted rounded animate-pulse"></div>
              ) : (
                <>
                  <div className="text-xl md:text-2xl font-bold">
                    {allEmployees.filter(emp => emp.pension_pin).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {allEmployees.length > 0 ? Math.round((allEmployees.filter(emp => emp.pension_pin).length / allEmployees.length) * 100) : 0}% registered
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">NHF Registered</CardTitle>
              <Shield className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0">
              {isLoading ? (
                <div className="h-6 md:h-8 bg-muted rounded animate-pulse"></div>
              ) : (
                <>
                  <div className="text-xl md:text-2xl font-bold">
                    {allEmployees.filter(emp => emp.nhf_number).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {allEmployees.length > 0 ? Math.round((allEmployees.filter(emp => emp.nhf_number).length / allEmployees.length) * 100) : 0}% registered
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Grid sections */}
      <div className="grid gap-3 md:gap-4 lg:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Activities - For general employees, show personal activities */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center text-primary text-base md:text-lg">
              <FileText className="mr-2 h-4 w-4 md:h-5 md:w-5" />
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
            ) : ['general_employee', 'finance', 'line_manager'].includes(user?.role || '') ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Clocked in today</span>
                  <span className="text-muted-foreground">8:00 AM</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Performance review submitted</span>
                  <span className="text-muted-foreground">Yesterday</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Training module completed</span>
                  <span className="text-muted-foreground">2 days ago</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Leave request approved</span>
                  <span className="text-muted-foreground">3 days ago</span>
                </div>
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
            ) : ['general_employee', 'finance', 'corporate_hr', 'line_manager', 'it_admin'].includes(user?.role || '') ? (
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

        {!['general_employee', 'finance', 'corporate_hr', 'line_manager', 'it_admin'].includes(user?.role || '') && (
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
        {['general_employee', 'finance', 'corporate_hr', 'line_manager', 'it_admin'].includes(user?.role || '') && (
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

        {/* Department Breakdown - Hidden for general employees and finance */}
        {!['general_employee', 'finance'].includes(user?.role || '') && (
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
        )}

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-primary">
              <Calendar className="mr-2 h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {['general_employee', 'finance'].includes(user?.role || '') ? (
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-sm"
                  onClick={() => navigate('/training')}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  My Training
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-sm"
                  onClick={() => navigate('/performance')}
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Performance Review
                </Button>
              </div>
            ) : ['corporate_hr', 'line_manager', 'it_power_user', 'it_admin'].includes(user?.role || '') ? (
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-sm"
                  onClick={() => navigate('/training')}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  My Training
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-sm"
                  onClick={() => navigate('/performance')}
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Performance Review
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