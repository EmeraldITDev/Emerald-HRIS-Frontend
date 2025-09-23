import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar, Plus, Clock, CalendarDays, LogIn, LogOut, Bell, Cake, Award, ChevronDown, Download, FileText, User, Phone, Building, Users, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/contexts/AuthContext"
import { RoleBasedComponent } from "@/components/RoleBasedComponent"
import apiService, { Employee } from "@/lib/api"

// Sample employee data for dropdown
const employees = [
  { id: "EMP001", name: "Adebayo Johnson", vacationDays: 25, usedDays: 5, birthday: "1990-08-23", joinDate: "2020-08-25", confirmationDate: "2024-08-23" },
  { id: "EMP002", name: "Fatima Abdul", vacationDays: 30, usedDays: 12, birthday: "1988-08-22", joinDate: "2019-08-20", confirmationDate: "2024-08-22" },
  { id: "EMP003", name: "Chinedu Okafor", vacationDays: 20, usedDays: 8, birthday: "1992-08-26", joinDate: "2021-08-24", confirmationDate: "2024-08-26" },
  { id: "EMP004", name: "Kemi Adeleke", vacationDays: 25, usedDays: 3, birthday: "1989-08-21", joinDate: "2018-08-19", confirmationDate: "2024-08-21" },
]

// Helper function to check if date is within current month
const isInCurrentMonth = (dateString: string) => {
  const today = new Date()
  const targetDate = new Date(dateString)
  targetDate.setFullYear(today.getFullYear()) // Use current year for birthdays
  return targetDate.getMonth() === today.getMonth()
}

// Helper function to check if date is within next 7 days
const isWithinNextWeek = (dateString: string) => {
  const today = new Date()
  const targetDate = new Date(dateString)
  targetDate.setFullYear(today.getFullYear()) // Use current year for birthdays
  const diffTime = targetDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays >= 0 && diffDays <= 7
}

// Get notifications for the current month
const getCurrentMonthEvents = () => {
  const today = new Date()
  const events = { birthdays: [], anniversaries: [] }

  employees.forEach(emp => {
    // Birthday events in current month
    if (isInCurrentMonth(emp.birthday)) {
      const birthdayDate = new Date(emp.birthday)
      birthdayDate.setFullYear(today.getFullYear())
      events.birthdays.push({
        type: 'birthday',
        employee: emp.name,
        date: birthdayDate.toLocaleDateString(),
        day: birthdayDate.getDate(),
        message: `${emp.name}'s birthday`,
        icon: Cake
      })
    }

    // Work anniversary events in current month
    const joinDate = new Date(emp.joinDate)
    const anniversaryDate = new Date(joinDate)
    anniversaryDate.setFullYear(today.getFullYear())
    if (isInCurrentMonth(anniversaryDate.toISOString().split('T')[0])) {
      const yearsOfService = today.getFullYear() - joinDate.getFullYear()
      events.anniversaries.push({
        type: 'anniversary',
        employee: emp.name,
        date: anniversaryDate.toLocaleDateString(),
        day: anniversaryDate.getDate(),
        message: `${emp.name}'s ${yearsOfService} year work anniversary`,
        icon: Award
      })
    }
  })

  return events
}

// Get notifications for upcoming events (within 7 days)
const getNotifications = () => {
  const today = new Date()
  const notifications = []

  employees.forEach(emp => {
    // Birthday notifications
    if (isWithinNextWeek(emp.birthday)) {
      const birthdayDate = new Date(emp.birthday)
      birthdayDate.setFullYear(today.getFullYear())
      notifications.push({
        type: 'birthday',
        employee: emp.name,
        date: birthdayDate.toLocaleDateString(),
        message: `${emp.name}'s birthday`,
        icon: Cake
      })
    }

    // Work anniversary notifications
    const joinDate = new Date(emp.joinDate)
    const anniversaryDate = new Date(joinDate)
    anniversaryDate.setFullYear(today.getFullYear())
    if (isWithinNextWeek(anniversaryDate.toISOString().split('T')[0])) {
      const yearsOfService = today.getFullYear() - joinDate.getFullYear()
      notifications.push({
        type: 'anniversary',
        employee: emp.name,
        date: anniversaryDate.toLocaleDateString(),
        message: `${emp.name}'s ${yearsOfService} year work anniversary`,
        icon: Award
      })
    }

    // Employment confirmation notifications
    if (isWithinNextWeek(emp.confirmationDate)) {
      notifications.push({
        type: 'confirmation',
        employee: emp.name,
        date: new Date(emp.confirmationDate).toLocaleDateString(),
        message: `${emp.name}'s employment confirmation due`,
        icon: Bell
      })
    }
  })

  return notifications
}

