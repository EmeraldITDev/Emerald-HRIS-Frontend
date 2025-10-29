import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Star, Plus, Eye, Download, MessageSquare, Calendar, CheckCircle, ClipboardCheck, FileText, Search, Filter, X } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DEPARTMENTS } from '@/constants/departments'
import { useToast } from "@/hooks/use-toast"
import { useAuth } from '@/contexts/AuthContext'
import { apiService, Employee, PerformanceReview } from '@/lib/api'

interface Review {
  id: string
  employeeId: string
  employeeName: string
  department: string
  reviewPeriod: string
  reviewDate: string
  rating: number
  status: string
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
  const [reviews, setReviews] = useState<Review[]>([
    // HR Manager - Austin Nwachwukwu
    {
      id: '1',
      employeeId: 'austin.nwachwukwu@emeraldcfze.com',
      employeeName: 'Austin Nwachwukwu',
      department: 'Human Resources',
      reviewPeriod: 'Q4 2024',
      reviewDate: '2024-12-15',
      rating: 5,
      status: 'Signed Off',
      reviewer: 'Bunmi Babajide (Executive)',
      goals: 'Improve HR processes, enhance employee engagement',
      achievements: 'Successfully implemented new HRIS system, increased employee satisfaction by 40%',
      areasForImprovement: 'Strategic workforce planning',
      comments: 'Austin has shown exceptional leadership in HR transformation initiatives.',
      selfAssessment: 'I led the successful implementation of our new HRIS system and significantly improved employee engagement through various initiatives.',
      selfAssessmentDate: '2024-12-01',
      managerReviewDate: '2024-12-10',
      employeeSignedDate: '2024-12-15',
      managerSignedDate: '2024-12-15'
    },
    // Corporate HR - Oluwapelumi Adeyefa
    {
      id: '2',
      employeeId: 'oluwapelumi.adeyefa@emeraldcfze.com',
      employeeName: 'Oluwapelumi Adeyefa',
      department: 'Human Resources',
      reviewPeriod: 'Q4 2024',
      reviewDate: '2024-12-14',
      rating: 4,
      status: 'Reviewed by Line Manager',
      reviewer: 'Austin Nwachwukwu (HR Manager)',
      goals: 'Streamline recruitment process, improve onboarding experience',
      achievements: 'Reduced time-to-hire by 30%, implemented comprehensive onboarding program',
      areasForImprovement: 'Data analytics and reporting skills',
      comments: 'Oluwapelumi has made significant improvements to our recruitment and onboarding processes.',
      selfAssessment: 'I successfully reduced our time-to-hire by 30% and created a comprehensive onboarding program that has received excellent feedback.',
      selfAssessmentDate: '2024-12-05',
      managerReviewDate: '2024-12-14'
    },
    // Line Manager - Henry Marcus (Technical Operations)
    {
      id: '3',
      employeeId: 'henry.marcus@emeraldcfze.com',
      employeeName: 'Henry Marcus',
      department: 'Technical Operations',
      reviewPeriod: 'Q4 2024',
      reviewDate: '2024-12-15',
      rating: 4,
      status: 'Signed Off',
      reviewer: 'Bunmi Babajide (Executive)',
      goals: 'Lead team effectively, complete infrastructure upgrades',
      achievements: 'Successfully managed technical team, completed cloud migration ahead of schedule',
      areasForImprovement: 'Strategic planning and cross-department collaboration',
      comments: 'Henry has demonstrated excellent leadership. His team consistently delivers high-quality work.',
      selfAssessment: 'I successfully led our Technical Operations team through major infrastructure upgrades and completed the cloud migration ahead of schedule.',
      selfAssessmentDate: '2024-12-01',
      managerReviewDate: '2024-12-10',
      employeeSignedDate: '2024-12-15',
      managerSignedDate: '2024-12-15'
    },
    // Employee - Chidi Okonkwo (Technical Operations)
    {
      id: '4',
      employeeId: 'chidi.okonkwo@emeraldcfze.com',
      employeeName: 'Chidi Okonkwo',
      department: 'Technical Operations',
      reviewPeriod: 'Q4 2024',
      reviewDate: '2024-12-14',
      rating: 4,
      status: 'Reviewed by Line Manager',
      reviewer: 'Henry Marcus (Line Manager - Technical Operations)',
      goals: 'Enhance system reliability, implement monitoring solutions',
      achievements: 'Improved system uptime to 99.8%, deployed comprehensive monitoring dashboard',
      areasForImprovement: 'Cross-team collaboration and documentation',
      comments: 'Chidi has made excellent progress in improving our technical operations.',
      selfAssessment: 'I successfully improved system uptime to 99.8% and deployed a monitoring dashboard that reduced incident response time by 40%.',
      selfAssessmentDate: '2024-12-05',
      managerReviewDate: '2024-12-14'
    },
    // Line Manager - Aisha Bello (Business Development)
    {
      id: '5',
      employeeId: 'aisha.bello@emeraldcfze.com',
      employeeName: 'Aisha Bello',
      department: 'Business Development',
      reviewPeriod: 'Q4 2024',
      reviewDate: '2024-12-16',
      rating: 5,
      status: 'Signed Off',
      reviewer: 'LAA (Executive)',
      goals: 'Expand client portfolio, lead business development initiatives',
      achievements: 'Secured 10 new major clients, increased revenue by 35%',
      areasForImprovement: 'Team delegation and mentoring',
      comments: 'Aisha has exceeded expectations in driving business growth and client acquisition.',
      selfAssessment: 'I successfully secured 10 new major clients and increased our revenue by 35% through strategic business development initiatives.',
      selfAssessmentDate: '2024-12-02',
      managerReviewDate: '2024-12-12',
      employeeSignedDate: '2024-12-16',
      managerSignedDate: '2024-12-16'
    },
    // Employee - Kunle Adeyemi (Business Development)
    {
      id: '6',
      employeeId: 'kunle.adeyemi@emeraldcfze.com',
      employeeName: 'Kunle Adeyemi',
      department: 'Business Development',
      reviewPeriod: 'Q4 2024',
      reviewDate: '2024-12-13',
      rating: 4,
      status: 'Sent to Line Manager',
      reviewer: 'Aisha Bello (Line Manager - Business Development)',
      goals: 'Build client relationships, support proposal development',
      achievements: 'Maintained excellent client relationships, contributed to 5 successful proposals',
      areasForImprovement: 'Independent client acquisition, presentation skills',
      comments: 'Kunle shows great potential in client relationship management.',
      selfAssessment: 'I maintained strong relationships with our key clients and contributed to 5 successful business proposals this quarter.',
      selfAssessmentDate: '2024-12-08'
    },
    // Line Manager - Temitope Lawal (Finance)
    {
      id: '7',
      employeeId: 'temitope.lawal@emeraldcfze.com',
      employeeName: 'Temitope Lawal',
      department: 'Finance',
      reviewPeriod: 'Q4 2024',
      reviewDate: '2024-12-17',
      rating: 5,
      status: 'Signed Off',
      reviewer: 'Bunmi Babajide (Executive)',
      goals: 'Optimize financial operations, ensure regulatory compliance',
      achievements: 'Reduced financial close time by 40%, achieved 100% audit compliance',
      areasForImprovement: 'Long-term financial forecasting',
      comments: 'Temitope has demonstrated exceptional financial leadership and process optimization.',
      selfAssessment: 'I successfully reduced our financial close time by 40% and maintained 100% compliance in our annual audit.',
      selfAssessmentDate: '2024-12-03',
      managerReviewDate: '2024-12-13',
      employeeSignedDate: '2024-12-17',
      managerSignedDate: '2024-12-17'
    },
    // Employee - Rachael Daniel (Finance)
    {
      id: '8',
      employeeId: 'rachael.daniel@emeraldcfze.com',
      employeeName: 'Rachael Daniel',
      department: 'Finance',
      reviewPeriod: 'Q4 2024',
      reviewDate: '2024-12-12',
      rating: 4,
      status: 'Reviewed by Line Manager',
      reviewer: 'Temitope Lawal (Line Manager - Finance)',
      goals: 'Process invoices accurately, support month-end closing',
      achievements: 'Achieved 99% accuracy in invoice processing, supported timely month-end close',
      areasForImprovement: 'Financial analysis skills',
      comments: 'Rachael consistently delivers accurate and timely financial processing.',
      selfAssessment: 'I maintained 99% accuracy in invoice processing and consistently supported our month-end closing processes.',
      selfAssessmentDate: '2024-12-06',
      managerReviewDate: '2024-12-12'
    },
    // Employee - Adeniyi Bamigbade (Finance)
    {
      id: '9',
      employeeId: 'adeniyi.bamigbade@emeraldcfze.com',
      employeeName: 'Adeniyi Bamigbade',
      department: 'Finance',
      reviewPeriod: 'Q4 2024',
      reviewDate: '2024-12-11',
      rating: 3,
      status: 'Sent to Line Manager',
      reviewer: 'Temitope Lawal (Line Manager - Finance)',
      goals: 'Improve reconciliation accuracy, learn new financial systems',
      achievements: 'Completed training on new ERP system, maintained consistent work quality',
      areasForImprovement: 'Speed and efficiency, attention to detail',
      comments: 'Adeniyi is developing his skills well but needs to focus on improving speed and accuracy.',
      selfAssessment: 'I completed comprehensive training on our new ERP system and maintained consistent work quality throughout the quarter.',
      selfAssessmentDate: '2024-12-07'
    },
    // Line Manager - Ibrahim Suleiman (IT)
    {
      id: '10',
      employeeId: 'it@emeraldcfze.com',
      employeeName: 'Ibrahim Suleiman',
      department: 'IT',
      reviewPeriod: 'Q4 2024',
      reviewDate: '2024-12-18',
      rating: 5,
      status: 'Signed Off',
      reviewer: 'LAA (Executive)',
      goals: 'Lead IT infrastructure modernization, improve security posture',
      achievements: 'Successfully migrated to cloud infrastructure, implemented zero-trust security model',
      areasForImprovement: 'Budget management and vendor negotiations',
      comments: 'Ibrahim has led exceptional IT transformation initiatives with measurable results.',
      selfAssessment: 'I successfully led our cloud migration and implemented a zero-trust security model, significantly improving our security posture.',
      selfAssessmentDate: '2024-12-04',
      managerReviewDate: '2024-12-14',
      employeeSignedDate: '2024-12-18',
      managerSignedDate: '2024-12-18'
    },
    // Employee - Chioma Nwosu (IT)
    {
      id: '11',
      employeeId: 'chioma.nwosu@emeraldcfze.com',
      employeeName: 'Chioma Nwosu',
      department: 'IT',
      reviewPeriod: 'Q4 2024',
      reviewDate: '2024-12-13',
      rating: 5,
      status: 'Reviewed by Line Manager',
      reviewer: 'Ibrahim Suleiman (Line Manager - IT)',
      goals: 'Support infrastructure projects, enhance technical skills',
      achievements: 'Obtained cloud certifications, automated 15+ manual processes',
      areasForImprovement: 'Documentation and knowledge sharing',
      comments: 'Chioma demonstrates exceptional technical aptitude and consistently delivers excellent results.',
      selfAssessment: 'I obtained AWS and Azure certifications and automated over 15 manual processes, significantly improving team efficiency.',
      selfAssessmentDate: '2024-12-08',
      managerReviewDate: '2024-12-13'
    },
    // Line Manager - Folake Williams (Operations)
    {
      id: '12',
      employeeId: 'folake.williams@emeraldcfze.com',
      employeeName: 'Folake Williams',
      department: 'Operations',
      reviewPeriod: 'Q4 2024',
      reviewDate: '2024-12-19',
      rating: 4,
      status: 'Signed Off',
      reviewer: 'Bunmi Babajide (Executive)',
      goals: 'Streamline operational processes, improve team productivity',
      achievements: 'Reduced operational costs by 25%, improved process efficiency by 35%',
      areasForImprovement: 'Change management and communication',
      comments: 'Folake has successfully optimized operations and delivered significant cost savings.',
      selfAssessment: 'I successfully reduced operational costs by 25% through process optimization and improved overall team productivity by 35%.',
      selfAssessmentDate: '2024-12-05',
      managerReviewDate: '2024-12-15',
      employeeSignedDate: '2024-12-19',
      managerSignedDate: '2024-12-19'
    },
    // Employee - Yusuf Mohammed (Operations)
    {
      id: '13',
      employeeId: 'yusuf.mohammed@emeraldcfze.com',
      employeeName: 'Yusuf Mohammed',
      department: 'Operations',
      reviewPeriod: 'Q4 2024',
      reviewDate: '2024-12-12',
      rating: 3,
      status: 'Sent to Line Manager',
      reviewer: 'Folake Williams (Line Manager - Operations)',
      goals: 'Improve process efficiency, reduce operational errors',
      achievements: 'Reduced processing errors by 15%, consistently met deadlines',
      areasForImprovement: 'Proactive problem-solving, initiative',
      comments: 'Yusuf meets expectations but should focus on taking more initiative.',
      selfAssessment: 'I reduced processing errors by 15% and maintained consistent performance in meeting all operational deadlines.',
      selfAssessmentDate: '2024-12-09'
    },
    // Line Manager - Ngozi Eze (Marketing)
    {
      id: '14',
      employeeId: 'ngozi.eze@emeraldcfze.com',
      employeeName: 'Ngozi Eze',
      department: 'Marketing',
      reviewPeriod: 'Q4 2024',
      reviewDate: '2024-12-20',
      rating: 5,
      status: 'Signed Off',
      reviewer: 'LAA (Executive)',
      goals: 'Increase brand visibility, lead successful campaigns',
      achievements: 'Increased social media engagement by 60%, launched 4 successful campaigns',
      areasForImprovement: 'Budget optimization and ROI measurement',
      comments: 'Ngozi has delivered outstanding marketing results and significantly increased brand visibility.',
      selfAssessment: 'I successfully increased our social media engagement by 60% and launched 4 highly successful marketing campaigns.',
      selfAssessmentDate: '2024-12-06',
      managerReviewDate: '2024-12-16',
      employeeSignedDate: '2024-12-20',
      managerSignedDate: '2024-12-20'
    },
    // Employee - Segun Oladipo (Marketing)
    {
      id: '15',
      employeeId: 'segun.oladipo@emeraldcfze.com',
      employeeName: 'Segun Oladipo',
      department: 'Marketing',
      reviewPeriod: 'Q4 2024',
      reviewDate: '2024-12-11',
      rating: 4,
      status: 'Reviewed by Line Manager',
      reviewer: 'Ngozi Eze (Line Manager - Marketing)',
      goals: 'Create engaging content, support campaign execution',
      achievements: 'Created 50+ high-quality content pieces, supported all major campaigns',
      areasForImprovement: 'Strategic thinking and campaign planning',
      comments: 'Segun produces excellent content and provides valuable support to marketing initiatives.',
      selfAssessment: 'I created over 50 high-quality content pieces and provided essential support to all our major marketing campaigns.',
      selfAssessmentDate: '2024-12-07',
      managerReviewDate: '2024-12-11'
    },
    // Line Manager - Amina Yusuf (Sales)
    {
      id: '16',
      employeeId: 'amina.yusuf@emeraldcfze.com',
      employeeName: 'Amina Yusuf',
      department: 'Sales',
      reviewPeriod: 'Q4 2024',
      reviewDate: '2024-12-21',
      rating: 5,
      status: 'Signed Off',
      reviewer: 'Bunmi Babajide (Executive)',
      goals: 'Drive sales growth, expand client base',
      achievements: 'Exceeded sales targets by 40%, acquired 20 new major clients',
      areasForImprovement: 'Team coaching and development',
      comments: 'Amina has delivered exceptional sales results and significantly expanded our client base.',
      selfAssessment: 'I exceeded sales targets by 40% and successfully acquired 20 new major clients through strategic relationship building.',
      selfAssessmentDate: '2024-12-07',
      managerReviewDate: '2024-12-17',
      employeeSignedDate: '2024-12-21',
      managerSignedDate: '2024-12-21'
    },
    // Employee - Tunde Akinola (Sales)
    {
      id: '17',
      employeeId: 'tunde.akinola@emeraldcfze.com',
      employeeName: 'Tunde Akinola',
      department: 'Sales',
      reviewPeriod: 'Q4 2024',
      reviewDate: '2024-12-10',
      rating: 4,
      status: 'Sent to Line Manager',
      reviewer: 'Amina Yusuf (Line Manager - Sales)',
      goals: 'Meet sales quotas, develop client relationships',
      achievements: 'Achieved 110% of sales quota, maintained 95% client retention',
      areasForImprovement: 'Cold calling and new business development',
      comments: 'Tunde consistently meets targets and maintains excellent client relationships.',
      selfAssessment: 'I achieved 110% of my sales quota and maintained a 95% client retention rate through excellent relationship management.',
      selfAssessmentDate: '2024-12-06'
    },
    // Line Manager - Blessing Okoro (Customer Service)
    {
      id: '18',
      employeeId: 'blessing.okoro@emeraldcfze.com',
      employeeName: 'Blessing Okoro',
      department: 'Customer Service',
      reviewPeriod: 'Q4 2024',
      reviewDate: '2024-12-22',
      rating: 5,
      status: 'Signed Off',
      reviewer: 'LAA (Executive)',
      goals: 'Improve customer satisfaction, reduce response times',
      achievements: 'Increased customer satisfaction to 95%, reduced response time by 50%',
      areasForImprovement: 'Escalation management and conflict resolution',
      comments: 'Blessing has significantly improved our customer service metrics and team performance.',
      selfAssessment: 'I successfully increased customer satisfaction to 95% and reduced average response time by 50% through process improvements.',
      selfAssessmentDate: '2024-12-08',
      managerReviewDate: '2024-12-18',
      employeeSignedDate: '2024-12-22',
      managerSignedDate: '2024-12-22'
    },
    // Employee - Daniel Agu (Customer Service)
    {
      id: '19',
      employeeId: 'daniel.agu@emeraldcfze.com',
      employeeName: 'Daniel Agu',
      department: 'Customer Service',
      reviewPeriod: 'Q4 2024',
      reviewDate: '2024-12-09',
      rating: 4,
      status: 'Reviewed by Line Manager',
      reviewer: 'Blessing Okoro (Line Manager - Customer Service)',
      goals: 'Handle customer inquiries efficiently, maintain high satisfaction',
      achievements: 'Maintained 98% customer satisfaction rate, resolved 500+ tickets',
      areasForImprovement: 'Technical knowledge and complex issue resolution',
      comments: 'Daniel provides excellent customer service and maintains high satisfaction rates.',
      selfAssessment: 'I maintained a 98% customer satisfaction rate and successfully resolved over 500 customer tickets this quarter.',
      selfAssessmentDate: '2024-12-05',
      managerReviewDate: '2024-12-09'
    },
    // Line Manager - Fatima Abdullahi (Procurement)
    {
      id: '20',
      employeeId: 'fatima.abdullahi@emeraldcfze.com',
      employeeName: 'Fatima Abdullahi',
      department: 'Procurement',
      reviewPeriod: 'Q4 2024',
      reviewDate: '2024-12-23',
      rating: 4,
      status: 'Signed Off',
      reviewer: 'Bunmi Babajide (Executive)',
      goals: 'Optimize procurement costs, strengthen vendor relationships',
      achievements: 'Reduced procurement costs by 20%, negotiated better vendor contracts',
      areasForImprovement: 'Risk management and supply chain diversification',
      comments: 'Fatima has delivered excellent cost savings and improved our vendor relationships.',
      selfAssessment: 'I successfully reduced procurement costs by 20% through strategic negotiations and strengthened our vendor partnerships.',
      selfAssessmentDate: '2024-12-09',
      managerReviewDate: '2024-12-19',
      employeeSignedDate: '2024-12-23',
      managerSignedDate: '2024-12-23'
    },
    // Employee - Emeka Okeke (Procurement)
    {
      id: '21',
      employeeId: 'emeka.okeke@emeraldcfze.com',
      employeeName: 'Emeka Okeke',
      department: 'Procurement',
      reviewPeriod: 'Q4 2024',
      reviewDate: '2024-12-08',
      rating: 3,
      status: 'Sent to Line Manager',
      reviewer: 'Fatima Abdullahi (Line Manager - Procurement)',
      goals: 'Process purchase orders accurately, support vendor management',
      achievements: 'Processed 300+ purchase orders accurately, maintained vendor database',
      areasForImprovement: 'Negotiation skills and strategic sourcing',
      comments: 'Emeka performs routine tasks well but needs to develop more advanced procurement skills.',
      selfAssessment: 'I accurately processed over 300 purchase orders and maintained our comprehensive vendor database throughout the quarter.',
      selfAssessmentDate: '2024-12-04'
    }
  ])
  
