import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import apiService, { Employee } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { GraduationCap, Calendar, DollarSign, Users, Plus, BookOpen, Upload, Download, Award, Bell, CheckCircle } from "lucide-react"
import { Eye, Pencil, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import RoleBasedComponent from "@/components/RoleBasedComponent"

interface TrainingRecord {
  id: string
  employeeId: string
  employeeName: string
  employeeDepartment: string
  trainingType: string
  notes: string
  completionDate: string
  cost: number
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled'
  certificate?: File | null
  certificateName?: string
  trainingId?: number
  attachmentName?: string
  attachmentPath?: string
}

const trainingTypes = [
  'Technical Skills',
  'Leadership Development',
  'Safety Training',
  'Compliance Training',
  'Soft Skills',
  'Professional Certification',
  'Product Training',
  'Software Training',
  'Other'
]

export default function Training() {
  const { user, hasPermission } = useAuth()
  const canUploadCertificate = user?.role === 'hr_manager' || user?.role === 'executive' || user?.role === 'line_manager'
  const isLineManager = user?.role === 'line_manager'
  const isExecutiveOrHR = user?.role === 'executive' || user?.role === 'hr_manager' || user?.role === 'corporate_hr'
  const userDepartment = user?.department
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true)
  const [trainingAssignments, setTrainingAssignments] = useState<any[]>([])
  const [trainings, setTrainings] = useState<TrainingRecord[]>([])

  const [newTraining, setNewTraining] = useState({
    title: '',
    category: '',
    category_other: '',
    description: '',
    instructor: '',
    location: '',
    delivery_method: 'online' as 'online' | 'in_person' | 'hybrid',
    cost: 0,
  })
  
  const [assignmentData, setAssignmentData] = useState({
    training_id: null as number | null,
    employee_ids: [] as number[],
    scheduled_at: '',
    duration_hours: 1,
    completion_deadline: '',
  })

  const [trainingAttachment, setTrainingAttachment] = useState<File | null>(null)
  const attachmentInputRef = useRef<HTMLInputElement>(null)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const certificateInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // View / Edit / Delete state
  const [viewAssignment, setViewAssignment] = useState<any | null>(null)
  const [editAssignment, setEditAssignment] = useState<any | null>(null)
  const [editForm, setEditForm] = useState({
    scheduled_at: '',
    completion_deadline: '',
    duration_hours: 1,
    notes: '',
  })
  const [deleteAssignmentId, setDeleteAssignmentId] = useState<number | null>(null)

  const canManageTraining = isExecutiveOrHR || isLineManager

  const openEditDialog = (assignment: any) => {
    setEditAssignment(assignment)
    setEditForm({
      scheduled_at: assignment.scheduled_at ? String(assignment.scheduled_at).slice(0, 16) : '',
      completion_deadline: assignment.completion_deadline ? String(assignment.completion_deadline).slice(0, 16) : '',
      duration_hours: Number(assignment.duration_hours) || 1,
      notes: assignment.notes || '',
    })
  }

  const handleSaveEdit = async () => {
    if (!editAssignment) return
    try {
      await apiService.updateTrainingAssignment(editAssignment.id, {
        scheduled_at: editForm.scheduled_at,
        completion_deadline: editForm.completion_deadline,
        duration_hours: editForm.duration_hours,
        notes: editForm.notes,
      })
      toast({ title: 'Training updated', description: 'The training assignment has been updated.' })
      setEditAssignment(null)
      fetchTrainingAssignments()
    } catch (e) {
      toast({ title: 'Update failed', description: 'Could not update training assignment.', variant: 'destructive' })
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteAssignmentId) return
    try {
      await apiService.deleteTrainingAssignment(deleteAssignmentId)
      toast({ title: 'Training deleted', description: 'The training assignment has been removed.' })
      setDeleteAssignmentId(null)
      fetchTrainingAssignments()
    } catch (e) {
      toast({ title: 'Delete failed', description: 'Could not delete training assignment.', variant: 'destructive' })
    }
  }

  const handleConfirmCompletion = async (assignment: any) => {
    try {
      await apiService.markTrainingCompleted(assignment.id)
      toast({ title: 'Marked as completed', description: 'Your training has been marked as completed.' })
      fetchTrainingAssignments()
    } catch (e) {
      toast({ title: 'Action failed', description: 'Could not confirm completion.', variant: 'destructive' })
    }
  }

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const employeesList = await apiService.getEmployees()
        let assignableEmployees = employeesList.filter((emp: Employee) => emp.id !== undefined && emp.id !== null)
        
        // Executives, HR Managers, and Corporate HR see ALL employees
        // Line Managers only see employees in their own department
        if (isLineManager && !isExecutiveOrHR && userDepartment) {
          const norm = (s?: string) => (s || '').trim().toLowerCase()
          const target = norm(userDepartment)
          assignableEmployees = assignableEmployees.filter(emp => norm(emp.department) === target)
        }
        
        setEmployees(assignableEmployees)
      } catch (error) {
        console.error('Failed to fetch employees:', error)
        toast({
          title: "Error",
          description: "Failed to load employees from database",
          variant: "destructive"
        })
      } finally {
        setIsLoadingEmployees(false)
      }
    }
    fetchEmployees()
    fetchTrainingAssignments()
  }, [isLineManager, isExecutiveOrHR, userDepartment])

  const fetchTrainingAssignments = async () => {
    try {
      const data = await apiService.getTrainingAssignments()
      const list = Array.isArray(data) ? data : ((data as any)?.data || [])
      if (list.length > 0) {
        // Diagnostic: show the exact shape so we can see how the backend
        // returns attachment metadata for training programs.
        console.log('[Training] first assignment payload:', list[0])
        console.log('[Training] first assignment.training:', (list[0] as any)?.training)
      }
      setTrainingAssignments(list)
    } catch (error) {
      console.error('Failed to fetch training assignments:', error)
    }
  }

  const handleAddTraining = async () => {
    if (!assignmentData.employee_ids.length || !assignmentData.scheduled_at || !assignmentData.completion_deadline) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    if (newTraining.category === 'Other' && !newTraining.category_other.trim()) {
      toast({
        title: "Specify the category",
        description: "Please describe the training category.",
        variant: "destructive"
      })
      return
    }

    try {
      // Send training details + assignment data together
      const payload: any = {
        ...assignmentData,
        ...newTraining,
      }

      if (!payload.training_id) {
        delete payload.training_id
      }

      // "Other" category: send the free-text value the backend expects.
      if (payload.category === 'Other') {
        payload.category_other = (newTraining.category_other || '').trim()
      } else {
        delete payload.category_other
      }

      // Don't send the file through assignTraining — it goes via S3 separately.
      delete payload.attachment

      const result = await apiService.assignTraining(payload)

      // Step 2: upload training materials to S3 if provided
      if (trainingAttachment && result?.training_id) {
        try {
          await apiService.uploadTrainingAttachment(result.training_id, trainingAttachment)
        } catch (uploadErr) {
          console.error('Training material upload failed:', uploadErr)
          toast({
            title: "Training created, but material upload failed",
            description: uploadErr instanceof Error ? uploadErr.message : "Could not upload materials. Try again from the table.",
            variant: "destructive",
          })
        }
      }

      await fetchTrainingAssignments()
      
      setAssignmentData({
        training_id: null,
        employee_ids: [],
        scheduled_at: '',
        duration_hours: 1,
        completion_deadline: '',
      })
      setNewTraining({
        title: '',
        category: '',
        category_other: '',
        description: '',
        instructor: '',
        location: '',
        delivery_method: 'online',
        cost: 0,
      })
      setTrainingAttachment(null)
      setIsDialogOpen(false)

      toast({
        title: "Training Assigned",
        description: "Training has been scheduled and employees notified",
      })
    } catch (error) {
      toast({
        title: "Assignment failed",
        description: "Please try again",
        variant: "destructive"
      })
    }
  }

  const handleCertificateUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Certificate file must be smaller than 5MB",
          variant: "destructive"
        })
        return
      }
      
      if (!file.type.includes('pdf') && !file.type.includes('image')) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF or image file",
          variant: "destructive"
        })
        return
      }
      
      setNewTraining(prev => ({ ...prev, certificate: file }))
    }
  }

  const handleEmployeeChange = (employeeId: string) => {
    const employee = employees.find(emp => emp.id?.toString() === employeeId)
    // Note: employee selection is handled via assignmentData.employee_ids, not newTraining
    console.log('Selected employee:', employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown')
  }
  
  const handleUploadCertificateForTraining = (trainingId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Certificate file must be smaller than 5MB",
        variant: "destructive"
      })
      return
    }
    
    // Validate file type
    if (!file.type.includes('pdf') && !file.type.includes('image')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or image file",
        variant: "destructive"
      })
      return
    }
    
    // Update the training record with certificate
    const updatedTrainings = trainings.map(training => 
      training.id === trainingId 
        ? { 
            ...training, 
            certificate: file,
            certificateName: file.name,
            status: 'Completed' as const
          }
        : training
    )
    
    setTrainings(updatedTrainings)
    
    toast({
      title: "Certificate uploaded",
      description: "Training certificate has been uploaded and status updated to Completed."
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return <Badge className="bg-success/10 text-success border-success/20">Completed</Badge>
      case 'In Progress':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">In Progress</Badge>
      case 'Scheduled':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Scheduled</Badge>
      case 'Cancelled':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const handleUploadMaterialForTraining = async (trainingId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    event.target.value = ''

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Materials must be smaller than 10MB", variant: "destructive" })
      return
    }

    try {
      const result = await apiService.uploadTrainingAttachment(trainingId, file)
      console.log('[Training] upload result:', result)
      // Optimistically update local state so the row reflects the new
      // material even if the backend list endpoint hasn't been refreshed
      // or returns the field under a different name.
      setTrainingAssignments(prev => prev.map(a => (
        a.training_id === trainingId || a.training?.id === trainingId
          ? {
              ...a,
              training: {
                ...(a.training || {}),
                attachment_name: file.name,
                attachment_path: (result as any)?.key || a.training?.attachment_path,
              },
            }
          : a
      )))
      await fetchTrainingAssignments()
      toast({ title: "Materials uploaded", description: `${file.name} attached to training.` })
    } catch (err) {
      console.error('Material upload failed:', err)
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Could not upload training material",
        variant: "destructive",
      })
    }
  }

  // Filter trainings based on role and department
  const currentUserFullName = user ? `${user.firstName} ${user.lastName}` : ''
  
  // Map training assignments to display format
  const mappedTrainings: TrainingRecord[] = trainingAssignments.map(a => ({
    id: String(a.id),
    employeeId: String(a.employee_id),
    employeeName: `${a.employee?.first_name || ''} ${a.employee?.last_name || ''}`.trim(),
    employeeDepartment: a.employee?.department || 'N/A',
    trainingType: a.training?.category || a.training?.title || 'Training',
    notes: a.training?.description || '',
    completionDate: a.completion_deadline?.split('T')[0] || '',
    cost: Number(a.training?.cost) || 0,
    status: a.status === 'completed' ? 'Completed' : a.status === 'cancelled' ? 'Cancelled' : a.status === 'in_progress' ? 'In Progress' : 'Scheduled',
    certificateName: undefined,
    trainingId: a.training_id,
    // Backend field naming has drifted in the past — read every variant we've
    // seen so a successful upload always renders as "Download" instead of
    // "No materials".
    attachmentName:
      a.training?.attachment_name ||
      a.training?.attachment_filename ||
      a.training?.attachment ||
      a.attachment_name ||
      a.attachment_filename ||
      undefined,
    attachmentPath:
      a.training?.attachment_path ||
      a.training?.attachment_key ||
      a.training?.attachment_url ||
      a.attachment_path ||
      a.attachment_key ||
      undefined,
  }))

  const filteredTrainings = mappedTrainings

  const totalCost = filteredTrainings.reduce((sum, training) => sum + training.cost, 0)
  const completedTrainings = filteredTrainings.filter(t => t.status === 'Completed').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Training & Development</h1>
          <p className="text-muted-foreground">
            {isExecutiveOrHR
              ? 'Track training programs and employee development'
              : isLineManager && userDepartment 
                ? `Track training programs for ${userDepartment} department`
                : 'View your training programs'
            }
          </p>
        </div>
        
        <RoleBasedComponent allowedRoles={['hr_manager', 'corporate_hr', 'executive', 'line_manager']}>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Schedule Training
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Schedule New Training</DialogTitle>
              <DialogDescription>
                Add a new training program for an employee.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Training Title *</Label>
                <Input
                  id="title"
                  value={newTraining.title}
                  onChange={(e) => setNewTraining({...newTraining, title: e.target.value})}
                  placeholder="e.g., Advanced Excel Training"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={newTraining.category}
                  onValueChange={(value) => setNewTraining({...newTraining, category: value, category_other: value === 'Other' ? newTraining.category_other : ''})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {trainingTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {newTraining.category === 'Other' && (
                <div className="space-y-2">
                  <Label htmlFor="category_other">Specify category *</Label>
                  <Input
                    id="category_other"
                    value={newTraining.category_other}
                    onChange={(e) => setNewTraining({...newTraining, category_other: e.target.value})}
                    placeholder="e.g., HSE Refresher"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTraining.description}
                  onChange={(e) => setNewTraining({...newTraining, description: e.target.value})}
                  placeholder="Enter training details and objectives..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instructor">Instructor</Label>
                  <Input
                    id="instructor"
                    value={newTraining.instructor}
                    onChange={(e) => setNewTraining({...newTraining, instructor: e.target.value})}
                    placeholder="Instructor name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={newTraining.location}
                    onChange={(e) => setNewTraining({...newTraining, location: e.target.value})}
                    placeholder="Online/Office/Venue"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Delivery Method</Label>
                <Select value={newTraining.delivery_method} onValueChange={(value: any) => setNewTraining({...newTraining, delivery_method: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="in_person">In Person</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trainingCost">Training Cost (₦)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
                  <Input
                    id="trainingCost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newTraining.cost}
                    onChange={(e) => setNewTraining({ ...newTraining, cost: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="pl-8"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Contributes to Total Investment statistics.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="training_attachment">Training Materials (Optional)</Label>
                <div className="flex items-center gap-2">
                  <input
                    ref={attachmentInputRef}
                    type="file"
                    id="training_attachment"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        if (file.size > 10 * 1024 * 1024) {
                          toast({
                            title: "File too large",
                            description: "File must be smaller than 10MB",
                            variant: "destructive"
                          })
                          return
                        }
                        setTrainingAttachment(file)
                      }
                    }}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => attachmentInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {trainingAttachment ? trainingAttachment.name : 'Choose File'}
                  </Button>
                  {trainingAttachment && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setTrainingAttachment(null)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload training materials, documents, or resources (PDF, DOC, XLS, PPT, images - max 10MB)
                </p>
              </div>

              <hr className="my-4" />
              <h4 className="font-semibold">Assignment Details</h4>

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
                        const allSelected = allIds.length > 0 && allIds.every(id => assignmentData.employee_ids.includes(id))
                        setAssignmentData({
                          ...assignmentData,
                          employee_ids: allSelected ? [] : allIds,
                        })
                      }}
                    >
                      {employees.length > 0 && employees.every(e => assignmentData.employee_ids.includes(e.id!)) ? 'Clear All' : 'Select All'}
                    </Button>
                  )}
                </div>
                <div className="border rounded-md p-3 max-h-32 overflow-y-auto">
                  {isLoadingEmployees ? (
                    <div className="text-sm text-muted-foreground">Loading employees...</div>
                  ) : employees.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No employees available</div>
                  ) : (
                    employees.map((employee) => (
                      <div key={employee.id} className="flex items-center space-x-2 py-1">
                        <input
                          type="checkbox"
                          id={`emp-${employee.id}`}
                          checked={assignmentData.employee_ids.includes(employee.id!)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAssignmentData({
                                ...assignmentData,
                                employee_ids: [...assignmentData.employee_ids, employee.id!]
                              })
                            } else {
                              setAssignmentData({
                                ...assignmentData,
                                employee_ids: assignmentData.employee_ids.filter(id => id !== employee.id)
                              })
                            }
                          }}
                          className="rounded"
                        />
                        <label htmlFor={`emp-${employee.id}`} className="text-sm cursor-pointer">
                          {employee.first_name} {employee.last_name} - {employee.department}
                        </label>
                      </div>
                    ))
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {assignmentData.employee_ids.length} employee(s) selected
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduled_at">Scheduled Date & Time *</Label>
                  <Input
                    id="scheduled_at"
                    type="datetime-local"
                    value={assignmentData.scheduled_at}
                    onChange={(e) => setAssignmentData({...assignmentData, scheduled_at: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (hours) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={assignmentData.duration_hours}
                    onChange={(e) => setAssignmentData({...assignmentData, duration_hours: parseInt(e.target.value) || 1})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Completion Deadline *</Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={assignmentData.completion_deadline}
                  onChange={(e) => setAssignmentData({...assignmentData, completion_deadline: e.target.value})}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddTraining} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Schedule Training
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </RoleBasedComponent>
      </div>

      {/* Training Assignment Notifications - for employees */}
      {!isExecutiveOrHR && !isLineManager && trainingAssignments.filter(a => !a.notification_read && a.status === 'scheduled').length > 0 && (
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <Bell className="h-5 w-5" />
              New Training Assignments ({trainingAssignments.filter(a => !a.notification_read && a.status === 'scheduled').length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {trainingAssignments.filter(a => !a.notification_read && a.status === 'scheduled').map((assignment) => (
              <div key={assignment.id} className="bg-white dark:bg-gray-900 p-4 rounded-lg border">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{assignment.training?.title || 'Training'}</h4>
                    <div className="text-sm text-muted-foreground mt-2 space-y-1">
                      <div>📅 Scheduled: {new Date(assignment.scheduled_at).toLocaleString()}</div>
                      <div>⏱️ Duration: {assignment.duration_hours} hour(s)</div>
                      <div>⏰ Complete by: {new Date(assignment.completion_deadline).toLocaleDateString()}</div>
                    </div>
                    {assignment.training?.attachment_name && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={async () => {
                          try {
                            const blob = await apiService.downloadTrainingAttachment(assignment.training_id)
                            const url = window.URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = assignment.training.attachment_name || 'training-material'
                            document.body.appendChild(a)
                            a.click()
                            window.URL.revokeObjectURL(url)
                            document.body.removeChild(a)
                          } catch (error) {
                            toast({
                              title: "Download failed",
                              description: "Could not download training materials",
                              variant: "destructive"
                            })
                          }
                        }}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download Materials
                      </Button>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={async () => {
                      await apiService.markTrainingNotificationRead(assignment.id);
                      fetchTrainingAssignments();
                    }}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{filteredTrainings.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedTrainings}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {filteredTrainings.filter(t => t.status === 'In Progress').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
            
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              ₦{totalCost.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Training Table */}
      <Card>
        <CardHeader>
          <CardTitle>Training Programs</CardTitle>
          <CardDescription>
            {isExecutiveOrHR
              ? 'Track all employee training and development programs'
              : isLineManager && userDepartment 
                ? `Training programs for ${userDepartment} department employees`
                : 'Your personal training and development programs'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Training Type</TableHead>
                  <TableHead className="hidden md:table-cell">Notes</TableHead>
                  <TableHead>Completion Date</TableHead>
                  <TableHead className="hidden sm:table-cell">Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Materials</TableHead>
                  {canUploadCertificate && <TableHead>Certificate</TableHead>}
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrainings.map((training) => {
                  const assignment = trainingAssignments.find(a => String(a.id) === training.id)
                  const isOwnAssignment = assignment && user && (
                    String(assignment.employee_id) === String((user as any).employee_id ?? (user as any).id) ||
                    `${assignment.employee?.first_name || ''} ${assignment.employee?.last_name || ''}`.trim() === currentUserFullName
                  )
                  return (
                  <TableRow key={training.id}>
                    <TableCell className="font-medium">{training.employeeName}</TableCell>
                    <TableCell>{training.trainingType}</TableCell>
                    <TableCell className="hidden md:table-cell max-w-xs truncate">
                      {training.notes || 'No notes'}
                    </TableCell>
                    <TableCell>{training.completionDate}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      ₦{training.cost.toLocaleString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(training.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {training.attachmentName ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              try {
                                const blob = await apiService.downloadTrainingAttachment(training.trainingId!)
                                const url = window.URL.createObjectURL(blob)
                                const a = document.createElement('a')
                                a.href = url
                                a.download = training.attachmentName || 'training-material'
                                document.body.appendChild(a)
                                a.click()
                                window.URL.revokeObjectURL(url)
                                document.body.removeChild(a)
                              } catch (error) {
                                toast({
                                  title: "Download failed",
                                  description: "Could not download training materials",
                                  variant: "destructive"
                                })
                              }
                            }}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">No materials</span>
                        )}
                        {canUploadCertificate && training.trainingId && (
                          <>
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
                              onChange={(e) => handleUploadMaterialForTraining(training.trainingId!, e)}
                              className="hidden"
                              id={`mat-upload-${training.id}`}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              title={training.attachmentName ? 'Replace materials' : 'Upload materials'}
                              onClick={() => document.getElementById(`mat-upload-${training.id}`)?.click()}
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                    {canUploadCertificate && (
                      <TableCell>
                        {training.certificateName ? (
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-muted-foreground truncate max-w-[100px]">
                              {training.certificateName}
                            </span>
                          </div>
                        ) : (training.status === 'In Progress' || training.status === 'Scheduled') ? (
                          <>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleUploadCertificateForTraining(training.id, e)}
                              className="hidden"
                              id={`cert-upload-${training.id}`}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById(`cert-upload-${training.id}`)?.click()}
                            >
                              <Upload className="h-4 w-4 mr-1" />
                              Upload
                            </Button>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="View details"
                          onClick={() => assignment && setViewAssignment(assignment)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canManageTraining && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Edit"
                              onClick={() => assignment && openEditDialog(assignment)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Delete"
                              className="text-destructive hover:text-destructive"
                              onClick={() => assignment && setDeleteAssignmentId(assignment.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {isOwnAssignment && training.status !== 'Completed' && training.status !== 'Cancelled' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-1"
                            onClick={() => assignment && handleConfirmCompletion(assignment)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Confirm
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={!!viewAssignment} onOpenChange={(o) => !o && setViewAssignment(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewAssignment?.training?.title || 'Training Details'}</DialogTitle>
            <DialogDescription>
              Full information about this training assignment.
            </DialogDescription>
          </DialogHeader>
          {viewAssignment && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Employee:</span><div className="font-medium">{`${viewAssignment.employee?.first_name || ''} ${viewAssignment.employee?.last_name || ''}`.trim()}</div></div>
                <div><span className="text-muted-foreground">Department:</span><div className="font-medium">{viewAssignment.employee?.department || 'N/A'}</div></div>
                <div><span className="text-muted-foreground">Category:</span><div className="font-medium">{viewAssignment.training?.category || '—'}</div></div>
                <div><span className="text-muted-foreground">Delivery Method:</span><div className="font-medium capitalize">{viewAssignment.training?.delivery_method || '—'}</div></div>
                <div><span className="text-muted-foreground">Instructor:</span><div className="font-medium">{viewAssignment.training?.instructor || '—'}</div></div>
                <div><span className="text-muted-foreground">Location:</span><div className="font-medium">{viewAssignment.training?.location || '—'}</div></div>
                <div><span className="text-muted-foreground">Scheduled:</span><div className="font-medium">{viewAssignment.scheduled_at ? new Date(viewAssignment.scheduled_at).toLocaleString() : '—'}</div></div>
                <div><span className="text-muted-foreground">Deadline:</span><div className="font-medium">{viewAssignment.completion_deadline ? new Date(viewAssignment.completion_deadline).toLocaleString() : '—'}</div></div>
                <div><span className="text-muted-foreground">Duration:</span><div className="font-medium">{viewAssignment.duration_hours || 0} hour(s)</div></div>
                <div><span className="text-muted-foreground">Status:</span><div className="font-medium capitalize">{viewAssignment.status}</div></div>
              </div>
              {viewAssignment.training?.description && (
                <div>
                  <span className="text-muted-foreground">Description:</span>
                  <div className="font-medium whitespace-pre-wrap">{viewAssignment.training.description}</div>
                </div>
              )}
              {viewAssignment.notes && (
                <div>
                  <span className="text-muted-foreground">Notes:</span>
                  <div className="font-medium whitespace-pre-wrap">{viewAssignment.notes}</div>
                </div>
              )}
              {viewAssignment.training?.attachment_name && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const blob = await apiService.downloadTrainingAttachment(viewAssignment.training_id)
                      const url = window.URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = viewAssignment.training.attachment_name || 'training-material'
                      document.body.appendChild(a)
                      a.click()
                      window.URL.revokeObjectURL(url)
                      document.body.removeChild(a)
                    } catch {
                      toast({ title: 'Download failed', variant: 'destructive' })
                    }
                  }}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download Materials
                </Button>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewAssignment(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editAssignment} onOpenChange={(o) => !o && setEditAssignment(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Training Assignment</DialogTitle>
            <DialogDescription>Update schedule, deadline, duration, or notes.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Scheduled Date & Time</Label>
              <Input type="datetime-local" value={editForm.scheduled_at}
                onChange={(e) => setEditForm({ ...editForm, scheduled_at: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Completion Deadline</Label>
              <Input type="datetime-local" value={editForm.completion_deadline}
                onChange={(e) => setEditForm({ ...editForm, completion_deadline: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Duration (hours)</Label>
              <Input type="number" min="1" value={editForm.duration_hours}
                onChange={(e) => setEditForm({ ...editForm, duration_hours: parseInt(e.target.value) || 1 })} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAssignment(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} className="bg-emerald-600 hover:bg-emerald-700 text-white">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteAssignmentId} onOpenChange={(o) => !o && setDeleteAssignmentId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Training Assignment?</DialogTitle>
            <DialogDescription>
              This will permanently remove the training assignment. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAssignmentId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}