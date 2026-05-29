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
  LogOut,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import apiService, { Employee } from "@/lib/api"
import { cn } from "@/lib/utils"
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
import { getCurrentMonthCelebrations, getUpcomingCelebrations, type Celebration } from "@/utils/celebrations"
import { CelebrationsCard } from "@/components/CelebrationsCard"
import { UpcomingAnniversariesCard } from "@/components/UpcomingAnniversariesCard"

interface UserActivity {
  id: string
  type: 'clock_in' | 'clock_out' | 'lunch_start' | 'lunch_end'
  description: string
  timestamp: string
  userId: string
}

// Extract HH:mm from a backend datetime string ("YYYY-MM-DD HH:MM:SS" or ISO).
function formatTimeOnly(value?: string | null): string {
  if (!value) return ""
  const s = String(value)
  // Try parse — fall back to substring extraction for raw "YYYY-MM-DD HH:MM:SS".
  const d = new Date(s.includes("T") ? s : s.replace(" ", "T"))
  if (!isNaN(d.getTime())) {
    const hh = String(d.getHours()).padStart(2, "0")
    const mm = String(d.getMinutes()).padStart(2, "0")
    return `${hh}:${mm}`
  }
  return s.length >= 16 ? s.slice(11, 16) : s
}

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
  const [showLateClockInDialog, setShowLateClockInDialog] = useState(false)
  const [lateClockInReason, setLateClockInReason] = useState("")
  const [lateClockInContext, setLateClockInContext] = useState<"morning" | "post_lunch">("morning")
  const [recentActivities, setRecentActivities] = useState<UserActivity[]>([])
  const [currentMonthCelebrations, setCurrentMonthCelebrations] = useState<Celebration[]>([])
  const [upcomingCelebrations, setUpcomingCelebrations] = useState<Celebration[]>([])
  const [currentEmployeeId, setCurrentEmployeeId] = useState<number | null>(null)
  // Message dialog state moved to CelebrationsCard component

  // Load user activities from localStorage
  const loadUserActivities = () => {
    if (!user) return
    const activities = JSON.parse(localStorage.getItem('userActivities') || '[]') as UserActivity[]
    const userActivities = activities
      .filter(a => a.userId === user.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
    setRecentActivities(userActivities)
  }

  // Save a new activity
  const saveActivity = (type: UserActivity['type'], description: string) => {
    if (!user) return
    const activities = JSON.parse(localStorage.getItem('userActivities') || '[]') as UserActivity[]
    const newActivity: UserActivity = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      description,
      timestamp: new Date().toISOString(),
      userId: user.id
    }
    activities.unshift(newActivity)
    // Keep only last 100 activities per user
    const filtered = activities.slice(0, 500)
    localStorage.setItem('userActivities', JSON.stringify(filtered))
    loadUserActivities()
  }

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

  const loadTodayStatus = async () => {
    if (!user || !currentEmployeeId) return
    try {
      const response: any = await apiService.getAttendance()
      const today = format(new Date(), 'yyyy-MM-dd')
      let attendanceArray: any[] = []
      if (response && typeof response === 'object') {
        if (Array.isArray(response)) attendanceArray = response
        else if (response.data) {
          attendanceArray = Array.isArray(response.data)
            ? response.data
            : (response.data.data || [])
        }
      }
      const todayRecord = attendanceArray.find(
        (r: any) => r.employee_id === currentEmployeeId &&
          format(new Date(r.date), 'yyyy-MM-dd') === today
      )
      setTodayStatus(todayRecord || null)
    } catch (e) {
      console.error('Failed to load today attendance:', e)
    }
  }

  useEffect(() => {
    loadUserActivities()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Resolve current employee ID from loaded employees
  useEffect(() => {
    if (!user || allEmployees.length === 0) return
    const me = allEmployees.find(
      (e) => e.email?.toLowerCase() === user.email?.toLowerCase()
    )
    if (me && me.id) setCurrentEmployeeId(Number(me.id))
  }, [user, allEmployees])

  // Fallback: ask backend for the authenticated user's employee_id
  // so admins / users without a directory email match can still clock in.
  useEffect(() => {
    if (!user || currentEmployeeId) return
    let cancelled = false
    ;(async () => {
      try {
        const ctx = await apiService.getLeaveSubmitContext()
        const eid = (ctx as any)?.employee_id
        if (!cancelled && eid && !currentEmployeeId) {
          setCurrentEmployeeId(Number(eid))
        }
      } catch (e) {
        // non-fatal
      }
    })()
    return () => { cancelled = true }
  }, [user, currentEmployeeId])

  useEffect(() => {
    loadTodayStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEmployeeId])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch ALL employees first for celebrations (should be visible to everyone)
        const allEmployeesData = await apiService.getEmployees()
        
        // Calculate celebrations from ALL employees - available to all users
        const celebrations = getCurrentMonthCelebrations(allEmployeesData)
        setCurrentMonthCelebrations(celebrations)
        
        const upcoming = getUpcomingCelebrations(allEmployeesData, 7)
        setUpcomingCelebrations(upcoming)
        
        // Now apply role-based filtering for other dashboard data
        let employees = allEmployeesData
        const isLineManager = user?.role === 'line_manager'
        const isExecutive = user?.role === 'executive'
        const userDepartment = user?.department
        
        if ((isLineManager || isExecutive) && userDepartment) {
          employees = allEmployeesData.filter(emp => emp.department === userDepartment)
        }
        
        // Store filtered employees for stats calculations
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

  // Test mode: bypass time restrictions for specific test users
  const isTestMode = user?.email === 'bunmi.babajide@emeraldcfze.com'
  
  const handleClockIn = async () => {
    if (!user || !currentEmployeeId) {
      toast({ title: "Error", description: "No user logged in or employee record not found.", variant: "destructive" })
      return
    }

    const nowDate = new Date()
    const hour = nowDate.getHours()
    const minute = nowDate.getMinutes()
    const isAdminBypass = user.role === 'hr_manager' || user.role === 'corporate_hr' || isTestMode
    const afterNine = hour > 9 || (hour === 9 && minute > 0)
    if (afterNine && !isAdminBypass) {
      // Open the late clock-in approval dialog instead of blocking outright.
      setLateClockInReason("")
      setLateClockInContext("morning")
      setShowLateClockInDialog(true)
      return
    }

    try {
      setIsPunching(true)
      const response = await apiService.createAttendance({
        employee_id: currentEmployeeId,
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        location: 'office',
        notes: afterNine && isAdminBypass ? 'Admin bypass clock-in (after 9:00 AM)' : ''
      })
      toast({ title: "Success", description: response.message || "Clocked in successfully!" })
      saveActivity('clock_in', `Clocked in at ${format(new Date(), 'HH:mm:ss')}`)
      await loadTodayStatus()
    } catch (error: any) {
      console.error('Clock in error:', error)
      const msg = error?.response?.data?.message || error?.message || "Failed to clock in."
      toast({ title: "Error", description: msg, variant: "destructive" })
    } finally {
      setIsPunching(false)
    }
  }

  const handleClockOut = () => {
    if (!user) {
      toast({ title: "Error", description: "No user logged in.", variant: "destructive" })
      return
    }
    const currentHour = new Date().getHours()
    const isAdminBypass = user.role === 'hr_manager' || user.role === 'corporate_hr' || isTestMode
    if (currentHour < 17 && !isAdminBypass) {
      setIsLunchBreak(false)
      setShowClockOutDialog(true)
      return
    }
    performClockOut()
  }

  const handleLunchBreak = () => {
    if (!user) {
      toast({ title: "Error", description: "No user logged in.", variant: "destructive" })
      return
    }
    // If currently on break, clicking again ends the break (resume working).
    const onBreak = !!(todayStatus?.break_start && !todayStatus?.break_end)
    if (onBreak) {
      const currentHour = new Date().getHours()
      const isAdminBypass = user.role === 'hr_manager' || user.role === 'corporate_hr' || isTestMode
      // Lunch window ends at 2:00 PM. Returning after that requires HR approval.
      if (currentHour >= 14 && !isAdminBypass) {
        setLateClockInReason("")
        setLateClockInContext("post_lunch")
        setShowLateClockInDialog(true)
        return
      }
      endLunchBreak()
      return
    }
    const currentHour = new Date().getHours()
    const isAdminBypass = user.role === 'hr_manager' || user.role === 'corporate_hr' || isTestMode
    if ((currentHour >= 12 && currentHour < 14) || isAdminBypass) {
      performClockOut("", true)
    } else {
      toast({
        title: "Invalid Time",
        description: "Lunch break is only available between 12:00 PM and 2:00 PM.",
        variant: "destructive"
      })
    }
  }

  const endLunchBreak = async () => {
    if (!user || !currentEmployeeId) return
    try {
      setIsPunching(true)
      const response = await apiService.createAttendance({
        employee_id: currentEmployeeId,
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        location: 'office',
        notes: 'Resumed from lunch break',
      })
      toast({ title: "Welcome back", description: response.message || "Lunch break ended. You're clocked back in." })
      saveActivity('lunch_end', `Ended lunch break at ${format(new Date(), 'HH:mm:ss')}`)
      await loadTodayStatus()
    } catch (error: any) {
      console.error('End lunch break error:', error)
      const msg = error?.response?.data?.message || error?.message || "Failed to end lunch break."
      toast({ title: "Error", description: msg, variant: "destructive" })
    } finally {
      setIsPunching(false)
    }
  }

  const performClockOut = async (reason?: string, isLunch?: boolean) => {
    if (!user || !currentEmployeeId) return
    try {
      setIsPunching(true)
      const response = await apiService.clockOut({
        employee_id: currentEmployeeId,
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        notes: reason || (isLunch ? 'Lunch break' : ''),
        location: 'office'
      })
      toast({
        title: "Success",
        description: response.message || (isLunch ? "Lunch break started. Remember to clock back in!" : "Clocked out successfully!")
      })
      saveActivity(isLunch ? 'lunch_start' : 'clock_out', `${isLunch ? 'Started lunch break' : 'Clocked out'} at ${format(new Date(), 'HH:mm:ss')}`)
      await loadTodayStatus()
      setShowClockOutDialog(false)
      setClockOutReason("")
    } catch (error: any) {
      console.error('Clock out error:', error)
      const msg = error?.response?.data?.message || error?.message || "Failed to clock out."
      toast({ title: "Error", description: msg, variant: "destructive" })
    } finally {
      setIsPunching(false)
    }
  }

  const handleConfirmClockOut = async () => {
    if (isLunchBreak) {
      performClockOut(clockOutReason, true)
      return
    }
    if (!clockOutReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for the early clock-out approval request.",
        variant: "destructive",
      })
      return
    }
    try {
      setIsPunching(true)
      await apiService.submitEarlyClockoutRequest({
        employee_id: currentEmployeeId as number,
        reason: clockOutReason.trim(),
        requested_at: new Date().toISOString(),
      })
      toast({
        title: "Approval Request Submitted",
        description: "Your early clock-out request has been sent to HR Manager / Corporate HR. You remain clocked in until it is approved.",
      })
      setShowClockOutDialog(false)
      setClockOutReason("")
    } catch (error: any) {
      console.error('Early clock-out request error:', error)
      const msg = error?.response?.data?.message || error?.message || "Failed to submit early clock-out request."
      toast({ title: "Error", description: msg, variant: "destructive" })
    } finally {
      setIsPunching(false)
    }
  }

  const handleConfirmLateClockIn = async () => {
    if (!user || !currentEmployeeId) {
      toast({ title: "Error", description: "No user logged in or employee record not found.", variant: "destructive" })
      return
    }
    if (!lateClockInReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for the late clock-in approval request.",
        variant: "destructive",
      })
      return
    }
    try {
      setIsPunching(true)
      await apiService.submitLateClockinRequest({
        employee_id: currentEmployeeId,
        reason: lateClockInReason.trim(),
        requested_at: new Date().toISOString(),
      })
      toast({
        title: "Approval Request Submitted",
        description: "Your late clock-in request has been sent to HR Manager / Corporate HR for approval.",
      })
      setShowLateClockInDialog(false)
      setLateClockInReason("")
    } catch (error: any) {
      console.error('Late clock-in request error:', error)
      const msg = error?.data?.message || error?.message || "Failed to submit late clock-in request."
      toast({ title: "Error", description: msg, variant: "destructive" })
    } finally {
      setIsPunching(false)
    }
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
                {todayStatus?.clock_in ? (
                  <>
                    <div className="flex items-center gap-2">
                      <LogIn className="h-4 w-4 text-success" />
                      <span>Clocked in at {formatTimeOnly(todayStatus.clock_in)}</span>
                    </div>
                    {todayStatus?.clock_out && (
                      <div className="flex items-center gap-2 mt-1">
                        <LogOut className="h-4 w-4 text-destructive" />
                        <span>Clocked out at {formatTimeOnly(todayStatus.clock_out)}</span>
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
              {!(todayStatus?.clock_in && !todayStatus?.clock_out) ? (
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
                    disabled={isPunching || !!todayStatus?.clock_out}
                    variant={todayStatus?.break_start && !todayStatus?.break_end ? "default" : "outline"}
                    className={cn("gap-2", todayStatus?.break_start && !todayStatus?.break_end && "bg-success hover:bg-success/90 text-white")}
                  >
                    <Timer className="h-4 w-4" />
                    {todayStatus?.break_start && !todayStatus?.break_end ? "On Lunch Break" : "Lunch Break"}
                  </Button>
                  <Button 
                    onClick={handleClockOut}
                    disabled={isPunching || !!todayStatus?.clock_out}
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

      {/* Late Clock-In Approval Dialog */}
      <Dialog open={showLateClockInDialog} onOpenChange={setShowLateClockInDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Late Clock-In Approval Request</DialogTitle>
            <DialogDescription>
              Clock-in is only allowed before 9:00 AM. Please provide a reason for clocking in late.
              Your request will be sent to HR Manager / Corporate HR for approval and you will only
              be clocked in once it is approved.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="late-reason">Reason</Label>
              <Textarea
                id="late-reason"
                placeholder="e.g., Traffic delay, Medical appointment, Family emergency"
                value={lateClockInReason}
                onChange={(e) => setLateClockInReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowLateClockInDialog(false)
              setLateClockInReason("")
            }}>
              Cancel
            </Button>
            <Button onClick={handleConfirmLateClockIn} disabled={isPunching}>
              Submit for Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hide aggregate stats for general_employee, finance, corporate_hr, line_manager, it_admin, executive */}
      {!['general_employee', 'finance', 'corporate_hr', 'line_manager', 'it_admin', 'executive'].includes(user?.role || '') && (
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
            ) : recentActivities.length > 0 ? (
              <div className="space-y-3">
                {recentActivities.slice(0, 5).map((activity) => {
                  const activityDate = new Date(activity.timestamp)
                  const now = new Date()
                  const diffMs = now.getTime() - activityDate.getTime()
                  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
                  let timeDisplay = ''
                  if (diffDays === 0) {
                    timeDisplay = format(activityDate, 'h:mm a')
                  } else if (diffDays === 1) {
                    timeDisplay = 'Yesterday'
                  } else {
                    timeDisplay = `${diffDays} days ago`
                  }
                  return (
                    <div key={activity.id} className="flex items-center justify-between text-sm">
                      <span>{activity.description}</span>
                      <span className="text-muted-foreground">{timeDisplay}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">
                No recent activities
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
            ) : ['general_employee', 'finance', 'corporate_hr', 'line_manager', 'it_admin', 'executive'].includes(user?.role || '') ? (
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
        {['general_employee', 'finance', 'corporate_hr', 'line_manager', 'it_admin', 'executive'].includes(user?.role || '') && (
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
            ) : ['corporate_hr', 'line_manager', 'it_power_user', 'it_admin', 'executive'].includes(user?.role || '') ? (
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

        {/* Birthdays & Anniversaries Section - Available to all users */}
        <CelebrationsCard 
          celebrations={currentMonthCelebrations} 
          isLoading={isLoading}
        />

        {/* Upcoming Work Anniversaries (Requirement 3) */}
        <UpcomingAnniversariesCard days={7} />
      </div>

      {/* Test/Debug Component for IT Power Users */}
      <RoleBasedComponent allowedRoles={['it_power_user']}>
        <ApiTest />
      </RoleBasedComponent>

    </div>
  )
}