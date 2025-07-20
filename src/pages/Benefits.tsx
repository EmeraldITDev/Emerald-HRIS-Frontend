import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Shield, Wifi, Monitor, Heart, Upload, Plus, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface EmployeeBenefit {
  id: string
  employeeId: string
  employeeName: string
  hmo: boolean
  lifeInsurance: boolean
  internet: boolean
  computer: boolean
  lastUpdated: string
}

const employees = [
  { id: "EMP001", name: "Adebayo Johnson" },
  { id: "EMP002", name: "Fatima Abdul" },
  { id: "EMP003", name: "Chinedu Okafor" },
  { id: "EMP004", name: "Kemi Adeleke" }
]

export default function Benefits() {
  const [benefits, setBenefits] = useState<EmployeeBenefit[]>([
    {
      id: '1',
      employeeId: 'EMP001',
      employeeName: 'Adebayo Johnson',
      hmo: true,
      lifeInsurance: true,
      internet: false,
      computer: true,
      lastUpdated: '2024-01-15'
    },
    {
      id: '2',
      employeeId: 'EMP002',
      employeeName: 'Fatima Abdul',
      hmo: true,
      lifeInsurance: false,
      internet: true,
      computer: true,
      lastUpdated: '2024-01-10'
    },
    {
      id: '3',
      employeeId: 'EMP003',
      employeeName: 'Chinedu Okafor',
      hmo: false,
      lifeInsurance: true,
      internet: true,
      computer: false,
      lastUpdated: '2024-01-20'
    },
    {
      id: '4',
      employeeId: 'EMP004',
      employeeName: 'Kemi Adeleke',
      hmo: true,
      lifeInsurance: true,
      internet: true,
      computer: true,
      lastUpdated: '2024-01-18'
    }
  ])

  const [newBenefit, setNewBenefit] = useState({
    employeeId: '',
    employeeName: '',
    hmo: false,
    lifeInsurance: false,
    internet: false,
    computer: false
  })

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  const handleAddBenefit = () => {
    if (!newBenefit.employeeId) {
      toast({
        title: "Missing information",
        description: "Please select an employee.",
        variant: "destructive"
      })
      return
    }

    const benefit: EmployeeBenefit = {
      id: (benefits.length + 1).toString(),
      employeeId: newBenefit.employeeId,
      employeeName: newBenefit.employeeName,
      hmo: newBenefit.hmo,
      lifeInsurance: newBenefit.lifeInsurance,
      internet: newBenefit.internet,
      computer: newBenefit.computer,
      lastUpdated: new Date().toISOString().split('T')[0]
    }

    setBenefits([benefit, ...benefits])
    setNewBenefit({
      employeeId: '',
      employeeName: '',
      hmo: false,
      lifeInsurance: false,
      internet: false,
      computer: false
    })
    setIsDialogOpen(false)
    
    toast({
      title: "Benefits updated",
      description: `Benefits have been configured for ${benefit.employeeName}.`
    })
  }

  const handleEmployeeChange = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId)
    setNewBenefit({
      ...newBenefit,
      employeeId,
      employeeName: employee?.name || ''
    })
  }

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        toast({
          title: "CSV file uploaded",
          description: "Employee benefits data has been imported successfully."
        })
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV file.",
          variant: "destructive"
        })
      }
    }
  }

  const getBenefitBadge = (benefit: boolean, type: string, icon: React.ReactNode) => {
    return (
      <div className="flex items-center space-x-1">
        {icon}
        <Badge variant={benefit ? "default" : "secondary"} className="text-xs">
          {benefit ? "Active" : "Inactive"}
        </Badge>
      </div>
    )
  }

  const totalWithHMO = benefits.filter(b => b.hmo).length
  const totalWithInsurance = benefits.filter(b => b.lifeInsurance).length
  const totalWithInternet = benefits.filter(b => b.internet).length
  const totalWithComputer = benefits.filter(b => b.computer).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Benefits Administration</h1>
          <p className="text-muted-foreground">Manage employee benefits and enrollments</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="hidden"
              id="csv-upload"
            />
            <Button variant="outline" asChild>
              <label htmlFor="csv-upload" className="cursor-pointer">
                <Upload className="mr-2 h-4 w-4" />
                Import CSV
              </label>
            </Button>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Configure Benefits
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Configure Employee Benefits</DialogTitle>
                <DialogDescription>
                  Set up benefits package for an employee.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="employee">Employee *</Label>
                  <Select onValueChange={handleEmployeeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-4">
                  <Label>Benefits Package</Label>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hmo"
                      checked={newBenefit.hmo}
                      onCheckedChange={(checked) => setNewBenefit({...newBenefit, hmo: checked as boolean})}
                    />
                    <Heart className="h-4 w-4 text-red-500" />
                    <Label htmlFor="hmo">Health Maintenance Organization (HMO)</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="lifeInsurance"
                      checked={newBenefit.lifeInsurance}
                      onCheckedChange={(checked) => setNewBenefit({...newBenefit, lifeInsurance: checked as boolean})}
                    />
                    <Shield className="h-4 w-4 text-blue-500" />
                    <Label htmlFor="lifeInsurance">Life Insurance</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="internet"
                      checked={newBenefit.internet}
                      onCheckedChange={(checked) => setNewBenefit({...newBenefit, internet: checked as boolean})}
                    />
                    <Wifi className="h-4 w-4 text-green-500" />
                    <Label htmlFor="internet">Internet Allowance</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="computer"
                      checked={newBenefit.computer}
                      onCheckedChange={(checked) => setNewBenefit({...newBenefit, computer: checked as boolean})}
                    />
                    <Monitor className="h-4 w-4 text-purple-500" />
                    <Label htmlFor="computer">Computer/Equipment</Label>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddBenefit} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Save Benefits
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">HMO Coverage</CardTitle>
            <Heart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalWithHMO}/{benefits.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Life Insurance</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalWithInsurance}/{benefits.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Internet Allowance</CardTitle>
            <Wifi className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalWithInternet}/{benefits.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipment</CardTitle>
            <Monitor className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{totalWithComputer}/{benefits.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Benefits Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Benefits</CardTitle>
          <CardDescription>
            Track and manage employee benefit enrollments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>HMO</TableHead>
                  <TableHead>Life Insurance</TableHead>
                  <TableHead className="hidden sm:table-cell">Internet</TableHead>
                  <TableHead className="hidden md:table-cell">Computer</TableHead>
                  <TableHead className="hidden lg:table-cell">Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {benefits.map((benefit) => (
                  <TableRow key={benefit.id}>
                    <TableCell className="font-medium">{benefit.employeeName}</TableCell>
                    <TableCell>
                      {getBenefitBadge(benefit.hmo, "HMO", <Heart className="h-3 w-3 text-red-500" />)}
                    </TableCell>
                    <TableCell>
                      {getBenefitBadge(benefit.lifeInsurance, "Insurance", <Shield className="h-3 w-3 text-blue-500" />)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {getBenefitBadge(benefit.internet, "Internet", <Wifi className="h-3 w-3 text-green-500" />)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {getBenefitBadge(benefit.computer, "Computer", <Monitor className="h-3 w-3 text-purple-500" />)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{benefit.lastUpdated}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}