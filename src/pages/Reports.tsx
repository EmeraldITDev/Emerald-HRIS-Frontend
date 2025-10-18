import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Download, FileText, User, Calendar, MapPin, Phone, Mail, Building, Briefcase } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { apiService, Employee } from '@/lib/api'

const dummyEmployeesOld = [
  {
    id: "EMP001",
    firstName: "Adebayo",
    lastName: "Johnson",
    email: "adebayo.johnson@company.com",
    phone: "+234 803 123 4567",
    department: "Engineering",
    position: "Senior Software Engineer",
    employmentType: "FTE",
    status: "Active",
    joinDate: "2022-03-15",
    vacationDays: 25,
    vacationTaken: 12,
    salary: "₦2,500,000",
    address: "123 Victoria Island, Lagos, Nigeria",
    emergencyContact: "Mrs. Folake Johnson - +234 803 987 6543",
    benefits: {
      hmo: true,
      lifeInsurance: true,
      internet: false,
      computer: true
    },
    performance: {
      lastReview: "2024 Q1",
      rating: "Exceeds Expectations",
      achievements: "Led successful project migration, improved team efficiency by 25%"
    },
    training: [
      {
        type: "Technical Skills",
        status: "In Progress",
        completionDate: "2024-03-15"
      }
    ]
  },
  {
    id: "EMP002",
    firstName: "Fatima",
    lastName: "Abdul",
    email: "fatima.abdul@company.com",
    phone: "+234 807 654 3210",
    department: "Human Resources",
    position: "HR Manager",
    employmentType: "FTE",
    status: "Active",
    joinDate: "2021-08-20",
    vacationDays: 30,
    vacationTaken: 20,
    salary: "₦1,800,000",
    address: "456 Ikoyi, Lagos, Nigeria",
    emergencyContact: "Mr. Musa Abdul - +234 807 123 4567",
    benefits: {
      hmo: true,
      lifeInsurance: false,
      internet: true,
      computer: true
    },
    performance: {
      lastReview: "2024 Q1",
      rating: "Meets Expectations",
      achievements: "Streamlined recruitment process, reduced time-to-hire by 30%"
    },
    training: [
      {
        type: "Leadership Development",
        status: "Completed",
        completionDate: "2024-02-28"
      }
    ]
  },
  {
    id: "EMP003",
    firstName: "Chinedu",
    lastName: "Okafor",
    email: "chinedu.okafor@company.com",
    phone: "+234 815 987 6543",
    department: "Supply Chain",
    position: "Financial Analyst",
    employmentType: "Consultant",
    status: "On Leave",
    joinDate: "2023-01-10",
    vacationDays: 20,
    vacationTaken: 8,
    salary: "₦1,200,000",
    address: "789 Surulere, Lagos, Nigeria",
    emergencyContact: "Mrs. Ngozi Okafor - +234 815 654 3210",
    benefits: {
      hmo: false,
      lifeInsurance: true,
      internet: true,
      computer: false
    },
    performance: {
      lastReview: "2024 Q1",
      rating: "Meets Expectations",
      achievements: "Improved financial reporting accuracy, implemented new cost tracking system"
    },
    training: []
  },
  {
    id: "EMP004",
    firstName: "Kemi",
    lastName: "Adeleke",
    email: "kemi.adeleke@company.com",
    phone: "+234 809 246 8135",
    department: "Marketing",
    position: "Marketing Specialist",
    employmentType: "FTE",
    status: "Active",
    joinDate: "2023-06-05",
    vacationDays: 25,
    vacationTaken: 15,
    salary: "₦950,000",
    address: "321 Yaba, Lagos, Nigeria",
    emergencyContact: "Mr. Tunde Adeleke - +234 809 876 5432",
    benefits: {
      hmo: true,
      lifeInsurance: true,
      internet: true,
      computer: true
    },
    performance: {
      lastReview: "2024 Q1",
      rating: "Meets Expectations",
      achievements: "Launched successful social media campaigns, increased brand awareness by 40%"
    },
    training: []
  }
]

