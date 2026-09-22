import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
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
  Eye, 
  Trash2,
  FileText,
  Edit,
  CheckCircle,
  Archive,
  AlertCircle,
  Download
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from '@/contexts/AuthContext'
import apiService, { Policy } from '@/lib/api'
import { format } from 'date-fns'

export default function Policies() {
  const [policyList, setPolicyList] = useState<Policy[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showAddPolicy, setShowAddPolicy] = useState(false)
  const [showViewPolicy, setShowViewPolicy] = useState(false)
  const [showEditPolicy, setShowEditPolicy] = useState(false)
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null)
  const [categories, setCategories] = useState<string[]>([
    "General", "Ethics", "Security", "HR", "Finance", "Legal", "Operations", "IT"
  ])
  const { toast } = useToast()
  const { user } = useAuth()
  
  const canManagePolicy = user?.role === 'hr_manager' || user?.role === 'executive'

  const [newPolicy, setNewPolicy] = useState({
    title: "",
    content: "",
    category: "",
    version: "1.0",
    effective_date: new Date().toISOString().split('T')[0],
    status: "draft" as "draft" | "active" | "archived"
  })

  const [editPolicy, setEditPolicy] = useState({
    title: "",
    content: "",
    category: "",
    version: "",
    effective_date: "",
    status: "draft" as "draft" | "active" | "archived"
  })

  useEffect(() => {
    fetchPolicies()
    fetchCategories()
  }, [])

  const fetchPolicies = async () => {
    try {
      setIsLoading(true)
      setLoadError(null)
      const policies = await apiService.getPolicies()
      setPolicyList(Array.isArray(policies) ? policies : [])
    } catch (error: any) {
      console.error('Failed to fetch policies:', error)
      setPolicyList([])
      setLoadError(error?.message || "We couldn't reach the server.")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const cats = await apiService.getPolicyCategories()
      if (cats.length > 0) {
        setCategories(cats)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const handleAddPolicy = async () => {
    if (!newPolicy.title || !newPolicy.content || !newPolicy.category || !newPolicy.effective_date) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill all required fields",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await apiService.createPolicy(newPolicy)
      setPolicyList(prev => [...prev, response.data])
      setNewPolicy({
        title: "",
        content: "",
        category: "",
        version: "1.0",
        effective_date: new Date().toISOString().split('T')[0],
        status: "draft"
      })
      setShowAddPolicy(false)
      
      toast({
        title: "Policy Created",
        description: response.message || "Policy has been successfully created.",
      })
      
      fetchPolicies()
    } catch (error: any) {
      console.error('Failed to create policy:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to create policy",
        variant: "destructive"
      })
    }
  }

  const handleUpdatePolicy = async () => {
    if (!selectedPolicy?.id) return

    try {
      const response = await apiService.updatePolicy(selectedPolicy.id, editPolicy)
      setPolicyList(prev => prev.map(p => p.id === selectedPolicy.id ? response.data : p))
      setShowEditPolicy(false)
      
      toast({
        title: "Policy Updated",
        description: response.message || "Policy has been successfully updated.",
      })
      
      fetchPolicies()
    } catch (error: any) {
      console.error('Failed to update policy:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to update policy",
        variant: "destructive"
      })
    }
  }

  const handleApprovePolicy = async (policy: Policy) => {
    if (!policy.id) return

    try {
      const response = await apiService.approvePolicy(policy.id)
      setPolicyList(prev => prev.map(p => p.id === policy.id ? response.data : p))
      
      toast({
        title: "Policy Approved",
        description: `${policy.title} has been approved and is now active.`,
      })
      
      fetchPolicies()
    } catch (error: any) {
      console.error('Failed to approve policy:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to approve policy",
        variant: "destructive"
      })
    }
  }

  const handleArchivePolicy = async (policy: Policy) => {
    if (!policy.id) return

    try {
      const response = await apiService.archivePolicy(policy.id)
      setPolicyList(prev => prev.map(p => p.id === policy.id ? response.data : p))
      
      toast({
        title: "Policy Archived",
        description: `${policy.title} has been archived.`,
      })
      
      fetchPolicies()
    } catch (error: any) {
      console.error('Failed to archive policy:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to archive policy",
        variant: "destructive"
      })
    }
  }

  const handleDeletePolicy = async (policy: Policy) => {
    if (!policy.id) return

    try {
      await apiService.deletePolicy(policy.id)
      setPolicyList(prev => prev.filter(p => p.id !== policy.id))
      
      toast({
        title: "Policy Deleted",
        description: `${policy.title} has been removed.`,
      })
    } catch (error: any) {
      console.error('Failed to delete policy:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete policy",
        variant: "destructive"
      })
    }
  }
  
  const handleViewPolicy = (policy: Policy) => {
    setSelectedPolicy(policy)
    setShowViewPolicy(true)
  }

  const handleDownloadPolicy = (policy: Policy) => {
    // Create a text file with policy content
    const content = `
${policy.title}
${'='.repeat(policy.title.length)}

Category: ${policy.category || 'N/A'}
Version: ${policy.version || '1.0'}
Effective Date: ${policy.effective_date ? format(new Date(policy.effective_date), 'MMMM dd, yyyy') : 'N/A'}
Status: ${policy.status || 'N/A'}

Policy Content:
${'-'.repeat(50)}

${policy.content}

${policy.approved_at ? `\nApproved on: ${format(new Date(policy.approved_at), 'MMMM dd, yyyy')}` : ''}
    `.trim()

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${policy.title.replace(/[^a-z0-9]/gi, '_')}_Policy.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Policy Downloaded",
      description: `${policy.title} has been downloaded.`,
    })
  }

  const handleEditClick = (policy: Policy) => {
    setSelectedPolicy(policy)
    setEditPolicy({
      title: policy.title,
      content: policy.content,
      category: policy.category || "",
      version: policy.version || "1.0",
      effective_date: policy.effective_date,
      status: policy.status || "draft"
    })
    setShowEditPolicy(true)
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

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle className="h-3 w-3 mr-1" />
          Active
        </Badge>
      case 'archived':
        return <Badge variant="secondary">
          <Archive className="h-3 w-3 mr-1" />
          Archived
        </Badge>
      case 'draft':
      default:
        return <Badge variant="outline">
          <AlertCircle className="h-3 w-3 mr-1" />
          Draft
        </Badge>
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Company Policies</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage and view company policy documents
          </p>
        </div>
        {canManagePolicy && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Dialog open={showAddPolicy} onOpenChange={setShowAddPolicy}>
              <DialogTrigger asChild>
                <Button size="sm" className="text-xs md:text-sm">
                  <Plus className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                  Create Policy
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Policy</DialogTitle>
                <DialogDescription>
                  Add a new company policy document
                </DialogDescription>
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="version">Version *</Label>
                    <Input
                      id="version"
                      value={newPolicy.version}
                      onChange={(e) => setNewPolicy({...newPolicy, version: e.target.value})}
                      placeholder="e.g., 1.0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="effective_date">Effective Date *</Label>
                    <Input
                      id="effective_date"
                      type="date"
                      value={newPolicy.effective_date}
                      onChange={(e) => setNewPolicy({...newPolicy, effective_date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <select 
                      className="w-full px-3 py-2 border border-input bg-background text-sm rounded-md"
                      value={newPolicy.status}
                      onChange={(e) => setNewPolicy({...newPolicy, status: e.target.value as "draft" | "active" | "archived"})}
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Policy Content *</Label>
                  <Textarea
                    id="content"
                    value={newPolicy.content}
                    onChange={(e) => setNewPolicy({...newPolicy, content: e.target.value})}
                    placeholder="Enter the full policy content here..."
                    className="min-h-[200px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">Attach Document (Optional)</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">
                    Supported formats: PDF, Word (.doc, .docx), Text (.txt)
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddPolicy(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddPolicy}>
                    Create Policy
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        )}
      </div>

      {/* Policies Table */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-primary">Policy Documents</CardTitle>
          <CardDescription>
            {isLoading ? "Loading policies..." : `${policyList.length} policies available`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading policies...
            </div>
          ) : policyList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No policies found. {canManagePolicy && "Create your first policy to get started."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Policy Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Effective Date</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policyList.map((policy) => (
                    <TableRow key={policy.id}>
                      <TableCell>
                        <div className="font-medium">{policy.title}</div>
                      </TableCell>
                      <TableCell>{policy.category && getCategoryBadge(policy.category)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {policy.version || "1.0"}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(policy.status)}</TableCell>
                      <TableCell className="text-sm">
                        {policy.effective_date ? format(new Date(policy.effective_date), 'MMM dd, yyyy') : '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {policy.createdBy?.name || '-'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <FileText className="h-3 w-3 mr-1" />
                              Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-popover border shadow-lg">
                            <DropdownMenuItem onClick={() => handleViewPolicy(policy)}>
                              <Eye className="h-3 w-3 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadPolicy(policy)}>
                              <Download className="h-3 w-3 mr-2" />
                              Download
                            </DropdownMenuItem>
                            {canManagePolicy && (
                              <>
                                <DropdownMenuItem onClick={() => handleEditClick(policy)}>
                                  <Edit className="h-3 w-3 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                {policy.status === 'draft' && (
                                  <DropdownMenuItem onClick={() => handleApprovePolicy(policy)}>
                                    <CheckCircle className="h-3 w-3 mr-2" />
                                    Approve
                                  </DropdownMenuItem>
                                )}
                                {policy.status === 'active' && (
                                  <DropdownMenuItem onClick={() => handleArchivePolicy(policy)}>
                                    <Archive className="h-3 w-3 mr-2" />
                                    Archive
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleDeletePolicy(policy)}
                                >
                                  <Trash2 className="h-3 w-3 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Policy Dialog */}
      <Dialog open={showViewPolicy} onOpenChange={setShowViewPolicy}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPolicy?.title}</DialogTitle>
            <DialogDescription>
              Version {selectedPolicy?.version} | {selectedPolicy?.category} | 
              Effective: {selectedPolicy?.effective_date ? format(new Date(selectedPolicy.effective_date), 'MMMM dd, yyyy') : '-'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              {selectedPolicy?.category && getCategoryBadge(selectedPolicy.category)}
              {getStatusBadge(selectedPolicy?.status)}
            </div>
            
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Policy Content</h3>
              <div className="whitespace-pre-wrap text-sm">
                {selectedPolicy?.content}
              </div>
            </div>

            {selectedPolicy?.approved_at && (
              <div className="border-t pt-4 text-sm text-muted-foreground">
                <p>
                  <strong>Approved by:</strong> {selectedPolicy.approvedBy?.name || 'Unknown'} on{' '}
                  {format(new Date(selectedPolicy.approved_at), 'MMMM dd, yyyy')}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => selectedPolicy && handleDownloadPolicy(selectedPolicy)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button onClick={() => setShowViewPolicy(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Policy Dialog */}
      <Dialog open={showEditPolicy} onOpenChange={setShowEditPolicy}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Policy</DialogTitle>
            <DialogDescription>
              Update policy information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Policy Title *</Label>
                <Input
                  id="edit-title"
                  value={editPolicy.title}
                  onChange={(e) => setEditPolicy({...editPolicy, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category *</Label>
                <select 
                  className="w-full px-3 py-2 border border-input bg-background text-sm rounded-md"
                  value={editPolicy.category}
                  onChange={(e) => setEditPolicy({...editPolicy, category: e.target.value})}
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-version">Version *</Label>
                <Input
                  id="edit-version"
                  value={editPolicy.version}
                  onChange={(e) => setEditPolicy({...editPolicy, version: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-effective_date">Effective Date *</Label>
                <Input
                  id="edit-effective_date"
                  type="date"
                  value={editPolicy.effective_date}
                  onChange={(e) => setEditPolicy({...editPolicy, effective_date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <select 
                  className="w-full px-3 py-2 border border-input bg-background text-sm rounded-md"
                  value={editPolicy.status}
                  onChange={(e) => setEditPolicy({...editPolicy, status: e.target.value as "draft" | "active" | "archived"})}
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-content">Policy Content *</Label>
              <Textarea
                id="edit-content"
                value={editPolicy.content}
                onChange={(e) => setEditPolicy({...editPolicy, content: e.target.value})}
                className="min-h-[200px]"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditPolicy(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdatePolicy}>
                Update Policy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
