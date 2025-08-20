import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Upload, Users, Calendar, FileText, Edit2, Trash2, MoreHorizontal, Plus, ClipboardList } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface Candidate {
  id: string
  name: string
  phone: string
  email: string
  position: string
  resumeFile?: File
  status: 'New' | 'Reviewing' | 'Interview Scheduled' | 'Interviewed' | 'Offered' | 'Hired' | 'Rejected'
  appliedDate: string
  requisitionId?: string
}

interface JobRequisition {
  id: string
  jobRequisitionForm?: File
  jobDescription?: File
  jobTitle: string
  department: string
  hiringManager: string
  dateCreated: string
  status: 'Open' | 'Approved' | 'Closed'
  targetHireDate: string
  numberOfPositions: number
  linkedCandidates: string[]
}

export default function Recruitment() {
  const [candidates, setCandidates] = useState<Candidate[]>([
    {
      id: '1',
      name: 'John Doe',
      phone: '+234 901 234 5678',
      email: 'john.doe@email.com',
      position: 'Software Engineer',
      status: 'Reviewing',
      appliedDate: '2024-01-15',
      requisitionId: 'REQ-001'
    },
    {
      id: '2',
      name: 'Jane Smith',
      phone: '+234 902 345 6789',
      email: 'jane.smith@email.com',
      position: 'Marketing Manager',
      status: 'Interview Scheduled',
      appliedDate: '2024-01-10',
      requisitionId: 'REQ-002'
    }
  ])

  const [jobRequisitions, setJobRequisitions] = useState<JobRequisition[]>([
    {
      id: 'REQ-001',
      jobTitle: 'Senior Software Engineer',
      department: 'Engineering',
      hiringManager: 'Adebayo Johnson',
      dateCreated: '2024-01-01',
      status: 'Open',
      targetHireDate: '2024-03-01',
      numberOfPositions: 2,
      linkedCandidates: ['1']
    },
    {
      id: 'REQ-002', 
      jobTitle: 'Marketing Manager',
      department: 'Marketing',
      hiringManager: 'Fatima Abdul',
      dateCreated: '2024-01-05',
      status: 'Approved',
      targetHireDate: '2024-02-15',
      numberOfPositions: 1,
      linkedCandidates: ['2']
    }
  ])

  const [newCandidate, setNewCandidate] = useState({
    name: '',
    phone: '',
    email: '',
    department: '',
    roleApplied: '',
    resumeFile: null as File | null,
    certificationsFile: null as File | null,
    otherDocumentsFile: null as File | null,
    requisitionId: ''
  })

  const [newJobRequisition, setNewJobRequisition] = useState({
    jobRequisitionForm: null as File | null,
    jobDescription: null as File | null,
    jobTitle: '',
    department: '',
    hiringManager: '',
    dateCreated: new Date().toISOString().split('T')[0],
    status: 'Open' as 'Open' | 'Approved' | 'Closed',
    targetHireDate: null as Date | null,
    numberOfPositions: 1
  })

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isRequisitionDialogOpen, setIsRequisitionDialogOpen] = useState(false)
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null)
  const [editingJobRequisition, setEditingJobRequisition] = useState<JobRequisition | null>(null)
  const [isEditCandidateDialogOpen, setIsEditCandidateDialogOpen] = useState(false)
  const [isEditJobRequisitionDialogOpen, setIsEditJobRequisitionDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('candidates')
  const { toast } = useToast()

  const departments = [
    'Engineering',
    'Marketing',
    'Finance',
    'Human Resources',
    'Sales',
    'Operations',
    'Product',
    'Design',
    'Customer Service',
    'Legal'
  ]

  const hiringManagers = [
    'Adebayo Johnson',
    'Fatima Abdul', 
    'Chinedu Okafor',
    'Kemi Adeleke',
    'Babatunde Okafor',
    'Amina Hassan'
  ]

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, fileType: 'resumeFile' | 'certificationsFile' | 'otherDocumentsFile') => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type === 'application/pdf' || file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.type.startsWith('image/')) {
        setNewCandidate({...newCandidate, [fileType]: file})
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF, Word document, or image file.",
          variant: "destructive"
        })
      }
    }
  }

  const handleAddCandidate = () => {
    if (!newCandidate.name || !newCandidate.phone || !newCandidate.email || !newCandidate.department || !newCandidate.roleApplied) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    const candidate: Candidate = {
      id: (candidates.length + 1).toString(),
      name: newCandidate.name,
      phone: newCandidate.phone,
      email: newCandidate.email,
      position: newCandidate.roleApplied,
      resumeFile: newCandidate.resumeFile || undefined,
      status: 'New',
      appliedDate: new Date().toISOString().split('T')[0],
      requisitionId: newCandidate.requisitionId
    }

    setCandidates([candidate, ...candidates])
    
    // Update linked candidates for the requisition
    if (newCandidate.requisitionId) {
      setJobRequisitions(prev => prev.map(req => 
        req.id === newCandidate.requisitionId 
          ? { ...req, linkedCandidates: [...req.linkedCandidates, candidate.id] }
          : req
      ))
    }
    
    setNewCandidate({ name: '', phone: '', email: '', department: '', roleApplied: '', resumeFile: null, certificationsFile: null, otherDocumentsFile: null, requisitionId: '' })
    setIsDialogOpen(false)
    
    toast({
      title: "Candidate added",
      description: `${candidate.name} has been added to the recruitment pipeline.`
    })
  }

  const handleEditStatus = (candidate: Candidate, newStatus: Candidate['status']) => {
    setCandidates(candidates.map(c => 
      c.id === candidate.id ? { ...c, status: newStatus } : c
    ))
    toast({
      title: "Status updated",
      description: `${candidate.name}'s status has been updated to ${newStatus}.`
    })
  }

  const handleDeleteCandidate = (candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId)
    setCandidates(candidates.filter(c => c.id !== candidateId))
    toast({
      title: "Candidate deleted",
      description: `${candidate?.name} has been removed from the recruitment pipeline.`
    })
  }

  const handleEditCandidate = (candidate: Candidate) => {
    setEditingCandidate(candidate)
    setIsEditCandidateDialogOpen(true)
  }

  const handleUpdateCandidate = () => {
    if (!editingCandidate) return
    
    setCandidates(candidates.map(c => 
      c.id === editingCandidate.id ? editingCandidate : c
    ))
    
    setIsEditCandidateDialogOpen(false)
    setEditingCandidate(null)
    
    toast({
      title: "Candidate updated",
      description: `${editingCandidate.name}'s information has been updated.`
    })
  }

  const handleEditJobRequisition = (requisition: JobRequisition) => {
    setEditingJobRequisition({
      ...requisition,
      targetHireDate: requisition.targetHireDate
    })
    setIsEditJobRequisitionDialogOpen(true)
  }

  const handleUpdateJobRequisition = () => {
    if (!editingJobRequisition) return
    
    setJobRequisitions(jobRequisitions.map(r => 
      r.id === editingJobRequisition.id ? editingJobRequisition : r
    ))
    
    setIsEditJobRequisitionDialogOpen(false)
    setEditingJobRequisition(null)
    
    toast({
      title: "Job requisition updated",
      description: `${editingJobRequisition.jobTitle} requisition has been updated.`
    })
  }

  const handleRequisitionFileUpload = (event: React.ChangeEvent<HTMLInputElement>, fileType: 'jobRequisitionForm' | 'jobDescription') => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type === 'application/pdf' || file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        setNewJobRequisition({...newJobRequisition, [fileType]: file})
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF or Word document.",
          variant: "destructive"
        })
      }
    }
  }

  const handleAddJobRequisition = () => {
    if (!newJobRequisition.jobTitle || !newJobRequisition.department || !newJobRequisition.hiringManager || !newJobRequisition.targetHireDate) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    const requisitionId = `REQ-${String(jobRequisitions.length + 1).padStart(3, '0')}`

    const requisition: JobRequisition = {
      id: requisitionId,
      jobRequisitionForm: newJobRequisition.jobRequisitionForm || undefined,
      jobDescription: newJobRequisition.jobDescription || undefined,
      jobTitle: newJobRequisition.jobTitle,
      department: newJobRequisition.department,
      hiringManager: newJobRequisition.hiringManager,
      dateCreated: newJobRequisition.dateCreated,
      status: newJobRequisition.status,
      targetHireDate: newJobRequisition.targetHireDate.toISOString().split('T')[0],
      numberOfPositions: newJobRequisition.numberOfPositions,
      linkedCandidates: []
    }

    setJobRequisitions([requisition, ...jobRequisitions])
    setNewJobRequisition({
      jobRequisitionForm: null,
      jobDescription: null,
      jobTitle: '',
      department: '',
      hiringManager: '',
      dateCreated: new Date().toISOString().split('T')[0],
      status: 'Open',
      targetHireDate: null,
      numberOfPositions: 1
    })
    setIsRequisitionDialogOpen(false)
    
    toast({
      title: "Job requisition created",
      description: `${requisition.jobTitle} requisition has been created with ID ${requisitionId}.`
    })
  }

  const handleDeleteJobRequisition = (requisitionId: string) => {
    const requisition = jobRequisitions.find(r => r.id === requisitionId)
    setJobRequisitions(jobRequisitions.filter(r => r.id !== requisitionId))
    
    // Remove requisition ID from linked candidates
    setCandidates(candidates.map(c => 
      c.requisitionId === requisitionId ? { ...c, requisitionId: undefined } : c
    ))
    
    toast({
      title: "Requisition deleted",
      description: `${requisition?.jobTitle} requisition has been removed.`
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'Reviewing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'Interview Scheduled': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      case 'Interviewed': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      case 'Offered': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400'
      case 'Hired': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'Rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getRequisitionStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'Approved': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'Closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Recruitment</h1>
          <p className="text-muted-foreground">Manage job openings and candidate applications</p>
        </div>
        
        <div className="flex gap-2">
          {activeTab === 'candidates' ? (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Users className="mr-2 h-4 w-4" />
                  Add Candidate
                </Button>
              </DialogTrigger>
            </Dialog>
          ) : (
            <Dialog open={isRequisitionDialogOpen} onOpenChange={setIsRequisitionDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Create Requisition
                </Button>
              </DialogTrigger>
            </Dialog>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
          <TabsTrigger value="requisitions">Job Requisitions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="candidates" className="space-y-6">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto my-8">
            <DialogHeader>
              <DialogTitle>Add New Candidate</DialogTitle>
              <DialogDescription>
                Enter the candidate's information and upload their resume.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={newCandidate.name}
                    onChange={(e) => setNewCandidate({...newCandidate, name: e.target.value})}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={newCandidate.phone}
                    onChange={(e) => setNewCandidate({...newCandidate, phone: e.target.value})}
                    placeholder="+234 XXX XXX XXXX"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newCandidate.email}
                  onChange={(e) => setNewCandidate({...newCandidate, email: e.target.value})}
                  placeholder="candidate@email.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="department">Department Applied *</Label>
                <Select onValueChange={(value) => setNewCandidate({...newCandidate, department: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((department) => (
                      <SelectItem key={department} value={department}>{department}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="roleApplied">Role Applied *</Label>
                <Input
                  id="roleApplied"
                  value={newCandidate.roleApplied}
                  onChange={(e) => setNewCandidate({...newCandidate, roleApplied: e.target.value})}
                  placeholder="Enter specific role (e.g., Senior Software Engineer)"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="requisitionId">Link to Job Requisition</Label>
                <Select onValueChange={(value) => setNewCandidate({...newCandidate, requisitionId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select job requisition (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {jobRequisitions.map((req) => (
                      <SelectItem key={req.id} value={req.id}>
                        {req.id} - {req.jobTitle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-foreground">Document Uploads</h3>
                
                <div className="grid gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="resume" className="text-sm font-medium">Resume Upload</Label>
                    <div className="flex flex-col gap-2">
                      <div className="relative">
                        <Input
                          id="resume"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => handleFileUpload(e, 'resumeFile')}
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer cursor-pointer h-11"
                        />
                      </div>
                      {newCandidate.resumeFile && (
                        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                          <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                            {newCandidate.resumeFile.name}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="certifications" className="text-sm font-medium">Professional Certifications</Label>
                    <div className="flex flex-col gap-2">
                      <div className="relative">
                        <Input
                          id="certifications"
                          type="file"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e, 'certificationsFile')}
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer cursor-pointer h-11"
                        />
                      </div>
                      {newCandidate.certificationsFile && (
                        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                            {newCandidate.certificationsFile.name}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="otherDocuments" className="text-sm font-medium">Other Supporting Documents</Label>
                    <div className="flex flex-col gap-2">
                      <div className="relative">
                        <Input
                          id="otherDocuments"
                          type="file"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e, 'otherDocumentsFile')}
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer cursor-pointer h-11"
                        />
                      </div>
                      {newCandidate.otherDocumentsFile && (
                        <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-md border border-purple-200 dark:border-purple-800">
                          <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                            {newCandidate.otherDocumentsFile.name}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="bg-muted/50 p-4 rounded-lg border border-dashed border-muted-foreground/20">
                  <p className="text-xs text-muted-foreground text-center">
                    <strong>Supported formats:</strong> PDF, DOC, DOCX, JPG, PNG • <strong>Max file size:</strong> 10MB per file
                  </p>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCandidate} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Add Candidate
              </Button>
            </DialogFooter>
          </DialogContent>
          </Dialog>

          {/* Edit Candidate Dialog */}
          <Dialog open={isEditCandidateDialogOpen} onOpenChange={setIsEditCandidateDialogOpen}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto my-8">
              <DialogHeader>
                <DialogTitle>Edit Candidate</DialogTitle>
                <DialogDescription>
                  Update the candidate's information.
                </DialogDescription>
              </DialogHeader>
              
              {editingCandidate && (
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editName">Full Name *</Label>
                      <Input
                        id="editName"
                        value={editingCandidate.name}
                        onChange={(e) => setEditingCandidate({...editingCandidate, name: e.target.value})}
                        placeholder="Enter full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editPhone">Phone Number *</Label>
                      <Input
                        id="editPhone"
                        value={editingCandidate.phone}
                        onChange={(e) => setEditingCandidate({...editingCandidate, phone: e.target.value})}
                        placeholder="+234 XXX XXX XXXX"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="editEmail">Email Address *</Label>
                    <Input
                      id="editEmail"
                      type="email"
                      value={editingCandidate.email}
                      onChange={(e) => setEditingCandidate({...editingCandidate, email: e.target.value})}
                      placeholder="candidate@email.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="editPosition">Position *</Label>
                    <Input
                      id="editPosition"
                      value={editingCandidate.position}
                      onChange={(e) => setEditingCandidate({...editingCandidate, position: e.target.value})}
                      placeholder="Enter position"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="editRequisitionId">Link to Job Requisition</Label>
                    <Select value={editingCandidate.requisitionId || ""} onValueChange={(value) => setEditingCandidate({...editingCandidate, requisitionId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select job requisition (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {jobRequisitions.map((req) => (
                          <SelectItem key={req.id} value={req.id}>
                            {req.id} - {req.jobTitle}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditCandidateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateCandidate} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Update Candidate
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{candidates.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {candidates.filter(c => c.status === 'New').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interviews Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {candidates.filter(c => c.status === 'Interview Scheduled').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hired This Month</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {candidates.filter(c => c.status === 'Hired').length}
            </div>
          </CardContent>
          </Card>
          </div>

          {/* Candidates Table */}
          <Card>
        <CardHeader>
          <CardTitle>Candidate Pipeline</CardTitle>
          <CardDescription>
            Track and manage all candidate applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Phone</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Applied Date</TableHead>
                  <TableHead className="hidden md:table-cell">Resume</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((candidate) => (
                  <TableRow key={candidate.id}>
                    <TableCell className="font-medium">{candidate.name}</TableCell>
                    <TableCell className="hidden sm:table-cell">{candidate.phone}</TableCell>
                    <TableCell className="hidden md:table-cell">{candidate.email}</TableCell>
                    <TableCell>{candidate.position}</TableCell>
                    <TableCell>
                      <Select
                        value={candidate.status}
                        onValueChange={(value) => handleEditStatus(candidate, value as Candidate['status'])}
                      >
                        <SelectTrigger className="w-auto h-8 border-none shadow-none p-0">
                          <Badge className={getStatusColor(candidate.status)}>
                            {candidate.status}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="New">New</SelectItem>
                          <SelectItem value="Reviewing">Reviewing</SelectItem>
                          <SelectItem value="Interview Scheduled">Interview Scheduled</SelectItem>
                          <SelectItem value="Interviewed">Interviewed</SelectItem>
                          <SelectItem value="Offered">Offered</SelectItem>
                          <SelectItem value="Hired">Hired</SelectItem>
                          <SelectItem value="Rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{candidate.appliedDate}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {candidate.resumeFile ? (
                        <Button variant="outline" size="sm">
                          <Upload className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">No file</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditCandidate(candidate)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteCandidate(candidate.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="requisitions" className="space-y-6">
          <Dialog open={isRequisitionDialogOpen} onOpenChange={setIsRequisitionDialogOpen}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto my-8">
              <DialogHeader>
                <DialogTitle>Create Job Requisition</DialogTitle>
                <DialogDescription>
                  Create a new job requisition with required documents and details.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job Title *</Label>
                    <Input
                      id="jobTitle"
                      value={newJobRequisition.jobTitle}
                      onChange={(e) => setNewJobRequisition({...newJobRequisition, jobTitle: e.target.value})}
                      placeholder="Enter job title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numberOfPositions">Number of Positions *</Label>
                    <Input
                      id="numberOfPositions"
                      type="number"
                      min="1"
                      value={newJobRequisition.numberOfPositions}
                      onChange={(e) => setNewJobRequisition({...newJobRequisition, numberOfPositions: parseInt(e.target.value) || 1})}
                      placeholder="1"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reqDepartment">Department *</Label>
                    <Select onValueChange={(value) => setNewJobRequisition({...newJobRequisition, department: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((department) => (
                          <SelectItem key={department} value={department}>{department}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hiringManager">Hiring Manager *</Label>
                    <Select onValueChange={(value) => setNewJobRequisition({...newJobRequisition, hiringManager: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select hiring manager" />
                      </SelectTrigger>
                      <SelectContent>
                        {hiringManagers.map((manager) => (
                          <SelectItem key={manager} value={manager}>{manager}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateCreated">Date Created</Label>
                    <Input
                      id="dateCreated"
                      type="date"
                      value={newJobRequisition.dateCreated}
                      onChange={(e) => setNewJobRequisition({...newJobRequisition, dateCreated: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reqStatus">Status</Label>
                    <Select value={newJobRequisition.status} onValueChange={(value) => setNewJobRequisition({...newJobRequisition, status: value as 'Open' | 'Approved' | 'Closed'})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetHireDate">Target Hire Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !newJobRequisition.targetHireDate && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {newJobRequisition.targetHireDate ? (
                            format(newJobRequisition.targetHireDate, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={newJobRequisition.targetHireDate || undefined}
                          onSelect={(date) => setNewJobRequisition({...newJobRequisition, targetHireDate: date || null})}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-foreground">Document Uploads</h3>
                  
                  <div className="grid gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="jobRequisitionForm" className="text-sm font-medium">Job Requisition Form</Label>
                      <div className="flex flex-col gap-2">
                        <Input
                          id="jobRequisitionForm"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => handleRequisitionFileUpload(e, 'jobRequisitionForm')}
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer cursor-pointer h-11"
                        />
                        {newJobRequisition.jobRequisitionForm && (
                          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                            <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                              {newJobRequisition.jobRequisitionForm.name}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="jobDescription" className="text-sm font-medium">Job Description</Label>
                      <div className="flex flex-col gap-2">
                        <Input
                          id="jobDescription"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => handleRequisitionFileUpload(e, 'jobDescription')}
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer cursor-pointer h-11"
                        />
                        {newJobRequisition.jobDescription && (
                          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                              {newJobRequisition.jobDescription.name}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 p-4 rounded-lg border border-dashed border-muted-foreground/20">
                    <p className="text-xs text-muted-foreground text-center">
                      <strong>Supported formats:</strong> PDF, DOC, DOCX • <strong>Max file size:</strong> 10MB per file
                    </p>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsRequisitionDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddJobRequisition} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Create Requisition
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Edit Job Requisition Dialog */}
          <Dialog open={isEditJobRequisitionDialogOpen} onOpenChange={setIsEditJobRequisitionDialogOpen}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto my-8">
              <DialogHeader>
                <DialogTitle>Edit Job Requisition</DialogTitle>
                <DialogDescription>
                  Update the job requisition details.
                </DialogDescription>
              </DialogHeader>
              
              {editingJobRequisition && (
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editJobTitle">Job Title *</Label>
                      <Input
                        id="editJobTitle"
                        value={editingJobRequisition.jobTitle}
                        onChange={(e) => setEditingJobRequisition({...editingJobRequisition, jobTitle: e.target.value})}
                        placeholder="Enter job title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editNumberOfPositions">Number of Positions *</Label>
                      <Input
                        id="editNumberOfPositions"
                        type="number"
                        min="1"
                        value={editingJobRequisition.numberOfPositions}
                        onChange={(e) => setEditingJobRequisition({...editingJobRequisition, numberOfPositions: parseInt(e.target.value) || 1})}
                        placeholder="1"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editReqDepartment">Department *</Label>
                      <Select value={editingJobRequisition.department} onValueChange={(value) => setEditingJobRequisition({...editingJobRequisition, department: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((department) => (
                            <SelectItem key={department} value={department}>{department}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editHiringManager">Hiring Manager *</Label>
                      <Select value={editingJobRequisition.hiringManager} onValueChange={(value) => setEditingJobRequisition({...editingJobRequisition, hiringManager: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select hiring manager" />
                        </SelectTrigger>
                        <SelectContent>
                          {hiringManagers.map((manager) => (
                            <SelectItem key={manager} value={manager}>{manager}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editReqStatus">Status</Label>
                      <Select value={editingJobRequisition.status} onValueChange={(value) => setEditingJobRequisition({...editingJobRequisition, status: value as 'Open' | 'Approved' | 'Closed'})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Open">Open</SelectItem>
                          <SelectItem value="Approved">Approved</SelectItem>
                          <SelectItem value="Closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editTargetHireDate">Target Hire Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !editingJobRequisition.targetHireDate && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {editingJobRequisition.targetHireDate ? (
                              format(new Date(editingJobRequisition.targetHireDate), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={editingJobRequisition.targetHireDate ? new Date(editingJobRequisition.targetHireDate) : undefined}
                            onSelect={(date) => setEditingJobRequisition({...editingJobRequisition, targetHireDate: date ? date.toISOString().split('T')[0] : ''})}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditJobRequisitionDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateJobRequisition} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Update Requisition
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Requisition Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requisitions</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{jobRequisitions.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {jobRequisitions.filter(r => r.status === 'Open').reduce((sum, r) => sum + r.numberOfPositions, 0)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {jobRequisitions.filter(r => r.status === 'Approved').length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Linked Candidates</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {jobRequisitions.reduce((sum, r) => sum + r.linkedCandidates.length, 0)}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Job Requisitions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Job Requisitions</CardTitle>
              <CardDescription>
                Manage and track all job requisitions and hiring requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Requisition ID</TableHead>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Hiring Manager</TableHead>
                      <TableHead>Positions</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Target Date</TableHead>
                      <TableHead className="hidden md:table-cell">Linked Candidates</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobRequisitions.map((requisition) => (
                      <TableRow key={requisition.id}>
                        <TableCell className="font-medium">{requisition.id}</TableCell>
                        <TableCell>{requisition.jobTitle}</TableCell>
                        <TableCell>{requisition.department}</TableCell>
                        <TableCell>{requisition.hiringManager}</TableCell>
                        <TableCell>{requisition.numberOfPositions}</TableCell>
                        <TableCell>
                          <Badge className={getRequisitionStatusColor(requisition.status)}>
                            {requisition.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{requisition.targetHireDate}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline">
                            {requisition.linkedCandidates.length} linked
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditJobRequisition(requisition)}>
                                <Edit2 className="mr-2 h-4 w-4" />
                                Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <FileText className="mr-2 h-4 w-4" />
                                View Documents
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteJobRequisition(requisition.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}