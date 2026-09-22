import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Star, Plus, Eye, Download, Calendar, CheckCircle, ClipboardCheck, FileText, Search, Filter, X } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DEPARTMENTS } from '@/constants/departments'
import { useToast } from "@/hooks/use-toast"
import { useAuth } from '@/contexts/AuthContext'
import { apiService, Employee, PerformanceReview } from '@/lib/api'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { useNavigate, useSearchParams } from 'react-router-dom'

interface Review {
  id: string
  employeeId: string
  employeeName: string
  department: string
  reviewPeriod: string
  reviewDate: string
  rating: number
  status: string
  rawStatus?: string
  reviewer: string
  goals: string
  achievements: string
  areasForImprovement: string
  comments: string
  employeeComments?: string
  selfAssessment?: string
  selfAssessmentDate?: string
  managerReviewDate?: string
  meetingScheduledDate?: string
  employeeSignedDate?: string
  managerSignedDate?: string
  hrApprovedDate?: string
  hrComments?: string
}

export default function Performance() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [reviews, setReviews] = useState<Review[]>([])

  const [newReview, setNewReview] = useState({
    employeeId: '',
    reviewPeriod: '',
    rating: 0,
    goals: '',
    achievements: '',
    areasForImprovement: '',
    comments: '',
    requestSelfAssessment: true,
  })

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [commentDialogOpen, setCommentDialogOpen] = useState(false)
  const [selfAssessmentOpen, setSelfAssessmentOpen] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  useEffect(() => {
    if (searchParams.get('selfAssessment')) setSelfAssessmentOpen(true)
  }, [searchParams])
  const [manageReviewDialogOpen, setManageReviewDialogOpen] = useState(false)
  const [hrReviewDialogOpen, setHrReviewDialogOpen] = useState(false)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [employeeComment, setEmployeeComment] = useState("")
  const [selfAssessmentPeriod, setSelfAssessmentPeriod] = useState("")
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [periodFilter, setPeriodFilter] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  
  const [selfAssessmentData, setSelfAssessmentData] = useState({
    mainResponsibilities: "",
    achievements: "",
    completedGoals: "",
    unachievedGoals: "",
    workQualityRating: "3",
    timeManagement: "",
    teamCommunication: "",
    feedbackResponse: "",
    professionalism: "",
    challenges: "",
    resourcesNeeded: "",
    skillsToLearn: "",
    futureGoals: "",
    teamContribution: "",
    suggestions: "",
    overallRating: "3"
  })
  const [managerNotes, setManagerNotes] = useState("")
  const [managerRating, setManagerRating] = useState("3")
  const [managerStrengths, setManagerStrengths] = useState("")
  const [managerAreasForImprovement, setManagerAreasForImprovement] = useState("")
  const [managerRecommendations, setManagerRecommendations] = useState("")
  const [meetingDate, setMeetingDate] = useState("")
  const [hrComments, setHrComments] = useState("")
  const { toast } = useToast()
  const { user } = useAuth()
  
  useEffect(() => {
    fetchEmployees()
    fetchReviews()
  }, [])
  
  const fetchEmployees = async () => {
    try {
      const data = await apiService.getEmployees()
      const list = Array.isArray(data) ? data : ((data as any)?.data || [])
      setEmployees(list)
    } catch (error) {
      console.error('Failed to fetch employees:', error)
    }
  }

  // Readable labels for the backend workflow statuses (historical rows were
  // migrated: submitted -> self_assessment_submitted, pending_hr_review -> hr_review,
  // closed/hr_approved -> completed).
  const STATUS_LABELS: Record<string, string> = {
    draft: 'Draft',
    self_assessment_requested: 'Awaiting Self-Assessment',
    self_assessment_submitted: 'Self-Assessment Submitted',
    manager_review: 'With Line Manager',
    hr_review: 'With HR',
    completed: 'Completed',
  }

  const statusLabel = (raw?: string) => {
    const key = String(raw || '').toLowerCase()
    return STATUS_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  }

  const fetchReviews = async () => {
    try {
      const data = await apiService.getPerformanceReviews()
      const mapped = (Array.isArray(data) ? data : []).map((r: PerformanceReview) => ({
        id: String(r.id || ''),
        employeeId: String(r.employee_id),
        employeeName: `${r.employee?.first_name ?? ''} ${r.employee?.last_name ?? ''}`.trim() || 'Employee',
        department: r.employee?.department ?? 'N/A',
        reviewPeriod: r.period,
        reviewDate: (r.created_at || '').split('T')[0] || '',
        rating: Number(r.manager_review?.overall_rating ?? r.self_assessment?.overallRating ?? 0),
        status: statusLabel(r.status),
        rawStatus: r.status,
        reviewer: r.manager?.name ?? '—',
        goals: r.self_assessment?.futureGoals ?? '',
        achievements: r.self_assessment?.achievements ?? '',
        areasForImprovement: r.self_assessment?.areasForImprovement ?? '',
        comments: r.manager_review?.comments ?? '',
        employeeComments: r.self_assessment?.comments ?? '',
        employeeSignedDate: r.employee_signed_at ? r.employee_signed_at.split('T')[0] : undefined,
        managerSignedDate: r.manager_signed_at ? r.manager_signed_at.split('T')[0] : undefined,
        hrApprovedDate: r.hr_approved_at ? r.hr_approved_at.split('T')[0] : undefined,
      }))
      if (mapped.length) setReviews(mapped as any)
    } catch (error) {
      console.error('Failed to fetch performance reviews:', error)
    }
  }
  
  // Determine user's access level (still useful for UI controls)
  const isExecutiveOrHR = user?.role === 'executive' || user?.role === 'hr_manager' || user?.role === 'corporate_hr'
  const isLineManager = user?.role === 'line_manager'
  const isGeneralEmployee = !isExecutiveOrHR && !isLineManager
  const canManageReviews = isExecutiveOrHR || isLineManager
  // Only HR opens a review cycle; managers contribute to existing ones.
  const canCreateReviews = user?.role === 'hr_manager' || user?.role === 'corporate_hr'
  const userDepartment = user?.department
  const currentEmployeeIdFromUser = user?.employee_id ? String(user.employee_id) : undefined
  
  // Filter reviews based on search and filter criteria only.
  // Backend (PerformanceReviewController@index) already enforces role-based visibility,
  // so every review returned by the API is one the current user is allowed to see.
  const filteredReviews = reviews.filter(review => {
    // Search term filtering
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        review.employeeName.toLowerCase().includes(searchLower) ||
        review.department.toLowerCase().includes(searchLower) ||
        review.reviewPeriod.toLowerCase().includes(searchLower) ||
        review.reviewer.toLowerCase().includes(searchLower)
      if (!matchesSearch) return false
    }
    
    // Status filtering
    if (statusFilter && review.status !== statusFilter) return false
    
    // Period filtering
    if (periodFilter && review.reviewPeriod !== periodFilter) return false
    
    // Department filtering
    if (departmentFilter && review.department !== departmentFilter) return false
    
    return true
  })
  
  // The employee may only self-assess when HR has requested it for them.
  const selfAssessmentRequest = reviews.find(
    r =>
      String(r.rawStatus || '').toLowerCase() === 'self_assessment_requested' &&
      (!currentEmployeeIdFromUser || r.employeeId === currentEmployeeIdFromUser),
  )

  // Filter employees based on department for line managers
  const filteredEmployees = isLineManager && userDepartment
    ? employees.filter(emp => emp.department === userDepartment)
    : employees

  // Get unique values for filter dropdowns
  const uniquePeriods = [...new Set(reviews.map(r => r.reviewPeriod))].sort()
  const uniqueStatuses = [...new Set(reviews.map(r => r.status))].sort()
  const uniqueDepartments = [...new Set(reviews.map(r => r.department))].sort()

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("")
    setPeriodFilter("")
    setDepartmentFilter("")
  }

  // Check if any filters are active
  const hasActiveFilters = searchTerm || statusFilter || periodFilter || departmentFilter
  
  const currentPeriod = `Q${Math.floor(new Date().getMonth() / 3) + 1} ${new Date().getFullYear()}`

  // Quarter options: two quarters back through three forward.
  const periodOptions = (() => {
    const now = new Date()
    const options: string[] = []
    for (let offset = -2; offset <= 3; offset++) {
      const d = new Date(now.getFullYear(), now.getMonth() + offset * 3, 1)
      options.push(`Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`)
    }
    return options
  })()

  const handleCreateNewReview = async () => {
    if (!newReview.employeeId) {
      toast({
        title: "Missing information",
        description: "Please select an employee.",
        variant: "destructive"
      })
      return
    }
    if (!newReview.reviewPeriod) {
      toast({
        title: "Missing information",
        description: "Please select a review period.",
        variant: "destructive"
      })
      return
    }

    const employee = employees.find(emp => emp.id?.toString() === newReview.employeeId)
    if (!employee) return

    const period = newReview.reviewPeriod

    try {
      // HR opens the cycle on the backend; the employee always gets a
      // self-assessment request.
      await apiService.createPerformanceReview({
        employee_id: Number(newReview.employeeId),
        period,
        request_self_assessment: true,
      })
      await fetchReviews()
    } catch (e: any) {
      toast({
        title: "Could not create review",
        description: e?.data?.message || e?.message || "Please try again.",
        variant: "destructive"
      })
      return
    }

    setNewReview({
      employeeId: '',
      reviewPeriod: '',
      rating: 0,
      goals: '',
      achievements: '',
      areasForImprovement: '',
      comments: '',
      requestSelfAssessment: true,
    })
    setIsDialogOpen(false)

    toast({
      title: "Review created",
      description: newReview.requestSelfAssessment
        ? `${employee.first_name} ${employee.last_name} has been asked to complete a self-assessment.`
        : `Performance review for ${employee.first_name} ${employee.last_name} has been created.`
    })
  }
  
  const handleAddEmployeeComment = async () => {
    if (!selectedReview || !employeeComment.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter your comment.",
        variant: "destructive"
      })
      return
    }
    
    try {
      // Persist employee comment to the backend
      await apiService.addEmployeePerformanceComment(Number(selectedReview.id), employeeComment.trim())
      await fetchReviews()

      setEmployeeComment("")
      setCommentDialogOpen(false)
      
      toast({
        title: "Comment added",
        description: "Your comment has been saved to this performance review."
      })
    } catch (error) {
      console.error('Failed to add employee comment:', error)
      toast({
        title: "Error",
        description: "Failed to save your comment. Please try again.",
        variant: "destructive"
      })
    }
  }
  
  const handleSubmitSelfAssessment = async () => {
    // Validate required fields
    if (!selfAssessmentPeriod || !selfAssessmentData.mainResponsibilities || !selfAssessmentData.achievements) {
      toast({
        title: "Required fields missing",
        description: "Please enter period and required fields before submitting.",
        variant: "destructive"
      })
      return
    }

    try {
      const saved = await apiService.createSelfAssessment({ period: selfAssessmentPeriod, self_assessment: selfAssessmentData })
      if (saved?.id) {
        await apiService.submitSelfAssessment(saved.id)
      }
      await fetchReviews()
      toast({ title: "Self-Assessment Submitted", description: "Sent to your manager." })
    } catch (e) {
      toast({ title: "Submit failed", description: "Please try again.", variant: 'destructive' })
      return
    }

    // Reset form
    setSelfAssessmentData({
      mainResponsibilities: "",
      achievements: "",
      completedGoals: "",
      unachievedGoals: "",
      workQualityRating: "3",
      timeManagement: "",
      teamCommunication: "",
      feedbackResponse: "",
      professionalism: "",
      challenges: "",
      resourcesNeeded: "",
      skillsToLearn: "",
      futureGoals: "",
      teamContribution: "",
      suggestions: "",
      overallRating: "3"
    })
    setSelfAssessmentPeriod("")
    setSelfAssessmentOpen(false)
  }

  const handleManagerReview = async () => {
    if (!selectedReview || !managerNotes.trim() || !meetingDate) {
      toast({
        title: "Missing information",
        description: "Please complete all fields.",
        variant: "destructive"
      })
      return
    }
    try {
      await apiService.managerReview(Number(selectedReview.id), {
        ratings: { overall: Number(managerRating) || 0 },
        observations: managerNotes,
        strengths: managerStrengths,
        areas_for_improvement: managerAreasForImprovement,
        recommendations: managerRecommendations,
        comments: managerNotes,
      })
      await apiService.schedulePerformanceMeeting(Number(selectedReview.id), new Date(meetingDate).toISOString())
      await fetchReviews()
      setManagerNotes("")
      setManagerRating("3")
      setManagerStrengths("")
      setManagerAreasForImprovement("")
      setManagerRecommendations("")
      setMeetingDate("")
      setManageReviewDialogOpen(false)
      toast({ title: "Review updated", description: "Sent and meeting scheduled." })
    } catch (e) {
      toast({ title: "Update failed", description: "Please try again.", variant: 'destructive' })
    }
  }
  
  const handleEmployeeSignOff = async (reviewId: string) => {
    try {
      await apiService.signPerformance(Number(reviewId), 'employee')
      await fetchReviews()
      toast({ title: "Review signed", description: "You have signed off." })
    } catch (e) {
      toast({ title: "Sign failed", description: "Please try again.", variant: 'destructive' })
    }
  }
  
  const handleManagerSignOff = (reviewId: string) => {
    const updatedReviews = reviews.map(review => 
      review.id === reviewId 
        ? { 
            ...review, 
            managerSignedDate: new Date().toISOString().split('T')[0],
            status: review.employeeSignedDate ? 'Awaiting HR Review' : 'Manager Signed'
          }
        : review
    )
    
    setReviews(updatedReviews)
    
    toast({
      title: "Review signed",
      description: "You have signed off on this performance review."
    })
  }
  
  const handleHRApproval = async () => {
    if (!selectedReview) return
    try {
      // HR final screen closes the review out on the backend
      await apiService.completePerformanceReview(Number(selectedReview.id), {
        hr_comments: hrComments || undefined,
      })
      await fetchReviews()
      setHrComments("")
      setHrReviewDialogOpen(false)
      toast({ title: "Review completed", description: "This review is now closed." })
    } catch (e) {
      toast({ title: "Approval failed", description: "Please try again.", variant: 'destructive' })
    }
  }
  
  const handleExportReview = async (review: Review) => {
    try {
      // Pull the full record so manager/HR answers are included when present.
      let full: any = null
      try {
        full = await apiService.getPerformanceReview(Number(review.id))
      } catch {
        full = null
      }
      const mr = full && typeof full.manager_review === "object" ? full.manager_review : full || {}
      const hr = full && typeof full.hr_review === "object" && full.hr_review ? full.hr_review : full || {}
      const sa = full?.self_assessment

      const val = (...keys: string[]) => {
        for (const k of keys) {
          const v = mr?.[k]
          if (v !== undefined && v !== null && String(v).trim() !== "") return String(v)
        }
        return ""
      }
      const hrVal = (...keys: string[]) => {
        for (const k of keys) {
          const v = hr?.[k]
          if (v !== undefined && v !== null && String(v).trim() !== "") return String(v)
        }
        return ""
      }
      const selfText =
        typeof sa === "string"
          ? sa
          : sa && typeof sa === "object"
            ? Object.entries(sa)
                .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "")
                .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
                .join("\n")
            : review.selfAssessment || ""

      await generatePerformanceReviewPdf(
        {
          employeeName: review.employeeName,
          employeeId: full?.employee?.employee_id || review.employeeId,
          department: review.department,
          period: review.reviewPeriod,
          reviewer: review.reviewer,
          status: review.status,
          rating: review.rating,
          sections: [
            {
              heading: "Employee self-assessment",
              entries: [["Self-assessment", selfText]],
            },
            {
              heading: "Line manager assessment",
              entries: [
                ["Assessment of reported performance", val("performance_assessment", "observations") || review.goals],
                ["Accuracy of self-rating", val("self_assessment_accuracy", "self_rating_accuracy")],
                ["Key strengths", val("strengths", "key_strengths") || review.achievements],
                ["Areas requiring improvement", val("areas_for_improvement") || review.areasForImprovement],
                ["Development actions", val("recommendations", "development_actions")],
                ["Manager rating", val("ratings", "overall_rating", "rating")],
                ["Manager comments", val("comments", "overall_comments") || review.comments],
              ],
            },
            {
              heading: "HR final review",
              entries: [
                ["HR assessment", hrVal("hr_assessment")],
                ["Review adequacy", hrVal("review_adequacy")],
                ["Development recommendations", hrVal("development_recommendations")],
                ["Final rating", hrVal("final_rating")],
                ["HR comments", hrVal("hr_comments") || review.hrComments || ""],
              ],
            },
            {
              heading: "Employee comments",
              entries: [["Comments", review.employeeComments || ""]],
            },
          ],
        },
        `${review.employeeName.replace(/\s+/g, "_")}_${review.reviewPeriod.replace(/\s+/g, "_")}_Performance_Review.pdf`,
      )

      toast({
        title: "Review downloaded",
        description: `Performance review for ${review.employeeName} saved as a PDF.`
      })
    } catch (e: any) {
      toast({
        title: "Export failed",
        description: "We couldn't build the PDF. Please try again.",
        variant: "destructive",
      })
    }
  }
  
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'text-yellow-500 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-muted-foreground">{rating}/5</span>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Performance Management</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {isGeneralEmployee 
              ? "View your performance reviews and add comments"
              : "Track and manage employee performance reviews"
            }
          </p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          {/* Self-assessment is only available once HR has requested one */}
          {selfAssessmentRequest && (
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
              onClick={() => {
                setSelfAssessmentPeriod(selfAssessmentRequest.reviewPeriod)
                setSelfAssessmentOpen(true)
              }}
            >
              <FileText className="mr-2 h-4 w-4" />
              <span className="text-sm md:text-base">Self-Assessment</span>
            </Button>
          )}
          
          {canCreateReviews && (
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              if (open && !newReview.reviewPeriod) {
                setNewReview({ ...newReview, reviewPeriod: currentPeriod })
              }
              setIsDialogOpen(open)
            }}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="text-sm md:text-base">New Review</span>
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
              <DialogHeader>
                <DialogTitle>Create Performance Review</DialogTitle>
                <DialogDescription>
                  Fill in the details for the performance review.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="employee">Employee *</Label>
                  <SearchableSelect
                    value={newReview.employeeId}
                    onValueChange={(value) => setNewReview({...newReview, employeeId: value})}
                    placeholder="Select employee"
                    searchPlaceholder="Search employees…"
                    options={filteredEmployees.map((employee) => ({
                      value: employee.id?.toString() || '',
                      label: `${employee.first_name} ${employee.last_name} - ${employee.department}`,
                      keywords: `${employee.employee_code || ''} ${employee.email || ''}`,
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="review-period">Review Period *</Label>
                  <Select
                    value={newReview.reviewPeriod}
                    onValueChange={(value) => setNewReview({ ...newReview, reviewPeriod: value })}
                  >
                    <SelectTrigger id="review-period">
                      <SelectValue placeholder="Select quarter" />
                    </SelectTrigger>
                    <SelectContent>
                      {periodOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <p className="text-xs text-muted-foreground">
                  The employee will be asked to complete a self-assessment.
                </p>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateNewReview} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Create Review
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search reviews by employee, department, period, or reviewer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Inline Select Filters (match Employee Records format) */}
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="w-44">
                <Select value={departmentFilter || 'all'} onValueChange={(v) => setDepartmentFilter(v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-40">
                <Select value={periodFilter || 'all'} onValueChange={(v) => setPeriodFilter(v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Periods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Periods</SelectItem>
                    {uniquePeriods.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-40">
                <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {uniqueStatuses.map((s) => (
                      <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>

        </CardContent>
      </Card>

      

      {/* Performance Reviews Table */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-lg md:text-xl">Performance Reviews</CardTitle>
          <CardDescription className="text-sm">
            {isGeneralEmployee 
              ? "Your performance evaluation history"
              : "Track and manage employee performance evaluations"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 md:p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs md:text-sm">Employee</TableHead>
                  <TableHead className="hidden md:table-cell text-xs md:text-sm">Department</TableHead>
                  <TableHead className="text-xs md:text-sm">Period</TableHead>
                  <TableHead className="hidden lg:table-cell text-xs md:text-sm">Reviewer</TableHead>
                  <TableHead className="hidden sm:table-cell text-xs md:text-sm">Rating</TableHead>
                  <TableHead className="text-xs md:text-sm">Status</TableHead>
                  <TableHead className="text-right text-xs md:text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell className="font-medium text-xs md:text-sm">
                      <div>
                        <div>{review.employeeName}</div>
                        <div className="md:hidden text-xs text-muted-foreground">{review.department}</div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs md:text-sm">{review.department}</TableCell>
                    <TableCell className="text-xs md:text-sm">{review.reviewPeriod}</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs md:text-sm text-muted-foreground">{review.reviewer}</TableCell>
                    <TableCell className="hidden sm:table-cell text-xs md:text-sm">{renderStars(review.rating)}</TableCell>
                    <TableCell className="text-xs md:text-sm">
                      <Badge className={
                        review.status === 'Signed Off' ? 'bg-success/10 text-success border-success/20 text-xs' :
                        review.status === 'Sent to HR Manager' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 text-xs' :
                        review.status === 'Reviewed by Line Manager' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 text-xs' :
                        'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 text-xs'
                      }>
                        {review.status}
                      </Badge>
                    </TableCell>
                     <TableCell className="text-right">
                      <div className="flex justify-end gap-1 md:gap-2 flex-wrap">
                        {/* View button - everyone can view */}
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate(`/performance/${review.id}`)} title="Open Review">
                          <Eye className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                        
                        {/* Employee actions - only the employee assigned to this review */}
                        {!isExecutiveOrHR && !isLineManager && review.employeeId === currentEmployeeIdFromUser && (
                          <>
                            {/* Sign-Off button - only after reviewed by both Line Manager and HR Manager */}
                            {review.managerReviewDate && review.hrApprovedDate && !review.employeeSignedDate && (
                              <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => handleEmployeeSignOff(review.id)} title="Sign Off Review">
                                <CheckCircle className="h-3 w-3 md:h-4 md:w-4 mr-1 text-green-600" />
                                <span className="text-xs hidden lg:inline">Sign Off</span>
                              </Button>
                            )}
                          </>
                        )}
                        
                        
                        {/* Export button */}
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hidden sm:inline-flex" onClick={() => handleExportReview(review)}>
                          <Download className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Review Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-[700px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Performance Review Details</DialogTitle>
          </DialogHeader>
          
          {selectedReview && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Employee</Label>
                  <p className="font-medium">{selectedReview.employeeName}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Department</Label>
                  <p className="font-medium">{selectedReview.department}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Review Period</Label>
                  <p className="font-medium">{selectedReview.reviewPeriod}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Review Date</Label>
                  <p className="font-medium">{selectedReview.reviewDate}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm text-muted-foreground">Rating</Label>
                {renderStars(selectedReview.rating)}
              </div>
              
              <div>
                <Label className="text-sm text-muted-foreground">KPIs</Label>
                <p className="mt-1">{selectedReview.goals}</p>
              </div>
              
              <div>
                <Label className="text-sm text-muted-foreground">Achievements</Label>
                <p className="mt-1">{selectedReview.achievements}</p>
              </div>
              
              <div>
                <Label className="text-sm text-muted-foreground">Areas for Improvement</Label>
                <p className="mt-1">{selectedReview.areasForImprovement}</p>
              </div>
              
              <div>
                <Label className="text-sm text-muted-foreground">Reviewer Comments</Label>
                <p className="mt-1">{selectedReview.comments}</p>
              </div>
              
              {selectedReview.employeeComments && (
                <div>
                  <Label className="text-sm text-muted-foreground">Employee Comments</Label>
                  <p className="mt-1 bg-muted p-3 rounded">{selectedReview.employeeComments}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Employee Comment Dialog */}
      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Add Your Comment</DialogTitle>
            <DialogDescription>
              Add your feedback or comments to this performance review
            </DialogDescription>
          </DialogHeader>
          
          {selectedReview && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Review Period</p>
                <p className="font-medium">{selectedReview.reviewPeriod}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="employee-comment">Your Comments</Label>
                <Textarea
                  id="employee-comment"
                  value={employeeComment}
                  onChange={(e) => setEmployeeComment(e.target.value)}
                  placeholder="Share your thoughts on this review..."
                  className="min-h-[150px]"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCommentDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleAddEmployeeComment} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Submit to HR Manager
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Self-Assessment moved inline above */}
      
      {/* Manager Review Dialog */}
      <Dialog open={manageReviewDialogOpen} onOpenChange={setManageReviewDialogOpen}>
        <DialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Manage Performance Review</DialogTitle>
            <DialogDescription>
              Add your evaluation and schedule a review meeting
            </DialogDescription>
          </DialogHeader>
          
          {selectedReview && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Employee</p>
                <p className="font-medium">{selectedReview.employeeName}</p>
                <p className="text-sm text-muted-foreground mt-2">Review Period</p>
                <p className="font-medium">{selectedReview.reviewPeriod}</p>
              </div>
              
              {selectedReview.selfAssessment && (
                <div className="space-y-2">
                  <Label>Employee Self-Assessment</Label>
                  <div className="bg-muted p-3 rounded">
                    <p className="text-sm">{selectedReview.selfAssessment}</p>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="manager-rating">Overall Rating (1-5)</Label>
                <Select value={managerRating} onValueChange={setManagerRating}>
                  <SelectTrigger id="manager-rating">
                    <SelectValue placeholder="Select a rating" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="1">1 - Needs significant improvement</SelectItem>
                    <SelectItem value="2">2 - Below expectations</SelectItem>
                    <SelectItem value="3">3 - Meets expectations</SelectItem>
                    <SelectItem value="4">4 - Exceeds expectations</SelectItem>
                    <SelectItem value="5">5 - Outstanding</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manager-notes">Observations</Label>
                <Textarea
                  id="manager-notes"
                  value={managerNotes}
                  onChange={(e) => setManagerNotes(e.target.value)}
                  placeholder="What you observed over the review period..."
                  className="min-h-[120px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manager-strengths">Strengths</Label>
                <Textarea
                  id="manager-strengths"
                  value={managerStrengths}
                  onChange={(e) => setManagerStrengths(e.target.value)}
                  placeholder="What this person does well..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manager-areas">Areas for Improvement</Label>
                <Textarea
                  id="manager-areas"
                  value={managerAreasForImprovement}
                  onChange={(e) => setManagerAreasForImprovement(e.target.value)}
                  placeholder="Where there is room to grow..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manager-recommendations">Recommendations</Label>
                <Textarea
                  id="manager-recommendations"
                  value={managerRecommendations}
                  onChange={(e) => setManagerRecommendations(e.target.value)}
                  placeholder="Training, support or next steps..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="meeting-date">Schedule Review Meeting</Label>
                <Input
                  id="meeting-date"
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setManageReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleManagerReview} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Save and Send to HR Manager
            </Button>
            <Button onClick={handleManagerReview} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Schedule Meeting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* HR Review Dialog */}
      <Dialog open={hrReviewDialogOpen} onOpenChange={setHrReviewDialogOpen}>
        <DialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>HR Review & Approval</DialogTitle>
            <DialogDescription>
              Review and approve the completed performance evaluation
            </DialogDescription>
          </DialogHeader>
          
          {selectedReview && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Employee</p>
                  <p className="font-medium">{selectedReview.employeeName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Review Period</p>
                  <p className="font-medium">{selectedReview.reviewPeriod}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rating</p>
                  {renderStars(selectedReview.rating)}
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-semibold">Status</Label>
                  <div className="flex gap-2 mt-1">
                    {selectedReview.employeeSignedDate && (
                      <Badge className="bg-success/10 text-success border-success/20">
                        Employee Signed ({selectedReview.employeeSignedDate})
                      </Badge>
                    )}
                    {selectedReview.managerSignedDate && (
                      <Badge className="bg-success/10 text-success border-success/20">
                        Manager Signed ({selectedReview.managerSignedDate})
                      </Badge>
                    )}
                  </div>
                </div>
                
                {selectedReview.comments && (
                  <div>
                    <Label className="text-sm font-semibold">Manager Comments</Label>
                    <p className="text-sm mt-1 bg-muted p-3 rounded">{selectedReview.comments}</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hr-comments">HR Comments (Optional)</Label>
                <Textarea
                  id="hr-comments"
                  value={hrComments}
                  onChange={(e) => setHrComments(e.target.value)}
                  placeholder="Add any HR notes or comments..."
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setHrReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleHRApproval} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Approve & File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Self-Assessment Form Dialog */}
      <Dialog open={selfAssessmentOpen} onOpenChange={setSelfAssessmentOpen}>
        <DialogContent className="max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Self-Assessment Form</DialogTitle>
            <DialogDescription>
              Complete your self-evaluation for this review period
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="sa-period">Review Period *</Label>
              <Input
                id="sa-period"
                placeholder="e.g., Q4 2025 or 2025-10"
                value={selfAssessmentPeriod}
                onChange={(e) => setSelfAssessmentPeriod(e.target.value)}
              />
            </div>
            {/* Section A: Job Performance */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Section A: Job Performance</h3>
              
              <div className="space-y-2">
                <Label htmlFor="mainResponsibilities">1. What are your main responsibilities in your current position? *</Label>
                <Textarea
                  id="mainResponsibilities"
                  value={selfAssessmentData.mainResponsibilities}
                  onChange={(e) => setSelfAssessmentData({...selfAssessmentData, mainResponsibilities: e.target.value})}
                  placeholder="Describe your main responsibilities..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="achievements">2. What achievements are you most proud of during this review period? *</Label>
                <Textarea
                  id="achievements"
                  value={selfAssessmentData.achievements}
                  onChange={(e) => setSelfAssessmentData({...selfAssessmentData, achievements: e.target.value})}
                  placeholder="Describe your key achievements..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="completedGoals">3. Which KPIs or tasks did you complete successfully?</Label>
                <Textarea
                  id="completedGoals"
                  value={selfAssessmentData.completedGoals}
                  onChange={(e) => setSelfAssessmentData({...selfAssessmentData, completedGoals: e.target.value})}
                  placeholder="List completed KPIs..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unachievedGoals">4. Were there any KPIs you did not achieve? If yes, please explain.</Label>
                <Textarea
                  id="unachievedGoals"
                  value={selfAssessmentData.unachievedGoals}
                  onChange={(e) => setSelfAssessmentData({...selfAssessmentData, unachievedGoals: e.target.value})}
                  placeholder="Explain any unachieved KPIs..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workQualityRating">5. How would you rate the quality and accuracy of your work?</Label>
                <Select 
                  value={selfAssessmentData.workQualityRating} 
                  onValueChange={(value) => setSelfAssessmentData({...selfAssessmentData, workQualityRating: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Poor</SelectItem>
                    <SelectItem value="2">2 - Fair</SelectItem>
                    <SelectItem value="3">3 - Good</SelectItem>
                    <SelectItem value="4">4 - Very Good</SelectItem>
                    <SelectItem value="5">5 - Excellent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Section B: Work Attitude & Behavior */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Section B: Work Attitude & Behavior</h3>
              
              <div className="space-y-2">
                <Label htmlFor="timeManagement">6. How do you manage your time and meet deadlines?</Label>
                <Textarea
                  id="timeManagement"
                  value={selfAssessmentData.timeManagement}
                  onChange={(e) => setSelfAssessmentData({...selfAssessmentData, timeManagement: e.target.value})}
                  placeholder="Describe your time management approach..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="teamCommunication">7. How well do you work and communicate with your team and supervisor?</Label>
                <Textarea
                  id="teamCommunication"
                  value={selfAssessmentData.teamCommunication}
                  onChange={(e) => setSelfAssessmentData({...selfAssessmentData, teamCommunication: e.target.value})}
                  placeholder="Describe your teamwork and communication..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedbackResponse">8. How do you respond to feedback or constructive criticism?</Label>
                <Textarea
                  id="feedbackResponse"
                  value={selfAssessmentData.feedbackResponse}
                  onChange={(e) => setSelfAssessmentData({...selfAssessmentData, feedbackResponse: e.target.value})}
                  placeholder="Describe how you handle feedback..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="professionalism">9. How do you demonstrate professionalism and a positive attitude at work?</Label>
                <Textarea
                  id="professionalism"
                  value={selfAssessmentData.professionalism}
                  onChange={(e) => setSelfAssessmentData({...selfAssessmentData, professionalism: e.target.value})}
                  placeholder="Describe your professionalism..."
                  className="min-h-[80px]"
                />
              </div>
            </div>

            {/* Section C: Development & Improvement */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Section C: Development & Improvement</h3>
              
              <div className="space-y-2">
                <Label htmlFor="challenges">10. What challenges affected your performance during this period?</Label>
                <Textarea
                  id="challenges"
                  value={selfAssessmentData.challenges}
                  onChange={(e) => setSelfAssessmentData({...selfAssessmentData, challenges: e.target.value})}
                  placeholder="Describe any challenges you faced..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resourcesNeeded">11. What resources or support do you need to do your job better?</Label>
                <Textarea
                  id="resourcesNeeded"
                  value={selfAssessmentData.resourcesNeeded}
                  onChange={(e) => setSelfAssessmentData({...selfAssessmentData, resourcesNeeded: e.target.value})}
                  placeholder="List resources or support needed..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="skillsToLearn">12. What new skills would you like to learn or improve on?</Label>
                <Textarea
                  id="skillsToLearn"
                  value={selfAssessmentData.skillsToLearn}
                  onChange={(e) => setSelfAssessmentData({...selfAssessmentData, skillsToLearn: e.target.value})}
                  placeholder="List skills you want to develop..."
                  className="min-h-[80px]"
                />
              </div>
            </div>

            {/* Section D: Future KPIs */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Section D: Future KPIs</h3>
              
              <div className="space-y-2">
                <Label htmlFor="futureGoals">13. What are your key KPIs for the next review period?</Label>
                <Textarea
                  id="futureGoals"
                  value={selfAssessmentData.futureGoals}
                  onChange={(e) => setSelfAssessmentData({...selfAssessmentData, futureGoals: e.target.value})}
                  placeholder="Describe your future KPIs..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="teamContribution">14. How do you plan to contribute to your team or department&apos;s success?</Label>
                <Textarea
                  id="teamContribution"
                  value={selfAssessmentData.teamContribution}
                  onChange={(e) => setSelfAssessmentData({...selfAssessmentData, teamContribution: e.target.value})}
                  placeholder="Describe your planned contributions..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="suggestions">15. Do you have any suggestions for improving workplace processes or communication?</Label>
                <Textarea
                  id="suggestions"
                  value={selfAssessmentData.suggestions}
                  onChange={(e) => setSelfAssessmentData({...selfAssessmentData, suggestions: e.target.value})}
                  placeholder="Share your suggestions..."
                  className="min-h-[80px]"
                />
              </div>
            </div>

            {/* Section E: Self-Rating */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Section E: Self-Rating</h3>
              
              <div className="space-y-2">
                <Label htmlFor="overallRating">16. How would you rate your overall performance on a scale of 1–5?</Label>
                <Select 
                  value={selfAssessmentData.overallRating} 
                  onValueChange={(value) => setSelfAssessmentData({...selfAssessmentData, overallRating: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Poor</SelectItem>
                    <SelectItem value="2">2 - Fair</SelectItem>
                    <SelectItem value="3">3 - Good</SelectItem>
                    <SelectItem value="4">4 - Very Good</SelectItem>
                    <SelectItem value="5">5 - Excellent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelfAssessmentOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitSelfAssessment} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Submit to Manager
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}// Performance page updated Wed Oct 29 19:10:53 EDT 2025
