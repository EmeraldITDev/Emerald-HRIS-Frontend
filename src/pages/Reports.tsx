import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Download, User, Calendar, MapPin, Phone, Mail, Briefcase } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { apiService, Employee } from '@/lib/api'
import { format } from 'date-fns'
import jsPDF from 'jspdf'

export default function Reports() {
  const { user } = useAuth()
  const isLineManager = user?.role === 'line_manager'
  const isExecutiveOrHR = user?.role === 'executive' || user?.role === 'hr_manager' || user?.role === 'corporate_hr'
  const userDepartment = user?.department
  
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [reportData, setReportData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  
  useEffect(() => {
    fetchEmployees()
  }, [])
  
  const fetchEmployees = async () => {
    try {
      let data = await apiService.getEmployees()
      
      // Filter by department for line managers
      if (isLineManager && userDepartment) {
        data = data.filter(emp => emp.department === userDepartment)
      }
      
      setEmployees(data)
    } catch (error) {
      console.error('Failed to fetch employees:', error)
      toast({
        title: "Error",
        description: "Failed to load employees",
        variant: "destructive"
      })
    }
  }

  const handleEmployeeSelect = async (employeeId: string) => {
    setSelectedEmployee(employeeId)
    setIsLoading(true)
    
    try {
      const report = await apiService.getEmployeeReport(parseInt(employeeId))
      
      // Transform backend data to frontend format
      const transformedReport = {
        id: report.employee.employee_code || `EMP${report.employee.id.toString().padStart(3, '0')}`,
        firstName: report.employee.first_name,
        lastName: report.employee.last_name,
        email: report.employee.email,
        phone: report.employee.phone_number || 'N/A',
        department: report.employee.department || 'N/A',
        position: report.employee.job_title || 'N/A',
        employmentType: report.employee.employment_type || 'N/A',
        status: report.employee.employment_status || 'Active',
        joinDate: report.employee.hire_date || 'N/A',
        birthDate: report.employee.birth_date || 'N/A',
        gender: report.employee.gender || 'N/A',
        maritalStatus: report.employee.marital_status || 'N/A',
        nationality: report.employee.nationality || 'N/A',
        stateOfOrigin: report.employee.state_of_origin || 'N/A',
        vacationDays: report.leave_summary.vacation_days_allocated || 0,
        vacationTaken: report.leave_summary.vacation_days_taken || 0,
        vacationRemaining: report.leave_summary.vacation_days_remaining || 0,
        salary: report.financial.gross_salary ? `₦${report.financial.gross_salary.toLocaleString()}` : 'N/A',
        netSalary: report.financial.net_salary ? `₦${report.financial.net_salary.toLocaleString()}` : 'N/A',
        address: report.employee.address || 'N/A',
        emergencyContact: report.employee.emergency_contact_name 
          ? `${report.employee.emergency_contact_name} (${report.employee.emergency_contact_relationship}) - ${report.employee.emergency_contact_phone}`
          : 'N/A',
        financial: {
          bankName: report.financial.bank_name,
          accountNumber: report.financial.account_number,
          pensionPin: report.financial.pension_pin,
          taxId: report.financial.tax_id,
        },
        attendance: report.attendance_summary,
        payroll: report.payroll_summary,
        performance: report.performance,
        systemRole: report.system_role,
      }
      
      setReportData(transformedReport)
    } catch (error: any) {
      console.error('Failed to fetch employee report:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to load employee report",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadReport = () => {
    if (!reportData) {
      toast({
        title: "No employee selected",
        description: "Please select an employee to generate a report.",
        variant: "destructive"
      })
      return
    }

    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      let yPos = 20

      // Header
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text('EMPLOYEE REPORT', pageWidth / 2, yPos, { align: 'center' })
      
      yPos += 15
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Generated on: ${format(new Date(), 'MMMM dd, yyyy')}`, pageWidth / 2, yPos, { align: 'center' })
      
      yPos += 15

      // Personal Information
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('PERSONAL INFORMATION', 20, yPos)
      yPos += 8

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Name: ${reportData.firstName} ${reportData.lastName}`, 20, yPos)
      yPos += 6
      doc.text(`Employee ID: ${reportData.id}`, 20, yPos)
      yPos += 6
      doc.text(`Email: ${reportData.email}`, 20, yPos)
      yPos += 6
      doc.text(`Phone: ${reportData.phone}`, 20, yPos)
      yPos += 6
      doc.text(`Address: ${reportData.address}`, 20, yPos)
      yPos += 6
      doc.text(`Birth Date: ${reportData.birthDate}`, 20, yPos)
      yPos += 6
      doc.text(`Gender: ${reportData.gender}`, 20, yPos)
      yPos += 6
      doc.text(`Marital Status: ${reportData.maritalStatus}`, 20, yPos)
      yPos += 6
      doc.text(`Nationality: ${reportData.nationality}`, 20, yPos)
      yPos += 10

      // Employment Details
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('EMPLOYMENT DETAILS', 20, yPos)
      yPos += 8

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Department: ${reportData.department}`, 20, yPos)
      yPos += 6
      doc.text(`Position: ${reportData.position}`, 20, yPos)
      yPos += 6
      doc.text(`Employment Type: ${reportData.employmentType}`, 20, yPos)
      yPos += 6
      doc.text(`Status: ${reportData.status}`, 20, yPos)
      yPos += 6
      doc.text(`Join Date: ${reportData.joinDate}`, 20, yPos)
      yPos += 6
      doc.text(`System Role: ${reportData.systemRole}`, 20, yPos)
      yPos += 10

      // Compensation
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('COMPENSATION', 20, yPos)
      yPos += 8

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Gross Salary: ${reportData.salary}`, 20, yPos)
      yPos += 6
      doc.text(`Net Salary: ${reportData.netSalary}`, 20, yPos)
      yPos += 6
      doc.text(`Bank: ${reportData.financial.bankName}`, 20, yPos)
      yPos += 6
      doc.text(`Account Number: ${reportData.financial.accountNumber}`, 20, yPos)
      yPos += 10

      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      // Leave Summary
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('LEAVE SUMMARY', 20, yPos)
      yPos += 8

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Vacation Days Allocated: ${reportData.vacationDays} days`, 20, yPos)
      yPos += 6
      doc.text(`Vacation Days Taken: ${reportData.vacationTaken} days`, 20, yPos)
      yPos += 6
      doc.text(`Vacation Days Remaining: ${reportData.vacationRemaining} days`, 20, yPos)
      yPos += 10

      // Attendance Summary (Current Month)
      if (reportData.attendance) {
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('ATTENDANCE SUMMARY (Current Month)', 20, yPos)
        yPos += 8

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text(`Present: ${reportData.attendance.present} days`, 20, yPos)
        yPos += 6
        doc.text(`Absent: ${reportData.attendance.absent} days`, 20, yPos)
        yPos += 6
        doc.text(`Late: ${reportData.attendance.late} days`, 20, yPos)
        yPos += 6
        doc.text(`Attendance Rate: ${reportData.attendance.attendance_rate}%`, 20, yPos)
        yPos += 10
      }

      // Payroll Summary (YTD)
      if (reportData.payroll) {
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('PAYROLL SUMMARY (Year-to-Date)', 20, yPos)
        yPos += 8

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text(`Total Gross (YTD): ₦${reportData.payroll.total_gross_ytd.toLocaleString()}`, 20, yPos)
        yPos += 6
        doc.text(`Total Deductions (YTD): ₦${reportData.payroll.total_deductions_ytd.toLocaleString()}`, 20, yPos)
        yPos += 6
        doc.text(`Total Net (YTD): ₦${reportData.payroll.total_net_ytd.toLocaleString()}`, 20, yPos)
        yPos += 6
        doc.text(`Payroll Records: ${reportData.payroll.records_count}`, 20, yPos)
        yPos += 10
      }

      // Emergency Contact
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('EMERGENCY CONTACT', 20, yPos)
      yPos += 8

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(reportData.emergencyContact, 20, yPos)

      // Save the PDF
      doc.save(`Employee_Report_${reportData.id}_${format(new Date(), 'yyyy-MM-dd')}.pdf`)

      toast({
        title: "Report downloaded",
        description: `Employee report for ${reportData.firstName} ${reportData.lastName} has been downloaded.`
      })
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      toast({
        title: "Error",
        description: "Failed to generate PDF report",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
      case "active":
        return <Badge className="bg-success/10 text-success border-success/20">Active</Badge>
      case "On Leave":
        return <Badge className="bg-warning/10 text-warning border-warning/20">On Leave</Badge>
      case "Terminated":
      case "terminated":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Terminated</Badge>
      case "Resigned":
      case "resigned":
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">Resigned</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Employee Reports</h1>
          <p className="text-muted-foreground">
            {isLineManager && userDepartment 
              ? `Generate reports for ${userDepartment} department employees`
              : 'Generate comprehensive employee reports and documentation'
            }
          </p>
        </div>
        
        <Button 
          onClick={handleDownloadReport}
          disabled={!reportData || isLoading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Download className="mr-2 h-4 w-4" />
          Download PDF Report
        </Button>
      </div>

      {/* Employee Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Employee</CardTitle>
          <CardDescription>Choose an employee to generate a detailed report</CardDescription>
        </CardHeader>
        <CardContent>
          <Select onValueChange={handleEmployeeSelect} value={selectedEmployee}>
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Select an employee" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id?.toString() || ''}>
                  {employee.first_name} {employee.last_name} - {employee.employee_code || `EMP${employee.id?.toString().padStart(3, '0')}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isLoading && (
            <p className="mt-2 text-sm text-muted-foreground">Loading report data...</p>
          )}
        </CardContent>
      </Card>

      {/* Employee Report */}
      {reportData && !isLoading && (
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Employee Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">PERSONAL DETAILS</h4>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center">
                      <User className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{reportData.firstName} {reportData.lastName}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{reportData.email}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{reportData.phone}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{reportData.address}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">EMPLOYMENT DETAILS</h4>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Employee ID:</span>
                      <span className="font-medium">{reportData.id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Department:</span>
                      <span className="font-medium">{reportData.department}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Position:</span>
                      <span className="font-medium">{reportData.position}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Employment Type:</span>
                      <Badge variant={reportData.employmentType === 'Full-Time' ? 'default' : 'secondary'}>
                        {reportData.employmentType}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Status:</span>
                      {getStatusBadge(reportData.status)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Join Date:</span>
                      <span className="font-medium">{reportData.joinDate}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">System Role:</span>
                      <Badge variant="outline">{reportData.systemRole}</Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground">EMERGENCY CONTACT</h4>
                <p className="mt-1 text-sm">{reportData.emergencyContact}</p>
              </div>
            </CardContent>
          </Card>

          {/* Compensation & Financial */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="mr-2 h-5 w-5" />
                Compensation & Financial Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">COMPENSATION</h4>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Gross Salary:</span>
                      <span className="font-bold text-lg text-emerald-600">{reportData.salary}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Net Salary:</span>
                      <span className="font-bold text-emerald-600">{reportData.netSalary}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">BANKING & TAX</h4>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Bank:</span>
                      <span className="font-medium">{reportData.financial.bankName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Account Number:</span>
                      <span className="font-medium">{reportData.financial.accountNumber}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Pension PIN:</span>
                      <span className="font-medium">{reportData.financial.pensionPin || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Tax ID:</span>
                      <span className="font-medium">{reportData.financial.taxId || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time Off & Attendance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Leave Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Vacation Days Allocated:</span>
                    <span className="font-medium">{reportData.vacationDays} days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Vacation Days Taken:</span>
                    <span className="font-medium">{reportData.vacationTaken} days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Remaining Vacation:</span>
                    <span className="font-medium text-emerald-600">
                      {reportData.vacationRemaining} days
                    </span>
                  </div>
                  <Separator />
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Utilization Rate: {reportData.vacationDays > 0 ? ((reportData.vacationTaken / reportData.vacationDays) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {reportData.attendance && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="mr-2 h-5 w-5" />
                    Attendance Summary (Current Month)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Present:</span>
                      <Badge className="bg-success/10 text-success border-success/20">
                        {reportData.attendance.present} days
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Absent:</span>
                      <Badge variant="destructive">{reportData.attendance.absent} days</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Late:</span>
                      <Badge className="bg-warning/10 text-warning border-warning/20">
                        {reportData.attendance.late} days
                      </Badge>
                    </div>
                    <Separator />
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        Attendance Rate: {reportData.attendance.attendance_rate}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Payroll Summary */}
          {reportData.payroll && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="mr-2 h-5 w-5" />
                  Payroll Summary (Year-to-Date)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="text-sm text-muted-foreground">Total Gross Pay</h4>
                    <p className="text-2xl font-bold text-emerald-600">
                      ₦{reportData.payroll.total_gross_ytd.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm text-muted-foreground">Total Deductions</h4>
                    <p className="text-2xl font-bold text-red-600">
                      ₦{reportData.payroll.total_deductions_ytd.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm text-muted-foreground">Total Net Pay</h4>
                    <p className="text-2xl font-bold text-blue-600">
                      ₦{reportData.payroll.total_net_ytd.toLocaleString()}
                    </p>
                  </div>
                </div>
                <Separator className="my-4" />
                <p className="text-sm text-muted-foreground">
                  Based on {reportData.payroll.records_count} payroll record(s)
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
