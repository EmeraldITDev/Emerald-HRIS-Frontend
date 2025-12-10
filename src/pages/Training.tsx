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
  'Software Training'
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
    description: '',
    instructor: '',
    location: '',
    delivery_method: 'online' as 'online' | 'in_person' | 'hybrid',
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

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await apiService.getEmployees()
        let activeEmployees = data.filter(emp => emp.employment_status === 'Active')
        
        // Filter by department for line managers
        if (isLineManager && userDepartment) {
          activeEmployees = activeEmployees.filter(emp => emp.department === userDepartment)
        }
        
        setEmployees(activeEmployees)
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
  }, [isLineManager, userDepartment])

  const fetchTrainingAssignments = async () => {
    try {
      const data = await apiService.getTrainingAssignments()
      setTrainingAssignments(Array.isArray(data) ? data : ((data as any)?.data || []))
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

    try {
      // Send training details + assignment data together
      const payload: any = {
        ...assignmentData,
        ...newTraining,
        attachment: trainingAttachment || undefined,
      }

      if (!payload.training_id) {
        delete payload.training_id
      }

      await apiService.assignTraining(payload)
      
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
        description: '',
        instructor: '',
        location: '',
        delivery_method: 'online',
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
    cost: 0,
    status: a.status === 'completed' ? 'Completed' : a.status === 'cancelled' ? 'Cancelled' : a.status === 'in_progress' ? 'In Progress' : 'Scheduled',
    certificateName: undefined,
    trainingId: a.training_id,
    attachmentName: a.training?.attachment_name,
    attachmentPath: a.training?.attachment_path,
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
                <Select onValueChange={(value) => setNewTraining({...newTraining, category: value})}>
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
                <Label>Select Employees *</Label>
                <div className="border rounded-md p-3 max-h-32 overflow-y-auto">
                  {isLoadingEmployees ? (
                    <div className="text-sm text-muted-foreground">Loading employees...</div>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrainings.map((training) => (
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