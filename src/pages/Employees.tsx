import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Edit, 
  Eye, 
  MoreHorizontal,
  CalendarIcon,
  FileText
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Sample employee data with updated fields
const employees = [
  {
    id: "EMP001",
    firstName: "Adebayo",
    lastName: "Johnson",
    email: "adebayo.johnson@company.com",
    department: "Engineering",
    position: "Senior Software Engineer",
    salary: "₦2,500,000",
    status: "Active",
    joinDate: "2022-03-15",
    phone: "+234 803 123 4567",
    vacationDays: 25,
    employmentType: "FTE"
  },
  {
    id: "EMP002",
    firstName: "Fatima",
    lastName: "Abdul",
    email: "fatima.abdul@company.com",
    department: "Accounting",
    position: "HR Manager",
    salary: "₦1,800,000",
    status: "Active",
    joinDate: "2021-08-20",
    phone: "+234 807 654 3210",
    vacationDays: 30,
    employmentType: "FTE"
  },
  {
    id: "EMP003",
    firstName: "Chinedu",
    lastName: "Okafor",
    email: "chinedu.okafor@company.com",
    department: "Supply Chain",
    position: "Financial Analyst",
    salary: "₦1,200,000",
    status: "On Leave",
    joinDate: "2023-01-10",
    phone: "+234 815 987 6543",
    vacationDays: 20,
    employmentType: "Consultant"
  },
  {
    id: "EMP004",
    firstName: "Kemi",
    lastName: "Adeleke",
    email: "kemi.adeleke@company.com",
    department: "Marketing",
    position: "Marketing Specialist",
    salary: "₦950,000",
    status: "Active",
    joinDate: "2023-06-05",
    phone: "+234 809 246 8135",
    vacationDays: 25,
    employmentType: "FTE"
  }
]

