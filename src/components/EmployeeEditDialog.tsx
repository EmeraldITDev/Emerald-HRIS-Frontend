import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import apiService, { Employee } from "@/lib/api"
import { DEPARTMENTS } from "@/constants/departments"
import { Download, Trash2, Upload, Loader2, FileText, File } from "lucide-react"

interface EmployeeDocument {
  type: string
  filename: string
  size?: number
  uploaded_by?: string
  uploaded_at?: string
  key: string
}

interface EmployeeEditDialogProps {
  employee: Employee | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EmployeeEditDialog({ employee, open, onOpenChange, onSuccess }: EmployeeEditDialogProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<Employee>>({})
  const [documents, setDocuments] = useState<EmployeeDocument[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<EmployeeDocument | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (employee) {
      setFormData(employee)
      fetchDocuments()
    }
  }, [employee])

  const [docsFetchError, setDocsFetchError] = useState<string | null>(null)

  const fetchDocuments = async () => {
    if (!employee?.id) return
    setLoadingDocs(true)
    setDocsFetchError(null)
    try {
      console.log(`[EditDialog] Fetching documents for employee ${employee.id}...`)
      const response = await apiService.getEmployeeDocuments(employee.id)
      console.log(`[EditDialog] Documents response:`, response)
      setDocuments(response.documents || [])
    } catch (error: any) {
      const errMsg = error instanceof Error ? error.message : String(error)
      console.error(`[EditDialog] ❌ Failed to fetch documents for employee ${employee.id}:`, errMsg, error)
      setDocsFetchError(errMsg)
      setDocuments([])
    } finally {
      setLoadingDocs(false)
    }
  }

