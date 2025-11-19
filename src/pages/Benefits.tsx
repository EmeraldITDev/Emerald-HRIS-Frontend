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
  const [dbBenefits, setDbBenefits] = useState<any[]>([])
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false)

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
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [assignBenefitForm, setAssignBenefitForm] = useState({
    employee_ids: [] as number[],
    benefit_name: '',
    benefit_type: '',
    description: '',
    value: '',
    start_date: '',
    end_date: '',
    notes: ''
  })
  const { toast } = useToast()
  const { user, refreshUser } = useAuth()
  
  const canManageBenefits = user?.role === 'executive' || user?.role === 'hr_manager'
  const isLineManager = user?.role === 'line_manager'
  const isGeneralEmployee = !canManageBenefits && !isLineManager
  const userDepartment = user?.department
  
  // Helper to safely get auth token
  const getAuthToken = (): string | null => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('auth_token')
  }
  
  useEffect(() => {
    // Only fetch data if user is authenticated and has a token
    const token = getAuthToken()
    if (user && token) {
      // If user doesn't have employee_id, refresh user data to get it
      if (!user.employee_id) {
        refreshUser()
      }
      fetchEmployees()
      fetchBenefits()
    } else if (user && !token) {
      // User is logged in but using dummy account (no token)
      toast({
        title: "Limited Access",
        description: "Some features require backend authentication. Please log in with a backend account.",
        variant: "default"
      })
    }
  }, [user])
  
  const fetchBenefits = async () => {
    const token = getAuthToken()
    if (!token) {
      console.warn('No auth token available, skipping benefits fetch')
      return
    }
    
    try {
      const data = await apiService.getEmployeeBenefits()
      setDbBenefits(Array.isArray(data) ? data : (data?.data || []))
    } catch (error: any) {
      console.error('Failed to fetch benefits:', error)
      // Don't show error toast for 401 - user might be using dummy account
      if (error.message && !error.message.includes('401')) {
        toast({
          title: "Error",
          description: "Failed to load benefits. Please try again.",
          variant: "destructive"
        })
      }
    }
  }
  
  const fetchEmployees = async () => {
    const token = getAuthToken()
    if (!token) {
      console.warn('No auth token available, skipping employees fetch')
      setIsLoadingEmployees(false)
      return
    }
    
    setIsLoadingEmployees(true)
    try {
      const data = await apiService.getEmployees()
      // Handle both array and object with data property
      const employeesList = Array.isArray(data) ? data : (data?.data || [])
      setEmployees(employeesList)
    } catch (error: any) {
      console.error('Failed to fetch employees:', error)
      // Don't show error toast for 401 - user might be using dummy account
      if (error.message && !error.message.includes('401')) {
        toast({
          title: "Error",
          description: "Failed to load employees. Please try again.",
          variant: "destructive"
        })
      }
    } finally {
      setIsLoadingEmployees(false)
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
  
  const handleAssignBenefit = async () => {
    const token = getAuthToken()
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please log in with a backend account to assign benefits.",
        variant: "destructive"
      })
      return
    }

    if (!assignBenefitForm.employee_ids.length || !assignBenefitForm.benefit_name || !assignBenefitForm.benefit_type || !assignBenefitForm.start_date) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    try {
      await apiService.assignBenefit({
        ...assignBenefitForm,
        value: assignBenefitForm.value ? parseFloat(assignBenefitForm.value) : undefined,
      })
      
      await fetchBenefits()
      
      setAssignBenefitForm({
        employee_ids: [],
        benefit_name: '',
        benefit_type: '',
        description: '',
        value: '',
        start_date: '',
        end_date: '',
        notes: ''
      })
      setIsAssignDialogOpen(false)

      toast({
        title: "Benefit Assigned",
        description: "Benefit has been assigned successfully to selected employees",
      })
    } catch (error) {
      toast({
        title: "Assignment failed",
        description: "Please try again",
        variant: "destructive"
      })
    }
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

  // Get current user's benefits from database
  const currentUserEmployeeId = user?.employee_id
  const myDbBenefits = dbBenefits.filter(b => {
    // Handle both number and string comparisons
    const benefitEmployeeId = typeof b.employee_id === 'string' ? parseInt(b.employee_id, 10) : b.employee_id
    return benefitEmployeeId === currentUserEmployeeId && b.status === 'active'
  })
  
  const myBenefits: EmployeeBenefit | undefined = benefits.find(b => {
    const employee = employees.find(e => e.id?.toString() === b.employeeId)
    return employee?.email?.toLowerCase() === user?.email?.toLowerCase()
  })

  // Employee View (My Benefits)
  if (!canManageBenefits) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Benefits</h1>
          <p className="text-muted-foreground">Benefits assigned to you by your organization</p>
        </div>

        {myDbBenefits.length > 0 ? (
          <div className="space-y-3">
            {myDbBenefits.map((benefit) => (
              <Card key={benefit.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{benefit.benefit_name}</h4>
                      <p className="text-sm text-muted-foreground capitalize mt-1">{benefit.benefit_type}</p>
                      {benefit.description && (
                        <p className="text-sm mt-3">{benefit.description}</p>
                      )}
                      {benefit.value && (
                        <p className="text-sm font-medium mt-2">Value: ₦{benefit.value.toLocaleString()}</p>
                      )}
                      <div className="text-xs text-muted-foreground mt-3">
                        Active from {new Date(benefit.start_date).toLocaleDateString()}
                        {benefit.end_date && ` to ${new Date(benefit.end_date).toLocaleDateString()}`}
                      </div>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">No benefits assigned yet. Please contact HR if you have questions about your benefits.</p>
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
        
        <div className="flex gap-2">
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => setIsAssignDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Assign Benefit
          </Button>
          <Button 
            variant="outline"
            onClick={() => handleOpenManageBenefit()}
          >
            <Plus className="mr-2 h-4 w-4" />
            Manage Benefits
          </Button>
        </div>
      </div>

      {/* Manager's Own Benefits Section */}
      {user?.employee_id && (
        <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-emerald-600" />
              My Assigned Benefits
            </CardTitle>
            <CardDescription>Benefits assigned to you</CardDescription>
          </CardHeader>
          <CardContent>
            {myDbBenefits.length > 0 ? (
              <div className="space-y-3">
                {myDbBenefits.map((benefit) => (
                  <div key={benefit.id} className="border rounded-lg p-4 bg-white dark:bg-gray-900">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{benefit.benefit_name}</h4>
                        <p className="text-sm text-muted-foreground capitalize">{benefit.benefit_type}</p>
                        {benefit.description && (
                          <p className="text-sm mt-2">{benefit.description}</p>
                        )}
                        {benefit.value && (
                          <p className="text-sm mt-1">Value: ₦{benefit.value.toLocaleString()}</p>
                        )}
                        <div className="text-xs text-muted-foreground mt-2">
                          Active from {new Date(benefit.start_date).toLocaleDateString()}
                          {benefit.end_date && ` to ${new Date(benefit.end_date).toLocaleDateString()}`}
                        </div>
                      </div>
                      <Badge variant="default">Active</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No benefits assigned to you yet.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Benefits Overview Cards - HR Managers Only */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* HMO Coverage */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                HMO Coverage
              </CardTitle>
              <Badge variant="outline">
                {hmoPercentage}% Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Employees with HMO</span>
                <span className="font-semibold">{totalWithHMO} / {filteredBenefits.length}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all"
                  style={{ width: `${hmoPercentage}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Track and manage employee health insurance coverage across the organization.
            </p>
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
              <Badge variant="outline">
                {insurancePercentage}% Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Employees with Insurance</span>
                <span className="font-semibold">{totalWithInsurance} / {filteredBenefits.length}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${insurancePercentage}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Monitor life insurance enrollment and coverage details for all employees.
            </p>
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
              <Badge variant="outline">
                {internetPercentage}% Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Employees with Allowance</span>
                <span className="font-semibold">{totalWithInternet} / {filteredBenefits.length}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${internetPercentage}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Track internet allowance assignments and usage across departments.
            </p>
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
              <Badge variant="outline">
                {equipmentPercentage}% Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Employees with Equipment</span>
                <span className="font-semibold">{totalWithEquipment} / {filteredBenefits.length}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all"
                  style={{ width: `${equipmentPercentage}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Manage equipment assignments and track asset allocation for employees.
            </p>
          </CardContent>
        </Card>
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

      {/* Assign Benefit Dialog */}
      <Dialog 
        open={isAssignDialogOpen} 
        onOpenChange={(open) => {
          setIsAssignDialogOpen(open)
          if (open) {
            const token = getAuthToken()
            if (token && employees.length === 0) {
              fetchEmployees()
            } else if (!token) {
              toast({
                title: "Authentication Required",
                description: "Please log in with a backend account to assign benefits.",
                variant: "destructive"
              })
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Benefit to Employees</DialogTitle>
            <DialogDescription>
              Assign a benefit to one or more employees
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Select Employees *</Label>
              <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
                {isLoadingEmployees ? (
                  <div className="text-sm text-muted-foreground text-center py-4">Loading employees...</div>
                ) : employees.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">No employees available</div>
                ) : (
                  employees
                    .filter(emp => emp.id !== undefined && emp.id !== null)
                    .map((employee) => {
                      const employeeId = employee.id!
                      const isChecked = assignBenefitForm.employee_ids.includes(employeeId)
                      return (
                        <div key={employeeId} className="flex items-center space-x-2 py-2 hover:bg-muted/50 rounded px-2">
                          <Checkbox
                            id={`emp-${employeeId}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setAssignBenefitForm({
                                  ...assignBenefitForm,
                                  employee_ids: [...assignBenefitForm.employee_ids, employeeId]
                                })
                              } else {
                                setAssignBenefitForm({
                                  ...assignBenefitForm,
                                  employee_ids: assignBenefitForm.employee_ids.filter(id => id !== employeeId)
                                })
                              }
                            }}
                          />
                          <label 
                            htmlFor={`emp-${employeeId}`} 
                            className="text-sm cursor-pointer flex-1"
                            onClick={() => {
                              setAssignBenefitForm({
                                ...assignBenefitForm,
                                employee_ids: isChecked
                                  ? assignBenefitForm.employee_ids.filter(id => id !== employeeId)
                                  : [...assignBenefitForm.employee_ids, employeeId]
                              })
                            }}
                          >
                            {employee.first_name} {employee.last_name} {employee.department ? `- ${employee.department}` : ''}
                          </label>
                        </div>
                      )
                    })
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {assignBenefitForm.employee_ids.length} employee(s) selected
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="benefit_name">Benefit Name *</Label>
              <Input
                id="benefit_name"
                value={assignBenefitForm.benefit_name}
                onChange={(e) => setAssignBenefitForm({...assignBenefitForm, benefit_name: e.target.value})}
                placeholder="e.g., Health Insurance, Gym Membership"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="benefit_type">Benefit Type *</Label>
              <Select value={assignBenefitForm.benefit_type} onValueChange={(v) => setAssignBenefitForm({...assignBenefitForm, benefit_type: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="health">Health & Medical</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                  <SelectItem value="retirement">Retirement</SelectItem>
                  <SelectItem value="allowance">Allowance</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="wellness">Wellness</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={assignBenefitForm.description}
                onChange={(e) => setAssignBenefitForm({...assignBenefitForm, description: e.target.value})}
                placeholder="Brief description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Monetary Value (₦)</Label>
              <Input
                id="value"
                type="number"
                value={assignBenefitForm.value}
                onChange={(e) => setAssignBenefitForm({...assignBenefitForm, value: e.target.value})}
                placeholder="e.g., 50000"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={assignBenefitForm.start_date}
                  onChange={(e) => setAssignBenefitForm({...assignBenefitForm, start_date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={assignBenefitForm.end_date}
                  onChange={(e) => setAssignBenefitForm({...assignBenefitForm, end_date: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={assignBenefitForm.notes}
                onChange={(e) => setAssignBenefitForm({...assignBenefitForm, notes: e.target.value})}
                placeholder="Additional notes"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignBenefit} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Assign Benefit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}