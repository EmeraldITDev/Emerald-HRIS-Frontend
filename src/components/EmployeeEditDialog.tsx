import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import apiService, { Employee } from "@/lib/api"
import { DEPARTMENTS } from "@/constants/departments"
import { Download, Trash2, Upload } from "lucide-react"

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

  useEffect(() => {
    if (employee) {
      setFormData(employee)
    }
  }, [employee])

  const handleSubmit = async () => {
    if (!employee?.id) return

    setIsLoading(true)
    try {
      await apiService.updateEmployee(employee.id, formData)
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

  const handleDocumentDownload = (docUrl: string, filename: string) => {
    // Create a temporary link to download
    const a = document.createElement('a')
    a.href = docUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    
    toast({
      title: "Download Started",
      description: `Downloading ${filename}`
    })
  }

  const handleDocumentRemove = (field: keyof Employee) => {
    handleChange(field, null)
    toast({
      title: "Document Removed",
      description: "Document will be removed when you save."
    })
  }

  const handleDocumentUpload = (field: keyof Employee, file: File) => {
    // In a real app, you'd upload to your backend/storage
    // For now, we'll just store the file name
    handleChange(field, file.name)
    toast({
      title: "Document Selected",
      description: "Document will be uploaded when you save."
    })
  }

  if (!employee) return null

  return (
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
            <TabsTrigger value="documents">Documents</TabsTrigger>
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
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  value={formData.phone_number || ''}
                  onChange={(e) => handleChange('phone_number', e.target.value)}
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
                <Label htmlFor="meal_allowance">Meal Allowance (₦)</Label>
                <Input
                  id="meal_allowance"
                  type="number"
                  value={formData.meal_allowance || ''}
                  onChange={(e) => handleChange('meal_allowance', Number(e.target.value))}
                />
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

          <TabsContent value="documents" className="space-y-4 mt-4">
            <div className="space-y-4">
              {/* Document Management UI */}
              <div className="border rounded-lg p-4">
                <Label className="text-base font-semibold mb-3 block">Supporting Documents</Label>
                <div className="space-y-3">
                  {formData.supporting_documents ? (
                    <div className="flex items-center justify-between p-3 bg-muted rounded">
                      <span className="text-sm">{formData.supporting_documents}</span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDocumentDownload(formData.supporting_documents!, 'supporting_documents.pdf')}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDocumentRemove('supporting_documents')}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleDocumentUpload('supporting_documents', file)
                        }}
                        accept=".pdf,.doc,.docx"
                      />
                      <Button size="sm" variant="outline">
                        <Upload className="h-4 w-4 mr-1" />
                        Upload
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <Label className="text-base font-semibold mb-3 block">Government IDs</Label>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="national_id">National ID</Label>
                    <Input
                      id="national_id"
                      value={formData.national_id || ''}
                      onChange={(e) => handleChange('national_id', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nhf_number">NHF Number</Label>
                    <Input
                      id="nhf_number"
                      value={formData.nhf_number || ''}
                      onChange={(e) => handleChange('nhf_number', e.target.value)}
                    />
                  </div>
                </div>
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
  )
}