export default function Reports() {
  const { user } = useAuth()
  const isLineManager = user?.role === 'line_manager'
  const isExecutiveOrHR = user?.role === 'executive' || user?.role === 'hr_manager' || user?.role === 'corporate_hr'
  const userDepartment = user?.department
  
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [reportData, setReportData] = useState<any>(null)
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
    }
  }

  const handleEmployeeSelect = (employeeId: string) => {
    const employee = employees.find(emp => emp.id?.toString() === employeeId)
    setSelectedEmployee(employeeId)
    if (employee) {
      // Transform employee data to match report format
      setReportData({
        id: employee.employee_code || `EMP${employee.id?.toString().padStart(3, '0')}`,
        firstName: employee.first_name,
        lastName: employee.last_name,
        email: employee.email,
        phone: employee.phone_number || 'N/A',
        department: employee.department || 'N/A',
        position: employee.job_title,
        employmentType: employee.employment_type || 'N/A',
        status: employee.employment_status || 'Active',
        joinDate: employee.hire_date || 'N/A',
        vacationDays: employee.vacation_days || 0,
        vacationTaken: 0, // Would need to fetch from attendance/leave data
        salary: employee.gross_salary ? `₦${employee.gross_salary.toLocaleString()}` : 'N/A',
        address: employee.address || 'N/A',
        emergencyContact: 'N/A', // Would need additional field
        benefits: {
          hmo: false,
          lifeInsurance: false,
          internet: false,
          computer: false
        },
        performance: {
          lastReview: 'N/A',
          rating: 'N/A',
          achievements: 'N/A'
        },
        training: []
      })
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

    toast({
      title: "Report generated",
      description: `Employee report for ${reportData.firstName} ${reportData.lastName} has been downloaded.`
    })
  }

  const getBenefitStatus = (benefit: boolean) => {
    return benefit ? (
      <Badge className="bg-success/10 text-success border-success/20">Active</Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-success/10 text-success border-success/20">Active</Badge>
      case "On Leave":
        return <Badge className="bg-warning/10 text-warning border-warning/20">On Leave</Badge>
      case "Terminated":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Terminated</Badge>
      case "Resigned":
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
          disabled={!reportData}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Download className="mr-2 h-4 w-4" />
          Download Report
        </Button>
      </div>

      {/* Employee Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Employee</CardTitle>
          <CardDescription>Choose an employee to generate a detailed report</CardDescription>
        </CardHeader>
        <CardContent>
          <Select onValueChange={handleEmployeeSelect}>
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
        </CardContent>
      </Card>

      {/* Employee Report */}
      {reportData && (
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
                      <Badge variant={reportData.employmentType === 'FTE' ? 'default' : 'secondary'}>
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

          {/* Compensation & Benefits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="mr-2 h-5 w-5" />
                Compensation & Benefits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">COMPENSATION</h4>
                  <div className="mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Annual Salary:</span>
                      <span className="font-bold text-lg text-emerald-600">{reportData.salary}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">BENEFITS PACKAGE</h4>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">HMO Coverage:</span>
                      {getBenefitStatus(reportData.benefits.hmo)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Life Insurance:</span>
                      {getBenefitStatus(reportData.benefits.lifeInsurance)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Internet Allowance:</span>
                      {getBenefitStatus(reportData.benefits.internet)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Computer/Equipment:</span>
                      {getBenefitStatus(reportData.benefits.computer)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time Off & Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Time Off Summary
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
                      {reportData.vacationDays - reportData.vacationTaken} days
                    </span>
                  </div>
                  <Separator />
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Utilization Rate: {((reportData.vacationTaken / reportData.vacationDays) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Last Review Period:</span>
                    <span className="font-medium">{reportData.performance.lastReview}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Overall Rating:</span>
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                      {reportData.performance.rating}
                    </Badge>
                  </div>
                  <Separator />
                  <div>
                    <h5 className="font-medium text-sm mb-2">Key Achievements:</h5>
                    <p className="text-sm text-muted-foreground">{reportData.performance.achievements}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Training Records */}
          {reportData.training.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Training & Development</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {reportData.training.map((training: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <span className="font-medium">{training.type}</span>
                        <p className="text-sm text-muted-foreground">Target: {training.completionDate}</p>
                      </div>
                      <Badge className={training.status === 'Completed' ? 'bg-success/10 text-success border-success/20' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'}>
                        {training.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}