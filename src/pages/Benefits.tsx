import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Shield, Monitor, Heart, Plus, Users, Award, Package, Gift, Briefcase, GraduationCap, Stethoscope } from "lucide-react"
import { Pencil, Trash2, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from '@/contexts/AuthContext'
import { apiService, Employee } from '@/lib/api'
import { formatNaira } from "@/lib/currency"
import { BenefitPlanDialog } from "@/components/benefits/BenefitPlanDialog"
import { BENEFIT_TYPE_OPTIONS } from "@/components/benefits/benefitTypes"
import { NairaIcon } from "@/components/icons/NairaIcon"
import EmployeeMultiSelect from "@/components/EmployeeMultiSelect"

const BENEFIT_TYPE_STYLES: Record<string, { label: string; icon: any; color: string; bar: string; text: string }> = {
  health:     { label: 'Health / HMO',      icon: Heart,         color: 'text-red-500',     bar: 'bg-red-500',     text: 'text-red-600' },
  wellness:   { label: 'Wellness',          icon: Stethoscope,   color: 'text-pink-500',    bar: 'bg-pink-500',    text: 'text-pink-600' },
  insurance:  { label: 'Insurance',         icon: Shield,        color: 'text-blue-500',    bar: 'bg-blue-500',    text: 'text-blue-600' },
  allowance:  { label: 'Allowance',         icon: NairaIcon,     color: 'text-green-500',   bar: 'bg-green-500',   text: 'text-green-600' },
  equipment:  { label: 'Equipment',         icon: Monitor,       color: 'text-purple-500',  bar: 'bg-purple-500',  text: 'text-purple-600' },
  transport:  { label: 'Transport',         icon: Briefcase,     color: 'text-amber-500',   bar: 'bg-amber-500',   text: 'text-amber-600' },
  training:   { label: 'Training',          icon: GraduationCap, color: 'text-indigo-500',  bar: 'bg-indigo-500',  text: 'text-indigo-600' },
  bonus:      { label: 'Bonus',             icon: Gift,          color: 'text-fuchsia-500', bar: 'bg-fuchsia-500', text: 'text-fuchsia-600' },
}

function styleForType(type: string) {
  const key = (type || '').toLowerCase()
  return BENEFIT_TYPE_STYLES[key] || { label: type || 'Other', icon: Package, color: 'text-slate-500', bar: 'bg-slate-500', text: 'text-slate-600' }
}

/** Sections shown even before anything has been added to them. */
const ALWAYS_SHOWN_TYPES = ['allowance', 'health', 'insurance']

interface BenefitTypeOverviewProps {
  activeDbBenefits: any[]
  plans: any[]
  totalEmployees: number
  onOpenPlan: (id: number) => void
  onAddPlan: (type: string) => void
}

function BenefitTypeOverview({ activeDbBenefits, plans, totalEmployees, onOpenPlan, onAddPlan }: BenefitTypeOverviewProps) {
  // Group benefits by benefit_type
  const grouped = new Map<string, any[]>(ALWAYS_SHOWN_TYPES.map((type) => [type, []]))
  for (const b of activeDbBenefits) {
    const key = (b.benefit_type || 'other').toLowerCase()
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(b)
  }
  for (const plan of plans) {
    const key = (plan.benefit_type || 'other').toLowerCase()
    if (!grouped.has(key)) grouped.set(key, [])
  }

  const types = Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {types.map(([type, items]) => {
        const style = styleForType(type)
        const Icon = style.icon
        const uniqueEmployees = new Set(items.map(i => i.employee_id)).size
        const percentage = totalEmployees > 0 ? Math.round((uniqueEmployees / totalEmployees) * 100) : 0
        const typePlans = plans
          .filter((plan) => (plan.benefit_type || 'other').toLowerCase() === type)
          .map((plan) => {
            const holders = items.filter((item) => Number(item.benefit_plan_id) === Number(plan.id))
            return {
              ...plan,
              count: holders.length,
              totalValue: holders.reduce((sum, item) => sum + Number(item.value || 0), 0),
            }
          })
          .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))

        return (
          <Card key={type} data-section={type}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className={`h-5 w-5 ${style.color}`} />
                <span className="capitalize">{style.label}</span>
                <Badge variant="secondary" className="ml-auto">{items.length} assignment{items.length === 1 ? '' : 's'}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Staff assigned</span>
                  <span className={`text-2xl font-bold ${style.text}`}>{percentage}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className={`${style.bar} h-2 rounded-full transition-all`} style={{ width: `${Math.min(percentage, 100)}%` }} />
                </div>
                <p className="text-xs text-muted-foreground text-right">
                  {uniqueEmployees} of {totalEmployees} employees
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Benefits in this category
                  </p>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onAddPlan(type)}>
                    <Plus className="h-3 w-3 mr-1" /> Add Benefit
                  </Button>
                </div>
                {typePlans.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">Nothing here yet.</p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {typePlans.map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => onOpenPlan(plan.id)}
                        className="w-full text-left flex items-center justify-between gap-2 p-2 rounded-md border bg-muted/30 hover:bg-muted transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{plan.name}</p>
                          {plan.totalValue > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Total value: ₦{plan.totalValue.toLocaleString()}
                            </p>
                          )}
                        </div>
                        <span className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline">
                            <Users className="h-3 w-3 mr-1" />
                            {plan.count}
                          </Badge>
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export default function Benefits() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [dbBenefits, setDbBenefits] = useState<any[]>([])
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false)

  const [plans, setPlans] = useState<any[]>([])
  const [openPlanId, setOpenPlanId] = useState<number | 'new' | null>(null)
  const [newPlanType, setNewPlanType] = useState('')
  const [returnToPlanId, setReturnToPlanId] = useState<number | null>(null)
  const [editingEmployeeName, setEditingEmployeeName] = useState('')
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isManageAllDialogOpen, setIsManageAllDialogOpen] = useState(false)
  const [editingBenefitId, setEditingBenefitId] = useState<number | null>(null)
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
    include_dependants: false,
  })
  const { toast } = useToast()
  const { user, refreshUser } = useAuth()
  
  const canManageBenefits = user?.role === 'executive' || user?.role === 'hr_manager' || user?.role === 'corporate_hr'
  
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
      refreshBenefits()
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
  
  const fetchPlans = async () => {
    if (!canManageBenefits || !getAuthToken()) return

    try {
      const data = await apiService.getBenefitPlans()
      setPlans(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch benefit plans:', error)
    }
  }

  // One after the other: both can apply due renewals on the server.
  const refreshBenefits = async () => {
    await fetchBenefits()
    await fetchPlans()
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

  // Clears the form, and returns to the benefit if one person was being edited from it.
  const closeAssignDialog = () => {
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
      include_dependants: false,
    })
    setIsAssignDialogOpen(false)
    setEditingBenefitId(null)
    if (returnToPlanId !== null) {
      setOpenPlanId(returnToPlanId)
      setReturnToPlanId(null)
    }
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
          description: assignBenefitForm.description || null,
          // An empty box clears the value rather than keeping the old one.
          value: assignBenefitForm.value === '' ? null : parseFloat(assignBenefitForm.value),
          start_date: assignBenefitForm.start_date,
          end_date: assignBenefitForm.end_date || null,
          notes: assignBenefitForm.notes || null,
          include_dependants: assignBenefitForm.include_dependants,
          is_recurring: assignBenefitForm.is_recurring,
          recurrence: assignBenefitForm.is_recurring ? assignBenefitForm.recurrence : 'none',
        })
      } else {
        response = await apiService.assignBenefit({
          ...assignBenefitForm,
          value: assignBenefitForm.value ? parseFloat(assignBenefitForm.value) : undefined,
        })
      }
      
      console.log('Benefit assignment response:', response)
      
      // Refresh benefits list
      await refreshBenefits()

      const wasEditing = !!editingBenefitId
      closeAssignDialog()

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
        const skippedMessages = responseAny.skipped.map((s: any) => s?.reason || `Employee ${s}`).join('; ');

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
      const errorData = error?.data || {}
      const errorMessage = error?.message || errorData.error || 'Unknown error occurred'
      const skippedDetails = errorData.skipped || []
      
      let description = errorMessage
      if (skippedDetails.length > 0) {
        const skippedMessages = skippedDetails.map((s: any) => s?.reason || `Employee ${s}`).join('; ');
        description = skippedMessages
      }

      toast({
        title: editingBenefitId ? "Could not save" : "Assignment failed",
        description: description,
        variant: "destructive"
      })
    }
  }

  // Open Assign dialog pre-filled for editing an existing DB benefit
  const handleEditDbBenefit = (benefit: any, fromPlanId: number | null = null) => {
    const fromList = employees.find(e => Number(e.id) === Number(benefit.employee_id))
    const person = fromList || benefit.employee
    setEditingEmployeeName(person ? `${person.first_name} ${person.last_name}` : `Employee #${benefit.employee_id}`)
    setEditingBenefitId(Number(benefit.id))
    setReturnToPlanId(fromPlanId)
    setOpenPlanId(null)
    setAssignBenefitForm({
      employee_ids: [Number(benefit.employee_id)],
      benefit_name: benefit.benefit_name || '',
      benefit_type: benefit.benefit_type || '',
      description: benefit.description || '',
      value: benefit.value != null ? String(benefit.value) : '',
      start_date: benefit.start_date ? benefit.start_date.split('T')[0] : '',
      end_date: benefit.end_date ? benefit.end_date.split('T')[0] : '',
      notes: benefit.notes || '',
      is_recurring: !!benefit.is_recurring,
      recurrence: benefit.is_recurring && benefit.recurrence !== 'none' ? benefit.recurrence : 'none',
      include_dependants: !!benefit.include_dependants,
    })
    setIsAssignDialogOpen(true)
  }


  const handleDeleteDbBenefit = async (benefitId: number) => {
    try {
      await apiService.deleteBenefit(benefitId)
      await refreshBenefits()
      toast({ title: 'Benefit Deleted', description: 'The benefit has been removed.' })
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

  // Calculate benefit statistics from database
  const activeDbBenefits = dbBenefits.filter(b => b.status === 'active')
  const totalEmployees = employees.length
  const employeesWithBenefitsCount = new Set(activeDbBenefits.map(b => b.employee_id)).size
  
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
                        <p className="text-sm font-medium mt-2">Value: {formatNaira(benefit.value)}</p>
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
                          <p className="text-sm mt-1">Value: {formatNaira(benefit.value)}</p>
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
      <BenefitTypeOverview
        activeDbBenefits={activeDbBenefits}
        plans={plans}
        totalEmployees={totalEmployees}
        onOpenPlan={(id) => setOpenPlanId(id)}
        onAddPlan={(type) => {
          setNewPlanType(type)
          setOpenPlanId('new')
        }}
      />

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
                          : (b.employee ? `${b.employee.first_name} ${b.employee.last_name}` : `Employee #${b.employee_id}`)
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
                          {b.value ? formatNaira(b.value) : '—'}
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

      {/* Assign Benefit Dialog */}
      <Dialog 
        open={isAssignDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            closeAssignDialog()
            return
          }
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
            <DialogTitle>{editingBenefitId ? 'Edit Benefit' : 'Assign Benefit to Employees'}</DialogTitle>
            <DialogDescription>
              {editingBenefitId
                ? 'Update this benefit assignment for the selected employee.'
                : 'Assign a benefit to one or more employees'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {editingBenefitId ? (
              <div className="space-y-2">
                <Label>Employee</Label>
                <p className="text-sm font-medium">{editingEmployeeName}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Select Employees *</Label>
                <EmployeeMultiSelect
                  employees={employees as any}
                  selectedIds={assignBenefitForm.employee_ids}
                  loading={isLoadingEmployees}
                  onChange={(ids) => setAssignBenefitForm({ ...assignBenefitForm, employee_ids: ids as number[] })}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="benefit_name">Benefit Name *</Label>
              <Input
                id="benefit_name"
                value={assignBenefitForm.benefit_name}
                onChange={(e) => setAssignBenefitForm({...assignBenefitForm, benefit_name: e.target.value})}
                placeholder="e.g., Health Insurance, Gym Membership"
              />
              {editingBenefitId && (
                <p className="text-xs text-muted-foreground">
                  Changing the name or type here moves only this person. To rename a benefit for everyone, open it from its section.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="benefit_type">Benefit Type *</Label>
              <Select value={assignBenefitForm.benefit_type} onValueChange={(v) => setAssignBenefitForm({...assignBenefitForm, benefit_type: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {BENEFIT_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                  {assignBenefitForm.benefit_type && !BENEFIT_TYPE_OPTIONS.some((o) => o.value === assignBenefitForm.benefit_type) && (
                    <SelectItem value={assignBenefitForm.benefit_type}>{assignBenefitForm.benefit_type}</SelectItem>
                  )}
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

            {/* Dependants */}
            <div className="rounded-md border p-3">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="include_dependants"
                  checked={assignBenefitForm.include_dependants}
                  onCheckedChange={(checked) =>
                    setAssignBenefitForm({ ...assignBenefitForm, include_dependants: !!checked })
                  }
                />
                <div className="flex-1">
                  <Label htmlFor="include_dependants" className="cursor-pointer font-medium">
                    Include Dependants
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Extend this benefit to the employee's registered dependants.
                  </p>
                </div>
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
            <Button variant="outline" onClick={closeAssignDialog}>
              Cancel
            </Button>
            <Button onClick={handleAssignBenefit} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {editingBenefitId ? 'Save Changes' : 'Assign Benefit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BenefitPlanDialog
        planId={openPlanId}
        defaultType={newPlanType}
        employees={employees}
        onClose={() => setOpenPlanId(null)}
        onChanged={refreshBenefits}
        onEditMember={(member) => handleEditDbBenefit(member, Number(member.benefit_plan_id))}
      />

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
                          <p className="text-sm font-medium mt-2">Value: {formatNaira(benefit.value)}</p>
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