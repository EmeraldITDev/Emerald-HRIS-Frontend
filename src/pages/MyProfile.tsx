import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import apiService, { Employee } from "@/lib/api"
import { 
  User, 
  Mail, 
  Building2, 
  Phone, 
  MapPin, 
  Calendar,
  Camera,
  Save,
  Loader2,
  Shield
} from "lucide-react"

export default function MyProfile() {
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [employeeData, setEmployeeData] = useState<Employee | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Editable fields
  const [formData, setFormData] = useState({
    phone_number: "",
    address: "",
  })

  useEffect(() => {
    loadEmployeeData()
  }, [user])

  // Refresh data periodically to reflect changes made by HR/Execs (every 30 seconds)
  useEffect(() => {
    if (!user?.employee_id) return

    const interval = setInterval(() => {
      loadEmployeeData()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [user])

  const loadEmployeeData = async () => {
    if (!user?.employee_id) {
      setIsLoading(false)
      return
    }

    try {
      // Use the dedicated my-profile endpoint for better performance
      const myEmployee = await apiService.getMyProfile()
      
      if (myEmployee) {
        setEmployeeData(myEmployee)
        setFormData({
          phone_number: myEmployee.phone_number || "",
          address: myEmployee.address || "",
        })
      }
    } catch (error) {
      console.error("Failed to load employee data:", error)
      toast({
        title: "Error",
        description: "Failed to load your profile data",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!employeeData?.id) {
      toast({
        title: "Error",
        description: "Employee record not found",
        variant: "destructive"
      })
      return
    }

    setIsSaving(true)
    try {
      await apiService.updateEmployee(employeeData.id, formData)
      toast({
        title: "Profile Updated",
        description: "Your personal information has been saved successfully"
      })
      await loadEmployeeData()
    } catch (error) {
      console.error("Failed to update profile:", error)
      toast({
        title: "Error",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePhotoClick = () => {
    fileInputRef.current?.click()
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !employeeData?.id) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive"
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      })
      return
    }

    setIsUploadingPhoto(true)
    try {
      // For now, just update the employee with a data URL
      const reader = new FileReader()
      reader.onloadend = async () => {
        try {
          await apiService.updateEmployee(employeeData.id, { profile_picture: reader.result as string })
          toast({
            title: "Photo Updated",
            description: "Your profile photo has been updated successfully"
          })
          await loadEmployeeData()
        } catch (error) {
          console.error("Failed to upload photo:", error)
          toast({
            title: "Upload Failed",
            description: "Failed to upload your photo. Please try again.",
            variant: "destructive"
          })
        } finally {
          setIsUploadingPhoto(false)
        }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Failed to upload photo:", error)
      toast({
        title: "Upload Failed",
        description: "Failed to upload your photo. Please try again.",
        variant: "destructive"
      })
      setIsUploadingPhoto(false)
    }
  }

  const getProfilePhoto = () => {
    if (!employeeData?.profile_picture) return ""
    
    // If it's a full URL, return as is
    if (employeeData.profile_picture.startsWith('http')) {
      return employeeData.profile_picture
    }
    
    // Otherwise, construct the storage URL
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    return `${baseUrl}/storage/${employeeData.profile_picture}`
  }

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      executive: 'Executive',
      hr_manager: 'HR Manager',
      corporate_hr: 'Corporate HR',
      line_manager: 'Line Manager',
      finance: 'Finance',
      it_admin: 'IT Admin',
      it_power_user: 'IT Power User',
      consulting_hr: 'Consulting HR',
      contract_hr: 'Contract HR',
      corporate_user: 'General Employee',
      contract_staff: 'Contract Staff',
      contract_employee: 'Contract Employee',
      general_employee: 'Employee'
    }
    return roleNames[role] || role
  }

  const getInitials = () => {
    if (user) {
      return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    }
    return "?"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground mt-1">View and update your personal information</p>
      </div>

      {/* Profile Overview Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Profile Photo */}
            <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-primary/20">
                <AvatarImage 
                  src={getProfilePhoto()} 
                  alt={`${user?.firstName} ${user?.lastName}`}
                />
                <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant="secondary"
                className="absolute bottom-0 right-0 rounded-full h-10 w-10 p-0 shadow-lg group-hover:scale-110 transition-transform"
                onClick={handlePhotoClick}
                disabled={isUploadingPhoto}
              >
                {isUploadingPhoto ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>

            {/* Basic Info */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-foreground">
                {user?.firstName} {user?.lastName}
              </h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                <Badge variant="default" className="text-sm">
                  <Shield className="h-3 w-3 mr-1" />
                  {getRoleDisplayName(user?.role || '')}
                </Badge>
                {employeeData?.employee_code && (
                  <Badge variant="outline">{employeeData.employee_code}</Badge>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">{user?.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span className="text-sm">{user?.department || "Not assigned"}</span>
                </div>
                {employeeData?.job_title && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span className="text-sm">{employeeData.job_title}</span>
                  </div>
                )}
                {employeeData?.hire_date && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Joined {new Date(employeeData.hire_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information - View Only */}
      {employeeData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Date of Birth</p>
                <p className="font-medium">
                  {employeeData.dob ? new Date(employeeData.dob).toLocaleDateString() : "—"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Gender</p>
                <p className="font-medium capitalize">{employeeData.gender || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Marital Status</p>
                <p className="font-medium capitalize">{employeeData.marital_status || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Nationality</p>
                <p className="font-medium">{employeeData.nationality || "—"}</p>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground mt-4 italic">
              * Contact HR to update personal information
            </p>
          </CardContent>
        </Card>
      )}

      {/* Editable Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone_number" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>
              <Input
                id="phone_number"
                value={formData.phone_number}
                onChange={(e) => handleInputChange("phone_number", e.target.value)}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Enter your address"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Read-only Employment Information */}
      {employeeData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Employment Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Employee ID</p>
                <p className="font-medium">{employeeData.employee_code || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Job Title</p>
                <p className="font-medium">{employeeData.job_title || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium">{employeeData.department || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Employment Type</p>
                <p className="font-medium capitalize">{employeeData.employment_type?.replace("_", " ") || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={employeeData.employment_status === "active" ? "default" : "secondary"}>
                  {employeeData.employment_status || "—"}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Hire Date</p>
                <p className="font-medium">
                  {employeeData.hire_date ? new Date(employeeData.hire_date).toLocaleDateString() : "—"}
                </p>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground mt-4 italic">
              * Contact HR to update employment information
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
