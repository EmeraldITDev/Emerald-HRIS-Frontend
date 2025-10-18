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
import { GraduationCap, Calendar, DollarSign, Users, Plus, BookOpen, Upload, Download, Award } from "lucide-react"
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
  const [trainings, setTrainings] = useState<TrainingRecord[]>([
    {
      id: '1',
      employeeId: 'EMP001',
      employeeName: 'Chidi Okonkwo',
      employeeDepartment: 'Technical Operations',
      trainingType: 'Technical Skills',
      notes: 'Advanced React development course',
      completionDate: '2024-03-15',
      cost: 150000,
      status: 'In Progress'
    },
    {
      id: '2',
      employeeId: 'EMP002',
      employeeName: 'Ibrahim Suleiman',
      employeeDepartment: 'IT',
      trainingType: 'Leadership Development',
      notes: 'IT Management fundamentals training',
      completionDate: '2024-02-28',
      cost: 200000,
      status: 'Completed',
      certificateName: 'leadership_certificate.pdf'
    },
    {
      id: '3',
      employeeId: 'EMP003',
      employeeName: 'Kunle Adeyemi',
      employeeDepartment: 'Business Development',
      trainingType: 'Sales Training',
      notes: 'Advanced sales techniques and customer relationship management',
      completionDate: '2024-04-10',
      cost: 120000,
      status: 'Scheduled'
    },
    {
      id: '4',
      employeeId: 'EMP004',
      employeeName: 'Rachael Daniel',
      employeeDepartment: 'Finance',
      trainingType: 'Professional Certification',
      notes: 'ACCA Financial Reporting certification',
      completionDate: '2024-05-15',
      cost: 300000,
      status: 'In Progress'
    }
  ])

  const [newTraining, setNewTraining] = useState({
    employeeId: '',
    employeeName: '',
    trainingType: '',
    notes: '',
    completionDate: '',
    cost: '',
    certificate: null as File | null
  })

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
  }, [isLineManager, userDepartment])

  const handleAddTraining = () => {
    if (!newTraining.employeeId || !newTraining.trainingType || !newTraining.completionDate) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    const employee = employees.find(emp => emp.id?.toString() === newTraining.employeeId)
    
    const training: TrainingRecord = {
      id: (trainings.length + 1).toString(),
      employeeId: newTraining.employeeId,
      employeeName: newTraining.employeeName,
      employeeDepartment: employee?.department || 'Unknown',
      trainingType: newTraining.trainingType,
      notes: newTraining.notes,
      completionDate: newTraining.completionDate,
      cost: parseFloat(newTraining.cost) || 0,
      status: 'Scheduled',
      certificate: newTraining.certificate,
      certificateName: newTraining.certificate?.name
    }

    setTrainings([training, ...trainings])
    setNewTraining({
      employeeId: '',
      employeeName: '',
      trainingType: '',
      notes: '',
      completionDate: '',
      cost: '',
      certificate: null
    })
    setIsDialogOpen(false)

    toast({
      title: "Training Added",
      description: "Training record has been added successfully",
    })
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
    setNewTraining({
      ...newTraining,
      employeeId,
      employeeName: employee ? `${employee.first_name} ${employee.last_name}` : ''
    })
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

  // Filter trainings based on department for line managers
  const filteredTrainings = isLineManager && userDepartment
    ? trainings.filter(t => t.employeeDepartment === userDepartment)
    : trainings

  const totalCost = filteredTrainings.reduce((sum, training) => sum + training.cost, 0)
  const completedTrainings = filteredTrainings.filter(t => t.status === 'Completed').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Training & Development</h1>
          <p className="text-muted-foreground">
            {isLineManager && userDepartment 
              ? `Track training programs for ${userDepartment} department`
              : 'Track training programs and employee development'
            }
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Schedule Training
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Schedule New Training</DialogTitle>
              <DialogDescription>
                Add a new training program for an employee.
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
                    {isLoadingEmployees ? (
                      <SelectItem value="loading" disabled>Loading...</SelectItem>
                    ) : (
                      employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id?.toString() || ''}>
                          {employee.first_name} {employee.last_name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="trainingType">Training Type *</Label>
                <Select onValueChange={(value) => setNewTraining({...newTraining, trainingType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select training type" />
                  </SelectTrigger>
                  <SelectContent>
                    {trainingTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Training Notes</Label>
                <Textarea
                  id="notes"
                  value={newTraining.notes}
                  onChange={(e) => setNewTraining({...newTraining, notes: e.target.value})}
                  placeholder="Enter training details, objectives, or notes..."
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="completionDate">Target Completion Date *</Label>
                  <Input
                    id="completionDate"
                    type="date"
                    value={newTraining.completionDate}
                    onChange={(e) => setNewTraining({...newTraining, completionDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost">Training Cost (₦)</Label>
                  <Input
                    id="cost"
                    type="number"
                    value={newTraining.cost}
                    onChange={(e) => setNewTraining({...newTraining, cost: e.target.value})}
                    placeholder="0"
                  />
                </div>
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
      </div>

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
            {isLineManager && userDepartment 
              ? `Training programs for ${userDepartment} department employees`
              : 'Track all employee training and development programs'
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