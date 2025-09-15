import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
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
  trainingType: string
  notes: string
  completionDate: string
  cost: number
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled'
  certificate?: File | null
  certificateName?: string
}

const employees = [
  { id: "EMP001", name: "Adebayo Johnson" },
  { id: "EMP002", name: "Fatima Abdul" },
  { id: "EMP003", name: "Chinedu Okafor" },
  { id: "EMP004", name: "Kemi Adeleke" }
]

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
  const [trainings, setTrainings] = useState<TrainingRecord[]>([
    {
      id: '1',
      employeeId: 'EMP001',
      employeeName: 'Adebayo Johnson',
      trainingType: 'Technical Skills',
      notes: 'Advanced React development course',
      completionDate: '2024-03-15',
      cost: 150000,
      status: 'In Progress'
    },
    {
      id: '2',
      employeeId: 'EMP002',
      employeeName: 'Fatima Abdul',
      trainingType: 'Leadership Development',
      notes: 'Management fundamentals training',
      completionDate: '2024-02-28',
      cost: 200000,
      status: 'Completed',
      certificateName: 'leadership_certificate.pdf'
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

  const handleAddTraining = () => {
    if (!newTraining.employeeId || !newTraining.trainingType || !newTraining.completionDate) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    const training: TrainingRecord = {
      id: (trainings.length + 1).toString(),
      employeeId: newTraining.employeeId,
      employeeName: newTraining.employeeName,
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
    const employee = employees.find(emp => emp.id === employeeId)
    setNewTraining({
      ...newTraining,
      employeeId,
      employeeName: employee?.name || ''
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

  const totalCost = trainings.reduce((sum, training) => sum + training.cost, 0)
  const completedTrainings = trainings.filter(t => t.status === 'Completed').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Training & Development</h1>
          <p className="text-muted-foreground">Track training programs and employee development</p>
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
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))}
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
            <div className="text-2xl font-bold text-emerald-600">{trainings.length}</div>
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
              {trainings.filter(t => t.status === 'In Progress').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
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
            Track all employee training and development programs
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {trainings.map((training) => (
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