  const [newReview, setNewReview] = useState({
    employeeId: '',
    reviewPeriod: '',
    rating: 0,
    goals: '',
    achievements: '',
    areasForImprovement: '',
    comments: ''
  })
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [commentDialogOpen, setCommentDialogOpen] = useState(false)
  const [selfAssessmentOpen, setSelfAssessmentOpen] = useState(false)
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
        status: r.status.replaceAll('_',' '),
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
  
  // Determine user's access level
  const isExecutiveOrHR = user?.role === 'executive' || user?.role === 'hr_manager' || user?.role === 'corporate_hr'
  const isLineManager = user?.role === 'line_manager'
  // All employee-level roles (not executive, HR, or line manager)
  const isGeneralEmployee = !isExecutiveOrHR && !isLineManager
  const canManageReviews = isExecutiveOrHR || isLineManager
  const userDepartment = user?.department

  // Get current employee email for filtering
  const currentEmployeeEmail = user?.email
  const currentEmployeeId = user?.employee_id

  // Filter reviews based on role, department, and search criteria
  const filteredReviews = reviews.filter(review => {
    // Role-based filtering
    let passesRoleFilter = false
    if (isGeneralEmployee) {
      passesRoleFilter = review.employeeId === currentEmployeeEmail || review.employeeId === String(currentEmployeeId ?? '')
    } else if (isLineManager && userDepartment) {
      passesRoleFilter = review.department === userDepartment
    } else {
      // Executives and HR can see all reviews
      passesRoleFilter = true
    }
    
    if (!passesRoleFilter) return false
    
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
  
  const handleCreateNewReview = () => {
    if (!newReview.employeeId || !newReview.reviewPeriod || !newReview.rating) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    const employee = employees.find(emp => emp.id?.toString() === newReview.employeeId)
    if (!employee) return

    const review: Review = {
      id: (reviews.length + 1).toString(),
      employeeId: newReview.employeeId,
      employeeName: `${employee.first_name} ${employee.last_name}`,
      department: employee.department || 'N/A',
      reviewPeriod: newReview.reviewPeriod,
      reviewDate: new Date().toISOString().split('T')[0],
      rating: newReview.rating,
      status: 'Completed',
      reviewer: user?.firstName + " " + user?.lastName || 'System',
      goals: newReview.goals,
      achievements: newReview.achievements,
      areasForImprovement: newReview.areasForImprovement,
      comments: newReview.comments
    }

    setReviews([review, ...reviews])
    setNewReview({
      employeeId: '',
      reviewPeriod: '',
      rating: 0,
      goals: '',
      achievements: '',
      areasForImprovement: '',
      comments: ''
    })
    setIsDialogOpen(false)
    
    toast({
      title: "Review created",
      description: `Performance review for ${employee.first_name} ${employee.last_name} has been created.`
    })
  }
  
  const handleAddEmployeeComment = () => {
    if (!selectedReview || !employeeComment.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter your comment.",
        variant: "destructive"
      })
      return
    }
    
    const updatedReviews = reviews.map(review => 
      review.id === selectedReview.id 
        ? { ...review, employeeComments: employeeComment }
        : review
    )
    
    setReviews(updatedReviews)
    setEmployeeComment("")
    setCommentDialogOpen(false)
    
    toast({
      title: "Comment added",
      description: "Your comment has been added to the review."
    })
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
      await apiService.managerReview(Number(selectedReview.id), { comments: managerNotes })
      await apiService.schedulePerformanceMeeting(Number(selectedReview.id), new Date(meetingDate).toISOString())
      await fetchReviews()
      setManagerNotes("")
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
      await apiService.approvePerformance(Number(selectedReview.id))
      await fetchReviews()
      setHrComments("")
      setHrReviewDialogOpen(false)
      toast({ title: "Review approved", description: "Employee can now sign off." })
    } catch (e) {
      toast({ title: "Approval failed", description: "Please try again.", variant: 'destructive' })
    }
  }
  
  const handleExportReview = (review: Review) => {
    toast({
      title: "Review exported",
      description: `Performance review for ${review.employeeName} has been exported.`
    })
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
          {/* Self-Assessment button for employees */}
          {!isExecutiveOrHR && (
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
              onClick={() => setSelfAssessmentOpen(true)}
            >
              <FileText className="mr-2 h-4 w-4" />
              <span className="text-sm md:text-base">Self-Assessment</span>
            </Button>
          )}
          
          {canManageReviews && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                  <Select onValueChange={(value) => setNewReview({...newReview, employeeId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredEmployees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id?.toString() || ''}>
                          {employee.first_name} {employee.last_name} - {employee.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reviewPeriod">Review Period *</Label>
                  <Input
                    id="reviewPeriod"
                    placeholder="e.g., Q4 2024"
                    value={newReview.reviewPeriod}
                    onChange={(e) => setNewReview({...newReview, reviewPeriod: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="rating">Overall Rating (1-5) *</Label>
                  <Select onValueChange={(value) => setNewReview({...newReview, rating: parseInt(value)})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Needs Improvement</SelectItem>
                      <SelectItem value="2">2 - Below Expectations</SelectItem>
                      <SelectItem value="3">3 - Meets Expectations</SelectItem>
                      <SelectItem value="4">4 - Exceeds Expectations</SelectItem>
                      <SelectItem value="5">5 - Outstanding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="goals">Goals</Label>
                  <Textarea
                    id="goals"
                    placeholder="List the employee's goals for this period"
                    value={newReview.goals}
                    onChange={(e) => setNewReview({...newReview, goals: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="achievements">Achievements</Label>
                  <Textarea
                    id="achievements"
                    placeholder="Describe key achievements"
                    value={newReview.achievements}
                    onChange={(e) => setNewReview({...newReview, achievements: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="areasForImprovement">Areas for Improvement</Label>
                  <Textarea
                    id="areasForImprovement"
                    placeholder="Identify areas needing development"
                    value={newReview.areasForImprovement}
                    onChange={(e) => setNewReview({...newReview, areasForImprovement: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="comments">Additional Comments</Label>
                  <Textarea
                    id="comments"
                    placeholder="Any additional feedback"
                    value={newReview.comments}
                    onChange={(e) => setNewReview({...newReview, comments: e.target.value})}
                  />
                </div>
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
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => {
                          setSelectedReview(review)
                          setViewDialogOpen(true)
                        }} title="View Review">
                          <Eye className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                        
                        {/* Employee actions */}
                        {!isExecutiveOrHR && !isLineManager && review.employeeId === currentEmployeeEmail && (
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
                        
                        {/* Line Manager and Executive actions */}
                        {(isLineManager || isExecutiveOrHR) && (
                          <>
                            {/* Comment button */}
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => {
                              setSelectedReview(review)
                              setEmployeeComment(review.employeeComments || "")
                              setCommentDialogOpen(true)
                            }} title="Add Comment">
                              <MessageSquare className="h-3 w-3 md:h-4 md:w-4" />
                            </Button>
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
                <Label className="text-sm text-muted-foreground">Goals</Label>
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
                <Label htmlFor="manager-notes">Manager Comments & Ratings</Label>
                <Textarea
                  id="manager-notes"
                  value={managerNotes}
                  onChange={(e) => setManagerNotes(e.target.value)}
                  placeholder="Add your evaluation, feedback, and notes..."
                  className="min-h-[150px]"
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
                <Label htmlFor="completedGoals">3. Which goals or tasks did you complete successfully?</Label>
                <Textarea
                  id="completedGoals"
                  value={selfAssessmentData.completedGoals}
                  onChange={(e) => setSelfAssessmentData({...selfAssessmentData, completedGoals: e.target.value})}
                  placeholder="List completed goals..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unachievedGoals">4. Were there any goals you did not achieve? If yes, please explain.</Label>
                <Textarea
                  id="unachievedGoals"
                  value={selfAssessmentData.unachievedGoals}
                  onChange={(e) => setSelfAssessmentData({...selfAssessmentData, unachievedGoals: e.target.value})}
                  placeholder="Explain any unachieved goals..."
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

            {/* Section D: Future Goals */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Section D: Future Goals</h3>
              
              <div className="space-y-2">
                <Label htmlFor="futureGoals">13. What are your key goals for the next review period?</Label>
                <Textarea
                  id="futureGoals"
                  value={selfAssessmentData.futureGoals}
                  onChange={(e) => setSelfAssessmentData({...selfAssessmentData, futureGoals: e.target.value})}
                  placeholder="Describe your future goals..."
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
