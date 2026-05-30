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
import { Shield, Wifi, Monitor, Heart, Upload, Plus, Users, Award, Package, Gift, DollarSign, Briefcase, GraduationCap, Stethoscope } from "lucide-react"
import { Pencil, Trash2, Settings } from "lucide-react"
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
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isManageAllDialogOpen, setIsManageAllDialogOpen] = useState(false)
  const [editingBenefitId, setEditingBenefitId] = useState<number | null>(null)
  const [deletingBenefitId, setDeletingBenefitId] = useState<number | null>(null)
  const [manageSearch, setManageSearch] = useState('')
  const [selectedEmployeeForView, setSelectedEmployeeForView] = useState<{employeeId: number, employeeName: string, benefits: any[]} | null>(null)
  const [assignBenefitForm, setAssignBenefitForm] = useState({
    employee_ids: [] as number[],
    benefit_name: '',
    benefit_type: '',
    description: '',
    value: '',
    start_date: '',
    end_date: '',
    notes: '',
    is_recurring: false,
    recurrence: 'none' as 'none' | 'monthly' | 'yearly',
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
      const data = await apiService.getEmployeeBenefits() as any
      const benefitsArray = Array.isArray(data) ? data : (data?.data || [])
      console.log('Fetched benefits:', benefitsArray)
      console.log('Current user employee_id:', user?.employee_id)
      setDbBenefits(benefitsArray)
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
      const data = await apiService.getEmployees() as any
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

    // Frontend date validation: end_date must be strictly after start_date
    if (assignBenefitForm.end_date) {
      const start = new Date(assignBenefitForm.start_date)
      const end = new Date(assignBenefitForm.end_date)
      if (end <= start) {
        toast({
          title: "Invalid date range",
          description: "End date must be after the start date.",
          variant: "destructive"
        })
        return
      }
    }

    try {
      let response: any
      if (editingBenefitId) {
        // Update existing benefit (single benefit)
        response = await apiService.updateBenefit(editingBenefitId, {
          benefit_name: assignBenefitForm.benefit_name,
          benefit_type: assignBenefitForm.benefit_type,
          description: assignBenefitForm.description,
          value: assignBenefitForm.value ? parseFloat(assignBenefitForm.value) : undefined,
          start_date: assignBenefitForm.start_date,
          end_date: assignBenefitForm.end_date || null,
          notes: assignBenefitForm.notes,
        })
      } else {
        response = await apiService.assignBenefit({
          ...assignBenefitForm,
          value: assignBenefitForm.value ? parseFloat(assignBenefitForm.value) : undefined,
        })
      }
      
      console.log('Benefit assignment response:', response)
      
      // Refresh benefits list
      await fetchBenefits()
      
      // Reset form
      setAssignBenefitForm({
        employee_ids: [],
        benefit_name: '',
        benefit_type: '',
        description: '',
        value: '',
        start_date: '',
        end_date: '',
        notes: '',
        is_recurring: false,
        recurrence: 'none',
      })
      setIsAssignDialogOpen(false)
      const wasEditing = !!editingBenefitId
      setEditingBenefitId(null)

      if (wasEditing) {
        toast({
          title: "Benefit Updated",
          description: `Benefit "${assignBenefitForm.benefit_name}" updated successfully.`,
        })
        return
      }

      // Check if there were any skipped employees
      const responseAny = response as any
      if (responseAny.skipped && responseAny.skipped.length > 0) {
        const skippedMessages = responseAny.skipped.map((s: any) => {
          if (typeof s === 'object' && s.reason) {
            return `Employee ${s.employee_id}: ${s.reason}`;
          }
          return `Employee ${s}`;
        }).join(', ');
        
        toast({
          title: responseAny.benefits?.length > 0 ? "Partially Assigned" : "Assignment Failed",
          description: responseAny.benefits?.length > 0 
            ? `${responseAny.benefits.length} benefit(s) assigned. Skipped: ${skippedMessages}`
            : `No benefits assigned. Errors: ${skippedMessages}`,
          variant: responseAny.benefits?.length > 0 ? "default" : "destructive"
        })
      } else {
        toast({
          title: "Benefit Assigned",
          description: `Benefit "${assignBenefitForm.benefit_name}" has been assigned successfully to ${responseAny.benefits?.length || assignBenefitForm.employee_ids.length} employee(s)`,
        })
      }
    } catch (error: any) {
      console.error('Error assigning benefit:', error)
      const errorData = error?.response?.data || {}
      const errorMessage = errorData.error || error?.message || 'Unknown error occurred'
      const skippedDetails = errorData.skipped || []
      
      let description = errorMessage
      if (skippedDetails.length > 0) {
        const skippedMessages = skippedDetails.map((s: any) => {
          if (typeof s === 'object' && s.reason) {
            return `Employee ${s.employee_id}: ${s.reason}`;
          }
          return `Employee ${s}`;
        }).join(', ');
        description = `${errorMessage}. Details: ${skippedMessages}`
      }
      
      toast({
        title: "Assignment failed",
        description: description,
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

  // Open Assign dialog pre-filled for editing an existing DB benefit
  const handleEditDbBenefit = (benefit: any) => {
    setEditingBenefitId(Number(benefit.id))
    setAssignBenefitForm({
      employee_ids: [Number(benefit.employee_id)],
      benefit_name: benefit.benefit_name || '',
      benefit_type: benefit.benefit_type || '',
      description: benefit.description || '',
      value: benefit.value != null ? String(benefit.value) : '',
      start_date: benefit.start_date ? benefit.start_date.split('T')[0] : '',
      end_date: benefit.end_date ? benefit.end_date.split('T')[0] : '',
      notes: benefit.notes || '',
      is_recurring: false,
      recurrence: 'none',
    })
    setIsAssignDialogOpen(true)
  }

  const handleDeleteDbBenefit = async (benefitId: number) => {
    try {
      await apiService.deleteBenefit(benefitId)
      await fetchBenefits()
      toast({ title: 'Benefit Deleted', description: 'The benefit has been removed.' })
      setDeletingBenefitId(null)
      // Refresh view dialog content if open
      if (selectedEmployeeForView) {
        setSelectedEmployeeForView({
          ...selectedEmployeeForView,
          benefits: selectedEmployeeForView.benefits.filter((b: any) => Number(b.id) !== benefitId),
        })
      }
    } catch (e: any) {
      console.error('Delete benefit error:', e)
      toast({ title: 'Delete failed', description: e?.message || 'Could not delete benefit', variant: 'destructive' })
    }
  }

  // Whether the current user can edit/delete a benefit assignment.
  // HR managers and executives can always manage. If backend supplies
  // `assigned_by` (user id), the original assigner can also manage.
  const canEditBenefit = (benefit: any): boolean => {
    if (canManageBenefits) return true
    if (!user) return false
    const assignerId = benefit?.assigned_by ?? benefit?.created_by
    if (assignerId != null && String(assignerId) === String(user.id)) return true
    return false
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount)
  }

  // Calculate benefit statistics from database
  const activeDbBenefits = dbBenefits.filter(b => b.status === 'active')
  const totalEmployees = employees.length
  const employeesWithBenefitsCount = new Set(activeDbBenefits.map(b => b.employee_id)).size
  
  // Count unique employees by benefit type - map benefit_type values to categories
  const hmoEmployees = new Set(
    activeDbBenefits
      .filter(b => {
        const type = b.benefit_type?.toLowerCase()
        return type === 'health' || type === 'wellness'
      })
      .map(b => b.employee_id)
  ).size
  
  const insuranceEmployees = new Set(
    activeDbBenefits
      .filter(b => {
        const type = b.benefit_type?.toLowerCase()
        return type === 'insurance'
      })
      .map(b => b.employee_id)
  ).size
  
  const internetEmployees = new Set(
    activeDbBenefits
      .filter(b => {
        const type = b.benefit_type?.toLowerCase()
        // Allowance type could be internet, transport, meal, etc. 
        // Check benefit_name for internet-specific allowances
        return type === 'allowance' && (
          b.benefit_name?.toLowerCase().includes('internet') ||
          b.benefit_name?.toLowerCase().includes('data') ||
          b.benefit_name?.toLowerCase().includes('wifi')
        )
      })
      .map(b => b.employee_id)
  ).size
  
  const equipmentEmployees = new Set(
    activeDbBenefits
      .filter(b => {
        const type = b.benefit_type?.toLowerCase()
        return type === 'equipment'
      })
      .map(b => b.employee_id)
  ).size

  const hmoPercentage = totalEmployees > 0 ? Math.round((hmoEmployees / totalEmployees) * 100) : 0
  const insurancePercentage = totalEmployees > 0 ? Math.round((insuranceEmployees / totalEmployees) * 100) : 0
  const internetPercentage = totalEmployees > 0 ? Math.round((internetEmployees / totalEmployees) * 100) : 0
  const equipmentPercentage = totalEmployees > 0 ? Math.round((equipmentEmployees / totalEmployees) * 100) : 0

  // Get current user's benefits from database
  const currentUserEmployeeId = user?.employee_id
  const myDbBenefits = dbBenefits.filter(b => {
    // Handle both number and string comparisons
    const benefitEmployeeId = typeof b.employee_id === 'string' ? parseInt(b.employee_id, 10) : b.employee_id
    const userEmployeeId = typeof currentUserEmployeeId === 'string' ? parseInt(currentUserEmployeeId, 10) : currentUserEmployeeId
    const matches = benefitEmployeeId === userEmployeeId && b.status === 'active'
    
    // Debug logging
    if (userEmployeeId) {
      console.log('Benefit filter check:', {
        benefit_id: b.id,
        benefit_employee_id: b.employee_id,
        benefit_employee_id_parsed: benefitEmployeeId,
        user_employee_id: currentUserEmployeeId,
        user_employee_id_parsed: userEmployeeId,
        status: b.status,
        matches
      })
    }
    
    return matches
  })
  
  console.log('Filtered myDbBenefits:', myDbBenefits)
  console.log('Total dbBenefits:', dbBenefits.length)
  console.log('Current user employee_id:', currentUserEmployeeId)
  
  // Group database benefits by employee for manager view
  const employeeBenefitsMap = new Map<number, any[]>()
  dbBenefits.forEach(benefit => {
    const empId = typeof benefit.employee_id === 'string' ? parseInt(benefit.employee_id, 10) : benefit.employee_id
    if (!employeeBenefitsMap.has(empId)) {
      employeeBenefitsMap.set(empId, [])
    }
    employeeBenefitsMap.get(empId)!.push(benefit)
  })

  // Create list of employees with their benefits for the table
  const employeesWithBenefits = Array.from(employeeBenefitsMap.entries()).map(([employeeId, benefits]) => {
    const employee = employees.find(e => e.id === employeeId)
    return {
      employeeId,
      employeeName: employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown',
      employeeDepartment: employee?.department || 'N/A',
      benefits: benefits.filter(b => b.status === 'active'),
      lastUpdated: benefits.length > 0 ? benefits[0].updated_at : null
    }
  }).filter(item => item.employeeName !== 'Unknown')
  
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
            onClick={() => setIsManageAllDialogOpen(true)}
          >
            <Settings className="mr-2 h-4 w-4" />
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

      {/* Benefits Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* HMO Coverage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              HMO Coverage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Employees with HMO</span>
                <span className="text-2xl font-bold text-red-600">{hmoPercentage}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all"
                  style={{ width: `${hmoPercentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {hmoEmployees} of {totalEmployees} employees
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Track and manage employee health insurance coverage across the organization.
            </p>
          </CardContent>
        </Card>

        {/* Life Insurance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              Life Insurance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Employees with Insurance</span>
                <span className="text-2xl font-bold text-blue-600">{insurancePercentage}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${insurancePercentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {insuranceEmployees} of {totalEmployees} employees
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Monitor life insurance enrollment and coverage details for all employees.
            </p>
          </CardContent>
        </Card>

        {/* Internet Allowance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5 text-green-500" />
              Internet Allowance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Employees with Allowance</span>
                <span className="text-2xl font-bold text-green-600">{internetPercentage}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${internetPercentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {internetEmployees} of {totalEmployees} employees
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Track internet allowance assignments and usage across departments.
            </p>
          </CardContent>
        </Card>

        {/* Equipment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-purple-500" />
              Equipment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Employees with Equipment</span>
                <span className="text-2xl font-bold text-purple-600">{equipmentPercentage}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all"
                  style={{ width: `${equipmentPercentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {equipmentEmployees} of {totalEmployees} employees
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Manage equipment assignments and track asset allocation for employees.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{employeesWithBenefits.length}</div>
            <p className="text-xs text-muted-foreground mt-1">with assigned benefits</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Benefits</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{dbBenefits.filter(b => b.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground mt-1">active benefit assignments</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Benefit Types</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {new Set(dbBenefits.map(b => b.benefit_type)).size}
            </div>
            <p className="text-xs text-muted-foreground mt-1">unique benefit types</p>
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
                  <TableHead>Department</TableHead>
                  <TableHead>Benefits</TableHead>
                  <TableHead className="hidden lg:table-cell">Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeesWithBenefits.length > 0 ? (
                  employeesWithBenefits.map((item) => (
                    <TableRow key={item.employeeId}>
                      <TableCell className="font-medium">{item.employeeName}</TableCell>
                      <TableCell>{item.employeeDepartment}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.benefits.map((benefit) => (
                            <Badge key={benefit.id} variant="default" className="text-xs">
                              {benefit.benefit_name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedEmployeeForView({
                              employeeId: item.employeeId,
                              employeeName: item.employeeName,
                              benefits: item.benefits
                            })
                            setIsViewDialogOpen(true)
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No employee benefits found. Assign benefits to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Manage All Benefits Dialog */}
      <Dialog open={isManageAllDialogOpen} onOpenChange={setIsManageAllDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Employee Benefits</DialogTitle>
            <DialogDescription>
              View, edit, or remove benefit assignments across the organisation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <Input
              placeholder="Search by employee, benefit name, or type..."
              value={manageSearch}
              onChange={(e) => setManageSearch(e.target.value)}
            />

            <div className="overflow-x-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Benefit</TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead className="hidden md:table-cell">Value</TableHead>
                    <TableHead className="hidden lg:table-cell">Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const q = manageSearch.trim().toLowerCase()
                    const rows = dbBenefits
                      .map((b: any) => {
                        const emp = employees.find(e => Number(e.id) === Number(b.employee_id))
                        const empName = emp
                          ? `${emp.first_name} ${emp.last_name}`
                          : (b.employee_name || `Employee #${b.employee_id}`)
                        return { ...b, _empName: empName }
                      })
                      .filter((b: any) => {
                        if (!q) return true
                        return (
                          b._empName.toLowerCase().includes(q) ||
                          (b.benefit_name || '').toLowerCase().includes(q) ||
                          (b.benefit_type || '').toLowerCase().includes(q)
                        )
                      })
                    if (rows.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            No benefit assignments found.
                          </TableCell>
                        </TableRow>
                      )
                    }
                    return rows.map((b: any) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{b._empName}</TableCell>
                        <TableCell>{b.benefit_name}</TableCell>
                        <TableCell className="hidden md:table-cell capitalize">{b.benefit_type}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {b.value ? `₦${Number(b.value).toLocaleString()}` : '—'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs">
                          {b.start_date ? new Date(b.start_date).toLocaleDateString() : '—'}
                          {b.end_date ? ` → ${new Date(b.end_date).toLocaleDateString()}` : ''}
                        </TableCell>
                        <TableCell>
                          <Badge variant={b.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                            {b.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {canEditBenefit(b) && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setIsManageAllDialogOpen(false)
                                    handleEditDbBenefit(b)
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => {
                                    if (window.confirm(`Delete benefit "${b.benefit_name}" for ${b._empName}?`)) {
                                      handleDeleteDbBenefit(Number(b.id))
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  })()}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManageAllDialogOpen(false)}>Close</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => { setIsManageAllDialogOpen(false); setEditingBenefitId(null); setIsAssignDialogOpen(true); }}
            >
              <Plus className="mr-2 h-4 w-4" /> New Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Legacy local-state Manage Benefits Dialog (kept for backwards compat, hidden) */}
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
          if (!open) {
            setEditingBenefitId(null)
          }
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
            <DialogTitle>{editingBenefitId ? 'Edit Benefit' : 'Assign Benefit to Employees'}</DialogTitle>
            <DialogDescription>
              {editingBenefitId
                ? 'Update this benefit assignment for the selected employee.'
                : 'Assign a benefit to one or more employees'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Select Employees *</Label>
                {employees.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allIds = employees.map(e => e.id!).filter(Boolean)
                      const allSelected = allIds.length > 0 && allIds.every(id => assignBenefitForm.employee_ids.includes(id))
                      setAssignBenefitForm({
                        ...assignBenefitForm,
                        employee_ids: allSelected ? [] : allIds,
                      })
                    }}
                  >
                    {employees.length > 0 && employees.every(e => assignBenefitForm.employee_ids.includes(e.id!)) ? 'Clear All' : 'Select All'}
                  </Button>
                )}
              </div>
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
                  min={assignBenefitForm.start_date || undefined}
                  value={assignBenefitForm.end_date}
                  onChange={(e) => setAssignBenefitForm({...assignBenefitForm, end_date: e.target.value})}
                />
                {assignBenefitForm.end_date && assignBenefitForm.start_date && new Date(assignBenefitForm.end_date) <= new Date(assignBenefitForm.start_date) && (
                  <p className="text-xs text-destructive">End date must be after start date.</p>
                )}
              </div>
            </div>

            {/* Recurring Benefit */}
            <div className="rounded-md border p-3 space-y-2">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="is_recurring"
                  checked={assignBenefitForm.is_recurring}
                  onCheckedChange={(checked) =>
                    setAssignBenefitForm({
                      ...assignBenefitForm,
                      is_recurring: !!checked,
                      recurrence: checked ? (assignBenefitForm.recurrence === 'none' ? 'monthly' : assignBenefitForm.recurrence) : 'none',
                    })
                  }
                />
                <div className="flex-1">
                  <Label htmlFor="is_recurring" className="cursor-pointer font-medium">
                    Recurring Benefit
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically renew this benefit on a schedule.
                  </p>
                </div>
              </div>
              {assignBenefitForm.is_recurring && (
                <div>
                  <Label htmlFor="recurrence">Recurrence</Label>
                  <Select
                    value={assignBenefitForm.recurrence}
                    onValueChange={(v: any) => setAssignBenefitForm({ ...assignBenefitForm, recurrence: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
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
            <Button variant="outline" onClick={() => { setIsAssignDialogOpen(false); setEditingBenefitId(null); }}>
              Cancel
            </Button>
            <Button onClick={handleAssignBenefit} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {editingBenefitId ? 'Save Changes' : 'Assign Benefit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Employee Benefits Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Benefits for {selectedEmployeeForView?.employeeName}</DialogTitle>
            <DialogDescription>
              View all assigned benefits for this employee
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedEmployeeForView && selectedEmployeeForView.benefits.length > 0 ? (
              selectedEmployeeForView.benefits.map((benefit) => (
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
                        {benefit.notes && (
                          <p className="text-sm text-muted-foreground mt-2 italic">Notes: {benefit.notes}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={benefit.status === 'active' ? 'default' : 'secondary'}>
                          {benefit.status}
                        </Badge>
                        {canEditBenefit(benefit) && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setIsViewDialogOpen(false); handleEditDbBenefit(benefit); }}
                            >
                              <Pencil className="h-4 w-4 mr-1" /> Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                if (window.confirm(`Delete benefit "${benefit.benefit_name}"?`)) {
                                  handleDeleteDbBenefit(Number(benefit.id))
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-1" /> Delete
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No benefits assigned to this employee.
              </p>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}