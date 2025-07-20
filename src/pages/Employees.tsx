import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
  MoreHorizontal 
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
  const [newEmployee, setNewEmployee] = useState({
    firstName: "",
    lastName: "",
    email: "",
    department: "",
    position: "",
    vacationDays: "",
    employmentType: "",
    phone: ""
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
    const empId = `EMP${String(employees.length + 1).padStart(3, '0')}`
    const employee = {
      id: empId,
      ...newEmployee,
      salary: "₦0",
      status: "Active",
      joinDate: new Date().toISOString().split('T')[0],
      vacationDays: parseInt(newEmployee.vacationDays) || 20
    }
    
    employees.push(employee)
    setNewEmployee({
      firstName: "",
      lastName: "",
      email: "",
      department: "",
      position: "",
      vacationDays: "",
      employmentType: "",
      phone: ""
    })
    setShowAddEmployee(false)
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
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
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
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
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
                
                <div className="space-y-2">
                  <Label htmlFor="position">Position *</Label>
                  <Input
                    id="position"
                    value={newEmployee.position}
                    onChange={(e) => setNewEmployee({...newEmployee, position: e.target.value})}
                  />
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
                
                <div className="space-y-2">
                  <Label htmlFor="employmentType">Employment Type *</Label>
                  <Select value={newEmployee.employmentType} onValueChange={(value) => setNewEmployee({...newEmployee, employmentType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border shadow-lg">
                      <SelectItem value="FTE">Full-Time Employee (FTE)</SelectItem>
                      <SelectItem value="Consultant">Consultant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={newEmployee.phone}
                    onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})}
                  />
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setShowAddEmployee(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddEmployee}>
                    Add Employee
                  </Button>
                </div>
              </div>
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
                          <DropdownMenuItem className="text-xs md:text-sm">
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
    </div>
  )
}