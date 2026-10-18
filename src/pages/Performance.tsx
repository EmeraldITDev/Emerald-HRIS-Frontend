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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Star, Plus, Eye, Download, Calendar, CheckCircle, ClipboardCheck, FileText, Search, Filter, X, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DEPARTMENTS } from '@/constants/departments'
import { useToast } from "@/hooks/use-toast"
import { useAuth } from '@/contexts/AuthContext'
import { apiService, Employee, PerformanceReview } from '@/lib/api'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { generatePerformanceReviewPdf } from '@/utils/performanceReviewPdf'
import {
  EMPTY_SELF_ASSESSMENT,
  SELF_ASSESSMENT_FIELDS,
  SELF_ASSESSMENT_REQUIRED_KEYS,
  hydrateSelfAssessment,
  type SelfAssessmentDraft,
} from '@/lib/performanceFormSchema'

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
  const [manageReviewDialogOpen, setManageReviewDialogOpen] = useState(false)
  const [hrReviewDialogOpen, setHrReviewDialogOpen] = useState(false)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [reviewPendingDelete, setReviewPendingDelete] = useState<Review | null>(null)
  const [deletingReview, setDeletingReview] = useState(false)
  const [employeeComment, setEmployeeComment] = useState("")
  const [selfAssessmentPeriod, setSelfAssessmentPeriod] = useState("")
  const [selfAssessmentReviewId, setSelfAssessmentReviewId] = useState<number | null>(null)
  const [selfAssessmentSaving, setSelfAssessmentSaving] = useState(false)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [periodFilter, setPeriodFilter] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  
  const [selfAssessmentData, setSelfAssessmentData] = useState<SelfAssessmentDraft>({
    ...EMPTY_SELF_ASSESSMENT,
  })
  const [selfAssessmentObjectives, setSelfAssessmentObjectives] = useState<any[]>([])
  const [managerNotes, setManagerNotes] = useState("")
  const [managerRating, setManagerRating] = useState("3")
  const [managerStrengths, setManagerStrengths] = useState("")
  const [managerAreasForImprovement, setManagerAreasForImprovement] = useState("")
  const [managerRecommendations, setManagerRecommendations] = useState("")
  const [meetingDate, setMeetingDate] = useState("")
  const [hrComments, setHrComments] = useState("")
  const { toast } = useToast()
  const { user } = useAuth()
  
  const [dash, setDash] = useState<any>(null)
  const [dashCycleId, setDashCycleId] = useState<string>("")
  const isHrUser = user?.role === 'hr_manager' || user?.role === 'corporate_hr' || user?.role === 'executive'

  useEffect(() => {
    fetchEmployees()
    fetchReviews()
  }, [])

  useEffect(() => {
    const status = searchParams.get('status')
    if (status) setStatusFilter(statusLabel(status) === status ? statusLabel(status) : statusLabel(status))
    // Prefer raw status filter match via rawStatus below when using dashboard deep-links
    if (status) setStatusFilter(statusLabel(status))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => {
    if (!isHrUser) return
    void (async () => {
      try {
        const res = await apiService.getPerformanceDashboard(
          dashCycleId ? { cycle_id: Number(dashCycleId) } : undefined,
        )
        setDash(res?.data ?? res)
      } catch (e) {
        console.error('Failed to load performance dashboard', e)
      }
    })()
  }, [isHrUser, dashCycleId])
  
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
    hod_review: 'Awaiting HOD',
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
      setReviews(mapped as any)
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
  const canDeleteReviews = user?.role === 'hr_manager' || user?.role === 'corporate_hr'
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
    
    // Status filtering (label or raw backend status from dashboard deep-links)
    if (statusFilter) {
      const want = statusFilter.toLowerCase()
      const raw = String(review.rawStatus || '').toLowerCase()
      const label = String(review.status || '').toLowerCase()
      if (raw !== want && label !== want && label !== statusLabel(want).toLowerCase()) return false
    }
    
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
  
  // Performance reviews run twice a year (H1 = Jan–Jun, H2 = Jul–Dec).
  const currentPeriod = (() => {
    const now = new Date()
    const half = now.getMonth() < 6 ? 1 : 2
    return `H${half} ${now.getFullYear()}`
  })()

  // Half-year options: two halves back through three forward.
  const periodOptions = (() => {
    const now = new Date()
    let year = now.getFullYear()
    let half = now.getMonth() < 6 ? 1 : 2
    for (let i = 0; i < 2; i++) {
      half -= 1
      if (half < 1) {
        half = 2
        year -= 1
      }
    }
    const options: string[] = []
    for (let i = 0; i < 6; i++) {
      options.push(`H${half} ${year}`)
      half += 1
      if (half > 2) {
        half = 1
        year += 1
      }
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
  
  const handleDeleteReview = async () => {
    if (!reviewPendingDelete) return
    const target = reviewPendingDelete
    const reviewId = Number(target.id)
    if (!Number.isFinite(reviewId) || reviewId <= 0) {
      toast({
        title: "Could not delete review",
        description: "This row has an invalid review id. Refresh the page and try again.",
        variant: "destructive",
      })
      setReviewPendingDelete(null)
      await fetchReviews()
      return
    }
    setDeletingReview(true)
    try {
      await apiService.deletePerformanceReview(reviewId)
      setReviewPendingDelete(null)
      setReviews((prev) => prev.filter((r) => String(r.id) !== String(target.id)))
      await fetchReviews()
      toast({
        title: "Review deleted",
        description: `The ${target.reviewPeriod} review for ${target.employeeName} has been removed.`,
      })
    } catch (error: any) {
      const status = error?.status
      const alreadyGone =
        status === 404 ||
        error?.data?.error === "NOT_FOUND" ||
        /no query results|no longer exists|not found/i.test(String(error?.message || ""))
      if (alreadyGone) {
        setReviewPendingDelete(null)
        setReviews((prev) => prev.filter((r) => String(r.id) !== String(target.id)))
        await fetchReviews()
        toast({
          title: "Review already removed",
          description: "That review is no longer on the server. The list has been refreshed.",
        })
      } else {
        toast({
          title: "Could not delete review",
          description: error?.data?.message || error?.message || "Failed to delete this performance review.",
          variant: "destructive",
        })
      }
    } finally {
      setDeletingReview(false)
    }
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
  
  const openSelfAssessment = async (review: Review) => {
    // Batch 6: supported self-assessment path is the detail page (Batch 3 schema).
    navigate(`/performance/${review.id}`)
  }

  const handleSaveSelfAssessmentDraft = async () => {
    if (!selfAssessmentReviewId) {
      toast({
        title: "No review available",
        description: "HR must request a self-assessment before you can save a draft.",
        variant: "destructive",
      })
      return
    }
    setSelfAssessmentSaving(true)
    try {
      await apiService.submitSelfAssessment(selfAssessmentReviewId, {
        draft: true,
        self_assessment: selfAssessmentData,
      })
      await fetchReviews()
      toast({ title: "Draft saved", description: "You can return later to continue." })
    } catch (e: any) {
      toast({
        title: "Draft not saved",
        description: e?.message || "Please try again. Your changes may not be on the server.",
        variant: "destructive",
      })
    } finally {
      setSelfAssessmentSaving(false)
    }
  }

  const handleSubmitSelfAssessment = async () => {
    if (!selfAssessmentPeriod || !selfAssessmentReviewId) {
      toast({
        title: "Required fields missing",
        description: "A review period and an HR-requested review are required.",
        variant: "destructive",
      })
      return
    }

    const missing = SELF_ASSESSMENT_REQUIRED_KEYS.filter(
      (k) => !String(selfAssessmentData[k] || "").trim(),
    )
    if (missing.length) {
      toast({
        title: "Required fields missing",
        description: "Please complete every self-assessment question before submitting.",
        variant: "destructive",
      })
      return
    }

    setSelfAssessmentSaving(true)
    try {
      await apiService.submitSelfAssessment(selfAssessmentReviewId, {
        self_assessment: selfAssessmentData,
      })
      await fetchReviews()
      toast({ title: "Self-Assessment Submitted", description: "Sent to your manager." })
      setSelfAssessmentData({ ...EMPTY_SELF_ASSESSMENT })
      setSelfAssessmentPeriod("")
      setSelfAssessmentReviewId(null)
      setSelfAssessmentOpen(false)
    } catch (e: any) {
      toast({
        title: "Submit failed",
        description: e?.message || "Please complete required fields and try again.",
        variant: "destructive",
      })
    } finally {
      setSelfAssessmentSaving(false)
    }
  }

  useEffect(() => {
    if (!searchParams.get('selfAssessment')) return
    if (selfAssessmentRequest) {
      void openSelfAssessment(selfAssessmentRequest)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, selfAssessmentRequest?.id])

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
          {canCreateReviews && (
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => navigate("/performance/cycles")}
              data-testid="open-cycle-admin"
            >
              <span className="text-sm md:text-base">Review cycles</span>
            </Button>
          )}
          {/* Self-assessment is only available once HR has requested one */}
          {selfAssessmentRequest && (
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
              onClick={() => openSelfAssessment(selfAssessmentRequest)}
              data-testid="open-self-assessment"
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
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto" data-testid="new-review-legacy">
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
                      keywords: `${employee.employee_code || ''} ${employee.staff_id || employee.staffId || ''} ${employee.email || ''}`,
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
                      <SelectValue placeholder="Select half-year period" />
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

      {isHrUser && (
        <Card data-testid="performance-hr-dashboard">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">HR performance dashboard</CardTitle>
                <CardDescription>
                  Counts derived from live review status{dash?.as_of ? ` · as of ${dash.as_of}` : ""}
                </CardDescription>
              </div>
              <Select value={dashCycleId || "all"} onValueChange={(v) => setDashCycleId(v === "all" ? "" : v)}>
                <SelectTrigger className="w-56" data-testid="dashboard-cycle-filter">
                  <SelectValue placeholder="All cycles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All cycles</SelectItem>
                  {(dash?.cycles || []).map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name || c.period_label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="dashboard-counts">
              {[
                ["due", "Due soon / overdue"],
                ["in_progress", "In progress"],
                ["submitted", "Awaiting manager"],
                ["overdue", "Overdue"],
                ["awaiting_hod", "Awaiting HOD"],
                ["awaiting_hr_quality", "Awaiting HR"],
                ["returned_or_reopened", "Returned / reopened"],
                ["finalised", "Finalised"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className="rounded-md border p-3 text-left hover:bg-muted/40"
                  data-testid={`dash-count-${key}`}
                  onClick={() => {
                    const map: Record<string, string> = {
                      submitted: "self_assessment_submitted",
                      awaiting_hod: "hod_review",
                      awaiting_hr_quality: "hr_review",
                      finalised: "completed",
                      in_progress: "self_assessment_requested",
                    }
                    if (map[key]) setStatusFilter(statusLabel(map[key]))
                  }}
                >
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-2xl font-semibold">{dash?.counts?.[key] ?? "—"}</p>
                </button>
              ))}
            </div>
            {(dash?.development_actions || []).length > 0 && (
              <p className="text-xs text-muted-foreground mt-3" data-testid="dashboard-dev-actions">
                Development actions tracked: {dash.development_actions.length}
                {" · "}
                Overdue: {dash.development_actions.filter((d: any) => d.overdue).length}
              </p>
            )}
          </CardContent>
        </Card>
      )}

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

                        {canDeleteReviews && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => setReviewPendingDelete(review)}
                            title="Delete review"
                          >
                            <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                          </Button>
                        )}
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

      {/* Self-Assessment Form Dialog — Guide §5 */}
      <Dialog open={selfAssessmentOpen} onOpenChange={setSelfAssessmentOpen}>
        <DialogContent className="max-w-[800px] max-h-[90vh] overflow-y-auto" data-testid="self-assessment-dialog">
          <DialogHeader>
            <DialogTitle>Employee self-assessment</DialogTitle>
            <DialogDescription>
              Answer each question for this review period. You can save a draft and return later.
              Structured objectives administration arrives in a later batch — summarise results against
              agreed objectives in the narrative fields for now.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="sa-period">Review Period</Label>
              <Input
                id="sa-period"
                value={selfAssessmentPeriod}
                readOnly
                className="bg-muted"
              />
            </div>

            {selfAssessmentObjectives.length > 0 && (
              <div className="space-y-2 rounded-md border p-3" data-testid="self-objectives-list">
                <p className="text-sm font-medium">Agreed / proposed objectives for this review</p>
                <p className="text-xs text-muted-foreground">
                  Refer to these when answering results against objectives. Structured objective
                  rows are maintained on the review detail page.
                </p>
                <ul className="text-sm space-y-2">
                  {selfAssessmentObjectives.map((o: any) => (
                    <li key={o.id}>
                      <span className="font-medium">{o.title}</span>
                      {o.target ? ` — target: ${o.target}` : ""}
                      {o.is_agreed ? " (agreed)" : " (proposed)"}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {SELF_ASSESSMENT_FIELDS.map((field, index) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>
                  {index + 1}. {field.label}
                </Label>
                <Textarea
                  id={field.key}
                  data-testid={`self-${field.key}`}
                  value={selfAssessmentData[field.key] || ""}
                  onChange={(e) =>
                    setSelfAssessmentData({
                      ...selfAssessmentData,
                      [field.key]: e.target.value,
                    })
                  }
                  className="min-h-[80px]"
                />
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSelfAssessmentOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              disabled={selfAssessmentSaving}
              onClick={handleSaveSelfAssessmentDraft}
              data-testid="save-self-draft"
            >
              Save draft
            </Button>
            <Button
              onClick={handleSubmitSelfAssessment}
              disabled={selfAssessmentSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              data-testid="submit-self-assessment"
            >
              Submit to Manager
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!reviewPendingDelete}
        onOpenChange={(open) => {
          if (!open && !deletingReview) setReviewPendingDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this performance review?</AlertDialogTitle>
            <AlertDialogDescription>
              {reviewPendingDelete
                ? `This permanently removes the ${reviewPendingDelete.reviewPeriod} review for ${reviewPendingDelete.employeeName}, including assessments and related history. This cannot be undone.`
                : "This permanently removes the review and related history."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingReview}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deletingReview}
              onClick={(e) => {
                e.preventDefault()
                void handleDeleteReview()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingReview ? "Deleting…" : "Delete review"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
