import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Plus, Clock, CalendarDays, LogIn, LogOut, Cake, ChevronDown, Award } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { apiService, Employee } from "@/lib/api"

export default function Attendance() {
  // State
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [attendance, setAttendance] = useState<any[]>([])
  const [leaveRequests, setLeaveRequests] = useState<any[]>([])
  const [clockInEmployee, setClockInEmployee] = useState<string>("")
  const [selectedEmployee, setSelectedEmployee] = useState<string>("")
  const [leaveType, setLeaveType] = useState<string>("")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)

  const { toast } = useToast()

  // Calculate leave days
  const days = useMemo(() => {
    if (!startDate || !endDate) return 0
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diff = end.getTime() - start.getTime()
    const d = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1
    return d > 0 ? d : 0
  }, [startDate, endDate])

  // Fetch data
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await apiService.getEmployees()
        setEmployees(data || [])
      } catch (error) {
        console.error("Error fetching employees:", error)
        toast({ title: "Error", description: "Failed to fetch employees", variant: "destructive" })
      } finally {
        setIsLoadingEmployees(false)
      }
    }
    fetchEmployees()
  }, [toast])

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const data = await apiService.getAttendance()
        const rows = Array.isArray(data) ? data : (data?.data?.data || data?.data || []);
        setAttendance(rows || [])
      } catch (error) {
        console.error("Error fetching attendance:", error)
      }
    }
    fetchAttendance()
  }, [toast])

  useEffect(() => {
    const fetchLeaveRequests = async () => {
      try {
        const data = await apiService.getLeaveRequests()
        const rows = Array.isArray(data) ? data : (data?.data?.data || data?.data || []);
        setLeaveRequests(rows || [])
      } catch (error) {
        console.error("Error fetching leave requests:", error)
      }
    }
    fetchLeaveRequests()
  }, [toast])

  // Clock in handler
  const handleClockIn = async () => {
    if (!clockInEmployee) {
      toast({ title: "Error", description: "Please select an employee to clock in.", variant: "destructive" })
      return
    }

    const emp = employees.find(e => String(e.id) === clockInEmployee)

    try {
      const response = await apiService.createAttendance({
        employee_id: parseInt(clockInEmployee),
        location: "office",
        notes: "Clocked in"
      })

      // Refresh attendance data
      const data = await apiService.getAttendance()
      const rows = Array.isArray(data) ? data : (data?.data?.data || data?.data || []);
      setAttendance(rows || [])

      setClockInEmployee("")
      
      // Show appropriate message
      if (response.action === 'clock_in') {
        toast({ title: "Success", description: `${emp?.first_name} ${emp?.last_name} clocked in successfully` })
      } else if (response.action === 'break_end') {
        toast({ title: "Success", description: `${emp?.first_name} ${emp?.last_name} break ended successfully` })
      }
    } catch (error) {
      console.error("Clock in failed:", error)
      toast({ title: "Error", description: "Failed to clock in. Please try again.", variant: "destructive" })
    }
  }

  // Clock out handler (for individual attendance entries)
  const handleClockOut = async (recordId: number) => {
    const record = attendance.find(r => r.id === recordId);
    if (!record) {
      toast({ title: "Error", description: "Record not found.", variant: "destructive" });
      return;
    }

    const emp = employees.find(e => e.id === record.employee_id);

    try {
      const response = await apiService.clockOut({
        employee_id: record.employee_id,
        notes: "Clocked out"
      })

      // Refresh attendance data
      const data = await apiService.getAttendance()
      const rows = Array.isArray(data) ? data : (data?.data?.data || data?.data || []);
      setAttendance(rows || [])

      // Show appropriate message
      if (response.action === 'break_start') {
        toast({ title: "Success", description: `${emp?.first_name} ${emp?.last_name} break started successfully` })
      } else if (response.action === 'shift_end') {
        toast({ title: "Success", description: `${emp?.first_name} ${emp?.last_name} shift ended successfully` })
      }
    } catch (error) {
      console.error("Clock out failed:", error)
      toast({ title: "Error", description: "Failed to clock out. Please try again.", variant: "destructive" })
    }
  }

  // Get dynamic button text
  const getButtonText = (employeeId: number, action: 'clockIn' | 'clockOut') => {
    const today = new Date().toISOString().split("T")[0];
    const record = attendance.find(r => {
      const recordDate = r.date ? r.date.split("T")[0] : null;
      return r.employee_id === employeeId && recordDate === today;
    });

    if (!record) {
      return action === 'clockIn' ? 'Clock In' : 'Clock Out';
    }

    const hasClockIn = record.clock_in;
    const hasClockOut = record.clock_out;
    const hasBreakStart = record.break_start;
    const hasBreakEnd = record.break_end;

    if (action === 'clockIn') {
      if (hasClockIn && hasBreakStart && !hasBreakEnd) {
        return 'Clock In (End Break)';
      }
      return 'Clock In';
    } else {
      if (hasClockIn && !hasBreakStart) {
        return 'Clock Out (Start Break)';
      }
      if (hasClockIn && hasBreakStart && hasBreakEnd && !hasClockOut) {
        return 'Clock Out (End Shift)';
      }
      return 'Clock Out';
    }
  };

  // Get status badge
  const getStatusBadge = (record: any) => {
    const hasClockIn = record.clock_in;
    const hasClockOut = record.clock_out;
    const hasBreakStart = record.break_start;
    const hasBreakEnd = record.break_end;

    if (hasClockIn && hasClockOut && hasBreakStart && hasBreakEnd) {
      return <Badge variant="secondary" className="text-xs">✅ Complete</Badge>;
    }
    if (hasClockIn && hasBreakStart && !hasBreakEnd) {
      return <Badge variant="outline" className="text-xs">☕ On Break</Badge>;
    }
    if (hasClockIn && !hasClockOut) {
      return <Badge variant="default" className="text-xs">🕐 Working</Badge>;
    }
    if (hasClockIn && hasBreakStart && hasBreakEnd && !hasClockOut) {
      return <Badge variant="default" className="text-xs">🕐 Back to Work</Badge>;
    }
    return null;
  };

  // Submit leave request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedEmployee || !leaveType || !startDate || !endDate || days <= 0) {
      toast({ title: "Error", description: "Please complete all required fields", variant: "destructive" })
      return
    }

    const payload = {
      employee_id: Number(selectedEmployee),
      leave_type_id: 1, // TODO: map from leaveType string -> ID from /leave/types
      start_date: startDate,
      end_date: endDate,
      days_requested: days,
      reason: "", // TODO: add reason field
      status: "Pending"
    }

    try {
      await apiService.createLeaveRequest(payload as any)
      toast({ title: "Success", description: "Leave request submitted" })
      
      // Reset form
      setSelectedEmployee("")
      setLeaveType("")
      setStartDate("")
      setEndDate("")
      
      // Refresh list
      const fresh = await apiService.getLeaveRequests()
      setLeaveRequests(fresh || [])
    } catch (error) {
      console.error("Create leave request failed:", error)
      toast({ title: "Error", description: "Failed to submit leave request", variant: "destructive" })
    }
  }

  // Update leave status
  const handleUpdateLeaveStatus = async (requestId: number, status: string) => {
    try {
      await apiService.updateLeaveRequest(requestId, { status })
      toast({ title: "Success", description: `Leave request ${status.toLowerCase()}` })
      
      // Refresh list
      const fresh = await apiService.getLeaveRequests()
      setLeaveRequests(fresh || [])
    } catch (error) {
      console.error("Update leave status failed:", error)
      toast({ title: "Error", description: "Failed to update leave request", variant: "destructive" })
    }
  }

  // Get today's attendance records
  const todayAttendance = attendance.filter(record => {
    const recordDate = record.date ? record.date.split("T")[0] : null;
    const today = new Date().toISOString().split("T")[0];
    return recordDate === today;
  });

  // Add these helper functions at the top of the component
  const isInCurrentMonth = (dateString: string) => {
    const today = new Date()
    const targetDate = new Date(dateString)
    targetDate.setFullYear(today.getFullYear()) // Use current year for birthdays
    return targetDate.getMonth() === today.getMonth()
  }

  // Get notifications for the current month
  const getCurrentMonthEvents = () => {
    const today = new Date()
    const events = { birthdays: [], anniversaries: [] }

    employees.forEach(emp => {
      // Birthday events in current month
      if (emp.date_of_birth && isInCurrentMonth(emp.date_of_birth)) {
        const birthdayDate = new Date(emp.date_of_birth)
        birthdayDate.setFullYear(today.getFullYear())
        events.birthdays.push({
          type: 'birthday',
          employee: `${emp.first_name} ${emp.last_name}`,
          date: birthdayDate.toLocaleDateString(),
          day: birthdayDate.getDate(),
          message: `${emp.first_name} ${emp.last_name}'s birthday`,
          icon: Cake
        })
      }

      // Work anniversary events in current month
      if (emp.hire_date) {
        const joinDate = new Date(emp.hire_date)
        const anniversaryDate = new Date(joinDate)
        anniversaryDate.setFullYear(today.getFullYear())
        if (isInCurrentMonth(anniversaryDate.toISOString().split('T')[0])) {
          const yearsOfService = today.getFullYear() - joinDate.getFullYear()
          events.anniversaries.push({
            type: 'anniversary',
            employee: `${emp.first_name} ${emp.last_name}`,
            date: anniversaryDate.toLocaleDateString(),
            day: anniversaryDate.getDate(),
            message: `${emp.first_name} ${emp.last_name}'s ${yearsOfService} year work anniversary`,
            icon: Award
          })
        }
      }
    })

    return events
  }

  // Add this state for the dropdown
  const [showMonthlyEvents, setShowMonthlyEvents] = useState(false)

  // Add this after the current month events calculation
  const currentMonthEvents = getCurrentMonthEvents()

  return (
    <div className="space-y-6">
      {/* Clock In/Out System */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Clock In
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clockInEmployee">Select Employee</Label>
              <Select value={clockInEmployee} onValueChange={setClockInEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee to clock in" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={String(emp.id)}>
                      {emp.first_name} {emp.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleClockIn}
              disabled={!clockInEmployee || isLoadingEmployees}
              className="w-full"
            >
              <LogIn className="mr-2 h-4 w-4" />
              {clockInEmployee ? getButtonText(parseInt(clockInEmployee), 'clockIn') : 'Clock In'}
            </Button>
          </CardContent>
        </Card>

        {/* Today's Attendance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Today's Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayAttendance.length === 0 ? (
                <p className="text-sm text-muted-foreground">No attendance records for today</p>
              ) : (
                todayAttendance.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">
                        {record.employee?.first_name} {record.employee?.last_name}
                      </p>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {record.clock_in && (
                          <p>🕐 Clock In: {format(new Date(record.clock_in), "HH:mm")}</p>
                        )}
                        {record.break_start && (
                          <p>☕ Break Start: {format(new Date(record.break_start), "HH:mm")}</p>
                        )}
                        {record.break_end && (
                          <p>☕ Break End: {format(new Date(record.break_end), "HH:mm")}</p>
                        )}
                        {record.clock_out && (
                          <p>🕐 Clock Out: {format(new Date(record.clock_out), "HH:mm")}</p>
                        )}
                        {record.total_hours && (
                          <p className="font-medium">Total: {record.total_hours}h</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(record)}
                      
                      {/* Clock out button for appropriate states */}
                      {(() => {
                        const hasClockIn = record.clock_in;
                        const hasClockOut = record.clock_out;
                        const hasBreakStart = record.break_start;
                        const hasBreakEnd = record.break_end;
                        
                        if ((hasClockIn && !hasClockOut) || (hasClockIn && hasBreakStart && hasBreakEnd && !hasClockOut)) {
                          let buttonText = 'Clock Out';
                          
                          if (hasClockIn && !hasBreakStart) {
                            buttonText = 'Clock Out (Start Break)';
                          } else if (hasClockIn && hasBreakStart && hasBreakEnd && !hasClockOut) {
                            buttonText = 'Clock Out (End Shift)';
                          }
                          
                          return (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleClockOut(record.id)}
                            >
                              <LogOut className="h-3 w-3 mr-1" />
                              {buttonText}
                            </Button>
                          );
                        }
                        
                        return null;
                      })()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Submit Leave Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="selectedEmployee">Employee *</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={String(emp.id)}>
                        {emp.first_name} {emp.last_name}
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
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
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
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
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
                        disabled={(date) => (startDate ? date < new Date(startDate) : false)}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {days > 0 && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    <strong>Total Days:</strong> {days} day{days !== 1 ? 's' : ''}
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Submit Leave Request
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Leave Records */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Leave Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaveRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No leave requests found</p>
              ) : (
                leaveRequests.map((request) => (
                  <div key={request.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">
                          {request.employee?.first_name} {request.employee?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {request.leave_type} - {request.days_requested} day{request.days_requested !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <Badge variant={request.status === 'Approved' ? 'default' : request.status === 'Rejected' ? 'destructive' : 'secondary'}>
                        {request.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      <p>{format(new Date(request.start_date), "MMM dd")} - {format(new Date(request.end_date), "MMM dd, yyyy")}</p>
                    </div>
                    {request.status === 'Pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateLeaveStatus(request.id, 'Approved')}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateLeaveStatus(request.id, 'Rejected')}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
    </div>
  )
}