export default function Employees() {
  const [searchTerm, setSearchTerm] = useState("")

  const [showAddEmployee, setShowAddEmployee] = useState(false)
  const [showViewDetails, setShowViewDetails] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [newEmployee, setNewEmployee] = useState({
    // Personal Information
    firstName: "",
    lastName: "",
    dateOfBirth: undefined as Date | undefined,
    gender: "",
    maritalStatus: "",
    nationality: "",
    phoneNumber: "",
    email: "",
    homeAddress: "",
    emergencyContact: "",
    
    // Job Information
    jobTitle: "",
    department: "",
    employmentType: "",
    gradeLevel: "",
    supervisorName: "",
    workLocation: "",
    hireDate: undefined as Date | undefined,
    probationPeriod: "",
    confirmationDate: undefined as Date | undefined,
    employmentStatus: "Active",
    
    // Financial Information
    grossSalary: "",
    mealAllowance: "",
    housingAllowance: "",
    transportAllowance: "",
    bankAccount: "",
    
    // Government IDs
    employeeId: "",
    nationalId: "",
    bvn: "",
    tin: "",
    pensionPin: "",
    nhfNumber: "",
    taxId: "",
    
    // Additional Fields
    vacationDays: "",
    supportingDocuments: [] as File[],
    performanceHistory: "",
    assetAllocation: ""
  })

  const departments = [
    "Accounting", "Info Technology", "Supply Chain", "Executive", 
    "Business Development", "Technician", "Engineering", "Administration", "Marketing"
  ]

  const filteredEmployees = employees.filter(employee =>
    `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.position.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddEmployee = () => {
    const empId = newEmployee.employeeId || `EMP${String(employees.length + 1).padStart(3, '0')}`
    const employee = {
      id: empId,
      firstName: newEmployee.firstName,
      lastName: newEmployee.lastName,
      email: newEmployee.email,
      department: newEmployee.department,
      position: newEmployee.jobTitle,
      salary: newEmployee.grossSalary ? `₦${newEmployee.grossSalary}` : "₦0",
      status: newEmployee.employmentStatus,
      joinDate: newEmployee.hireDate ? format(newEmployee.hireDate, 'yyyy-MM-dd') : new Date().toISOString().split('T')[0],
      phone: newEmployee.phoneNumber,
      vacationDays: parseInt(newEmployee.vacationDays) || 20,
      employmentType: newEmployee.employmentType
    }
    
    // Add the additional fields to the employee object
    const fullEmployee = {
      ...employee,
      ...newEmployee
    }
    
    employees.push(fullEmployee as any)
    setNewEmployee({
      firstName: "",
      lastName: "",
      dateOfBirth: undefined,
      gender: "",
      maritalStatus: "",
      nationality: "",
      phoneNumber: "",
      email: "",
      homeAddress: "",
      emergencyContact: "",
      jobTitle: "",
      department: "",
      employmentType: "",
      gradeLevel: "",
      supervisorName: "",
      workLocation: "",
      hireDate: undefined,
      probationPeriod: "",
      confirmationDate: undefined,
      employmentStatus: "Active",
      grossSalary: "",
      mealAllowance: "",
      housingAllowance: "",
      transportAllowance: "",
      bankAccount: "",
      employeeId: "",
      nationalId: "",
      bvn: "",
      tin: "",
      pensionPin: "",
      nhfNumber: "",
      taxId: "",
      vacationDays: "",
      supportingDocuments: [],
      performanceHistory: "",
      assetAllocation: ""
    })
    setShowAddEmployee(false)
  }

  const handleViewDetails = (employee: any) => {
    setSelectedEmployee(employee)
    setShowViewDetails(true)
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
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 text-xs">Resigned</Badge>
      case "Inactive":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-xs">Inactive</Badge>
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Employee Records</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage comprehensive employee information and records
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" className="text-xs md:text-sm">
            <Upload className="mr-2 h-3 w-3 md:h-4 md:w-4" />
            Import CSV
          </Button>
          <Button variant="outline" size="sm" className="text-xs md:text-sm">
            <Download className="mr-2 h-3 w-3 md:h-4 md:w-4" />
            Export Data
          </Button>
          <Dialog open={showAddEmployee} onOpenChange={setShowAddEmployee}>
            <DialogTrigger asChild>
              <Button size="sm" className="text-xs md:text-sm">
                <Plus className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="job">Job Info</TabsTrigger>
                  <TabsTrigger value="financial">Financial</TabsTrigger>
                  <TabsTrigger value="government">Gov IDs</TabsTrigger>
                  <TabsTrigger value="additional">Additional</TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={newEmployee.firstName}
                        onChange={(e) => setNewEmployee({...newEmployee, firstName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={newEmployee.lastName}
                        onChange={(e) => setNewEmployee({...newEmployee, lastName: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date of Birth</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !newEmployee.dateOfBirth && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newEmployee.dateOfBirth ? format(newEmployee.dateOfBirth, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={newEmployee.dateOfBirth}
                            onSelect={(date) => setNewEmployee({...newEmployee, dateOfBirth: date})}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select value={newEmployee.gender} onValueChange={(value) => setNewEmployee({...newEmployee, gender: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border shadow-lg">
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maritalStatus">Marital Status</Label>
                      <Select value={newEmployee.maritalStatus} onValueChange={(value) => setNewEmployee({...newEmployee, maritalStatus: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border shadow-lg">
                          <SelectItem value="Single">Single</SelectItem>
                          <SelectItem value="Married">Married</SelectItem>
                          <SelectItem value="Divorced">Divorced</SelectItem>
                          <SelectItem value="Widowed">Widowed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nationality">Nationality</Label>
                      <Input
                        id="nationality"
                        value={newEmployee.nationality}
                        onChange={(e) => setNewEmployee({...newEmployee, nationality: e.target.value})}
                        placeholder="e.g., Nigerian"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone Number *</Label>
                      <Input
                        id="phoneNumber"
                        value={newEmployee.phoneNumber}
                        onChange={(e) => setNewEmployee({...newEmployee, phoneNumber: e.target.value})}
                        placeholder="+234 XXX XXX XXXX"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newEmployee.email}
                        onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                        placeholder="employee@company.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="homeAddress">Home Address</Label>
                    <Textarea
                      id="homeAddress"
                      value={newEmployee.homeAddress}
                      onChange={(e) => setNewEmployee({...newEmployee, homeAddress: e.target.value})}
                      placeholder="Full residential address"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact">Emergency Contact</Label>
                    <Input
                      id="emergencyContact"
                      value={newEmployee.emergencyContact}
                      onChange={(e) => setNewEmployee({...newEmployee, emergencyContact: e.target.value})}
                      placeholder="Name and phone number"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="job" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="jobTitle">Job Title *</Label>
                      <Input
                        id="jobTitle"
                        value={newEmployee.jobTitle}
                        onChange={(e) => setNewEmployee({...newEmployee, jobTitle: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department *</Label>
                      <Select value={newEmployee.department} onValueChange={(value) => setNewEmployee({...newEmployee, department: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border shadow-lg">
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="employmentType">Employment Type *</Label>
                      <Select value={newEmployee.employmentType} onValueChange={(value) => setNewEmployee({...newEmployee, employmentType: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border shadow-lg">
                          <SelectItem value="Full-time">Full-time</SelectItem>
                          <SelectItem value="Contract">Contract</SelectItem>
                          <SelectItem value="Part-time">Part-time</SelectItem>
                          <SelectItem value="Consultant">Consultant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gradeLevel">Grade Level</Label>
                      <Input
                        id="gradeLevel"
                        value={newEmployee.gradeLevel}
                        onChange={(e) => setNewEmployee({...newEmployee, gradeLevel: e.target.value})}
                        placeholder="e.g., Level 8"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="supervisorName">Supervisor Name</Label>
                      <Input
                        id="supervisorName"
                        value={newEmployee.supervisorName}
                        onChange={(e) => setNewEmployee({...newEmployee, supervisorName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workLocation">Work Location</Label>
                      <Input
                        id="workLocation"
                        value={newEmployee.workLocation}
                        onChange={(e) => setNewEmployee({...newEmployee, workLocation: e.target.value})}
                        placeholder="e.g., Lagos Office"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Hire Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !newEmployee.hireDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newEmployee.hireDate ? format(newEmployee.hireDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={newEmployee.hireDate}
                            onSelect={(date) => setNewEmployee({...newEmployee, hireDate: date})}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="probationPeriod">Probation Period</Label>
                      <Input
                        id="probationPeriod"
                        value={newEmployee.probationPeriod}
                        onChange={(e) => setNewEmployee({...newEmployee, probationPeriod: e.target.value})}
                        placeholder="e.g., 6 months"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Confirmation Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !newEmployee.confirmationDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newEmployee.confirmationDate ? format(newEmployee.confirmationDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={newEmployee.confirmationDate}
                            onSelect={(date) => setNewEmployee({...newEmployee, confirmationDate: date})}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="employmentStatus">Employment Status</Label>
                      <Select value={newEmployee.employmentStatus} onValueChange={(value) => setNewEmployee({...newEmployee, employmentStatus: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border shadow-lg">
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Resigned">Resigned</SelectItem>
                          <SelectItem value="Terminated">Terminated</SelectItem>
                          <SelectItem value="Retired">Retired</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vacationDays">Vacation Days</Label>
                      <Select value={newEmployee.vacationDays} onValueChange={(value) => setNewEmployee({...newEmployee, vacationDays: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select vacation days" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border shadow-lg">
                          {Array.from({length: 24}, (_, i) => i + 7).map((days) => (
                            <SelectItem key={days} value={days.toString()}>{days} days</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="financial" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="grossSalary">Gross Salary</Label>
                      <Input
                        id="grossSalary"
                        value={newEmployee.grossSalary}
                        onChange={(e) => setNewEmployee({...newEmployee, grossSalary: e.target.value})}
                        placeholder="₦2,500,000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mealAllowance">Meal Allowance</Label>
                      <Input
                        id="mealAllowance"
                        value={newEmployee.mealAllowance}
                        onChange={(e) => setNewEmployee({...newEmployee, mealAllowance: e.target.value})}
                        placeholder="₦50,000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="housingAllowance">Housing Allowance</Label>
                      <Input
                        id="housingAllowance"
                        value={newEmployee.housingAllowance}
                        onChange={(e) => setNewEmployee({...newEmployee, housingAllowance: e.target.value})}
                        placeholder="₦300,000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="transportAllowance">Transport Allowance</Label>
                      <Input
                        id="transportAllowance"
                        value={newEmployee.transportAllowance}
                        onChange={(e) => setNewEmployee({...newEmployee, transportAllowance: e.target.value})}
                        placeholder="₦100,000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bankAccount">Bank Account for Salary Payments</Label>
                    <Input
                      id="bankAccount"
                      value={newEmployee.bankAccount}
                      onChange={(e) => setNewEmployee({...newEmployee, bankAccount: e.target.value})}
                      placeholder="Bank Name - Account Number"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="government" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="employeeId">Employee ID</Label>
                      <Input
                        id="employeeId"
                        value={newEmployee.employeeId}
                        onChange={(e) => setNewEmployee({...newEmployee, employeeId: e.target.value})}
                        placeholder="Auto-generated if empty"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nationalId">National ID (NIN)</Label>
                      <Input
                        id="nationalId"
                        value={newEmployee.nationalId}
                        onChange={(e) => setNewEmployee({...newEmployee, nationalId: e.target.value})}
                        placeholder="11-digit NIN"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bvn">BVN</Label>
                      <Input
                        id="bvn"
                        value={newEmployee.bvn}
                        onChange={(e) => setNewEmployee({...newEmployee, bvn: e.target.value})}
                        placeholder="11-digit BVN"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tin">TIN</Label>
                      <Input
                        id="tin"
                        value={newEmployee.tin}
                        onChange={(e) => setNewEmployee({...newEmployee, tin: e.target.value})}
                        placeholder="Tax Identification Number"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pensionPin">Pension PIN</Label>
                      <Input
                        id="pensionPin"
                        value={newEmployee.pensionPin}
                        onChange={(e) => setNewEmployee({...newEmployee, pensionPin: e.target.value})}
                        placeholder="Pension Fund Administrator PIN"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nhfNumber">NHF Number</Label>
                      <Input
                        id="nhfNumber"
                        value={newEmployee.nhfNumber}
                        onChange={(e) => setNewEmployee({...newEmployee, nhfNumber: e.target.value})}
                        placeholder="National Housing Fund Number"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxId">Tax ID</Label>
                    <Input
                      id="taxId"
                      value={newEmployee.taxId}
                      onChange={(e) => setNewEmployee({...newEmployee, taxId: e.target.value})}
                      placeholder="State Tax ID"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="additional" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="supportingDocuments">Supporting Documents</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <Input
                        id="supportingDocuments"
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setNewEmployee({...newEmployee, supportingDocuments: files});
                        }}
                        className="w-full"
                      />
                      <p className="text-sm text-muted-foreground mt-2">
                        Upload CV, Contract, ID, Certificates (PDF or DOCX format)
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="performanceHistory">Performance History</Label>
                    <Textarea
                      id="performanceHistory"
                      value={newEmployee.performanceHistory}
                      onChange={(e) => setNewEmployee({...newEmployee, performanceHistory: e.target.value})}
                      placeholder="Records of reviews, ratings, and feedback"
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assetAllocation">Asset Allocation History</Label>
                    <Textarea
                      id="assetAllocation"
                      value={newEmployee.assetAllocation}
                      onChange={(e) => setNewEmployee({...newEmployee, assetAllocation: e.target.value})}
                      placeholder="Laptops, ID cards, equipment issued to the employee"
                      rows={4}
                    />
                  </div>
                </TabsContent>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setShowAddEmployee(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddEmployee}>
                    Add Employee
                  </Button>
                </div>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-primary">Employee Database</CardTitle>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile-responsive table wrapper */}
          <div className="overflow-x-auto -mx-3 md:mx-0">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs md:text-sm">Employee ID</TableHead>
                  <TableHead className="text-xs md:text-sm">Name</TableHead>
                  <TableHead className="hidden sm:table-cell text-xs md:text-sm">Department</TableHead>
                  <TableHead className="hidden md:table-cell text-xs md:text-sm">Position</TableHead>
                  <TableHead className="hidden lg:table-cell text-xs md:text-sm">Vacation Days</TableHead>
                  <TableHead className="hidden lg:table-cell text-xs md:text-sm">Employment Type</TableHead>
                  <TableHead className="text-xs md:text-sm">Status</TableHead>
                  <TableHead className="text-right text-xs md:text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id} className="hover:bg-accent/30">
                    <TableCell className="font-medium text-xs md:text-sm">{employee.id}</TableCell>
                    <TableCell className="min-w-0">
                      <div>
                        <div className="font-medium text-xs md:text-sm truncate">{employee.firstName} {employee.lastName}</div>
                        <div className="text-xs text-muted-foreground truncate">{employee.email}</div>
                        {/* Show department on mobile when hidden */}
                        <div className="text-xs text-muted-foreground sm:hidden">{employee.department}</div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs md:text-sm">{employee.department}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs md:text-sm">{employee.position}</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs md:text-sm">{employee.vacationDays} days</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs md:text-sm">
                      <Badge variant={employee.employmentType === 'FTE' ? 'default' : 'secondary'} className="text-xs">
                        {employee.employmentType}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(employee.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-6 w-6 md:h-8 md:w-8 p-0">
                            <MoreHorizontal className="h-3 w-3 md:h-4 md:w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border shadow-lg">
                          <DropdownMenuItem className="text-xs md:text-sm" onClick={() => handleViewDetails(employee)}>
                            <Eye className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-xs md:text-sm">
                            <Edit className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                            Edit Employee
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-xs md:text-sm">
                            <Download className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                            Download Profile
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                </TableRow>
              ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredEmployees.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No employees found matching your search criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={showViewDetails} onOpenChange={setShowViewDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="job">Job Info</TabsTrigger>
                <TabsTrigger value="financial">Financial</TabsTrigger>
                <TabsTrigger value="government">Gov IDs</TabsTrigger>
                <TabsTrigger value="additional">Additional</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">First Name</Label>
                    <p className="text-sm">{selectedEmployee.firstName || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Last Name</Label>
                    <p className="text-sm">{selectedEmployee.lastName || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Date of Birth</Label>
                    <p className="text-sm">{selectedEmployee.dateOfBirth ? format(selectedEmployee.dateOfBirth, "PPP") : 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Gender</Label>
                    <p className="text-sm">{selectedEmployee.gender || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Marital Status</Label>
                    <p className="text-sm">{selectedEmployee.maritalStatus || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Nationality</Label>
                    <p className="text-sm">{selectedEmployee.nationality || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Phone Number</Label>
                    <p className="text-sm">{selectedEmployee.phone || selectedEmployee.phoneNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email Address</Label>
                    <p className="text-sm">{selectedEmployee.email || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Home Address</Label>
                  <p className="text-sm">{selectedEmployee.homeAddress || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Emergency Contact</Label>
                  <p className="text-sm">{selectedEmployee.emergencyContact || 'N/A'}</p>
                </div>
              </TabsContent>

              <TabsContent value="job" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Job Title</Label>
                    <p className="text-sm">{selectedEmployee.position || selectedEmployee.jobTitle || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Department</Label>
                    <p className="text-sm">{selectedEmployee.department || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Employment Type</Label>
                    <p className="text-sm">{selectedEmployee.employmentType || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Grade Level</Label>
                    <p className="text-sm">{selectedEmployee.gradeLevel || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Supervisor Name</Label>
                    <p className="text-sm">{selectedEmployee.supervisorName || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Work Location</Label>
                    <p className="text-sm">{selectedEmployee.workLocation || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Hire Date</Label>
                    <p className="text-sm">{selectedEmployee.joinDate || selectedEmployee.hireDate ? format(new Date(selectedEmployee.joinDate || selectedEmployee.hireDate), "PPP") : 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Probation Period</Label>
                    <p className="text-sm">{selectedEmployee.probationPeriod || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Confirmation Date</Label>
                    <p className="text-sm">{selectedEmployee.confirmationDate ? format(selectedEmployee.confirmationDate, "PPP") : 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Employment Status</Label>
                    {getStatusBadge(selectedEmployee.status || selectedEmployee.employmentStatus)}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Vacation Days</Label>
                    <p className="text-sm">{selectedEmployee.vacationDays || 'N/A'} days</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="financial" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Gross Salary</Label>
                    <p className="text-sm">{selectedEmployee.salary || selectedEmployee.grossSalary || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Meal Allowance</Label>
                    <p className="text-sm">{selectedEmployee.mealAllowance || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Housing Allowance</Label>
                    <p className="text-sm">{selectedEmployee.housingAllowance || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Transport Allowance</Label>
                    <p className="text-sm">{selectedEmployee.transportAllowance || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Bank Account</Label>
                  <p className="text-sm">{selectedEmployee.bankAccount || 'N/A'}</p>
                </div>
              </TabsContent>

              <TabsContent value="government" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Employee ID</Label>
                    <p className="text-sm">{selectedEmployee.id || selectedEmployee.employeeId || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">National ID (NIN)</Label>
                    <p className="text-sm">{selectedEmployee.nationalId || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">BVN</Label>
                    <p className="text-sm">{selectedEmployee.bvn || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">TIN</Label>
                    <p className="text-sm">{selectedEmployee.tin || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Pension PIN</Label>
                    <p className="text-sm">{selectedEmployee.pensionPin || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">NHF Number</Label>
                    <p className="text-sm">{selectedEmployee.nhfNumber || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Tax ID</Label>
                  <p className="text-sm">{selectedEmployee.taxId || 'N/A'}</p>
                </div>
              </TabsContent>

              <TabsContent value="additional" className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Supporting Documents</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <FileText className="h-4 w-4" />
                    <p className="text-sm">{selectedEmployee.supportingDocuments?.length > 0 ? `${selectedEmployee.supportingDocuments.length} files uploaded` : 'No documents uploaded'}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Performance History</Label>
                  <p className="text-sm">{selectedEmployee.performanceHistory || 'No performance history recorded'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Asset Allocation History</Label>
                  <p className="text-sm">{selectedEmployee.assetAllocation || 'No asset allocation recorded'}</p>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}