// Sample attendance records
const attendanceRecords = [
  {
    id: 1,
    employeeId: "EMP001",
    employeeName: "Adebayo Johnson",
    date: "2024-01-15",
    clockIn: "08:30",
    clockOut: "17:00",
    status: "Present"
  },
  {
    id: 2,
    employeeId: "EMP002",
    employeeName: "Fatima Abdul", 
    date: "2024-01-15",
    clockIn: "09:00",
    clockOut: "17:30",
    status: "Present"
  },
]

// Sample leave records with multi-level approval
const leaveRecords = [
  {
    id: 1,
    employeeId: "EMP001",
    employeeName: "Adebayo Johnson",
    leaveType: "Annual Leave",
    startDate: "2024-01-15",
    endDate: "2024-01-19",
    days: 5,
    status: "Approved",
    supervisorApproval: "Approved",
    hrApproval: "Approved",
    appliedDate: "2024-01-01"
  },
  {
    id: 2,
    employeeId: "EMP002", 
    employeeName: "Fatima Abdul",
    leaveType: "Sick Leave",
    startDate: "2024-01-22",
    endDate: "2024-01-24",
    days: 3,
    status: "Pending",
    supervisorApproval: "Approved",
    hrApproval: "Pending",
    appliedDate: "2024-01-20"
  },
]

