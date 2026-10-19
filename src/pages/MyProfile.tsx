import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import apiService, { Employee } from "@/lib/api"
import { formatNaira } from "@/lib/currency"
import { getEmployeePayrollPackage } from "@/lib/payrollCalc"
import { staffIdFromEmployee } from "@/lib/staffId"
import { getYearsOfService } from "@/utils/celebrations"
import { EmployeeDocumentsPanel } from "@/components/EmployeeDocumentsPanel"
import { NairaIcon } from "@/components/icons/NairaIcon"
import { format } from "date-fns"
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
  Shield,
  Briefcase,
  FileText,
  IdCard,
  Banknote,
  Copy,
  Receipt,
  Award,
  Users,
} from "lucide-react"

function displayDate(value?: string | null) {
  if (!value) return "—"
  try {
    return format(new Date(value), "dd/MM/yyyy")
  } catch {
    return "—"
  }
}

function displayLongDate(value?: string | null) {
  if (!value) return "—"
  try {
    return format(new Date(value), "PPP")
  } catch {
    return "—"
  }
}

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium text-sm break-words">{value ?? "—"}</p>
    </div>
  )
}

export default function MyProfile() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [employeeData, setEmployeeData] = useState<Employee | null>(null)
  const [leaveRemaining, setLeaveRemaining] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    phone_number: "",
    address: "",
  })

  useEffect(() => {
    loadEmployeeData()
  }, [user])

  useEffect(() => {
    if (!user?.employee_id) return
    const interval = setInterval(() => {
      loadEmployeeData()
    }, 30000)
    return () => clearInterval(interval)
  }, [user])

  const loadEmployeeData = async () => {
    if (!user?.employee_id) {
      setIsLoading(false)
      return
    }

    try {
      const myEmployee = await apiService.getMyProfile()
      if (myEmployee) {
        setEmployeeData(myEmployee)
        setFormData({
          phone_number: myEmployee.phone_number || myEmployee.phone || "",
          address: myEmployee.address || "",
        })
        try {
          const bal: any = await apiService.getLeaveBalance(myEmployee.id as any)
          const remaining =
            bal?.remaining ??
            bal?.summary?.vacation_days_remaining ??
            bal?.vacation_days_remaining
          if (typeof remaining === "number") {
            setLeaveRemaining(remaining)
          }
        } catch {
          // leave balance is optional on profile
        }
      }
    } catch (error) {
      console.error("Failed to load employee data:", error)
      toast({
        title: "Error",
        description: "Failed to load your profile data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!employeeData?.id) {
      toast({
        title: "Error",
        description: "Employee record not found",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      await apiService.updateEmployee(employeeData.id, formData)
      toast({
        title: "Profile Updated",
        description: "Your contact information has been saved successfully",
      })
      await loadEmployeeData()
    } catch (error) {
      console.error("Failed to update profile:", error)
      toast({
        title: "Error",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
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

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive",
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    setIsUploadingPhoto(true)
    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        try {
          await apiService.updateEmployee(employeeData.id!, {
            profile_picture: reader.result as string,
          })
          toast({
            title: "Photo Updated",
            description: "Your profile photo has been updated successfully",
          })
          await loadEmployeeData()
        } catch (error) {
          console.error("Failed to upload photo:", error)
          toast({
            title: "Upload Failed",
            description: "Failed to upload your photo. Please try again.",
            variant: "destructive",
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
        variant: "destructive",
      })
      setIsUploadingPhoto(false)
    }
  }

  const getProfilePhoto = () => {
    if (!employeeData?.profile_picture && !(employeeData as any)?.profile_picture_url) return ""
    const pic = (employeeData as any).profile_picture_url || employeeData.profile_picture
    if (!pic) return ""
    if (String(pic).startsWith("http") || String(pic).startsWith("data:")) return String(pic)
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"
    return `${baseUrl}/storage/${pic}`
  }

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      executive: "Executive",
      hr_manager: "HR Manager",
      corporate_hr: "Corporate HR",
      line_manager: "Line Manager",
      finance: "Finance",
      it_admin: "IT Admin",
      it_power_user: "IT Power User",
      consulting_hr: "Consulting HR",
      contract_hr: "Contract HR",
      corporate_user: "General Employee",
      contract_staff: "Contract Staff",
      contract_employee: "Contract Employee",
      general_employee: "Employee",
    }
    return roleNames[role] || role
  }

  const getInitials = () => {
    if (user) {
      return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    }
    return "?"
  }

  const money = (amount?: number | string | null) =>
    formatNaira(typeof amount === "string" ? Number(amount) || 0 : amount ?? 0)

  /** Monthly figures from annual gross (÷12 + FTE split) — same rules as payroll. */
  const payrollPackage = employeeData ? getEmployeePayrollPackage(employeeData) : null

  const staffId = employeeData ? staffIdFromEmployee(employeeData) : null
  /** Hire / join date only — never use confirmation_date here. */
  const dateJoined = employeeData?.hire_date || null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground mt-1">
            View your full employee record to verify details with HR. Contact HR to correct anything that looks wrong.
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => navigate("/payroll/my-payslips")}>
          <Receipt className="h-4 w-4" />
          My Payslips
        </Button>
      </div>

      {/* Profile Overview */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-primary/20">
                <AvatarImage src={getProfilePhoto()} alt={`${user?.firstName} ${user?.lastName}`} />
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

            <div className="flex-1 text-center md:text-left space-y-3">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {employeeData?.first_name || user?.firstName}{" "}
                  {employeeData?.last_name || user?.lastName}
                </h2>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                  <Badge variant="default" className="text-sm">
                    <Shield className="h-3 w-3 mr-1" />
                    {getRoleDisplayName(user?.role || "")}
                  </Badge>
                  {employeeData?.employee_code && (
                    <Badge variant="outline">{employeeData.employee_code}</Badge>
                  )}
                  {staffId && (
                    <Badge variant="secondary" className="gap-1">
                      Staff ID {staffId}
                      <button
                        type="button"
                        className="ml-1"
                        title="Copy Staff ID"
                        onClick={() => {
                          navigator.clipboard.writeText(staffId)
                          toast({ title: "Copied", description: staffId })
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="text-sm">{employeeData?.email || user?.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4 shrink-0" />
                  <span className="text-sm">{employeeData?.job_title || "—"}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4 shrink-0" />
                  <span className="text-sm">{employeeData?.department || user?.department || "—"}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span className="text-sm">
                    Date joined {dateJoined ? displayDate(dateJoined) : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick stats */}
      {employeeData && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Employee ID</CardTitle>
              <IdCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{employeeData.employee_code || "—"}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Staff ID: {staffId || "Not assigned"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly package</CardTitle>
              <NairaIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{money(payrollPackage?.monthlyGross ?? 0)}</div>
              <p className="text-xs text-muted-foreground mt-1">Annual gross ÷ 12</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tenure</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                {dateJoined ? `${getYearsOfService(dateJoined)} yr` : "—"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                From date joined {dateJoined ? displayDate(dateJoined) : ""}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Annual leave</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                {leaveRemaining ?? employeeData.vacation_days ?? "—"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Days remaining</p>
            </CardContent>
          </Card>
        </div>
      )}

      {employeeData && (
        <Tabs defaultValue="personal" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto">
            <TabsTrigger value="personal" className="gap-1 text-xs sm:text-sm">
              <User className="h-3.5 w-3.5" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="job" className="gap-1 text-xs sm:text-sm">
              <Briefcase className="h-3.5 w-3.5" />
              Job
            </TabsTrigger>
            <TabsTrigger value="payroll" className="gap-1 text-xs sm:text-sm">
              <NairaIcon className="h-3.5 w-3.5" />
              Payroll
            </TabsTrigger>
            <TabsTrigger value="government" className="gap-1 text-xs sm:text-sm">
              <Shield className="h-3.5 w-3.5" />
              Gov IDs
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-1 text-xs sm:text-sm">
              <FileText className="h-3.5 w-3.5" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="contact" className="gap-1 text-xs sm:text-sm">
              <Phone className="h-3.5 w-3.5" />
              Contact
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="h-5 w-5" />
                    Personal information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <Field label="Full name" value={`${employeeData.first_name} ${employeeData.last_name}`} />
                  <Field label="Date of birth" value={displayLongDate(employeeData.dob)} />
                  <Field label="Gender" value={employeeData.gender || "—"} />
                  <Field label="Marital status" value={employeeData.marital_status || "—"} />
                  <Field label="Nationality" value={employeeData.nationality || "—"} />
                  <Field label="Email" value={employeeData.email} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calendar className="h-5 w-5" />
                    Employment dates
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4">
                  <Field
                    label="Date joined (hire date)"
                    value={dateJoined ? displayLongDate(dateJoined) : "—"}
                  />
                  <Field
                    label="Confirmation date"
                    value={displayLongDate(employeeData.confirmation_date)}
                  />
                  <Field label="Probation period" value={employeeData.probation_period || "—"} />
                  <Field
                    label="Years of service"
                    value={
                      dateJoined
                        ? `${getYearsOfService(dateJoined)} year${getYearsOfService(dateJoined) !== 1 ? "s" : ""}`
                        : "—"
                    }
                  />
                </CardContent>
              </Card>
            </div>
            <p className="text-xs text-muted-foreground italic">
              * Contact HR to update personal or employment dates if anything is incorrect.
            </p>
          </TabsContent>

          <TabsContent value="job" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Briefcase className="h-5 w-5" />
                    Job information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <Field label="Job title" value={employeeData.job_title || "—"} />
                  <Field label="Department" value={employeeData.department || "—"} />
                  <Field label="Grade level" value={employeeData.grade_level || "—"} />
                  <Field label="Work location" value={employeeData.work_location || "—"} />
                  <Field
                    label="Employment type"
                    value={employeeData.employment_type?.replace(/_/g, " ") || "—"}
                  />
                  <Field
                    label="Status"
                    value={
                      <Badge
                        variant={
                          String(employeeData.employment_status || "").toLowerCase() === "active"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {employeeData.employment_status || "—"}
                      </Badge>
                    }
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-5 w-5" />
                    Reporting & leave
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4">
                  <Field label="Supervisor / reports to" value={employeeData.supervisor_name || "—"} />
                  <Field
                    label="Annual leave remaining"
                    value={
                      leaveRemaining != null
                        ? `${leaveRemaining} days`
                        : employeeData.vacation_days != null
                          ? `${employeeData.vacation_days} days`
                          : "—"
                    }
                  />
                  <Field label="System role" value={getRoleDisplayName(user?.role || "")} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payroll" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <NairaIcon className="h-5 w-5" />
                    Compensation on record
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Annual gross</span>
                    <span className="font-medium">{money(payrollPackage?.annualGross ?? 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Basic salary (monthly)</span>
                    <span className="font-medium">{money(payrollPackage?.monthlyBasic ?? 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Housing allowance (monthly)</span>
                    <span className="font-medium">{money(payrollPackage?.monthlyHousing ?? 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Transport allowance (monthly)</span>
                    <span className="font-medium">{money(payrollPackage?.monthlyTransport ?? 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Meal allowance (monthly)</span>
                    <span className="font-medium">{money(payrollPackage?.monthlyMeal ?? 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Other allowance (monthly)</span>
                    <span className="font-medium">{money(payrollPackage?.monthlyOther ?? 0)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Monthly package</span>
                    <span className="text-lg">{money(payrollPackage?.monthlyGross ?? 0)}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 mt-2"
                    onClick={() => navigate("/payroll/my-payslips")}
                  >
                    <Receipt className="h-4 w-4" />
                    Open My Payslips
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Banknote className="h-5 w-5" />
                    Banking information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4">
                  <Field label="Bank name" value={employeeData.bank_name || "—"} />
                  <Field
                    label="Account number"
                    value={employeeData.account_number || employeeData.bank_account || "—"}
                  />
                  <Field label="NUBAN" value={employeeData.nuban || "—"} />
                  <Field label="Sort code" value={employeeData.sort_code || "—"} />
                </CardContent>
              </Card>
            </div>
            <p className="text-xs text-muted-foreground italic">
              * Monthly figures are annual gross ÷ 12 (with the standard FTE split). Raise any discrepancy with HR or Finance offline.
            </p>
          </TabsContent>

          <TabsContent value="government" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-5 w-5" />
                  Government & statutory IDs
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label="National ID (NIN)" value={employeeData.national_id || "—"} />
                <Field label="BVN" value={employeeData.bvn || "—"} />
                <Field label="TIN" value={employeeData.tin || "—"} />
                <Field label="Tax ID" value={employeeData.tax_id || "—"} />
                <Field label="Pension PIN" value={employeeData.pension_pin || "—"} />
                <Field label="NHF number" value={employeeData.nhf_number || "—"} />
                <Field label="Passport number" value={employeeData.passport_number || "—"} />
              </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground italic">
              * Verify these against your documents. Contact HR if NIN, BVN, or pension details need updating.
            </p>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            {employeeData.id ? (
              <EmployeeDocumentsPanel
                employeeId={employeeData.id}
                employeeName={`${employeeData.first_name} ${employeeData.last_name}`}
              />
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground text-sm">
                  No employee record linked — documents unavailable.
                </CardContent>
              </Card>
            )}
            <p className="text-xs text-muted-foreground italic">
              * You can view and download files on your record. Uploads and deletions are managed by HR.
            </p>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Phone className="h-5 w-5" />
                  Contact information you can update
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone_number" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone number
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
                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save contact changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {!employeeData && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No employee record is linked to your login. Ask HR to connect your user account to an employee profile.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
