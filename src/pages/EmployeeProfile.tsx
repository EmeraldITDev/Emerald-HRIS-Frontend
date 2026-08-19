import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  Edit, 
  Download, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Building2, 
  User, 
  DollarSign, 
  FileText, 
  Award,
  Clock,
  GraduationCap,
  Shield,
  CreditCard,
  Home,
  Car,
  Utensils,
  Banknote,
  IdCard,
  Building,
  Users,
  TrendingUp,
  Briefcase,
  Cake,
  Loader2
} from "lucide-react"
import jsPDF from "jspdf"
import { format } from "date-fns"
import { getWorkAnniversaryDate, getYearsOfService } from "@/utils/celebrations"
import apiService, { Employee } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { EmployeeEditDialog } from "@/components/EmployeeEditDialog"
import { EmployeeDocumentsPanel } from "@/components/EmployeeDocumentsPanel"

export default function EmployeeProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [leaveRemaining, setLeaveRemaining] = useState<number | null>(null)

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!id) return
      
      try {
        const employees = await apiService.getEmployees()
        const foundEmployee = employees.find(emp => emp.id?.toString() === id)
        
        if (foundEmployee) {
          setEmployee(foundEmployee)
          // Trigger backend recalc and pick up the latest annual-leave
          // remaining days (backend also syncs employees.vacation_days here).
          try {
            const bal: any = await apiService.getLeaveBalance(foundEmployee.id as any)
            const remaining =
              bal?.remaining ??
              bal?.summary?.vacation_days_remaining ??
              bal?.vacation_days_remaining
            if (typeof remaining === "number") {
              setLeaveRemaining(remaining)
              setEmployee(prev => prev ? { ...prev, vacation_days: remaining } : prev)
            }
          } catch (e) {
            console.warn("Leave balance sync failed", e)
          }
        } else {
          toast({
            title: "Employee Not Found",
            description: "The requested employee could not be found.",
            variant: "destructive"
          })
          navigate('/employees')
        }
      } catch (error) {
        console.error('Failed to fetch employee:', error)
        toast({
          title: "Error",
          description: "Failed to load employee data.",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchEmployee()
  }, [id, navigate, toast])

  const refreshEmployee = async () => {
    if (!id) return
    
    try {
      const employees = await apiService.getEmployees()
      const foundEmployee = employees.find(emp => emp.id?.toString() === id)
      
      if (foundEmployee) {
        setEmployee(foundEmployee)
      }
    } catch (error) {
      console.error('Failed to refresh employee:', error)
    }
  }

  const handleDownloadProfile = async () => {
    if (!employee) return
    
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      let yPos = 20
      
      // Add logo
      const logoUrl = '/lovable-uploads/cbfc52d9-b5d8-4ea8-9ec0-98664ee4afad.png'
      try {
        const logoImg = new Image()
        logoImg.crossOrigin = 'anonymous'
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve
          logoImg.onerror = reject
          logoImg.src = logoUrl
        })
        doc.addImage(logoImg, 'PNG', 15, yPos, 30, 30)
        yPos += 35
      } catch (e) {
        console.warn('Could not load logo:', e)
        yPos += 5
      }

      // Header
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text('EMPLOYEE PROFILE', pageWidth / 2, yPos, { align: 'center' })
      yPos += 10
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Generated on: ${format(new Date(), 'MMMM dd, yyyy')}`, pageWidth / 2, yPos, { align: 'center' })
      yPos += 15

      // Personal Information Section
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setFillColor(240, 240, 240)
      doc.rect(15, yPos - 5, pageWidth - 30, 10, 'F')
      doc.text('PERSONAL INFORMATION', 20, yPos)
      yPos += 12

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      
      const personalInfo = [
        ['Full Name', `${employee.first_name} ${employee.last_name}`],
        ['Employee ID', employee.employee_code || `EMP${String(employee.id).padStart(3, '0')}`],
        ['Email', employee.email],
        ['Phone', employee.phone_number || 'N/A'],
        ['Address', employee.address || 'N/A'],
        ['Date of Birth', employee.dob ? format(new Date(employee.dob), 'PPP') : 'N/A'],
        ['Gender', employee.gender || 'N/A'],
        ['Marital Status', employee.marital_status || 'N/A'],
        ['Nationality', employee.nationality || 'N/A'],
      ]

      personalInfo.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold')
        doc.text(`${label}:`, 20, yPos)
        doc.setFont('helvetica', 'normal')
        doc.text(String(value), 70, yPos)
        yPos += 6
      })
      yPos += 5

      // Employment Details Section
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setFillColor(240, 240, 240)
      doc.rect(15, yPos - 5, pageWidth - 30, 10, 'F')
      doc.text('EMPLOYMENT DETAILS', 20, yPos)
      yPos += 12

      doc.setFontSize(10)
      const employmentInfo = [
        ['Job Title', employee.job_title || 'N/A'],
        ['Department', employee.department || 'N/A'],
        ['Employment Type', employee.employment_type || 'N/A'],
        ['Employment Status', employee.employment_status || 'Active'],
        ['Hire Date', employee.hire_date ? format(new Date(employee.hire_date), 'PPP') : 'N/A'],
        ['Grade Level', employee.grade_level || 'N/A'],
        ['Work Location', employee.work_location || 'N/A'],
        ['Supervisor', employee.supervisor_name || 'N/A'],
        ['Vacation Days', `${employee.vacation_days || 0} days`],
      ]

      employmentInfo.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold')
        doc.text(`${label}:`, 20, yPos)
        doc.setFont('helvetica', 'normal')
        doc.text(String(value), 70, yPos)
        yPos += 6
      })
      yPos += 5

      // Check for page break
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      // Financial Information Section
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setFillColor(240, 240, 240)
      doc.rect(15, yPos - 5, pageWidth - 30, 10, 'F')
      doc.text('FINANCIAL INFORMATION', 20, yPos)
      yPos += 12

      doc.setFontSize(10)
      const totalSalary = (employee.gross_salary || 0) + 
                          (employee.housing_allowance || 0) + (employee.transport_allowance || 0)
      
      const financialInfo = [
        ['Basic Salary', formatCurrency(employee.gross_salary)],
        ['Housing Allowance', formatCurrency(employee.housing_allowance)],
        ['Transport Allowance', formatCurrency(employee.transport_allowance)],
        ['Total Monthly Salary', formatCurrency(totalSalary)],
        ['Bank Account', employee.bank_account || 'N/A'],
      ]

      financialInfo.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold')
        doc.text(`${label}:`, 20, yPos)
        doc.setFont('helvetica', 'normal')
        doc.text(String(value), 80, yPos)
        yPos += 6
      })
      yPos += 5

      // Government IDs Section
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setFillColor(240, 240, 240)
      doc.rect(15, yPos - 5, pageWidth - 30, 10, 'F')
      doc.text('GOVERNMENT IDENTIFICATIONS', 20, yPos)
      yPos += 12

      doc.setFontSize(10)
      const govInfo = [
        ['National ID (NIN)', employee.national_id || 'N/A'],
        ['BVN', employee.bvn || 'N/A'],
        ['TIN', employee.tin || 'N/A'],
        ['Pension PIN', employee.pension_pin || 'N/A'],
        ['NHF Number', employee.nhf_number || 'N/A'],
        ['Tax ID', employee.tax_id || 'N/A'],
      ]

      govInfo.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold')
        doc.text(`${label}:`, 20, yPos)
        doc.setFont('helvetica', 'normal')
        doc.text(String(value), 70, yPos)
        yPos += 6
      })

      // Footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.text(
          `Page ${i} of ${pageCount} - Confidential Employee Record`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        )
      }

      // Save with employee name
      const fileName = `${employee.first_name}_${employee.last_name}_Profile_${format(new Date(), 'yyyy-MM-dd')}.pdf`
      doc.save(fileName)

      toast({
        title: "Profile Downloaded",
        description: `Employee profile has been saved as ${fileName}`,
      })
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      toast({
        title: "Download Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      })
    }
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

  const formatCurrency = (amount: number | undefined) => formatNaira(amount ?? 0)

  const calculateTotalSalary = () => {
    if (!employee) return 0
    return (employee.gross_salary || 0) + 
           (employee.housing_allowance || 0) + 
           (employee.transport_allowance || 0)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
          <div className="h-6 w-48 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 w-32 bg-muted rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-muted rounded animate-pulse"></div>
                  <div className="h-4 w-3/4 bg-muted rounded animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-muted-foreground">Employee Not Found</h2>
        <Button onClick={() => navigate('/employees')} className="mt-4">
          Back to Employees
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/employees')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{employee.first_name} {employee.last_name}</h1>
            <p className="text-muted-foreground">{employee.job_title} • {employee.department}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(employee.employment_status || 'Active')}
          <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadProfile}>
            <Download className="mr-2 h-4 w-4" />
            Download Profile
          </Button>
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employee ID</CardTitle>
            <IdCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employee.id}</div>
            <p className="text-xs text-muted-foreground">Employee Code: {employee.employee_code || 'N/A'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Salary</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(calculateTotalSalary())}</div>
            <p className="text-xs text-muted-foreground">Monthly compensation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tenure</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employee.hire_date ? 
                Math.floor((new Date().getTime() - new Date(employee.hire_date).getTime()) / (1000 * 60 * 60 * 24 * 30)) : 
                0
              }
            </div>
            <p className="text-xs text-muted-foreground">Months with company</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vacation Days</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaveRemaining ?? employee.vacation_days ?? 0}</div>
            <p className="text-xs text-muted-foreground">Annual leave remaining</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="personal" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Personal</span>
          </TabsTrigger>
          <TabsTrigger value="job" className="flex items-center space-x-2">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Job Info</span>
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Financial</span>
          </TabsTrigger>
          <TabsTrigger value="government" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Gov IDs</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Documents</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Performance</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                    <p className="text-sm">{employee.first_name} {employee.last_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                    <p className="text-sm">{employee.dob ? format(new Date(employee.dob), 'PPP') : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Gender</label>
                    <p className="text-sm">{employee.gender || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Marital Status</label>
                    <p className="text-sm">{employee.marital_status || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nationality</label>
                    <p className="text-sm">{employee.nationality || 'N/A'}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{employee.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{employee.phone_number || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{employee.address || 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  Employment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center space-x-1">
                      <Award className="h-3 w-3" />
                      <span>Hire Date</span>
                    </label>
                    <p className="text-sm">{employee.hire_date ? format(new Date(employee.hire_date), 'PPP') : 'N/A'}</p>
                    {employee.hire_date && (
                      <div className="text-xs text-muted-foreground mt-1 space-y-1">
                        <p>
                          Work Anniversary: {format(new Date(employee.hire_date), 'MMMM d')}
                        </p>
                        <p className="font-medium text-primary">
                          Years of Service: {getYearsOfService(employee.hire_date)} year{getYearsOfService(employee.hire_date) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Employment Type</label>
                    <p className="text-sm">{employee.employment_type || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Employment Status</label>
                    <div className="mt-1">{getStatusBadge(employee.employment_status || 'Active')}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Probation Period</label>
                    <p className="text-sm">{employee.probation_period || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Confirmation Date</label>
                    <p className="text-sm">{employee.confirmation_date ? format(new Date(employee.confirmation_date), 'PPP') : 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="job" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Briefcase className="h-5 w-5" />
                  Job Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Job Title</label>
                    <p className="text-sm font-medium">{employee.job_title}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Department</label>
                    <p className="text-sm">{employee.department}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Grade Level</label>
                    <p className="text-sm">{employee.grade_level || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Work Location</label>
                    <p className="text-sm">{employee.work_location || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Supervisor</label>
                    <p className="text-sm">{employee.supervisor_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Vacation Days</label>
                    <p className="text-sm">{leaveRemaining ?? employee.vacation_days ?? 0} days remaining</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  Organizational Structure
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Reports to:</span>
                    <span className="text-sm">{employee.supervisor_name || 'Direct Report'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Department:</span>
                    <span className="text-sm">{employee.department}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Location:</span>
                    <span className="text-sm">{employee.work_location || 'Main Office'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  Salary Structure
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Basic Salary:</span>
                    <span className="text-sm font-medium">{formatCurrency(employee.gross_salary)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Housing Allowance:</span>
                    <span className="text-sm">{formatCurrency(employee.housing_allowance)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Transport Allowance:</span>
                    <span className="text-sm">{formatCurrency(employee.transport_allowance)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center font-medium">
                    <span>Total Monthly Salary:</span>
                    <span className="text-lg">{formatCurrency(calculateTotalSalary())}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Banknote className="h-5 w-5" />
                  Banking Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Bank Account</label>
                  <p className="text-sm">{employee.bank_account || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="government" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  Government IDs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">National ID (NIN)</label>
                    <p className="text-sm">{employee.national_id || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">BVN</label>
                    <p className="text-sm">{employee.bvn || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">TIN</label>
                    <p className="text-sm">{employee.tin || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Pension PIN</label>
                    <p className="text-sm">{employee.pension_pin || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">NHF Number</label>
                    <p className="text-sm">{employee.nhf_number || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tax ID</label>
                    <p className="text-sm">{employee.tax_id || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <EmployeeDocumentsPanel
            employeeId={employee.id!}
            employeeName={`${employee.first_name} ${employee.last_name}`}
          />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Performance Notes</label>
                  <p className="text-sm">{employee.performance_history || 'No performance history available.'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5" />
                  Asset Allocation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Asset History</label>
                  <p className="text-sm">{employee.asset_allocation_history || 'No asset allocation history available.'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <EmployeeEditDialog
        employee={employee}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={refreshEmployee}
      />
    </div>
  )
}
