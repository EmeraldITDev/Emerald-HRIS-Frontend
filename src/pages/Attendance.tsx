import { useState } from "react"
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
import { Calendar, Plus, Clock, CalendarDays, LogIn, LogOut, Bell, Cake, Award, ChevronDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"

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
  const [records, setRecords] = useState(leaveRecords)
  const [attendance, setAttendance] = useState(attendanceRecords)
  const [clockInEmployee, setClockInEmployee] = useState("")
  const [currentTime] = useState(new Date())
  const [notifications] = useState(getNotifications())
  const [currentMonthEvents] = useState(getCurrentMonthEvents())
  const [showMonthlyEvents, setShowMonthlyEvents] = useState(false)
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)
  const { toast } = useToast()

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
  const selectedEmp = employees.find(emp => emp.id === selectedEmployee)
  const remainingDays = selectedEmp ? selectedEmp.vacationDays - selectedEmp.usedDays : 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedEmployee || !leaveType || !startDate || !endDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (days > remainingDays) {
      toast({
        title: "Error", 
        description: `Insufficient leave balance. Only ${remainingDays} days remaining.`,
        variant: "destructive",
      })
      return
    }

    const newRecord = {
      id: records.length + 1,
      employeeId: selectedEmployee,
      employeeName: selectedEmp?.name || "",
      leaveType,
      startDate,
      endDate,
      days,
      status: "Pending",
      supervisorApproval: "Pending",
      hrApproval: "Pending",
      appliedDate: new Date().toISOString().split('T')[0]
    }

    setRecords([newRecord, ...records])
    
    // Update employee's used days
    const empIndex = employees.findIndex(emp => emp.id === selectedEmployee)
    if (empIndex !== -1) {
      employees[empIndex].usedDays += days
    }

    // Reset form
    setSelectedEmployee("")
    setLeaveType("")
    setStartDate("")
    setEndDate("")

    toast({
      title: "Success",
      description: "Leave request submitted successfully",
    })
  }

  const handleClockIn = () => {
    if (!clockInEmployee) {
      toast({
        title: "Error",
        description: "Please select an employee to clock in",
        variant: "destructive",
      })
      return
    }

    const selectedEmp = employees.find(emp => emp.id === clockInEmployee)
    const today = new Date().toISOString().split('T')[0]
    
    // Check if already clocked in today
    const existingRecord = attendance.find(record => 
      record.employeeId === clockInEmployee && record.date === today
    )
    
    if (existingRecord && !existingRecord.clockOut) {
      toast({
        title: "Error",
        description: "Employee is already clocked in today",
        variant: "destructive",
      })
      return
    }

    const newAttendance = {
      id: attendance.length + 1,
      employeeId: clockInEmployee,
      employeeName: selectedEmp?.name || "",
      date: today,
      clockIn: currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      clockOut: "",
      status: "Present"
    }

    setAttendance([newAttendance, ...attendance])
    setClockInEmployee("")
    
    toast({
      title: "Success",
      description: `${selectedEmp?.name} clocked in successfully`,
    })
  }

  const handleClockOut = (attendanceId: number) => {
    const updatedAttendance = attendance.map(record => {
      if (record.id === attendanceId) {
        return {
          ...record,
          clockOut: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        }
      }
      return record
    })
    
    setAttendance(updatedAttendance)
    
    toast({
      title: "Success",
      description: "Clocked out successfully",
    })
  }

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

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Attendance & Leave</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Manage employee leave requests and track attendance records
        </p>
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
            <div className="space-y-2">
              <Label>Select Employee</Label>
              <Select value={clockInEmployee} onValueChange={setClockInEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee to clock in" />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-lg">
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleClockIn} className="w-full">
              <LogIn className="mr-2 h-4 w-4" />
              Clock In
            </Button>
          </CardContent>
        </Card>

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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Leave Request Form */}
        <Card className="lg:col-span-1 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-primary flex items-center">
              <CalendarDays className="mr-2 h-5 w-5" />
              Submit Leave Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employee">Employee *</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-lg">
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name} ({emp.vacationDays - emp.usedDays} days left)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="leaveType">Leave Type *</Label>
                <Select value={leaveType} onValueChange={setLeaveType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-lg">
                    <SelectItem value="Annual Leave">Annual Leave</SelectItem>
                    <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                    <SelectItem value="Maternity Leave">Maternity Leave</SelectItem>
                    <SelectItem value="Paternity Leave">Paternity Leave</SelectItem>
                    <SelectItem value="Emergency Leave">Emergency Leave</SelectItem>
                    <SelectItem value="Study Leave">Study Leave</SelectItem>
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
                  <div className="text-sm font-medium">Leave Summary:</div>
                  <div className="text-sm text-muted-foreground">
                    Duration: {days} day{days > 1 ? 's' : ''}
                  </div>
                  {selectedEmp && (
                    <div className="text-sm text-muted-foreground">
                      Remaining: {remainingDays - days} days after approval
                    </div>
                  )}
                </div>
              )}

              <Button type="submit" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Submit Request
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Leave Records Table */}
        <Card className="lg:col-span-2 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-primary flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Leave Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs md:text-sm">Employee</TableHead>
                    <TableHead className="text-xs md:text-sm">Leave Type</TableHead>
                    <TableHead className="hidden md:table-cell text-xs md:text-sm">Start Date</TableHead>
                    <TableHead className="hidden md:table-cell text-xs md:text-sm">End Date</TableHead>
                    <TableHead className="text-xs md:text-sm">Days</TableHead>
                    <TableHead className="text-xs md:text-sm">Supervisor</TableHead>
                    <TableHead className="text-xs md:text-sm">HR</TableHead>
                    <TableHead className="text-xs md:text-sm">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium text-xs md:text-sm">
                        {record.employeeName}
                      </TableCell>
                      <TableCell className="text-xs md:text-sm">{record.leaveType}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs md:text-sm">{record.startDate}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs md:text-sm">{record.endDate}</TableCell>
                      <TableCell className="text-xs md:text-sm">{record.days}</TableCell>
                      <TableCell>{getStatusBadge(record.supervisorApproval)}</TableCell>
                      <TableCell>{getStatusBadge(record.hrApproval)}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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