export default function Attendance() {
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [leaveType, setLeaveType] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [reason, setReason] = useState("")
  const [contactDuringLeave, setContactDuringLeave] = useState("")
  const [medicalCertificate, setMedicalCertificate] = useState<File | null>(null)
  const [birthCertificate, setBirthCertificate] = useState<File | null>(null)
  const [deathCertificate, setDeathCertificate] = useState<File | null>(null)
  const [admissionLetter, setAdmissionLetter] = useState<File | null>(null)
  const [otherDocument, setOtherDocument] = useState<File | null>(null)
  const [otherDocumentType, setOtherDocumentType] = useState("")
  const [records, setRecords] = useState(leaveRecords)
  const [attendance, setAttendance] = useState(attendanceRecords)
  const [currentTime] = useState(new Date())
  const [notifications] = useState(getNotifications())
  const [currentMonthEvents] = useState(getCurrentMonthEvents())
  const [showMonthlyEvents, setShowMonthlyEvents] = useState(false)
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false)
  const [leaveRequests, setLeaveRequests] = useState<any[]>([])
  const [isLoadingLeaveRequests, setIsLoadingLeaveRequests] = useState(false)
  const [todayStatus, setTodayStatus] = useState<any>(null);
  const [isPunching, setIsPunching] = useState(false);

  const loadTodayStatus = async () => {
    if (!user?.employee_id) return;
    try {
      const res = await fetch('http://localhost:8000/api/attendance/today-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ employee_id: user.employee_id }),
      });
      const data = await res.json();
      if (data.success) setTodayStatus(data.data);
    } catch (e) {
      console.error('today-status failed', e);
    }
  };

  useEffect(() => {
    loadTodayStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.employee_id]);

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    fetchLeaveRequests()
  }, [])

  const fetchEmployees = async () => {
    try {
      setIsLoadingEmployees(true)
      const employeeData = await apiService.getEmployees()
      setEmployees(employeeData)
    } catch (error) {
      console.error('Error fetching employees:', error)
      toast({
        title: "Error",
        description: "Failed to load employees from database",
        variant: "destructive"
      })
    } finally {
      setIsLoadingEmployees(false)
    }
  }

  // Function to fetch leave requests from database
  const fetchLeaveRequests = async () => {
    try {
      setIsLoadingLeaveRequests(true)
      const leaveData = await apiService.getLeaveRequests()
      setLeaveRequests(leaveData)
    } catch (error) {
      console.error('Error fetching leave requests:', error)
      // If API fails, try to get from localStorage as fallback
      const savedRequests = localStorage.getItem('leaveRequests')
      if (savedRequests) {
        setLeaveRequests(JSON.parse(savedRequests))
      }
    } finally {
      setIsLoadingLeaveRequests(false)
    }
  }

  // Function to save leave requests to localStorage as backup
  const saveLeaveRequestsToStorage = (requests: any[]) => {
    localStorage.setItem('leaveRequests', JSON.stringify(requests))
  }

  const calculateDays = () => {
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const timeDiff = end.getTime() - start.getTime()
      const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1
      return dayDiff > 0 ? dayDiff : 0
    }
    return 0
  }

  const days = calculateDays()
  const selectedEmp = employees.find(emp => emp.id?.toString() === selectedEmployee.toString())
  const remainingDays = selectedEmp ? (selectedEmp.vacation_days || selectedEmp.vacationDays || 0) - (selectedEmp.usedDays || 0) : 0

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, fileType: string) => {
    const file = event.target.files?.[0]
    if (file) {
      switch (fileType) {
        case 'medical':
          setMedicalCertificate(file)
          break
        case 'birth':
          setBirthCertificate(file)
          break
        case 'death':
          setDeathCertificate(file)
          break
        case 'admission':
          setAdmissionLetter(file)
          break
        case 'other':
          setOtherDocument(file)
          break
      }
      toast({
        title: "File uploaded",
        description: `${file.name} has been uploaded successfully`,
      })
    }
  }

  const handleGenerateReport = (reportType: string) => {
    toast({
      title: "Generating Report",
      description: `${reportType} attendance report is being generated...`,
    })
  }

  // Updated handleSubmit function with enhanced leave request data
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedEmployee || !leaveType || !startDate || !endDate) {
      toast({
        title: "Error", 
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    // Check if user is contract staff
    const selectedEmp = employees.find(emp => emp.id?.toString() === selectedEmployee)
    if (selectedEmp?.employment_type === 'Contract') {
      toast({
        title: "Access Denied",
        description: "Contract staff cannot submit leave requests",
        variant: "destructive",
      })
      return
    }

    try {
      // Calculate leave days
      const start = new Date(startDate)
      const end = new Date(endDate)
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      
      // Check leave balance
      const availableDays = selectedEmp?.vacation_days || 25
      const usedDays = 0
      
      if (daysDiff > availableDays - usedDays) {
        toast({
          title: "Insufficient Leave Balance",
          description: `Available: ${availableDays - usedDays} days, Requested: ${daysDiff} days`,
          variant: "destructive",
        })
        return
      }
      
      const leaveRequestData = {
        employee_id: parseInt(selectedEmployee),
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason,
        contact_during_leave: contactDuringLeave,
        status: "Pending",
        days_requested: daysDiff
      }

      // Try to submit to database
      try {
        const leaveRequestWithTypeId = {
          ...leaveRequestData,
          leave_type_id: 1 // Default leave type ID, should be dynamic based on selected leave type
        }
        await apiService.createLeaveRequest(leaveRequestWithTypeId)
        
        // Refresh leave requests from database
        await fetchLeaveRequests()
        
        toast({
          title: "Success",
          description: `Leave request submitted for ${selectedEmp ? `${selectedEmp.first_name} ${selectedEmp.last_name}` : "Employee"}`,
        })
      } catch (dbError) {
        console.error('Database submission failed:', dbError)
        
        // Fallback to local state and localStorage
        const newRequest = {
          id: Date.now(),
          employee_id: parseInt(selectedEmployee),
          employee_name: selectedEmp ? `${selectedEmp.first_name} ${selectedEmp.last_name}` : "Unknown",
          leave_type: leaveType,
          start_date: startDate,
          end_date: endDate,
          status: "Pending",
          reason: reason,
          contact_during_leave: contactDuringLeave,
          days_requested: daysDiff
        }
        
        const updatedRequests = [newRequest, ...leaveRequests]
        setLeaveRequests(updatedRequests)
        saveLeaveRequestsToStorage(updatedRequests)
        
        toast({
          title: "Success (Local)",
          description: `Leave request submitted for ${selectedEmp ? `${selectedEmp.first_name} ${selectedEmp.last_name}` : "Employee"}`,
        })
      }
      
      // Reset form
      setSelectedEmployee("")
      setLeaveType("")
      setStartDate("")
      setEndDate("")
      setReason("")
      setContactDuringLeave("")
      setMedicalCertificate(null)
      setBirthCertificate(null)
      setDeathCertificate(null)
      setAdmissionLetter(null)
      setOtherDocument(null)
      setOtherDocumentType("")
      
    } catch (error) {
      console.error('Error submitting leave request:', error)
      toast({
        title: "Error",
        description: "Failed to submit leave request",
        variant: "destructive"
      })
    }
  }

  const handleClockIn = async () => {
    if (!user?.employee_id) {
      toast({ title: "Error", description: "No linked employee on this account.", variant: "destructive" });
      return;
    }
    try {
      setIsPunching(true);
      const res = await fetch('http://localhost:8000/api/attendance/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ employee_id: user.employee_id, location: 'office' }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Success", description: data.message });
        await loadTodayStatus();
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to clock in.", variant: "destructive" });
    } finally {
      setIsPunching(false);
    }
  };

  const handleClockOut = async () => {
    if (!user?.employee_id) {
      toast({ title: "Error", description: "No linked employee on this account.", variant: "destructive" });
      return;
    }
    try {
      setIsPunching(true);
      const res = await fetch('http://localhost:8000/api/attendance/clock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ employee_id: user.employee_id }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Success", description: data.message });
        await loadTodayStatus();
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to clock out.", variant: "destructive" });
    } finally {
      setIsPunching(false);
    }
  };

  // Example helpers (replace your current variants if desired)
  const getButtonText = () => {
    if (!todayStatus?.is_clocked_in) return "Clock In";
    if (todayStatus?.is_clocked_in && !todayStatus?.break_start) return "Start Break";
    if (todayStatus?.break_start && !todayStatus?.break_end) return "End Break";
    if (todayStatus?.break_end && !todayStatus?.clock_out_time) return "End Shift";
    return "Completed";
  };

  const getAttendanceStatusBadge = () => {
    if (!todayStatus?.is_clocked_in) return <Badge variant="secondary">Not Started</Badge>;
    if (todayStatus?.is_clocked_in && !todayStatus?.break_start) return <Badge variant="default">Working</Badge>;
    if (todayStatus?.break_start && !todayStatus?.break_end) return <Badge variant="destructive">On Break</Badge>;
    if (todayStatus?.clock_out_time) return <Badge variant="outline">Completed</Badge>;
    return <Badge variant="secondary">Unknown</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return <Badge className="bg-success/10 text-success border-success/20 text-xs">Approved</Badge>
      case "Pending":
        return <Badge className="bg-warning/10 text-warning border-warning/20 text-xs">Pending</Badge>
      case "Rejected":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-xs">Rejected</Badge>
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>
    }
  }

  // Function to handle approve/reject leave requests
  const handleUpdateLeaveStatus = async (requestId: number, newStatus: string) => {
    try {
      // Try to update in database
      try {
        await apiService.updateLeaveRequest(requestId, { status: newStatus })
        
        // Refresh leave requests from database
        await fetchLeaveRequests()
        
        toast({
          title: "Success",
          description: `Leave request ${newStatus.toLowerCase()} successfully`,
        })
      } catch (dbError) {
        console.error('Database update failed:', dbError)
        
        // Fallback to local state and localStorage
        const updatedRequests = leaveRequests.map(request => 
          request.id === requestId 
            ? { ...request, status: newStatus }
            : request
        )
        
        setLeaveRequests(updatedRequests)
        saveLeaveRequestsToStorage(updatedRequests)
        
        toast({
          title: "Success (Local)",
          description: `Leave request ${newStatus.toLowerCase()} successfully`,
        })
      }
    } catch (error) {
      console.error('Error updating leave status:', error)
      toast({
        title: "Error",
        description: "Failed to update leave status",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Attendance & Leave</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage employee leave requests and track attendance records
          </p>
        </div>
        <RoleBasedComponent allowedRoles={['executive', 'hr_manager']}>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => handleGenerateReport('Daily')}>
              <Download className="mr-2 h-4 w-4" />
              Daily Report
            </Button>
            <Button variant="outline" onClick={() => handleGenerateReport('Weekly')}>
              <FileText className="mr-2 h-4 w-4" />
              Weekly Report
            </Button>
            <Button variant="outline" onClick={() => handleGenerateReport('Monthly')}>
              <Calendar className="mr-2 h-4 w-4" />
              Monthly Report
            </Button>
            <Button variant="outline" onClick={() => handleGenerateReport('Yearly')}>
              <Users className="mr-2 h-4 w-4" />
              Yearly Report
            </Button>
          </div>
        </RoleBasedComponent>
      </div>

      {/* Notifications Section */}
      {notifications.length > 0 && (
        <Card className="border-border/50 shadow-sm bg-primary/5">
          <CardHeader>
            <CardTitle className="text-primary flex items-center">
              <Bell className="mr-2 h-5 w-5" />
              Upcoming Events & Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.map((notification, index) => {
                const IconComponent = notification.icon
                return (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-background rounded-lg border">
                    <IconComponent className="h-5 w-5 text-primary flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{notification.message}</div>
                      <div className="text-xs text-muted-foreground">{notification.date}</div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {notification.type === 'birthday' && 'Birthday'}
                      {notification.type === 'anniversary' && 'Anniversary'}
                      {notification.type === 'confirmation' && 'Confirmation'}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Events Dropdown */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader 
          className="cursor-pointer" 
          onClick={() => setShowMonthlyEvents(!showMonthlyEvents)}
        >
          <CardTitle className="text-primary flex items-center justify-between">
            <div className="flex items-center">
              <Cake className="mr-2 h-5 w-5" />
              This Month's Birthdays & Anniversaries
            </div>
            <ChevronDown className={`h-5 w-5 transition-transform ${showMonthlyEvents ? 'rotate-180' : ''}`} />
          </CardTitle>
        </CardHeader>
        {showMonthlyEvents && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Birthdays Section */}
              <div>
                <h3 className="font-semibold text-primary mb-3 flex items-center">
                  <Cake className="mr-2 h-4 w-4" />
                  Birthdays ({currentMonthEvents.birthdays.length})
                </h3>
                <div className="space-y-2">
                  {currentMonthEvents.birthdays.length > 0 ? (
                    currentMonthEvents.birthdays
                      .sort((a, b) => a.day - b.day)
                      .map((birthday, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                          <div className="flex items-center space-x-3">
                            <Cake className="h-4 w-4 text-primary" />
                            <div>
                              <div className="font-medium text-sm">{birthday.employee}</div>
                              <div className="text-xs text-muted-foreground">{birthday.date}</div>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
                            Day {birthday.day}
                          </Badge>
                        </div>
                      ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No birthdays this month</p>
                  )}
                </div>
              </div>

              {/* Work Anniversaries Section */}
              <div>
                <h3 className="font-semibold text-primary mb-3 flex items-center">
                  <Award className="mr-2 h-4 w-4" />
                  Work Anniversaries ({currentMonthEvents.anniversaries.length})
                </h3>
                <div className="space-y-2">
                  {currentMonthEvents.anniversaries.length > 0 ? (
                    currentMonthEvents.anniversaries
                      .sort((a, b) => a.day - b.day)
                      .map((anniversary, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                          <div className="flex items-center space-x-3">
                            <Award className="h-4 w-4 text-primary" />
                            <div>
                              <div className="font-medium text-sm">{anniversary.employee}</div>
                              <div className="text-xs text-muted-foreground">{anniversary.date}</div>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
                            Day {anniversary.day}
                          </Badge>
                        </div>
                      ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No work anniversaries this month</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Attendance Tracking Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-primary flex items-center">
              <LogIn className="mr-2 h-5 w-5" />
              Clock In/Out System
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-accent/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium text-sm">Current User: {user?.email}</div>
                  <div className="text-xs text-muted-foreground">Ready to clock in</div>
                </div>
              </div>
            </div>
            <Button 
              onClick={handleClockIn} 
              className="w-full"
              disabled={!user || isPunching}
            >
              <LogIn className="mr-2 h-4 w-4" />
              Clock In
            </Button>
          </CardContent>
        </Card>

        <RoleBasedComponent allowedRoles={['hr_manager', 'corporate_hr', 'executive']}>
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-primary flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Today's Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {attendance
                  .filter(record => record.date === new Date().toISOString().split('T')[0])
                  .map((record) => (
                    <div key={record.id} className="flex justify-between items-center p-2 bg-accent/50 rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{record.employeeName}</div>
                        <div className="text-xs text-muted-foreground">
                          In: {record.clockIn} {record.clockOut && `• Out: ${record.clockOut}`}
                        </div>
                      </div>
                      {!record.clockOut && (
                        <Button size="sm" onClick={() => handleClockOut(record.id)} variant="outline">
                          <LogOut className="mr-1 h-3 w-3" />
                          Clock Out
                        </Button>
                      )}
                    </div>
                  ))
                }
                {attendance.filter(record => record.date === new Date().toISOString().split('T')[0]).length === 0 && (
                  <p className="text-sm text-muted-foreground">No attendance records for today</p>
                )}
              </div>
            </CardContent>
          </Card>
        </RoleBasedComponent>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Enhanced Leave Request Form */}
        {user?.role !== 'contract_staff' && (
          <Card className="lg:col-span-1 border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-primary flex items-center">
                <CalendarDays className="mr-2 h-5 w-5" />
                Submit Leave Request
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Section A: Employee Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-primary border-b pb-2">Section A: Employee Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="employee">Employee *</Label>
                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingEmployees ? "Loading employees..." : "Select employee"} />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border shadow-lg max-h-60">
                        {employees.length > 0 ? (
                          employees.filter(emp => emp.employment_type !== 'Contract').map((emp) => (
                            <SelectItem key={emp.id} value={emp.id?.toString() || '0'}>
                              {emp.employee_code} - {emp.first_name} {emp.last_name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-employees" disabled>
                            {isLoadingEmployees ? "Loading..." : "No employees available"}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedEmp && (
                    <div className="p-3 bg-accent/20 rounded-lg space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="font-medium">Employee ID:</span>
                        <span>{selectedEmp.employee_code}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Job Title:</span>
                        <span>{selectedEmp.job_title || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Department:</span>
                        <span>{selectedEmp.department || 'N/A'}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="contactDuringLeave">Contact During Leave</Label>
                    <Input
                      id="contactDuringLeave"
                      value={contactDuringLeave}
                      onChange={(e) => setContactDuringLeave(e.target.value)}
                      placeholder="Phone number or email for emergencies"
                    />
                  </div>

                  <RoleBasedComponent allowedRoles={['hr_manager', 'corporate_hr', 'executive']}>
                    {selectedEmp && (
                      <div className="p-3 bg-primary/5 rounded-lg">
                        <h4 className="text-xs font-medium mb-2">Leave Balance Available</h4>
                        <div className="text-sm">
                          <div className="flex justify-between">
                            <span>Annual Leave:</span>
                            <span>{selectedEmp.vacation_days || 25} days</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Remaining:</span>
                            <span>{remainingDays} days</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </RoleBasedComponent>
                </div>

                {/* Section B: Leave Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-primary border-b pb-2">Section B: Leave Details</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="leaveType">Type of Leave Requested *</Label>
                    <Select value={leaveType} onValueChange={setLeaveType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border shadow-lg">
                        <SelectItem value="Annual">Annual Leave</SelectItem>
                        <SelectItem value="Sick">Sick Leave</SelectItem>
                        <SelectItem value="Maternity">Maternity Leave</SelectItem>
                        <SelectItem value="Paternity">Paternity Leave</SelectItem>
                        <SelectItem value="Compassionate">Compassionate Leave</SelectItem>
                        <SelectItem value="Study">Study Leave</SelectItem>
                        <SelectItem value="Unpaid">Unpaid Leave</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date *</Label>
                      <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className="w-full justify-start text-left font-normal"
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {startDate ? format(new Date(startDate), "PPP") : <span>Pick start date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={startDate ? new Date(startDate) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                setStartDate(format(date, "yyyy-MM-dd"))
                                setStartDateOpen(false)
                              }
                            }}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date *</Label>
                      <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className="w-full justify-start text-left font-normal"
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {endDate ? format(new Date(endDate), "PPP") : <span>Pick end date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={endDate ? new Date(endDate) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                setEndDate(format(date, "yyyy-MM-dd"))
                                setEndDateOpen(false)
                              }
                            }}
                            disabled={(date) => startDate ? date < new Date(startDate) : false}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {days > 0 && (
                    <div className="p-3 bg-accent/50 rounded-lg">
                      <div className="text-sm font-medium">Total Number of Days: {days}</div>
                      {selectedEmp && (
                        <div className="text-sm text-muted-foreground">
                          Remaining after approval: {remainingDays - days} days
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason for Leave {leaveType === 'Annual' ? '(Optional)' : ''}</Label>
                    <Textarea
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder={leaveType === 'Annual' ? 'Optional: Brief reason for annual leave' : 'Please provide reason for leave request'}
                      rows={3}
                    />
                  </div>
                </div>

                {/* Section C: Attachments */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-primary border-b pb-2">Section C: Attachments</h3>
                  
                  <div className="space-y-3">
                    {(leaveType === 'Sick') && (
                      <div className="space-y-2">
                        <Label htmlFor="medicalCert">Medical Certificate</Label>
                        <Input
                          id="medicalCert"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e, 'medical')}
                          className="cursor-pointer"
                        />
                      </div>
                    )}
                    
                    {(leaveType === 'Maternity' || leaveType === 'Paternity') && (
                      <div className="space-y-2">
                        <Label htmlFor="birthCert">Birth/Adoption Certificate</Label>
                        <Input
                          id="birthCert"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e, 'birth')}
                          className="cursor-pointer"
                        />
                      </div>
                    )}
                    
                    {leaveType === 'Compassionate' && (
                      <div className="space-y-2">
                        <Label htmlFor="deathCert">Death Certificate/Obituary</Label>
                        <Input
                          id="deathCert"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e, 'death')}
                          className="cursor-pointer"
                        />
                      </div>
                    )}
                    
                    {leaveType === 'Study' && (
                      <div className="space-y-2">
                        <Label htmlFor="admissionLetter">Academic Admission Letter</Label>
                        <Input
                          id="admissionLetter"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e, 'admission')}
                          className="cursor-pointer"
                        />
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="otherDoc">Other Document</Label>
                      <Input
                        id="otherDocType"
                        value={otherDocumentType}
                        onChange={(e) => setOtherDocumentType(e.target.value)}
                        placeholder="Specify document type"
                        className="mb-2"
                      />
                      <Input
                        id="otherDoc"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(e, 'other')}
                        className="cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Section D: Approvals Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-primary border-b pb-2">Section D: Approvals</h3>
                  <div className="p-3 bg-muted/30 rounded-lg text-xs space-y-2">
                    <div className="font-medium">Approval Workflow:</div>
                    <div className="space-y-1">
                      <div>1. Supervisor/Line Manager</div>
                      <div>2. HR Department</div>
                      <div className="text-muted-foreground">
                        Status updates will be communicated via email and system notifications.
                      </div>
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Submit Leave Request
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Leave Records Table */}
        <Card className="lg:col-span-2 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-primary flex items-center">
              <CalendarDays className="mr-2 h-5 w-5" />
              Leave Records
              {isLoadingLeaveRequests && <span className="ml-2 text-sm text-muted-foreground">(Loading...)</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leaveRequests.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveRequests.map((request) => {
                      // Calculate days for display
                      const start = new Date(request.start_date)
                      const end = new Date(request.end_date)
                      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
                      
                      return (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">
                            {request.employee_name || `Employee ${request.employee_id}`}
                          </TableCell>
                          <TableCell>{request.leave_type}</TableCell>
                          <TableCell>{format(new Date(request.start_date), "MMM dd, yyyy")}</TableCell>
                          <TableCell>{format(new Date(request.end_date), "MMM dd, yyyy")}</TableCell>
                          <TableCell>{days} day{days > 1 ? 's' : ''}</TableCell>
                          <TableCell>
                            {getStatusBadge(request.status)}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {request.status === "Pending" && (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleUpdateLeaveStatus(request.id, "Approved")}
                                  >
                                    Approve
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleUpdateLeaveStatus(request.id, "Rejected")}
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {isLoadingLeaveRequests ? "Loading leave requests..." : "No leave requests found"}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Leave Balances */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-primary">Employee Leave Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {employees.map((emp) => (
              <div key={emp.id} className="p-4 border rounded-lg bg-card">
                <div className="font-medium text-sm">{emp.name}</div>
                <div className="text-xs text-muted-foreground">{emp.id}</div>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Total:</span>
                    <span>{emp.vacationDays} days</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Used:</span>
                    <span>{emp.usedDays} days</span>
                  </div>
                  <div className="flex justify-between text-xs font-medium">
                    <span>Remaining:</span>
                    <span className="text-primary">{emp.vacationDays - emp.usedDays} days</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}