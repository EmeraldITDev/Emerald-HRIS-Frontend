import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Upload, Users, Calendar, FileText, Edit2, Trash2, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

interface Candidate {
  id: string
  name: string
  phone: string
  email: string
  position: string
  resumeFile?: File
  status: 'New' | 'Reviewing' | 'Interview Scheduled' | 'Interviewed' | 'Offered' | 'Hired' | 'Rejected'
  appliedDate: string
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
      appliedDate: '2024-01-15'
    },
    {
      id: '2',
      name: 'Jane Smith',
      phone: '+234 902 345 6789',
      email: 'jane.smith@email.com',
      position: 'Marketing Manager',
      status: 'Interview Scheduled',
      appliedDate: '2024-01-10'
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
    otherDocumentsFile: null as File | null
  })

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null)
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
      appliedDate: new Date().toISOString().split('T')[0]
    }

    setCandidates([candidate, ...candidates])
    setNewCandidate({ name: '', phone: '', email: '', department: '', roleApplied: '', resumeFile: null, certificationsFile: null, otherDocumentsFile: null })
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Recruitment</h1>
          <p className="text-muted-foreground">Manage job openings and candidate applications</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Users className="mr-2 h-4 w-4" />
              Add Candidate
            </Button>
          </DialogTrigger>
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
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resume">Resume Upload</Label>
                  <Input
                    id="resume"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileUpload(e, 'resumeFile')}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                  {newCandidate.resumeFile && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {newCandidate.resumeFile.name}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="certifications">Certifications</Label>
                  <Input
                    id="certifications"
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e, 'certificationsFile')}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                  {newCandidate.certificationsFile && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {newCandidate.certificationsFile.name}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="otherDocuments">Other Supporting Documents</Label>
                  <Input
                    id="otherDocuments"
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e, 'otherDocumentsFile')}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                  {newCandidate.otherDocumentsFile && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {newCandidate.otherDocumentsFile.name}
                    </p>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Supported formats: PDF, DOC, DOCX, JPG, PNG
                </p>
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
      </div>

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
                          <DropdownMenuItem onClick={() => setEditingCandidate(candidate)}>
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
    </div>
  )
}