import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Shield, Wifi, Monitor, Heart, Upload, Plus, Users, Award } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from '@/contexts/AuthContext'
import { apiService, Employee } from '@/lib/api'
import RoleBasedComponent from '@/components/RoleBasedComponent'

interface BenefitDetail {
  status: 'active' | 'inactive'
  cost: number
  usage: number // percentage 0-100
  details?: string
}

interface EmployeeBenefit {
  id: string
  employeeId: string
  employeeName: string
  hmo: BenefitDetail
  lifeInsurance: BenefitDetail
  internet: BenefitDetail
  equipment: BenefitDetail
  lastUpdated: string
}

export default function Benefits() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [benefits, setBenefits] = useState<EmployeeBenefit[]>([])

  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [editingBenefit, setEditingBenefit] = useState<EmployeeBenefit | null>(null)
  const [showManageBenefitDialog, setShowManageBenefitDialog] = useState(false)
  const [benefitForm, setBenefitForm] = useState({
    hmo: { status: 'inactive' as 'active' | 'inactive', cost: 0, usage: 0, details: '' },
    lifeInsurance: { status: 'inactive' as 'active' | 'inactive', cost: 0, usage: 0, details: '' },
    internet: { status: 'inactive' as 'active' | 'inactive', cost: 0, usage: 0, details: '' },
    equipment: { status: 'inactive' as 'active' | 'inactive', cost: 0, usage: 0, details: '' }
  })
  
  const [customBenefits, setCustomBenefits] = useState<{id: string, name: string}[]>([])
  const [isAddingCustomBenefit, setIsAddingCustomBenefit] = useState(false)
  const [newCustomBenefitName, setNewCustomBenefitName] = useState('')
  const [employeeBenefitAssignment, setEmployeeBenefitAssignment] = useState<{[key: string]: {[benefitId: string]: boolean}}>({})
  const [showAssignBenefitDialog, setShowAssignBenefitDialog] = useState(false)
  const [selectedEmployeeForBenefit, setSelectedEmployeeForBenefit] = useState('')
  const [selectedCustomBenefit, setSelectedCustomBenefit] = useState('')

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()
  
  const canManageBenefits = user?.role === 'executive' || user?.role === 'hr_manager'
  const isLineManager = user?.role === 'line_manager'
  const isGeneralEmployee = !canManageBenefits && !isLineManager
  const userDepartment = user?.department
  
  useEffect(() => {
    fetchEmployees()
  }, [])
  
  const fetchEmployees = async () => {
    try {
      const data = await apiService.getEmployees()
      setEmployees(data)
      
      // Generate dummy benefits for all employees except HR Manager
      const generatedBenefits: EmployeeBenefit[] = data
        .filter(emp => emp.job_title?.toLowerCase() !== 'hr manager')
        .map((emp, index) => {
          // Randomize benefits for variety
          const hasHMO = Math.random() > 0.3
          const hasInsurance = Math.random() > 0.1
          const hasInternet = Math.random() > 0.2
          const hasEquipment = Math.random() > 0.15
          
          return {
            id: emp.id?.toString() || `gen-${index}`,
            employeeId: emp.id?.toString() || '',
            employeeName: `${emp.first_name} ${emp.last_name}`,
            hmo: hasHMO 
              ? { 
                  status: 'active' as const, 
                  cost: Math.random() > 0.5 ? 50000 : 40000, 
                  usage: Math.floor(Math.random() * 80) + 10,
                  details: Math.random() > 0.5 ? 'Family plan' : 'Individual plan'
                } 
              : { status: 'inactive' as const, cost: 0, usage: 0 },
            lifeInsurance: hasInsurance
              ? {
                  status: 'active' as const,
                  cost: 25000,
                  usage: 0,
                  details: Math.random() > 0.5 ? '₦5M coverage' : '₦3M coverage'
                }
              : { status: 'inactive' as const, cost: 0, usage: 0 },
            internet: hasInternet
              ? {
                  status: 'active' as const,
                  cost: 15000,
                  usage: Math.floor(Math.random() * 90) + 10,
                  details: '₦15k/month'
                }
              : { status: 'inactive' as const, cost: 0, usage: 0 },
            equipment: hasEquipment
              ? {
                  status: 'active' as const,
                  cost: Math.floor(Math.random() * 200000) + 300000,
                  usage: 100,
                  details: ['MacBook Pro 2023', 'Dell Latitude', 'HP EliteBook', 'Lenovo ThinkPad'][Math.floor(Math.random() * 4)]
                }
              : { status: 'inactive' as const, cost: 0, usage: 0 },
            lastUpdated: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          }
        })
      
      setBenefits(generatedBenefits)
    } catch (error) {
      console.error('Failed to fetch employees:', error)
    }
  }

  const handleOpenManageBenefit = (employeeId?: string) => {
    if (employeeId) {
      const existing = benefits.find(b => b.employeeId === employeeId)
      if (existing) {
        setEditingBenefit(existing)
        setBenefitForm({
          hmo: { ...existing.hmo, details: existing.hmo.details || '' },
          lifeInsurance: { ...existing.lifeInsurance, details: existing.lifeInsurance.details || '' },
          internet: { ...existing.internet, details: existing.internet.details || '' },
          equipment: { ...existing.equipment, details: existing.equipment.details || '' }
        })
      }
      setSelectedEmployee(employeeId)
    } else {
      setEditingBenefit(null)
      setSelectedEmployee('')
      setBenefitForm({
        hmo: { status: 'inactive', cost: 0, usage: 0, details: '' },
        lifeInsurance: { status: 'inactive', cost: 0, usage: 0, details: '' },
        internet: { status: 'inactive', cost: 0, usage: 0, details: '' },
        equipment: { status: 'inactive', cost: 0, usage: 0, details: '' }
      })
    }
    setShowManageBenefitDialog(true)
  }

  const handleSaveBenefit = () => {
    if (!selectedEmployee) {
      toast({
        title: "Missing information",
        description: "Please select an employee.",
        variant: "destructive"
      })
      return
    }

    const employee = employees.find(e => e.id?.toString() === selectedEmployee)
    const employeeName = employee ? `${employee.first_name} ${employee.last_name}` : ''

    if (editingBenefit) {
      // Update existing
      setBenefits(benefits.map(b => 
        b.id === editingBenefit.id 
          ? { ...b, ...benefitForm, lastUpdated: new Date().toISOString().split('T')[0] }
          : b
      ))
      toast({
        title: "Benefits updated",
        description: `Benefits updated for ${employeeName}.`
      })
    } else {
      // Create new
      const newBenefit: EmployeeBenefit = {
        id: (benefits.length + 1).toString(),
        employeeId: selectedEmployee,
        employeeName,
        ...benefitForm,
        lastUpdated: new Date().toISOString().split('T')[0]
      }
      setBenefits([newBenefit, ...benefits])
      toast({
        title: "Benefits assigned",
        description: `Benefits assigned to ${employeeName}.`
      })
    }

    setShowManageBenefitDialog(false)
    setEditingBenefit(null)
  }
  
  const handleAddCustomBenefit = () => {
    if (!newCustomBenefitName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a benefit name",
        variant: "destructive"
      })
      return
    }
    
    const newBenefit = {
      id: `custom_${Date.now()}`,
      name: newCustomBenefitName
    }
    
    setCustomBenefits(prev => [...prev, newBenefit])
    setNewCustomBenefitName('')
    setIsAddingCustomBenefit(false)
    
    toast({
      title: "Custom Benefit Created",
      description: `${newCustomBenefitName} has been added to the benefits list`
    })
  }
  
  const handleAssignCustomBenefit = () => {
    if (!selectedEmployeeForBenefit || !selectedCustomBenefit) {
      toast({
        title: "Error",
        description: "Please select both employee and benefit",
        variant: "destructive"
      })
      return
    }
    
    setEmployeeBenefitAssignment(prev => ({
      ...prev,
      [selectedEmployeeForBenefit]: {
        ...prev[selectedEmployeeForBenefit],
        [selectedCustomBenefit]: true
      }
    }))
    
    const employee = employees.find(e => e.id?.toString() === selectedEmployeeForBenefit)
    const benefit = customBenefits.find(b => b.id === selectedCustomBenefit)
    
    setShowAssignBenefitDialog(false)
    setSelectedEmployeeForBenefit('')
    setSelectedCustomBenefit('')
    
    toast({
      title: "Benefit Assigned",
      description: `${benefit?.name} has been assigned to ${employee?.first_name} ${employee?.last_name}`
    })
  }

  const updateBenefitField = (type: 'hmo' | 'lifeInsurance' | 'internet' | 'equipment', field: string, value: any) => {
    setBenefitForm(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }))
  }
  
  // Get current user's benefits - if not found in system, generate dummy data for testing
  const myBenefits: EmployeeBenefit | undefined = (() => {
    // Try to find existing benefits
    const existingBenefit = benefits.find(b => {
      const employee = employees.find(e => e.id?.toString() === b.employeeId)
      return employee?.email?.toLowerCase() === user?.email?.toLowerCase()
    })
    
    if (existingBenefit) return existingBenefit
    
    // Generate dummy benefits for any logged-in user for testing purposes
    if (user) {
      return {
        id: `dummy-${user.id}`,
        employeeId: user.id || '',
        employeeName: user.email || 'Current User',
        hmo: {
          status: 'active' as const,
          cost: 50000,
          usage: 45,
          details: 'Family plan - Premium coverage'
        },
        lifeInsurance: {
          status: 'active' as const,
          cost: 25000,
          usage: 0,
          details: '₦5M coverage'
        },
        internet: {
          status: 'active' as const,
          cost: 15000,
          usage: 68,
          details: '₦15k/month allowance'
        },
        equipment: {
          status: 'active' as const,
          cost: 450000,
          usage: 100,
          details: 'MacBook Pro 2023 - 16GB RAM'
        },
        lastUpdated: new Date().toISOString().split('T')[0]
      }
    }
    
    return undefined
  })()

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

  // Filter benefits based on role and department
  const currentUserFullName = user ? `${user.firstName} ${user.lastName}` : ''
  
  const filteredBenefits = (() => {
    // Executives and HR Managers see all benefits
    if (canManageBenefits) {
      return benefits
    }
    
    // Line Managers see benefits for their department only
    if (isLineManager && userDepartment) {
      return benefits.filter(b => {
        const employee = employees.find(e => `${e.first_name} ${e.last_name}` === b.employeeName)
        return employee?.department === userDepartment
      })
    }
    
    // General employees see only their own benefits
    return benefits.filter(b => b.employeeName === currentUserFullName)
  })()
  
  const totalWithHMO = filteredBenefits.filter(b => b.hmo.status === 'active').length
  const totalWithInsurance = filteredBenefits.filter(b => b.lifeInsurance.status === 'active').length
  const totalWithInternet = filteredBenefits.filter(b => b.internet.status === 'active').length
  const totalWithEquipment = filteredBenefits.filter(b => b.equipment.status === 'active').length
  
  const hmoPercentage = filteredBenefits.length > 0 ? Math.round((totalWithHMO / filteredBenefits.length) * 100) : 0
  const insurancePercentage = filteredBenefits.length > 0 ? Math.round((totalWithInsurance / filteredBenefits.length) * 100) : 0
  const internetPercentage = filteredBenefits.length > 0 ? Math.round((totalWithInternet / filteredBenefits.length) * 100) : 0
  const equipmentPercentage = filteredBenefits.length > 0 ? Math.round((totalWithEquipment / filteredBenefits.length) * 100) : 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount)
  }

  // Employee View (My Benefits)
  if (!canManageBenefits) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Benefits</h1>
          <p className="text-muted-foreground">Manage My Benefits</p>
        </div>

        {myBenefits ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* HMO Coverage */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    HMO Coverage
                  </CardTitle>
                  <Badge variant={myBenefits.hmo.status === 'active' ? 'default' : 'secondary'}>
                    {myBenefits.hmo.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {myBenefits.hmo.status === 'active' ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Annual Cost</span>
                      <span className="font-semibold">{formatCurrency(myBenefits.hmo.cost)}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Usage</span>
                        <span className="font-semibold">{myBenefits.hmo.usage}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full transition-all"
                          style={{ width: `${myBenefits.hmo.usage}%` }}
                        />
                      </div>
                    </div>
                    {myBenefits.hmo.details && (
                      <p className="text-sm text-muted-foreground">{myBenefits.hmo.details}</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Not enrolled in HMO coverage</p>
                )}
              </CardContent>
            </Card>

            {/* Life Insurance */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-500" />
                    Life Insurance
                  </CardTitle>
                  <Badge variant={myBenefits.lifeInsurance.status === 'active' ? 'default' : 'secondary'}>
                    {myBenefits.lifeInsurance.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {myBenefits.lifeInsurance.status === 'active' ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Annual Premium</span>
                      <span className="font-semibold">{formatCurrency(myBenefits.lifeInsurance.cost)}</span>
                    </div>
                    {myBenefits.lifeInsurance.details && (
                      <p className="text-sm text-muted-foreground">{myBenefits.lifeInsurance.details}</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Not enrolled in life insurance</p>
                )}
              </CardContent>
            </Card>

            {/* Internet Allowance */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Wifi className="h-5 w-5 text-green-500" />
                    Internet Allowance
                  </CardTitle>
                  <Badge variant={myBenefits.internet.status === 'active' ? 'default' : 'secondary'}>
                    {myBenefits.internet.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {myBenefits.internet.status === 'active' ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Monthly Allowance</span>
                      <span className="font-semibold">{formatCurrency(myBenefits.internet.cost)}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Usage This Month</span>
                        <span className="font-semibold">{myBenefits.internet.usage}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${myBenefits.internet.usage}%` }}
                        />
                      </div>
                    </div>
                    {myBenefits.internet.details && (
                      <p className="text-sm text-muted-foreground">{myBenefits.internet.details}</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No internet allowance assigned</p>
                )}
              </CardContent>
            </Card>

            {/* Equipment */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-purple-500" />
                    Equipment
                  </CardTitle>
                  <Badge variant={myBenefits.equipment.status === 'active' ? 'default' : 'secondary'}>
                    {myBenefits.equipment.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {myBenefits.equipment.status === 'active' ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Equipment Value</span>
                      <span className="font-semibold">{formatCurrency(myBenefits.equipment.cost)}</span>
                    </div>
                    {myBenefits.equipment.details && (
                      <p className="text-sm text-muted-foreground">{myBenefits.equipment.details}</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No equipment assigned</p>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">No benefits information available. Please contact HR.</p>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // HR Manager View
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Benefits Administration</h1>
          <p className="text-muted-foreground">Manage employee benefits and enrollments</p>
        </div>
        
        <Button 
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => handleOpenManageBenefit()}
        >
          <Plus className="mr-2 h-4 w-4" />
          Assign/Edit Benefits
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">HMO Coverage</CardTitle>
            <Heart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{hmoPercentage}%</div>
            <p className="text-xs text-muted-foreground mt-1">of staff HMO active</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Life Insurance</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{insurancePercentage}%</div>
            <p className="text-xs text-muted-foreground mt-1">of staff Life Insurance active</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Internet Allowance</CardTitle>
            <Wifi className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{internetPercentage}%</div>
            <p className="text-xs text-muted-foreground mt-1">of staff Internet active</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipment</CardTitle>
            <Monitor className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{equipmentPercentage}%</div>
            <p className="text-xs text-muted-foreground mt-1">of staff Equipment active</p>
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
                  <TableHead className="hidden md:table-cell">Equipment</TableHead>
                  <TableHead className="hidden lg:table-cell">Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBenefits.map((benefit) => (
                  <TableRow key={benefit.id}>
                    <TableCell className="font-medium">{benefit.employeeName}</TableCell>
                    <TableCell>
                      <Badge variant={benefit.hmo.status === 'active' ? 'default' : 'secondary'}>
                        {benefit.hmo.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={benefit.lifeInsurance.status === 'active' ? 'default' : 'secondary'}>
                        {benefit.lifeInsurance.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={benefit.internet.status === 'active' ? 'default' : 'secondary'}>
                        {benefit.internet.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={benefit.equipment.status === 'active' ? 'default' : 'secondary'}>
                        {benefit.equipment.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{benefit.lastUpdated}</TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleOpenManageBenefit(benefit.employeeId)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Manage Benefits Dialog */}
      <Dialog open={showManageBenefitDialog} onOpenChange={setShowManageBenefitDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBenefit ? 'Edit' : 'Assign'} Employee Benefits</DialogTitle>
            <DialogDescription>
              Configure benefits package with cost and usage details.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Employee *</Label>
              <Select 
                value={selectedEmployee} 
                onValueChange={setSelectedEmployee}
                disabled={!!editingBenefit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id?.toString() || ''}>
                      {employee.first_name} {employee.last_name} - {employee.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* HMO */}
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  HMO Coverage
                </Label>
                <Select 
                  value={benefitForm.hmo.status}
                  onValueChange={(val) => updateBenefitField('hmo', 'status', val)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {benefitForm.hmo.status === 'active' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Annual Cost (₦)</Label>
                    <Input 
                      type="number"
                      value={benefitForm.hmo.cost}
                      onChange={(e) => updateBenefitField('hmo', 'cost', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Usage (%)</Label>
                    <Input 
                      type="number"
                      min="0"
                      max="100"
                      value={benefitForm.hmo.usage}
                      onChange={(e) => updateBenefitField('hmo', 'usage', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs">Details</Label>
                    <Input 
                      placeholder="e.g., Family plan"
                      value={benefitForm.hmo.details}
                      onChange={(e) => updateBenefitField('hmo', 'details', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Life Insurance */}
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  Life Insurance
                </Label>
                <Select 
                  value={benefitForm.lifeInsurance.status}
                  onValueChange={(val) => updateBenefitField('lifeInsurance', 'status', val)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {benefitForm.lifeInsurance.status === 'active' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Annual Premium (₦)</Label>
                    <Input 
                      type="number"
                      value={benefitForm.lifeInsurance.cost}
                      onChange={(e) => updateBenefitField('lifeInsurance', 'cost', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs">Coverage Details</Label>
                    <Input 
                      placeholder="e.g., ₦5M coverage"
                      value={benefitForm.lifeInsurance.details}
                      onChange={(e) => updateBenefitField('lifeInsurance', 'details', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Internet */}
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-green-500" />
                  Internet Allowance
                </Label>
                <Select 
                  value={benefitForm.internet.status}
                  onValueChange={(val) => updateBenefitField('internet', 'status', val)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {benefitForm.internet.status === 'active' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Monthly Cost (₦)</Label>
                    <Input 
                      type="number"
                      value={benefitForm.internet.cost}
                      onChange={(e) => updateBenefitField('internet', 'cost', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Usage This Month (%)</Label>
                    <Input 
                      type="number"
                      min="0"
                      max="100"
                      value={benefitForm.internet.usage}
                      onChange={(e) => updateBenefitField('internet', 'usage', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs">Details</Label>
                    <Input 
                      placeholder="e.g., ₦15k/month"
                      value={benefitForm.internet.details}
                      onChange={(e) => updateBenefitField('internet', 'details', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Equipment */}
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-purple-500" />
                  Equipment
                </Label>
                <Select 
                  value={benefitForm.equipment.status}
                  onValueChange={(val) => updateBenefitField('equipment', 'status', val)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {benefitForm.equipment.status === 'active' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Equipment Value (₦)</Label>
                    <Input 
                      type="number"
                      value={benefitForm.equipment.cost}
                      onChange={(e) => updateBenefitField('equipment', 'cost', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs">Equipment Details</Label>
                    <Input 
                      placeholder="e.g., MacBook Pro 2023"
                      value={benefitForm.equipment.details}
                      onChange={(e) => updateBenefitField('equipment', 'details', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManageBenefitDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBenefit} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Save Benefits
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}