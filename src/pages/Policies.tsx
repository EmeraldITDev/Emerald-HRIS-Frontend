import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Plus, 
  Upload, 
  Download, 
  Eye, 
  Trash2,
  FileText
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

interface Policy {
  id: string
  title: string
  description: string
  category: string
  version: string
  dateUploaded: string
  fileType: string
  fileName: string
  fileSize: string
  uploadedBy: string
}

const policies: Policy[] = [
  {
    id: "POL001",
    title: "Employee Handbook",
    description: "Comprehensive guide for all employees covering company policies and procedures",
    category: "General",
    version: "v2.1",
    dateUploaded: "2024-01-15",
    fileType: "PDF",
    fileName: "employee_handbook_v2.1.pdf",
    fileSize: "2.5 MB",
    uploadedBy: "HR Department"
  },
  {
    id: "POL002",
    title: "Code of Conduct",
    description: "Ethical guidelines and behavioral expectations for all employees",
    category: "Ethics",
    version: "v1.3",
    dateUploaded: "2024-01-10",
    fileType: "PDF",
    fileName: "code_of_conduct_v1.3.pdf",
    fileSize: "1.8 MB",
    uploadedBy: "Legal Department"
  },
  {
    id: "POL003",
    title: "Data Protection Policy",
    description: "Guidelines for handling and protecting sensitive company and customer data",
    category: "Security",
    version: "v1.0",
    dateUploaded: "2024-01-05",
    fileType: "DOCX",
    fileName: "data_protection_policy.docx",
    fileSize: "986 KB",
    uploadedBy: "IT Department"
  }
]

export default function Policies() {
  const [policyList, setPolicyList] = useState<Policy[]>(policies)
  const [showAddPolicy, setShowAddPolicy] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const [newPolicy, setNewPolicy] = useState({
    title: "",
    description: "",
    category: "",
    version: "",
    file: null as File | null
  })

  const categories = ["General", "Ethics", "Security", "HR", "Finance", "Legal", "Operations", "IT"]

  const handleFileUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please select a PDF, DOC, or DOCX file",
        variant: "destructive"
      })
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive"
      })
      return
    }

    setNewPolicy({...newPolicy, file})
  }

  const handleAddPolicy = () => {
    if (!newPolicy.title || !newPolicy.description || !newPolicy.category || !newPolicy.version || !newPolicy.file) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill all required fields and select a file",
        variant: "destructive"
      })
      return
    }

    const fileSize = newPolicy.file.size < 1024 * 1024 
      ? `${(newPolicy.file.size / 1024).toFixed(0)} KB`
      : `${(newPolicy.file.size / (1024 * 1024)).toFixed(1)} MB`

    const fileType = newPolicy.file.type.includes('pdf') ? 'PDF' 
      : newPolicy.file.type.includes('wordprocessingml') ? 'DOCX' 
      : 'DOC'

    const policy: Policy = {
      id: `POL${String(policyList.length + 1).padStart(3, '0')}`,
      title: newPolicy.title,
      description: newPolicy.description,
      category: newPolicy.category,
      version: newPolicy.version,
      dateUploaded: new Date().toISOString().split('T')[0],
      fileType,
      fileName: newPolicy.file.name,
      fileSize,
      uploadedBy: "Current User" // This would come from auth context in real app
    }

    setPolicyList(prev => [...prev, policy])
    setNewPolicy({
      title: "",
      description: "",
      category: "",
      version: "",
      file: null
    })
    setShowAddPolicy(false)
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    toast({
      title: "Policy Added",
      description: `${policy.title} has been successfully uploaded.`,
    })
  }

  const handleDeletePolicy = (policy: Policy) => {
    setPolicyList(prev => prev.filter(p => p.id !== policy.id))
    toast({
      title: "Policy Deleted",
      description: `${policy.title} has been removed.`,
    })
  }

  const getCategoryBadge = (category: string) => {
    const colors: {[key: string]: string} = {
      "General": "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      "Ethics": "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
      "Security": "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
      "HR": "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      "Finance": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      "Legal": "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
      "Operations": "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
      "IT": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400"
    }
    
    return <Badge className={`${colors[category] || "bg-gray-100 text-gray-800"} text-xs`}>
      {category}
    </Badge>
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Company Policies</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage and store company policy documents
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Dialog open={showAddPolicy} onOpenChange={setShowAddPolicy}>
            <DialogTrigger asChild>
              <Button size="sm" className="text-xs md:text-sm">
                <Plus className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                Upload Policy
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload New Policy</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Policy Title *</Label>
                    <Input
                      id="title"
                      value={newPolicy.title}
                      onChange={(e) => setNewPolicy({...newPolicy, title: e.target.value})}
                      placeholder="e.g., Employee Handbook"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <select 
                      className="w-full px-3 py-2 border border-input bg-background text-sm rounded-md"
                      value={newPolicy.category}
                      onChange={(e) => setNewPolicy({...newPolicy, category: e.target.value})}
                    >
                      <option value="">Select category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="version">Version *</Label>
                    <Input
                      id="version"
                      value={newPolicy.version}
                      onChange={(e) => setNewPolicy({...newPolicy, version: e.target.value})}
                      placeholder="e.g., v1.0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Policy Document *</Label>
                    <Button 
                      variant="outline" 
                      onClick={handleFileUpload}
                      className="w-full"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {newPolicy.file ? newPolicy.file.name : "Select File"}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Supported formats: PDF, DOC, DOCX (Max 10MB)
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={newPolicy.description}
                    onChange={(e) => setNewPolicy({...newPolicy, description: e.target.value})}
                    placeholder="Brief description of the policy document..."
                    className="min-h-[80px]"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddPolicy(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddPolicy}>
                    Upload Policy
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Policies Table */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-primary">Policy Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Policy Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>File Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Date Uploaded</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policyList.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{policy.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {policy.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getCategoryBadge(policy.category)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {policy.version}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {policy.fileType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{policy.fileSize}</TableCell>
                    <TableCell className="text-sm">{policy.dateUploaded}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <FileText className="h-3 w-3 mr-1" />
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-popover border shadow-lg">
                          <DropdownMenuItem>
                            <Eye className="h-3 w-3 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="h-3 w-3 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeletePolicy(policy)}
                          >
                            <Trash2 className="h-3 w-3 mr-2" />
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