  const handleSubmit = async () => {
    if (!employee?.id) return

    setIsLoading(true)
    try {
      // Build payload with only valid database columns
      const payload: Record<string, any> = {
        // Personal Info
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone, // Backend uses 'phone' not 'phone_number'
        dob: formData.dob,
        gender: formData.gender,
        marital_status: formData.marital_status,
        nationality: formData.nationality,
        address: formData.address,

        // Job Info
        employee_code: formData.employee_code,
        job_title: formData.job_title,
        department: formData.department,
        employment_type: formData.employment_type,
        employment_status: formData.employment_status,
        hire_date: formData.hire_date,
        work_location: formData.work_location,
        supervisor_name: formData.supervisor_name,

        // Financial Info
        gross_salary: formData.gross_salary,
        housing_allowance: formData.housing_allowance,
        transport_allowance: formData.transport_allowance,
        // meal_allowance removed (Requirement 6 – no longer used in new payroll runs)
        baseSalary: formData.baseSalary,
        salaryType: formData.salaryType,
        bank_account: formData.bank_account,
        bank_name: formData.bank_name,
        account_number: formData.account_number,
        pension_pin: formData.pension_pin,
        tax_id: formData.tax_id,
        bvn: formData.bvn,
        tin: formData.tin,
        passport_number: formData.passport_number,

        // Documents
        national_id: formData.national_id,
        nhf_number: formData.nhf_number,
        supporting_documents: formData.supporting_documents,
      }

      // Remove undefined/null values to avoid sending unnecessary fields
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined) {
          delete payload[key]
        }
      })

      await apiService.updateEmployee(employee.id, payload)
      toast({
        title: "Success",
        description: "Employee record updated successfully."
      })
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to update employee:', error)
      toast({
        title: "Error",
        description: "Failed to update employee record.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof Employee, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDocumentDownload = async (docType: string, filename: string) => {
    if (!employee?.id) return
    try {
      const { url } = await apiService.getDocumentUrl(employee.id, docType, true)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast({ title: "Download Started", description: `Downloading ${filename}` })
    } catch (error) {
      console.error('Download failed:', error)
      toast({ title: "Download Failed", description: "Could not download document.", variant: "destructive" })
    }
  }

  const handleDocumentRemove = async (docType: string, filename: string) => {
    if (!employee?.id) return
    try {
      await apiService.deleteDocument(employee.id, docType, filename)
      toast({ title: "Document Removed", description: "Document has been deleted." })
      // Refresh supporting_documents field
      handleChange('supporting_documents', null)
      onSuccess()
    } catch (error) {
      console.error('Delete failed:', error)
      toast({ title: "Delete Failed", description: "Could not delete document.", variant: "destructive" })
    }
  }

  const handleDocumentUpload = async (file: File) => {
    if (!employee?.id) return
    setIsUploading(true)
    setUploadProgress(0)
    try {
      await apiService.uploadDocument(employee.id, 'supporting_docs', file, (percent) => {
        setUploadProgress(percent)
      })
      toast({ title: "Document Uploaded", description: `${file.name} uploaded successfully.` })
      onSuccess()
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error)
      console.error(`[EditDialog] Upload failed for ${file.name}:`, errMsg, error)
      toast({ title: "Upload Failed", description: "Could not upload document.", variant: "destructive" })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  if (!employee) return null

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Employee Record</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="job">Job Info</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="additional">Additional</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name || ''}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name || ''}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={formData.dob || ''}
                  onChange={(e) => handleChange('dob', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select value={formData.gender || ''} onValueChange={(value) => handleChange('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="marital_status">Marital Status</Label>
                <Select value={formData.marital_status || ''} onValueChange={(value) => handleChange('marital_status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single">Single</SelectItem>
                    <SelectItem value="Married">Married</SelectItem>
                    <SelectItem value="Divorced">Divorced</SelectItem>
                    <SelectItem value="Widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="nationality">Nationality</Label>
                <Input
                  id="nationality"
                  value={formData.nationality || ''}
                  onChange={(e) => handleChange('nationality', e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address || ''}
                  onChange={(e) => handleChange('address', e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="job" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employee_code">Employee ID</Label>
                <Input
                  id="employee_code"
                  value={formData.employee_code || ''}
                  onChange={(e) => handleChange('employee_code', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="job_title">Job Title</Label>
                <Input
                  id="job_title"
                  value={formData.job_title || ''}
                  onChange={(e) => handleChange('job_title', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Select value={formData.department || ''} onValueChange={(value) => handleChange('department', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="employment_type">Employment Type</Label>
                <Select value={formData.employment_type || ''} onValueChange={(value) => handleChange('employment_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="hire_date">Hire Date</Label>
                <Input
                  id="hire_date"
                  type="date"
                  value={formData.hire_date || ''}
                  onChange={(e) => handleChange('hire_date', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="employment_status">Employment Status</Label>
                <Select value={formData.employment_status || ''} onValueChange={(value) => handleChange('employment_status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="On Leave">On Leave</SelectItem>
                    <SelectItem value="Terminated">Terminated</SelectItem>
                    <SelectItem value="Resigned">Resigned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="work_location">Work Location</Label>
                <Input
                  id="work_location"
                  value={formData.work_location || ''}
                  onChange={(e) => handleChange('work_location', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="supervisor_name">Supervisor</Label>
                <Input
                  id="supervisor_name"
                  value={formData.supervisor_name || ''}
                  onChange={(e) => handleChange('supervisor_name', e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="financial" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gross_salary">Basic Salary (₦)</Label>
                <Input
                  id="gross_salary"
                  type="number"
                  value={formData.gross_salary || ''}
                  onChange={(e) => handleChange('gross_salary', Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="housing_allowance">Housing Allowance (₦)</Label>
                <Input
                  id="housing_allowance"
                  type="number"
                  value={formData.housing_allowance || ''}
                  onChange={(e) => handleChange('housing_allowance', Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="transport_allowance">Transport Allowance (₦)</Label>
                <Input
                  id="transport_allowance"
                  type="number"
                  value={formData.transport_allowance || ''}
                  onChange={(e) => handleChange('transport_allowance', Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="baseSalary">Base Salary (₦)</Label>
                <Input
                  id="baseSalary"
                  type="number"
                  min={0}
                  step="0.01"
                  value={formData.baseSalary ?? ''}
                  onChange={(e) => handleChange('baseSalary', e.target.value === '' ? undefined : Number(e.target.value))}
                />
                {formData.baseSalary !== undefined && formData.salaryType && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.salaryType === 'monthly' && `Monthly Gross: ₦${Number(formData.baseSalary).toLocaleString()}`}
                    {formData.salaryType === 'annual' && `Monthly Gross: ₦${(Number(formData.baseSalary) / 12).toFixed(2)}`}
                    {formData.salaryType === 'hourly' && 'Hourly type — not yet supported in payroll'}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="salaryType">Salary Type</Label>
                <Select
                  value={formData.salaryType || ''}
                  onValueChange={(value) => handleChange('salaryType', value as 'monthly' | 'annual' | 'hourly')}
                >
                  <SelectTrigger id="salaryType">
                    <SelectValue placeholder="Select salary type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="bank_account">Bank Account</Label>
                <Input
                  id="bank_account"
                  value={formData.bank_account || ''}
                  onChange={(e) => handleChange('bank_account', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="pension_pin">Pension PIN</Label>
                <Input
                  id="pension_pin"
                  value={formData.pension_pin || ''}
                  onChange={(e) => handleChange('pension_pin', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="tax_id">Tax ID</Label>
                <Input
                  id="tax_id"
                  value={formData.tax_id || ''}
                  onChange={(e) => handleChange('tax_id', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="bvn">BVN</Label>
                <Input
                  id="bvn"
                  value={formData.bvn || ''}
                  onChange={(e) => handleChange('bvn', e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="additional" className="space-y-6 mt-4">
            {/* Government IDs Section */}
            <div className="border rounded-lg p-4 bg-card">
              <h3 className="text-base font-semibold mb-4">Government IDs</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="national_id">National ID Number</Label>
                  <Input
                    id="national_id"
                    value={formData.national_id || ''}
                    onChange={(e) => handleChange('national_id', e.target.value)}
                    placeholder="Enter National ID"
                  />
                </div>
                <div>
                  <Label htmlFor="passport_number">Passport Number</Label>
                  <Input
                    id="passport_number"
                    value={formData.passport_number || ''}
                    onChange={(e) => handleChange('passport_number', e.target.value)}
                    placeholder="Enter Passport Number"
                  />
                </div>
                <div>
                  <Label htmlFor="bvn">BVN</Label>
                  <Input
                    id="bvn"
                    value={formData.bvn || ''}
                    onChange={(e) => handleChange('bvn', e.target.value)}
                    placeholder="Enter BVN"
                  />
                </div>
                <div>
                  <Label htmlFor="tin">TIN</Label>
                  <Input
                    id="tin"
                    value={formData.tin || ''}
                    onChange={(e) => handleChange('tin', e.target.value)}
                    placeholder="Enter Tax ID Number"
                  />
                </div>
                <div>
                  <Label htmlFor="nhf_number">NHF Number</Label>
                  <Input
                    id="nhf_number"
                    value={formData.nhf_number || ''}
                    onChange={(e) => handleChange('nhf_number', e.target.value)}
                    placeholder="Enter NHF Number"
                  />
                </div>
                <div>
                  <Label htmlFor="pension_pin">Pension PIN</Label>
                  <Input
                    id="pension_pin"
                    value={formData.pension_pin || ''}
                    onChange={(e) => handleChange('pension_pin', e.target.value)}
                    placeholder="Enter Pension PIN"
                  />
                </div>
              </div>
            </div>

            {/* Supporting Documents Section - S3 backed */}
            <div className="border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold">Supporting Documents</h3>
                <Badge variant="secondary">{documents.length}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Upload employee documents directly to secure S3 storage.</p>
              
              {/* Documents List from API */}
              <div className="mb-4">
                <Label className="text-sm font-medium mb-2 block">Current Documents</Label>
                {loadingDocs ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
              ) : docsFetchError ? (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm font-medium text-destructive">Failed to load documents</p>
                    <p className="text-xs text-muted-foreground mt-1">Backend error: {docsFetchError}</p>
                    <p className="text-xs text-muted-foreground mt-1">Documents may exist in S3 but the listing endpoint returned an error. Check the backend logs.</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={fetchDocuments}>
                      <Loader2 className={`h-3 w-3 mr-1 ${loadingDocs ? 'animate-spin' : ''}`} />
                      Retry
                    </Button>
                  </div>
              ) : documents.length > 0 ? (
                  <div className="space-y-2">
                    {documents.map((doc, index) => (
                      <div key={`${doc.key}-${index}`} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{doc.filename}</p>
                            <p className="text-xs text-muted-foreground">
                              {doc.type}{doc.size ? ` • ${(doc.size / 1024).toFixed(1)} KB` : ''}{doc.uploaded_at ? ` • ${new Date(doc.uploaded_at).toLocaleDateString()}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1 ml-2 shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              try {
                                const { url } = await apiService.getDocumentUrl(employee!.id!, doc.type, true)
                                console.log(`[EditDialog] Got download URL for type="${doc.type}":`, url?.substring(0, 100))
                                const a = document.createElement('a')
                                a.href = url
                                a.download = doc.filename
                                document.body.appendChild(a)
                                a.click()
                                document.body.removeChild(a)
                              } catch (err: any) {
                                const errMsg = err instanceof Error ? err.message : String(err)
                                console.error(`[EditDialog] ❌ Download failed for type="${doc.type}":`, errMsg, err)
                                toast({ title: "Download Failed", description: `Could not download: ${errMsg}`, variant: "destructive" })
                              }
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(doc)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
                  </div>
                )}
              </div>

              {/* Upload New Documents - multiple files */}
              <div className="border-2 border-dashed rounded-lg p-4">
                <Label className="text-sm font-medium mb-2 block">Add Documents</Label>
                <div className="flex items-center gap-2">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={async (e) => {
                      const files = e.target.files
                      if (!files || files.length === 0 || !employee?.id) return
                      setIsUploading(true)
                      setUploadProgress(0)

                      for (let i = 0; i < files.length; i++) {
                        const file = files[i]
                        if (file.size > 10 * 1024 * 1024) {
                          toast({ title: "File Too Large", description: `${file.name} exceeds 10MB.`, variant: "destructive" })
                          continue
                        }
                        try {
                          setUploadProgress(Math.round(((i) / files.length) * 100))
                          await apiService.uploadDocument(employee.id, 'supporting_docs', file)
                          toast({ title: "Uploaded", description: `${file.name} uploaded successfully.` })
                        } catch (err) {
                          console.error(`[EditDialog Bulk] Upload failed for ${file.name}:`, err instanceof Error ? err.message : err, err)
                          toast({ title: "Upload Failed", description: `Failed to upload ${file.name}.`, variant: "destructive" })
                        }
                      }
                      setUploadProgress(100)
                      setIsUploading(false)
                      if (fileInputRef.current) fileInputRef.current.value = ""
                      await fetchDocuments()
                      onSuccess()
                    }}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                    className="flex-1"
                    disabled={isUploading}
                  />
                </div>
                {isUploading && (
                  <div className="mt-2 space-y-1">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Uploading... {uploadProgress}%
                    </p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">Select multiple files. Accepted: PDF, DOC, DOCX, JPG, PNG, WEBP • Max 10MB each</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Delete Confirmation Dialog */}
    <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Document</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{deleteTarget?.filename}</strong>? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => {
              if (!deleteTarget || !employee?.id) return
              setIsDeleting(true)
              try {
                await apiService.deleteDocument(employee.id, deleteTarget.type, deleteTarget.filename)
                toast({ title: "Document Deleted", description: `${deleteTarget.filename} has been removed.` })
                await fetchDocuments()
                onSuccess()
              } catch (err: any) {
                const errMsg = err instanceof Error ? err.message : String(err)
                console.error(`[EditDialog] ❌ Delete failed:`, errMsg, err)
                toast({ title: "Delete Failed", description: `Could not delete: ${errMsg}`, variant: "destructive" })
              } finally {
                setIsDeleting(false)
                setDeleteTarget(null)
              }
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Deleting...</> : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
