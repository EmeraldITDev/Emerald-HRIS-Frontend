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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Calendar, Plus, Clock, CalendarDays, LogIn, LogOut, Bell, ChevronDown, ChevronUp, Download, FileText, User, Phone, Building, Users, Upload, Eye, File } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useToast } from "@/hooks/use-toast"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/contexts/AuthContext"
import { RoleBasedComponent } from "@/components/RoleBasedComponent"
import apiService, { Employee } from "@/lib/api"
import {
  AttendanceStatusBadge,
  extractRows,
  formatTimeWithZone,
  locationStatusLabel,
} from "@/lib/attendanceUi"
import { getCurrentMonthCelebrations, type Celebration } from "@/utils/celebrations"

// Extract HH:mm from a backend datetime string ("YYYY-MM-DD HH:MM:SS" or ISO).
function formatAttTime(value?: string | null): string {
  if (!value) return ""
  const s = String(value)
  const d = new Date(s.includes("T") ? s : s.replace(" ", "T"))
  if (!isNaN(d.getTime())) {
    const hh = String(d.getHours()).padStart(2, "0")
    const mm = String(d.getMinutes()).padStart(2, "0")
    return `${hh}:${mm}`
  }
  return s.length >= 16 ? s.slice(11, 16) : s
}
import { CelebrationsCard } from "@/components/CelebrationsCard"
import { LeaveBalanceCard } from "@/components/LeaveBalanceCard"
import { AttendanceApprovalsCard } from "@/components/AttendanceApprovalsCard"
import { MyAttendanceRequestsCard } from "@/components/MyAttendanceRequestsCard"
import WeeklyAttendanceCard from "@/components/attendance/WeeklyAttendanceCard"
import MyWorkRequestsCard from "@/components/attendance/MyWorkRequestsCard"
import ExceptionRequestForm from "@/components/attendance/ExceptionRequestForm"
import WFHRequestForm from "@/components/attendance/WFHRequestForm"
import { canSubmitException, canSubmitWFH } from "@/lib/permissions"

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
  const [currentMonthCelebrations, setCurrentMonthCelebrations] = useState<Celebration[]>([])
  const [isCelebrationsLoading, setIsCelebrationsLoading] = useState(false)
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false)
  const [leaveRequests, setLeaveRequests] = useState<any[]>([])
  const [isLoadingLeaveRequests, setIsLoadingLeaveRequests] = useState(false)
  const [leaveFilterStatus, setLeaveFilterStatus] = useState<string>("all")
  const [leaveFilterEmployee, setLeaveFilterEmployee] = useState<string>("all")
  const [leaveFilterType, setLeaveFilterType] = useState<string>("all")
  const [leaveFilterDateFrom, setLeaveFilterDateFrom] = useState<string>("")
  const [leaveFilterDateTo, setLeaveFilterDateTo] = useState<string>("")
  const [leaveFilterDepartment, setLeaveFilterDepartment] = useState<string>("all")
  const [leaveTypes, setLeaveTypes] = useState<any[]>([])
  const [isLoadingLeaveTypes, setIsLoadingLeaveTypes] = useState(false)
  const [todayAttendance, setTodayAttendance] = useState<any[]>([]);
  const [selectedLeaveRequest, setSelectedLeaveRequest] = useState<any>(null);
  const [showLeaveDetailsDialog, setShowLeaveDetailsDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [approvalNotes, setApprovalNotes] = useState("");
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);
  const [showTodayAttendance, setShowTodayAttendance] = useState(true);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<number | null>(null);
  const [workRequestsKey, setWorkRequestsKey] = useState(0);

  // Load the org/team "Today's Attendance" table (managers & HR).
  const loadTodayStatus = async () => {
    if (!user) return;

    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');

      // Prefer the org-dashboard payload — it is the same source the
      // Organisation-Wide Attendance page uses and already carries employee
      // name/code, department, work mode and location status.
      try {
        const orgRes: any = await apiService.getOrgAttendanceDashboard({ date: todayStr });
        const payload: any = orgRes?.data ?? orgRes;
        let orgRows = extractRows(payload?.rows ? payload.rows : orgRes);
        if (orgRows.length > 0) {
          if (user?.role === 'line_manager' && user?.department) {
            orgRows = orgRows.filter((r: any) => r.department === user.department);
          }
          setTodayAttendance(orgRows);
          return;
        }
      } catch (orgError) {
        console.warn('Org dashboard unavailable, falling back to attendance list:', orgError);
      }

      const response = await apiService.getAttendance();
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Handle paginated response from backend
      // Backend returns: { success: true, data: { data: [...], current_page: 1, ... } }
      let attendanceArray: any[] = [];
       const res = response as any;
       if (res && typeof res === 'object') {
         if (Array.isArray(res)) {
          // Direct array response
           attendanceArray = res;
         } else if (res.data) {
          // Paginated response - extract the data array
           attendanceArray = Array.isArray(res.data) 
             ? res.data 
             : (res.data.data || []);
        }
      }

      // Load all today's attendance for display (already filtered by department from backend)
      let allTodayRecords = attendanceArray.filter(
        (record: any) => format(new Date(record.date), 'yyyy-MM-dd') === today
      );
      
      // Additional frontend filtering for line managers (belt and suspenders)
      if (user?.role === 'line_manager' && user?.department) {
        allTodayRecords = allTodayRecords.filter(
          (record: any) => record.employee?.department === user.department
        );
      }

      // Normalise the legacy shape onto the org-dashboard field names.
      setTodayAttendance(
        allTodayRecords.map((r: any) => ({
          ...r,
          employee_name:
            r.employee_name ||
            [r.employee?.first_name, r.employee?.last_name].filter(Boolean).join(' '),
          employee_code: r.employee_code || r.employee?.employee_code || r.employee_id,
          department: r.department || r.employee?.department,
          actual_mode: r.actual_mode || r.work_mode,
          attendance_status: r.attendance_status || r.status,
        }))
      );
    } catch (error) {
      console.error('Failed to load attendance status:', error);
    }
  };

  useEffect(() => {
    loadTodayStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentEmployeeId]);

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    fetchLeaveRequests()
  }, [])

  useEffect(() => {
    fetchLeaveTypes()
  }, [])

  // Auto-select current user for non-HR managers and set employee ID
  useEffect(() => {
    if (user && employees.length > 0) {
      const currentUser = employees.find(emp => 
        emp.email?.toLowerCase() === user.email?.toLowerCase()
      )
      if (currentUser && currentUser.id) {
        setCurrentEmployeeId(currentUser.id)
        if (user.role !== 'hr_manager') {
          setSelectedEmployee(currentUser.id.toString())
        }
      }
    }
  }, [user, employees])

  // Fallback: ask backend for the authenticated user's leave submit context
  // so selectedEmployee binds even if the employees list lookup misses.
  useEffect(() => {
    if (!user) return
    if (selectedEmployee) return
    let cancelled = false
    ;(async () => {
      try {
        const ctx = await apiService.getLeaveSubmitContext()
        const eid = ctx?.employee_id
        if (!cancelled && eid && !selectedEmployee) {
          setSelectedEmployee(eid.toString())
          setCurrentEmployeeId(Number(eid))
        }
      } catch (e) {
        // non-fatal — form still works via employees lookup
      }
    })()
    return () => { cancelled = true }
  }, [user, selectedEmployee])

  // Update celebrations when all employees are loaded
  useEffect(() => {
    const fetchCelebrations = async () => {
      setIsCelebrationsLoading(true)
      try {
        // Get all employees for celebrations regardless of role filtering
        const allEmployees = await apiService.getEmployees()
        const celebrations = getCurrentMonthCelebrations(allEmployees)
        setCurrentMonthCelebrations(celebrations)
      } catch (error) {
        console.error('Error loading celebrations:', error)
      } finally {
        setIsCelebrationsLoading(false)
      }
    }
    fetchCelebrations()
  }, [])

  const fetchEmployees = async () => {
    try {
      setIsLoadingEmployees(true)
      const employeeData = await apiService.getEmployees()
      
      // Department-aware filtering
      let filteredData = employeeData;
      if (user?.role === 'line_manager' && user?.department) {
        // Line managers see only their department
        filteredData = employeeData.filter(emp => emp.department === user.department);
      } else if (user?.role === 'general_employee' || user?.role === 'finance') {
        // Employees see only themselves
        filteredData = employeeData.filter(emp => emp.email === user.email);
      }
      // HR managers and executives see all employees
      
      setEmployees(filteredData)
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
      const response = await apiService.getLeaveRequests()
      // Handle paginated response from backend
      let requests: any[] = []
      if (Array.isArray(response)) {
        requests = response
      } else if (response && typeof response === 'object') {
        // Handle paginated response: { success: true, data: { data: [...], current_page: 1, ... } }
        const responseObj = response as { data?: any }
        if (responseObj.data) {
          requests = Array.isArray(responseObj.data) 
            ? responseObj.data 
            : (responseObj.data.data || [])
        }
      }
      setLeaveRequests(requests)
    } catch (error) {
      console.error('Error fetching leave requests:', error)
      // If API fails, try to get from localStorage as fallback
      const savedRequests = localStorage.getItem('leaveRequests')
      if (savedRequests) {
        setLeaveRequests(JSON.parse(savedRequests))
      } else {
        // Ensure it's always an array
        setLeaveRequests([])
      }
    } finally {
      setIsLoadingLeaveRequests(false)
    }
  }

  // Function to save leave requests to localStorage as backup
  const saveLeaveRequestsToStorage = (requests: any[]) => {
    localStorage.setItem('leaveRequests', JSON.stringify(requests))
  }

  // Function to fetch leave types from backend
  const fetchLeaveTypes = async () => {
    try {
      setIsLoadingLeaveTypes(true)
      const response = await apiService.getLeaveTypes()
      // Handle response structure: could be direct array or { success: true, data: [...] }
       const res = response as any;
       const types = Array.isArray(res) ? res : (res?.data || [])
      
      // If no leave types from backend, use fallback
      if (types.length === 0) {
        console.warn('No leave types found in database, using fallback types')
        setLeaveTypes([
          { id: 1, name: 'Annual Leave' },
          { id: 2, name: 'Sick Leave' },
          { id: 3, name: 'Maternity Leave' },
          { id: 4, name: 'Paternity Leave' },
          { id: 5, name: 'Emergency Leave' },
          { id: 6, name: 'Study Leave' },
          { id: 7, name: 'Unpaid Leave' },
        ])
      } else {
        setLeaveTypes(types)
      }
    } catch (error) {
      console.error('Error fetching leave types:', error)
      // Fallback to default leave types if API fails
      setLeaveTypes([
        { id: 1, name: 'Annual Leave' },
        { id: 2, name: 'Sick Leave' },
        { id: 3, name: 'Maternity Leave' },
        { id: 4, name: 'Paternity Leave' },
        { id: 5, name: 'Emergency Leave' },
        { id: 6, name: 'Study Leave' },
        { id: 7, name: 'Unpaid Leave' },
      ])
    } finally {
      setIsLoadingLeaveTypes(false)
    }
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
  const remainingDays = selectedEmp ? (selectedEmp.vacation_days || 0) : 0

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

  const handleGenerateReport = async (reportType: string) => {
    const today = new Date()
    let startDate: Date
    let endDate: Date = new Date()
    
    switch(reportType) {
      case 'Daily':
        startDate = new Date(today)
        break
      case 'Weekly':
        startDate = new Date(today)
        startDate.setDate(today.getDate() - 7)
        break
      case 'Monthly':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        break
      case 'Yearly':
        startDate = new Date(today.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(today)
    }

    const startStr = format(startDate, 'yyyy-MM-dd')
    const endStr = format(endDate, 'yyyy-MM-dd')
    const year = startDate.getFullYear()

    try {
      // Fetch reports from backend so they are based on real database data
      const [attendanceReport, leaveReport] = await Promise.all([
        apiService.getAttendanceReport(startStr, endStr),
        apiService.getLeaveReport(year),
      ])

      // ===== Attendance report (by employee summary) =====
      const attendanceByEmployee = Array.isArray(attendanceReport?.by_employee)
        ? attendanceReport.by_employee
        : []

      if (attendanceByEmployee.length > 0) {
        const attendanceHeaders = [
          'Employee Code',
          'Employee Name',
          'Department',
          'Total Present Days',
          'Total Absent Days',
          'Total Late Days',
          'Attendance Rate (%)',
          'Period Start',
          'Period End',
          'Total Days in Period'
        ]

        const attendanceRows = attendanceByEmployee.map((item: any) => [
          item.employee_code || 'N/A',
          item.employee_name || 'N/A',
          item.department || 'N/A',
          item.total_present ?? 0,
          item.total_absent ?? 0,
          item.total_late ?? 0,
          item.attendance_rate ?? 0,
          attendanceReport?.period?.start || startStr,
          attendanceReport?.period?.end || endStr,
          attendanceReport?.period?.total_days ?? ''
        ])

        const attendanceCsv = [
          attendanceHeaders.join(','),
          ...attendanceRows.map((row: any[]) => row.join(','))
        ].join('\n')

        const attendanceBlob = new Blob([attendanceCsv], { type: 'text/csv;charset=utf-8;' })
        const attendanceLink = document.createElement('a')
        const attendanceUrl = URL.createObjectURL(attendanceBlob)
        attendanceLink.setAttribute('href', attendanceUrl)
        attendanceLink.setAttribute('download', `attendance_${reportType.toLowerCase()}_${startStr}_${endStr}.csv`)
        attendanceLink.style.visibility = 'hidden'
        document.body.appendChild(attendanceLink)
        attendanceLink.click()
        document.body.removeChild(attendanceLink)
      }

      // ===== Leave report (request-level data) =====
      const leaveRequestsReport = Array.isArray(leaveReport?.requests)
        ? leaveReport.requests
        : []

      if (leaveRequestsReport.length > 0) {
        const leaveHeaders = [
          'Employee Code',
          'Employee Name',
          'Department',
          'Leave Type',
          'Start Date',
          'End Date',
          'Days Requested',
          'Status',
          'Year'
        ]

        const leaveRows = leaveRequestsReport.map((req: any) => [
          req.employee_code || 'N/A',
          req.employee_name || 'N/A',
          req.department || 'N/A',
          req.leave_type || 'N/A',
          req.start_date || 'N/A',
          req.end_date || 'N/A',
          req.days_requested ?? 'N/A',
          (req.status || 'N/A').toString().toUpperCase(),
          leaveReport?.year ?? year
        ])

        const leaveCsv = [
          leaveHeaders.join(','),
          ...leaveRows.map((row: any[]) => row.join(','))
        ].join('\n')

        const leaveBlob = new Blob([leaveCsv], { type: 'text/csv;charset=utf-8;' })
        const leaveLink = document.createElement('a')
        const leaveUrl = URL.createObjectURL(leaveBlob)
        leaveLink.setAttribute('href', leaveUrl)
        leaveLink.setAttribute('download', `leave_${reportType.toLowerCase()}_${year}.csv`)
        leaveLink.style.visibility = 'hidden'
        document.body.appendChild(leaveLink)
        leaveLink.click()
        document.body.removeChild(leaveLink)
      }

      if (attendanceByEmployee.length === 0 && leaveRequestsReport.length === 0) {
        toast({
          title: "No Data",
          description: `No attendance or leave records found in the selected ${reportType.toLowerCase()} period.`,
        })
      } else {
        toast({
          title: "Reports Downloaded",
          description: `${reportType} attendance and leave reports have been downloaded successfully from live data.`,
        })
      }
    } catch (error) {
      console.error('Failed to generate reports:', error)
      toast({
        title: "Error",
        description: "Failed to generate attendance/leave reports. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Updated handleSubmit function with enhanced leave request data
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmittingLeave) return

    if (!selectedEmployee || !leaveType || !startDate || !endDate) {
      toast({
        title: "Error", 
        description: "Please fill in all required fields (Employee, Leave Type, Start Date, and End Date)",
        variant: "destructive",
      })
      return
    }

    // Find the leave type ID from the selected leave type name
    const selectedLeaveType = leaveTypes.find(lt => 
      lt.name === leaveType || lt.id?.toString() === leaveType
    )
    
    if (!selectedLeaveType || !selectedLeaveType.id) {
      toast({
        title: "Error", 
        description: "Invalid leave type selected. Please select a valid leave type.",
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

    // All users (including HR Manager) can only submit leave requests for themselves.
    // Compare against the employee record id (user.employee_id), NOT the auth user id (user.id) —
    // they are different identifiers and `selectedEmployee` holds the employee id.
    const ownEmployeeId = user?.employee_id?.toString()
    if (ownEmployeeId && selectedEmployee !== ownEmployeeId) {
      toast({
        title: "Access Denied",
        description: "You can only submit leave requests for yourself",
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
      
      // Try to submit to database
      try {
        setIsSubmittingLeave(true)
        // Create FormData to handle file uploads
        const formData = new FormData()
        formData.append('employee_id', selectedEmployee)
        formData.append('leave_type_id', selectedLeaveType.id.toString())
        formData.append('start_date', startDate)
        formData.append('end_date', endDate)
        formData.append('reason', reason || 'Leave request submitted')
        
        // Add contact during leave if provided
        if (contactDuringLeave) {
          formData.append('contact_during_leave', contactDuringLeave)
        }
        
        // Collect all documents into an array
        const documents: File[] = []
        const documentTypes: string[] = []
        
        if (medicalCertificate) {
          documents.push(medicalCertificate)
          documentTypes.push('medical_certificate')
        }
        if (birthCertificate) {
          documents.push(birthCertificate)
          documentTypes.push('birth_certificate')
        }
        if (deathCertificate) {
          documents.push(deathCertificate)
          documentTypes.push('death_certificate')
        }
        if (admissionLetter) {
          documents.push(admissionLetter)
          documentTypes.push('admission_letter')
        }
        if (otherDocument) {
          documents.push(otherDocument)
          documentTypes.push(otherDocumentType || 'other')
        }
        
        // Add all documents to FormData
        documents.forEach((file, index) => {
          formData.append('documents[]', file)
          formData.append(`document_types[${index}]`, documentTypes[index])
        })
        
        await apiService.createLeaveRequest(formData)
        
        // Refresh leave requests from database
        await fetchLeaveRequests()
        
        toast({
          title: "Success",
          description: `Leave request submitted for ${selectedEmp ? `${selectedEmp.first_name} ${selectedEmp.last_name}` : "Employee"}`,
        })
      } catch (dbError: any) {
        console.error('Database submission failed:', dbError)
        
        // Show backend validation errors if available
        const errorMessage = dbError?.message || 'Failed to submit leave request';
        const backendErrors = dbError?.response?.data?.errors || dbError?.errors;

        // Requirement 1: Annual leave cap exceeded
        const errCode = dbError?.data?.error || (errorMessage === 'LEAVE_LIMIT_REACHED' ? 'LEAVE_LIMIT_REACHED' : null);
        if (errCode === 'LEAVE_LIMIT_REACHED') {
          const used = dbError?.data?.used ?? '?';
          const limit = dbError?.data?.limit ?? 20;
          toast({
            title: "Leave Quota Exceeded",
            description: `You have used ${used} of ${limit} days this year.`,
            variant: "destructive",
          });
          return;
        }

        // Supervisor / line-manager routing failures from backend
        if (errCode === 'NO_LINE_MANAGER_FOUND') {
          toast({
            title: "No line manager assigned",
            description:
              dbError?.data?.debug_info?.message ||
              "This employee has no resolvable supervisor. Ask HR to set 'Supervisor Name' on the employee profile (matching an existing employee's full name or firstname.lastname@emeraldcfze.com).",
            variant: "destructive",
          });
          return;
        }
        if (errCode === 'CIRCULAR_ROUTING_DETECTED') {
          toast({
            title: "Circular approval routing",
            description:
              "The resolved supervisor is the requester themselves. HR must correct the 'Supervisor Name' on this employee's profile.",
            variant: "destructive",
          });
          return;
        }

        if (backendErrors) {
          const errorDetails = Object.values(backendErrors).flat().join(', ');
          toast({
            title: "Validation Error",
            description: errorDetails || errorMessage,
            variant: "destructive",
          })
          return; // Don't fallback to local storage if there's a validation error
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
        
        // Fallback to local state and localStorage only for network errors
        const newRequest = {
          id: Date.now(),
          employee_id: parseInt(selectedEmployee),
          employee_name: selectedEmp ? `${selectedEmp.first_name} ${selectedEmp.last_name}` : "Unknown",
          leave_type: selectedLeaveType.name,
          leave_type_id: selectedLeaveType.id,
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
    } finally {
      setIsSubmittingLeave(false)
    }
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

  // Function to handle approve/reject leave requests
  const handleUpdateLeaveStatus = async (requestId: number, newStatus: string, notes?: string) => {
    try {
      // Get current user's employee ID for approved_by
      const currentUserEmployee = employees.find(emp => 
        emp.email?.toLowerCase() === user?.email?.toLowerCase()
      )
      
      if (!currentUserEmployee?.id) {
        toast({
          title: "Error",
          description: "Unable to identify approver. Please contact support.",
          variant: "destructive"
        })
        return
      }

      // Try to update in database
      try {
        await apiService.updateLeaveRequest(
          requestId, 
          newStatus === "Approved" ? "approved" : "rejected",
          currentUserEmployee.id,
          notes
        )
        
        // Refresh leave requests from database
        await fetchLeaveRequests()
        
        // Close approval dialog if open
        setShowApprovalDialog(false)
        setApprovalNotes("")
        
        toast({
          title: "Success",
          description: `Leave request ${newStatus.toLowerCase()} successfully`,
        })
      } catch (dbError: any) {
        console.error('Database update failed:', dbError)

        // Requirement 1: leave cap reached at approval
        if (dbError?.data?.error === 'LEAVE_LIMIT_REACHED' || dbError?.message === 'LEAVE_LIMIT_REACHED') {
          const used = dbError?.data?.used ?? '?';
          const limit = dbError?.data?.limit ?? 20;
          toast({
            title: "Cannot Approve",
            description: `Employee has reached annual leave limit (${used}/${limit}).`,
            variant: "destructive"
          });
          return;
        }

        const errorMessage = dbError?.response?.data?.message || dbError?.message || 'Failed to update leave status'
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
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

  const handleApproveRejectClick = (requestId: number, action: 'approve' | 'reject') => {
    setSelectedLeaveRequest(leaveRequests.find(req => req.id === requestId))
    setApprovalAction(action)
    setApprovalNotes("")
    setShowApprovalDialog(true)
  }

  const handleConfirmApproval = () => {
    if (selectedLeaveRequest) {
      const status = approvalAction === 'approve' ? 'Approved' : 'Rejected'
      handleUpdateLeaveStatus(selectedLeaveRequest.id, status, approvalNotes)
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
        <RoleBasedComponent allowedRoles={['executive', 'hr_manager', 'corporate_hr']}>
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

      {/* HR / Corporate HR: pending late clock-in & early clock-out approvals */}
      <AttendanceApprovalsCard />

      {/* Employee self-service: status of my submitted justifications */}
      <MyAttendanceRequestsCard employeeId={currentEmployeeId} />

      {/* Employee self-service: weekly attendance from the backend */}
      <WeeklyAttendanceCard employeeId={currentEmployeeId} />

      {/* Employee self-service: exception & WFH requests */}
      <div className="flex flex-wrap gap-2 mb-6">
        {canSubmitException(user) && (
          <ExceptionRequestForm
            employeeId={currentEmployeeId}
            onSubmitted={() => setWorkRequestsKey((k) => k + 1)}
          />
        )}
        {canSubmitWFH(user) && (
          <WFHRequestForm
            employeeId={currentEmployeeId}
            onSubmitted={() => setWorkRequestsKey((k) => k + 1)}
          />
        )}
      </div>
      <MyWorkRequestsCard employeeId={currentEmployeeId} refreshKey={workRequestsKey} />


      {/* Today's Attendance Section - Manager View */}
      <RoleBasedComponent allowedRoles={['hr_manager', 'corporate_hr', 'executive', 'line_manager']}>
        <Card className="border-border/50 shadow-sm mb-6">
          <CardHeader 
            className="cursor-pointer" 
            onClick={() => setShowTodayAttendance(!showTodayAttendance)}
          >
            <CardTitle className="text-primary flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                {user?.role === 'line_manager' ? "Today's Attendance - My Team" : "Today's Attendance - All Staff"}
              </div>
              <ChevronDown className={`h-5 w-5 transition-transform ${showTodayAttendance ? 'rotate-180' : ''}`} />
            </CardTitle>
          </CardHeader>
          {showTodayAttendance && (
          <CardContent>
            <div className="space-y-3">
              {todayAttendance.length > 0 ? (
                todayAttendance.map((record) => (
                  <div key={record.id} className="p-3 bg-accent/50 rounded-lg border">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium text-sm">{record.employee_name}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          <div className="flex items-center gap-1">
                            <LogIn className="w-3 h-3" />
                            Clock In: {formatAttTime(record.clock_in)}
                          </div>
                          {record.clock_out && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <LogOut className="w-3 h-3" />
                              Clock Out: {formatAttTime(record.clock_out)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {record.clock_in && !record.clock_out && (
                          <Badge variant="default" className="text-xs">
                            Active
                          </Badge>
                        )}
                        {record.clock_out && (
                          <Badge variant="outline" className="text-xs">
                            Completed
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Show early departure reason if exists */}
                    {record.early_departure_reason && (
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <div className="text-xs font-medium text-destructive flex items-center gap-1">
                          <Bell className="w-3 h-3" />
                          Early Departure:
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 pl-4">
                          {record.early_departure_reason}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No attendance records for today</p>
              )}
            </div>
          </CardContent>
          )}
        </Card>
      </RoleBasedComponent>

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
              {/* Requirement 1: Annual Leave Balance */}
              <div className="mb-4">
                <LeaveBalanceCard employeeId={currentEmployeeId ?? undefined} />
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Section A: Employee Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-primary border-b pb-2">Section A: Employee Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="employee">Employee *</Label>
                    {user?.role === 'hr_manager' ? (
                      <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingEmployees ? "Loading employees..." : "Select employee"} />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border shadow-lg max-h-60">
                          {employees.length > 0 ? (
                            employees
                              .filter(emp => emp.employment_type !== 'Contract')
                              .map((emp) => (
                                <SelectItem key={emp.id} value={emp.id?.toString() || '0'}>
                                  {emp.employee_display || `${emp.employee_code ? emp.employee_code + ' - ' : ''}${emp.first_name} ${emp.last_name}`}
                                </SelectItem>
                              ))
                          ) : (
                            <SelectItem value="no-employees" disabled>
                              {isLoadingEmployees ? "Loading..." : "No employees available"}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id="employee"
                        value={
                          isLoadingEmployees 
                            ? "Loading..." 
                            : employees.length === 0
                            ? `${user?.firstName} ${user?.lastName}` || "Loading employee information..."
                            : (() => {
                                const currentEmployee = employees.find(emp => 
                                  emp.email?.toLowerCase() === user?.email?.toLowerCase()
                                );
                                return currentEmployee 
                                  ? (currentEmployee.employee_display || `${currentEmployee.employee_code ? currentEmployee.employee_code + ' - ' : ''}${currentEmployee.first_name} ${currentEmployee.last_name}`)
                                  : `${user?.firstName} ${user?.lastName}` || "Employee not found";
                              })()
                        }
                        disabled
                        className="bg-muted cursor-not-allowed"
                      />
                    )}
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
                    <Select 
                      value={leaveType} 
                      onValueChange={setLeaveType}
                      disabled={isLoadingLeaveTypes || leaveTypes.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingLeaveTypes ? "Loading leave types..." : leaveTypes.length === 0 ? "No leave types available" : "Select leave type"} />
                      </SelectTrigger>
                      {leaveTypes.length > 0 && (
                        <SelectContent className="bg-popover border shadow-lg">
                          {leaveTypes.map((lt) => (
                            <SelectItem key={lt.id} value={lt.name}>
                              {lt.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      )}
                    </Select>
                    {!isLoadingLeaveTypes && leaveTypes.length === 0 && (
                      <p className="text-sm text-muted-foreground">No leave types are currently available. Please contact HR.</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2 min-w-0">
                      <Label htmlFor="startDate">Start Date *</Label>
                      <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className="w-full justify-start text-left font-normal min-w-0"
                          >
                            <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
                            <span className="truncate">
                              {startDate ? format(new Date(startDate), "PPP") : "Pick start date"}
                            </span>
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
                    <div className="space-y-2 min-w-0">
                      <Label htmlFor="endDate">End Date *</Label>
                      <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className="w-full justify-start text-left font-normal min-w-0"
                          >
                            <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
                            <span className="truncate">
                              {endDate ? format(new Date(endDate), "PPP") : "Pick end date"}
                            </span>
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

                <Button type="submit" className="w-full" disabled={isSubmittingLeave}>
                  <Plus className="mr-2 h-4 w-4" />
                  {isSubmittingLeave ? "Submitting…" : "Submit Leave Request"}
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
            {/* Filters for Managers and HR */}
            {(user?.role === 'hr_manager' || user?.role === 'line_manager' || user?.role === 'corporate_hr' || user?.role === 'executive') && (
              <div className="mb-4 p-4 bg-muted/50 rounded-lg space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">Filters</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Status Filter */}
                  <div className="space-y-1">
                    <Label className="text-xs">Status</Label>
                    <Select value={leaveFilterStatus} onValueChange={setLeaveFilterStatus}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Employee Filter - Only for HR/Execs */}
                  {(user?.role === 'hr_manager' || user?.role === 'corporate_hr' || user?.role === 'executive') && (
                    <div className="space-y-1">
                      <Label className="text-xs">Employee</Label>
                      <Select value={leaveFilterEmployee} onValueChange={setLeaveFilterEmployee}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="All Employees" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Employees</SelectItem>
                          {employees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id?.toString() || ''}>
                              {emp.first_name} {emp.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Department Filter - Only for HR/Execs */}
                  {(user?.role === 'hr_manager' || user?.role === 'corporate_hr' || user?.role === 'executive') && (
                    <div className="space-y-1">
                      <Label className="text-xs">Department</Label>
                      <Select value={leaveFilterDepartment} onValueChange={setLeaveFilterDepartment}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="All Departments" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Departments</SelectItem>
                          {Array.from(new Set(employees.map(emp => emp.department).filter(Boolean))).map((dept) => (
                            <SelectItem key={dept} value={dept || ''}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Leave Type Filter */}
                  <div className="space-y-1">
                    <Label className="text-xs">Leave Type</Label>
                    <Select value={leaveFilterType} onValueChange={setLeaveFilterType}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {leaveTypes.map((lt) => (
                          <SelectItem key={lt.id} value={lt.id?.toString() || ''}>
                            {lt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date From Filter */}
                  <div className="space-y-1">
                    <Label className="text-xs">From Date</Label>
                    <Input
                      type="date"
                      value={leaveFilterDateFrom}
                      onChange={(e) => setLeaveFilterDateFrom(e.target.value)}
                      className="h-9"
                    />
                  </div>

                  {/* Date To Filter */}
                  <div className="space-y-1">
                    <Label className="text-xs">To Date</Label>
                    <Input
                      type="date"
                      value={leaveFilterDateTo}
                      onChange={(e) => setLeaveFilterDateTo(e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>

                {/* Clear Filters Button */}
                <div className="flex justify-end pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setLeaveFilterStatus("all")
                      setLeaveFilterEmployee("all")
                      setLeaveFilterType("all")
                      setLeaveFilterDateFrom("")
                      setLeaveFilterDateTo("")
                      setLeaveFilterDepartment("all")
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
            <div className="space-y-4">
              {(() => {
                // Ensure leaveRequests is always an array
                const safeLeaveRequests = Array.isArray(leaveRequests) ? leaveRequests : []
                
                // Backend already filters by role, but add frontend safety check
                // HR managers and line managers see filtered results from backend
                // General employees see only their own
                let filteredRequests = safeLeaveRequests
                
                // Additional frontend filtering for safety (backend is primary filter)
                if (user?.role === 'general_employee' || user?.role === 'finance') {
                  filteredRequests = safeLeaveRequests.filter(req => 
                    req.employee_id === user?.id || req.employee?.id === user?.id
                  )
                }

                // Apply frontend filters for managers and HR
                if (user?.role === 'hr_manager' || user?.role === 'line_manager' || user?.role === 'corporate_hr' || user?.role === 'executive') {
                  // Status filter
                  if (leaveFilterStatus !== "all") {
                    filteredRequests = filteredRequests.filter(req => 
                      req.status?.toLowerCase() === leaveFilterStatus.toLowerCase()
                    )
                  }

                  // Employee filter
                  if (leaveFilterEmployee !== "all") {
                    filteredRequests = filteredRequests.filter(req => 
                      req.employee_id?.toString() === leaveFilterEmployee || 
                      req.employee?.id?.toString() === leaveFilterEmployee
                    )
                  }

                  // Department filter
                  if (leaveFilterDepartment !== "all") {
                    filteredRequests = filteredRequests.filter(req => 
                      req.employee?.department === leaveFilterDepartment ||
                      req.department === leaveFilterDepartment
                    )
                  }

                  // Leave type filter
                  if (leaveFilterType !== "all") {
                    filteredRequests = filteredRequests.filter(req => 
                      req.leave_type_id?.toString() === leaveFilterType ||
                      req.leaveType?.id?.toString() === leaveFilterType
                    )
                  }

                  // Date range filters
                  if (leaveFilterDateFrom) {
                    filteredRequests = filteredRequests.filter(req => {
                      const startDate = new Date(req.start_date)
                      const filterFrom = new Date(leaveFilterDateFrom)
                      return startDate >= filterFrom
                    })
                  }

                  if (leaveFilterDateTo) {
                    filteredRequests = filteredRequests.filter(req => {
                      const endDate = new Date(req.end_date)
                      const filterTo = new Date(leaveFilterDateTo)
                      return endDate <= filterTo
                    })
                  }
                }
                
                return filteredRequests.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {(user?.role === 'hr_manager' || user?.role === 'line_manager' || user?.role === 'corporate_hr' || user?.role === 'executive') && (
                          <TableHead>Employee</TableHead>
                        )}
                        <TableHead>Leave Type</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((request) => {
                        // Calculate days for display
                        const start = new Date(request.start_date)
                        const end = new Date(request.end_date)
                        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
                        
                        return (
                          <TableRow key={request.id}>
                            {(user?.role === 'hr_manager' || user?.role === 'line_manager' || user?.role === 'corporate_hr' || user?.role === 'executive') && (
                              <TableCell className="font-medium">
                                {request.employee_display
                                  || (request.employee_code && request.employee_name
                                        ? `${request.employee_code} - ${request.employee_name}`
                                        : request.employee_name)
                                  || (request.employee?.first_name && request.employee?.last_name
                                        ? `${request.employee.employee_code ? request.employee.employee_code + ' - ' : ''}${request.employee.first_name} ${request.employee.last_name}`
                                        : `Employee ${request.employee_id}`)}
                              </TableCell>
                            )}
                            <TableCell>{request.leave_type || request.leaveType?.name || 'N/A'}</TableCell>
                            <TableCell>{format(new Date(request.start_date), "MMM dd, yyyy")}</TableCell>
                            <TableCell>{format(new Date(request.end_date), "MMM dd, yyyy")}</TableCell>
                            <TableCell>{days} day{days > 1 ? 's' : ''}</TableCell>
                            <TableCell>
                              {getStatusBadge(request.status)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {/* View Details button - only for HR managers, line managers, and the employee themselves */}
                                {(user?.role === 'hr_manager' || 
                                  user?.role === 'line_manager' || 
                                  user?.role === 'corporate_hr' ||
                                  user?.role === 'executive' ||
                                  request.employee_id === user?.id || 
                                  request.employee?.id === user?.id) && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedLeaveRequest(request)
                                      setShowLeaveDetailsDialog(true)
                                    }}
                                    className="h-8 w-8 p-0"
                                    title="View Details"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                )}
                                {/* Approve/Reject buttons - only for HR managers and line managers */}
                                {(user?.role === 'hr_manager' || 
                                  user?.role === 'line_manager' || 
                                  user?.role === 'corporate_hr' || 
                                  user?.role === 'executive') && 
                                  request.status === "Pending" && (
                                    <>
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => handleApproveRejectClick(request.id, 'approve')}
                                        className="text-xs"
                                      >
                                        Approve
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => handleApproveRejectClick(request.id, 'reject')}
                                        className="text-xs"
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
                )
              })()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Leave Balances */}
      <RoleBasedComponent allowedRoles={['hr_manager', 'corporate_hr', 'executive']}>
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-primary">Employee Leave Balances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {employees.map((emp) => (
                <div key={emp.id} className="p-4 border rounded-lg bg-card">
                  <div className="font-medium text-sm">{emp.first_name} {emp.last_name}</div>
                  <div className="text-xs text-muted-foreground">{emp.employee_code || emp.id}</div>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Total:</span>
                      <span>{emp.vacation_days || 0} days</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Used:</span>
                      <span>0 days</span>
                    </div>
                    <div className="flex justify-between text-xs font-medium">
                      <span>Remaining:</span>
                      <span className="text-primary">{emp.vacation_days || 0} days</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </RoleBasedComponent>

      {/* Approval/Rejection Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
            </DialogTitle>
            <DialogDescription>
              {approvalAction === 'approve' 
                ? 'Are you sure you want to approve this leave request? You can add optional notes below.'
                : 'Are you sure you want to reject this leave request? Please provide a reason below.'}
            </DialogDescription>
          </DialogHeader>
          {selectedLeaveRequest && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground">Employee</Label>
                  <p className="font-medium">{selectedLeaveRequest.employee_display || selectedLeaveRequest.employee_name || `Employee ${selectedLeaveRequest.employee_id}`}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Leave Type</Label>
                  <p className="font-medium">{selectedLeaveRequest.leave_type || selectedLeaveRequest.leaveType?.name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Start Date</Label>
                  <p className="font-medium">{format(new Date(selectedLeaveRequest.start_date), "MMM dd, yyyy")}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Days</Label>
                  <p className="font-medium">{selectedLeaveRequest.days_requested || 'N/A'} day{(selectedLeaveRequest.days_requested || 0) !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div>
                <Label htmlFor="approvalNotes" className="text-sm">
                  {approvalAction === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason *'}
                </Label>
                <Textarea
                  id="approvalNotes"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder={approvalAction === 'approve' 
                    ? 'Optional notes about this approval...'
                    : 'Please provide a reason for rejection...'}
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowApprovalDialog(false)
              setApprovalNotes("")
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmApproval}
              variant={approvalAction === 'approve' ? 'default' : 'destructive'}
              disabled={approvalAction === 'reject' && !approvalNotes.trim()}
            >
              {approvalAction === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Request Details Dialog */}
      <Dialog open={showLeaveDetailsDialog} onOpenChange={setShowLeaveDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Leave Request Details</DialogTitle>
            <DialogDescription>
              View complete information about this leave request
            </DialogDescription>
          </DialogHeader>
          {selectedLeaveRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Employee</Label>
                  <p className="font-medium">{selectedLeaveRequest.employee_display || selectedLeaveRequest.employee_name || `Employee ${selectedLeaveRequest.employee_id}`}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Leave Type</Label>
                  <p className="font-medium">{selectedLeaveRequest.leave_type || selectedLeaveRequest.leaveType?.name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Start Date</Label>
                  <p className="font-medium">{format(new Date(selectedLeaveRequest.start_date), "MMM dd, yyyy")}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">End Date</Label>
                  <p className="font-medium">{format(new Date(selectedLeaveRequest.end_date), "MMM dd, yyyy")}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Days Requested</Label>
                  <p className="font-medium">{selectedLeaveRequest.days_requested || 'N/A'} day{(selectedLeaveRequest.days_requested || 0) !== 1 ? 's' : ''}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <div>{getStatusBadge(selectedLeaveRequest.status)}</div>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm text-muted-foreground">Routed To (First-level Approver)</Label>
                  <p className="font-medium">
                    {selectedLeaveRequest.line_manager_name
                      || selectedLeaveRequest.routed_to_name
                      || selectedLeaveRequest.supervisor_name
                      || 'Pending supervisor resolution'}
                    {(selectedLeaveRequest.line_manager_email || selectedLeaveRequest.routed_to_email) && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({selectedLeaveRequest.line_manager_email || selectedLeaveRequest.routed_to_email})
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {selectedLeaveRequest.reason && (
                <div>
                  <Label className="text-sm text-muted-foreground">Reason</Label>
                  <p className="mt-1 p-3 bg-muted rounded-lg">{selectedLeaveRequest.reason}</p>
                </div>
              )}

              {selectedLeaveRequest.contact_during_leave && (
                <div>
                  <Label className="text-sm text-muted-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Contact During Leave
                  </Label>
                  <p className="mt-1 p-3 bg-muted rounded-lg">{selectedLeaveRequest.contact_during_leave}</p>
                </div>
              )}

              {selectedLeaveRequest.documents && Array.isArray(selectedLeaveRequest.documents) && selectedLeaveRequest.documents.length > 0 && (
                <div>
                  <Label className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                    <File className="h-4 w-4" />
                    Documents ({selectedLeaveRequest.documents.length})
                  </Label>
                  <div className="space-y-2">
                    {selectedLeaveRequest.documents.map((doc: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{doc.filename || `Document ${index + 1}`}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.type && <span className="capitalize">{doc.type.replace('_', ' ')}</span>}
                            {doc.size && ` • ${(doc.size / 1024).toFixed(2)} KB`}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Construct download URL
                            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
                            // Remove 'public/' prefix if present, as Laravel storage serves from /storage
                            const cleanPath = doc.path?.replace('public/', '') || doc.path
                            const fileUrl = `${baseUrl}/storage/${cleanPath}`
                            window.open(fileUrl, '_blank')
                          }}
                          className="ml-2"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!selectedLeaveRequest.documents || !Array.isArray(selectedLeaveRequest.documents) || selectedLeaveRequest.documents.length === 0) && 
               !selectedLeaveRequest.contact_during_leave && 
               !selectedLeaveRequest.reason && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No additional information available
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLeaveDetailsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* This Month's Birthdays & Anniversaries - Collapsible */}
      <CollapsibleCelebrations 
        celebrations={currentMonthCelebrations} 
        isLoading={isCelebrationsLoading}
      />
    </div>
  )
}

// Collapsible Celebrations Component
function CollapsibleCelebrations({ 
  celebrations, 
  isLoading 
}: { 
  celebrations: Celebration[], 
  isLoading: boolean 
}) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
      <div className="flex items-center justify-between">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-4 h-auto bg-gradient-to-r from-pink-500/10 via-amber-500/10 to-purple-500/10 hover:from-pink-500/20 hover:via-amber-500/20 hover:to-purple-500/20 rounded-lg border border-border/30">
            <span className="flex items-center gap-2 font-semibold text-foreground">
              <span className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-amber-500 text-white">
                🎉
              </span>
              This Month's Birthdays & Anniversaries
              <Badge variant="secondary" className="ml-2">
                {celebrations.length}
              </Badge>
            </span>
            {isOpen ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="space-y-2">
        <CelebrationsCard 
          celebrations={celebrations} 
          isLoading={isLoading}
          title=""
          className="border-t-0 rounded-t-none"
        />
      </CollapsibleContent>
    </Collapsible>
  )
}