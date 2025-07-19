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
import { Calendar, Plus, Clock, CalendarDays } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Sample employee data for dropdown
const employees = [
  { id: "EMP001", name: "Adebayo Johnson", vacationDays: 25, usedDays: 5 },
  { id: "EMP002", name: "Fatima Abdul", vacationDays: 30, usedDays: 12 },
  { id: "EMP003", name: "Chinedu Okafor", vacationDays: 20, usedDays: 8 },
  { id: "EMP004", name: "Kemi Adeleke", vacationDays: 25, usedDays: 3 },
]

// Sample leave records
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
    status: "Approved",
    appliedDate: "2024-01-20"
  },
]

export default function Attendance() {
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [leaveType, setLeaveType] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [records, setRecords] = useState(leaveRecords)
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
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                  />
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