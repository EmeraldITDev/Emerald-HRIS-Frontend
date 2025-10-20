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
import { Star, Plus, Eye, Download, MessageSquare, FileEdit, Calendar, CheckCircle, ClipboardCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from '@/contexts/AuthContext'
import { apiService, Employee } from '@/lib/api'

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
  selfAssessmentStatus?: 'Draft' | 'Sent to Line Manager' | 'Reviewed by Line Manager' | 'Signed Off'
  managerReviewComments?: string
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
    // Henry Marcus (Line Manager) - Reviews for his IT team
    {
      id: '1',
      employeeId: '5',
      employeeName: 'Henry Marcus',
      department: 'IT',
      reviewPeriod: 'Q4 2024',
      reviewDate: '2024-12-15',
      rating: 4,
      status: 'Completed',
      reviewer: 'Sarah Johnson (Executive)',
      goals: 'Lead team effectively, complete infrastructure upgrades, mentor junior staff',
      achievements: 'Successfully managed 5-person IT team, completed cloud migration ahead of schedule, mentored 3 junior developers',
      areasForImprovement: 'Strategic planning and cross-department collaboration',
      comments: 'Henry has demonstrated excellent leadership as a Line Manager. His team consistently delivers high-quality work.',
      selfAssessment: 'I have focused on building a cohesive team and ensuring timely project delivery. The cloud migration was a major achievement.',
      selfAssessmentDate: '2024-12-01',
      selfAssessmentStatus: 'Signed Off',
      managerReviewComments: 'Excellent self-awareness and leadership skills demonstrated throughout the period.',
      managerReviewDate: '2024-12-10'
    },
    {
      id: '2',
      employeeId: '5',
      employeeName: 'Henry Marcus',
      department: 'IT',
      reviewPeriod: 'Q3 2024',
      reviewDate: '2024-09-15',
      rating: 5,
      status: 'Completed',
      reviewer: 'Sarah Johnson (Executive)',
      goals: 'Improve team productivity, implement new security protocols',
      achievements: 'Increased team productivity by 30%, successfully implemented zero-trust security framework',
      areasForImprovement: 'Continue developing executive-level communication skills',
      comments: 'Outstanding performance. Henry has proven himself as a strong leader and technical expert.',
      employeeComments: 'Thank you for the recognition. I am committed to continuing to grow as a leader and supporting my team.',
      selfAssessment: 'I implemented new workflows that increased efficiency. The security framework rollout was completed 2 weeks ahead of schedule.',
      selfAssessmentDate: '2024-09-01',
      selfAssessmentStatus: 'Signed Off',
      managerReviewComments: 'Outstanding initiative and technical expertise.',
      managerReviewDate: '2024-09-10'
    },
    // Sarah Chen (Marketing) - Employee
    {
      id: '3',
      employeeId: '2',
      employeeName: 'Sarah Chen',
      department: 'Marketing',
      reviewPeriod: 'Q4 2024',
      reviewDate: '2024-12-10',
      rating: 5,
      status: 'Completed',
      reviewer: 'Emily Brown (Line Manager)',
      goals: 'Launch new marketing campaigns, improve brand visibility, manage team of 8',
      achievements: 'Launched 3 successful campaigns with 45% engagement increase, expanded social media following by 60%, excellent team management',
      areasForImprovement: 'Budget management and ROI tracking',
      comments: 'Sarah continues to excel in her role. Her creative campaigns have significantly boosted our brand presence.',
      selfAssessment: 'I led successful campaigns and focused on data-driven strategies. My team collaboration has improved significantly.',
      selfAssessmentDate: '2024-11-25',
      selfAssessmentStatus: 'Reviewed by Line Manager',
      managerReviewComments: 'Creative and results-driven. Excellent team player.',
      managerReviewDate: '2024-12-05'
    },
    // John Smith (Corporate HR) - Employee in Finance
    {
      id: '4',
      employeeId: '3',
      employeeName: 'John Smith',
      department: 'Finance',
      reviewPeriod: 'Q4 2024',
      reviewDate: '2024-12-08',
      rating: 4,
      status: 'Completed',
      reviewer: 'Michael Brown (Line Manager - Finance)',
      goals: 'Streamline financial reporting processes, ensure compliance with new regulations',
      achievements: 'Reduced report generation time by 40%, successfully implemented new compliance framework, trained 5 team members',
      areasForImprovement: 'Proactive communication with stakeholders',
      comments: 'John has made significant improvements to our financial processes. His attention to detail is commendable.',
      selfAssessment: 'I streamlined our reporting processes and ensured compliance. I focused on efficiency and accuracy in all deliverables.',
      selfAssessmentDate: '2024-11-20',
      selfAssessmentStatus: 'Sent to Line Manager'
    },
    // Emily Davis (IT Power User) - General employee
    {
      id: '5',
      employeeId: '7',
      employeeName: 'Emily Davis',
      department: 'IT',
      reviewPeriod: 'Q4 2024',
      reviewDate: '2024-12-20',
      rating: 5,
      status: 'Completed',
      reviewer: 'Henry Marcus (Line Manager - IT)',
      goals: 'Complete certification in cloud architecture, lead system optimization project',
      achievements: 'Obtained AWS Solutions Architect certification, optimized system performance by 35%, automated 10+ manual processes',
      areasForImprovement: 'Documentation and knowledge sharing',
      comments: 'Emily has shown exceptional technical skills and initiative. She is a valuable asset to the IT team.',
      employeeComments: 'Thanks for the feedback! I will work on improving my documentation practices.',
      selfAssessment: 'I achieved my AWS certification and led the system optimization project. I automated many manual processes saving the team significant time.',
      selfAssessmentDate: '2024-12-05',
      selfAssessmentStatus: 'Signed Off',
      managerReviewComments: 'Outstanding technical achievement and initiative.',
      managerReviewDate: '2024-12-15'
    },
    // Michael Wilson (Contract Employee) - Sales
    {
      id: '6',
      employeeId: '8',
      employeeName: 'Michael Wilson',
      department: 'Sales',
      reviewPeriod: 'Q4 2024',
      reviewDate: '2024-12-18',
      rating: 4,
      status: 'Completed',
      reviewer: 'Jennifer Lee (Line Manager - Sales)',
      goals: 'Achieve quarterly sales targets, expand client base',
      achievements: 'Exceeded sales target by 25%, acquired 15 new clients, maintained 95% client retention rate',
      areasForImprovement: 'CRM system utilization and follow-up consistency',
      comments: 'Michael has consistently delivered strong sales results. His client relationship skills are excellent.',
      selfAssessment: 'I exceeded my sales targets and acquired many new clients. I focused on building strong relationships and understanding client needs.',
      selfAssessmentDate: '2024-12-01',
      selfAssessmentStatus: 'Reviewed by Line Manager',
      managerReviewComments: 'Excellent sales performance and client management.',
      managerReviewDate: '2024-12-12'
    },
    // Lisa Anderson (General Employee) - Operations
    {
      id: '7',
      employeeId: '9',
      employeeName: 'Lisa Anderson',
      department: 'Operations',
      reviewPeriod: 'Q4 2024',
      reviewDate: '2024-12-12',
      rating: 3,
      status: 'Completed',
      reviewer: 'David Kim (Line Manager - Operations)',
      goals: 'Improve process efficiency, reduce operational errors',
      achievements: 'Reduced processing errors by 20%, contributed to team projects consistently',
      areasForImprovement: 'Time management, taking more initiative on projects',
      comments: 'Lisa meets expectations but has room to grow. Encourage her to take on more challenging tasks and be more proactive.',
      employeeComments: 'I appreciate the feedback and will work on being more proactive in identifying improvement opportunities.',
      selfAssessment: 'I have worked on reducing errors in our operational processes. I completed my assigned tasks on time and collaborated with team members on various projects. I recognize I need to be more proactive in suggesting improvements.',
      selfAssessmentDate: '2024-11-28',
      selfAssessmentStatus: 'Sent to Line Manager'
    },
    // Additional reviews for other employee accounts
    {
      id: '8',
      employeeId: '1',
      employeeName: 'Admin User',
      department: 'IT',
      reviewPeriod: 'Q4 2024',
      reviewDate: '2024-12-10',
      rating: 4,
      status: 'Completed',
      reviewer: 'Henry Marcus (Line Manager - IT)',
      goals: 'Maintain system security, improve infrastructure',
      achievements: 'Enhanced security protocols, reduced system downtime by 15%',
      areasForImprovement: 'User documentation and training materials',
      comments: 'Strong performance in technical areas. Good progress overall.',
      selfAssessment: 'I focused on system security improvements and successfully implemented new monitoring tools. I maintained high uptime and responded quickly to incidents.',
      selfAssessmentDate: '2024-11-22',
      selfAssessmentStatus: 'Reviewed by Line Manager',
      managerReviewComments: 'Excellent technical execution and reliability.',
      managerReviewDate: '2024-12-05'
    },
    {
      id: '9',
      employeeId: '4',
      employeeName: 'Jane Smith',
      department: 'HR',
      reviewPeriod: 'Q4 2024',
      reviewDate: '2024-12-14',
      rating: 4,
      status: 'Completed',
      reviewer: 'Sarah Johnson (Executive)',
      goals: 'Improve employee engagement, streamline HR processes',
      achievements: 'Increased employee satisfaction by 20%, automated onboarding process',
      areasForImprovement: 'Strategic HR planning and analytics',
      comments: 'Jane has done excellent work in improving HR operations and employee satisfaction.',
      selfAssessment: 'I successfully automated the onboarding process, saving significant time. Employee feedback has been very positive regarding the new engagement initiatives I led.',
      selfAssessmentDate: '2024-11-25',
      selfAssessmentStatus: 'Signed Off',
      managerReviewComments: 'Outstanding contribution to HR transformation.',
      managerReviewDate: '2024-12-10'
    },
    // Chidi Okonkwo (Technical Operations Employee) - employeeId '6' from AuthContext
    {
      id: '10',
      employeeId: '6',
      employeeName: 'Chidi Okonkwo',
      department: 'Technical Operations',
      reviewPeriod: 'Q4 2024',
      reviewDate: '2024-12-18',
      rating: 4,
      status: 'Completed',
      reviewer: 'Henry Marcus (Line Manager - Technical Operations)',
      goals: 'Complete system integration projects, improve code quality, enhance testing procedures',
      achievements: 'Successfully integrated 3 major systems, improved code coverage to 85%, reduced bugs by 30%',
      areasForImprovement: 'Documentation practices and stakeholder communication',
      comments: 'Chidi has shown strong technical capabilities and attention to detail. His work on system integration has been exemplary.',
      selfAssessment: 'I successfully completed the system integration projects on schedule. I focused on writing clean, maintainable code and improving our test coverage. I worked closely with the team to ensure smooth deployments.',
      selfAssessmentDate: '2024-12-05',
      selfAssessmentStatus: 'Reviewed by Line Manager',
      managerReviewComments: 'Excellent technical execution and team collaboration.',
      managerReviewDate: '2024-12-15'
    },
    {
      id: '11',
      employeeId: '6',
      employeeName: 'Chidi Okonkwo',
      department: 'Technical Operations',
      reviewPeriod: 'Q3 2024',
      reviewDate: '2024-09-18',
      rating: 5,
      status: 'Completed',
      reviewer: 'Henry Marcus (Line Manager - Technical Operations)',
      goals: 'Enhance system reliability, participate in team training, improve response time',
      achievements: 'Reduced system downtime by 25%, completed advanced technical training, improved incident response time by 40%',
      areasForImprovement: 'Leadership skills and mentoring junior team members',
      comments: 'Outstanding performance this quarter. Chidi consistently delivers high-quality work and shows great initiative.',
      selfAssessment: 'I focused on system reliability improvements and completed my technical certifications. I contributed to several critical projects and helped resolve complex technical issues.',
      selfAssessmentDate: '2024-09-05',
      selfAssessmentStatus: 'Reviewed by Line Manager',
      managerReviewComments: 'Exceptional technical skills and dedication to continuous improvement.',
      managerReviewDate: '2024-09-15'
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
  const [selfAssessmentDialogOpen, setSelfAssessmentDialogOpen] = useState(false)
  const [manageReviewDialogOpen, setManageReviewDialogOpen] = useState(false)
  const [hrReviewDialogOpen, setHrReviewDialogOpen] = useState(false)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [employeeComment, setEmployeeComment] = useState("")
  const [selfAssessmentForm, setSelfAssessmentForm] = useState({
    responsibilities: "",
    achievements: "",
    goalsCompleted: "",
    goalsNotAchieved: "",
    workQuality: "3",
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
  });
  const [selfAssessment, setSelfAssessment] = useState("")
  const [managerNotes, setManagerNotes] = useState("")
  const [meetingDate, setMeetingDate] = useState("")
  const [hrComments, setHrComments] = useState("")
  const { toast } = useToast()
  const { user } = useAuth()
  
  useEffect(() => {
    fetchEmployees()
  }, [])
  
  const fetchEmployees = async () => {
    try {
      const data = await apiService.getEmployees()
      setEmployees(data)
    } catch (error) {
      console.error('Failed to fetch employees:', error)
    }
  }
  
  // Determine user's access level
  const isExecutiveOrHR = user?.role === 'executive' || user?.role === 'hr_manager' || user?.role === 'corporate_hr'
  const isLineManager = user?.role === 'line_manager'
  const isGeneralEmployee = user?.role === 'general_employee'
  const canManageReviews = isExecutiveOrHR || isLineManager
  const userDepartment = user?.department

  // Get current employee ID for filtering
  const currentEmployeeId = employees.find(emp => emp.email === user?.email)?.id?.toString()

  // Filter reviews based on role and department
  const filteredReviews = reviews.filter(review => {
    // General employees can only see their own reviews
    if (isGeneralEmployee) {
      return review.employeeId === currentEmployeeId
    }
    
    // Line managers can only see reviews from their department
    if (isLineManager && userDepartment) {
      return review.department === userDepartment
    }
    
    // Executives and HR can see all reviews
    return true
  })
  
  // Filter employees based on department for line managers
  const filteredEmployees = isLineManager && userDepartment
    ? employees.filter(emp => emp.department === userDepartment)
    : employees
  
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
  
  const handleSubmitSelfAssessment = () => {
    if (!selectedReview || !selfAssessment.trim()) {
      toast({
        title: "Missing information",
        description: "Please complete your self-assessment.",
        variant: "destructive"
      })
      return
    }
    
    const updatedReviews = reviews.map(review => 
      review.id === selectedReview.id 
        ? { 
            ...review, 
            selfAssessment,
            selfAssessmentDate: new Date().toISOString().split('T')[0],
            status: 'Self-Assessment Submitted'
          }
        : review
    )
    
    setReviews(updatedReviews)
    setSelfAssessment("")
    setSelfAssessmentDialogOpen(false)
    
    toast({
      title: "Self-assessment submitted",
      description: "Your self-assessment has been sent to your line manager."
    })
  }
  
  const handleSubmitSelfAssessmentForm = () => {
    // Validate required fields
    if (!selfAssessmentForm.responsibilities || !selfAssessmentForm.achievements) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in all required fields before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    // Use selected review if available, otherwise find the employee's most recent review
    const targetReview = selectedReview || reviews
      .filter(r => r.employeeId === currentEmployeeId)
      .sort((a, b) => new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime())[0];
    
    if (!targetReview) {
      toast({
        title: "No Review Found",
        description: "No performance review found to attach this self-assessment to.",
        variant: "destructive",
      });
      return;
    }
    
    const selfAssessmentText = `
Main Responsibilities: ${selfAssessmentForm.responsibilities}

Achievements: ${selfAssessmentForm.achievements}

Goals Completed: ${selfAssessmentForm.goalsCompleted || 'N/A'}

Goals Not Achieved: ${selfAssessmentForm.goalsNotAchieved || 'N/A'}

Work Quality Rating: ${selfAssessmentForm.workQuality}/5

Time Management: ${selfAssessmentForm.timeManagement}

Team Communication: ${selfAssessmentForm.teamCommunication}

Response to Feedback: ${selfAssessmentForm.feedbackResponse}

Professionalism: ${selfAssessmentForm.professionalism}

Challenges: ${selfAssessmentForm.challenges}

Resources Needed: ${selfAssessmentForm.resourcesNeeded}

Skills to Learn: ${selfAssessmentForm.skillsToLearn}

Future Goals: ${selfAssessmentForm.futureGoals}

Team Contribution: ${selfAssessmentForm.teamContribution}

Suggestions: ${selfAssessmentForm.suggestions}

Overall Self-Rating: ${selfAssessmentForm.overallRating}/5
    `.trim();
    
    const updatedReviews = reviews.map(review => 
      review.id === targetReview.id 
        ? { 
            ...review, 
            selfAssessment: selfAssessmentText,
            selfAssessmentDate: new Date().toISOString().split('T')[0],
            selfAssessmentStatus: 'Sent to Line Manager' as const
          }
        : review
    );
    
    setReviews(updatedReviews);
    
    toast({
      title: "Self-Assessment Submitted",
      description: "Your self-assessment has been sent to your line manager for review.",
    });
    setSelfAssessmentDialogOpen(false);
    setSelectedReview(null);
    setSelfAssessmentForm({
      responsibilities: "",
      achievements: "",
      goalsCompleted: "",
      goalsNotAchieved: "",
      workQuality: "3",
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
    });
  }

  
  const handleManagerReview = () => {
    if (!selectedReview || !managerNotes.trim() || !meetingDate) {
      toast({
        title: "Missing information",
        description: "Please complete all fields.",
        variant: "destructive"
      })
      return
    }
    
    const updatedReviews = reviews.map(review => 
      review.id === selectedReview.id 
        ? { 
            ...review, 
            managerReviewComments: managerNotes,
            managerReviewDate: new Date().toISOString().split('T')[0],
            meetingScheduledDate: meetingDate,
            selfAssessmentStatus: 'Reviewed by Line Manager' as const,
            status: 'Meeting Scheduled'
          }
        : review
    )
    
    setReviews(updatedReviews)
    setManagerNotes("")
    setMeetingDate("")
    setManageReviewDialogOpen(false)
    
    toast({
      title: "Review updated",
      description: "Manager review completed and self-assessment marked as reviewed."
    })
  }
  
  const handleEmployeeSignOff = (reviewId: string) => {
    const updatedReviews = reviews.map(review => 
      review.id === reviewId 
        ? { 
            ...review, 
            employeeSignedDate: new Date().toISOString().split('T')[0],
            status: review.managerSignedDate ? 'Awaiting HR Review' : 'Employee Signed'
          }
        : review
    )
    
    setReviews(updatedReviews)
    
    toast({
      title: "Review signed",
      description: "You have signed off on this performance review."
    })
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
  
  const handleHRApproval = () => {
    if (!selectedReview) return
    
    const updatedReviews = reviews.map(review => 
      review.id === selectedReview.id 
        ? { 
            ...review, 
            hrApprovedDate: new Date().toISOString().split('T')[0],
            hrComments: hrComments,
            status: 'HR Approved'
          }
        : review
    )
    
    setReviews(updatedReviews)
    setHrComments("")
    setHrReviewDialogOpen(false)
    
    toast({
      title: "Review approved",
      description: "Performance review has been approved and filed."
    })
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
          {/* Self-Assessment button for all employees except executives */}
          {user?.role !== 'executive' && (
            <Dialog open={selfAssessmentDialogOpen} onOpenChange={setSelfAssessmentDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
                  <FileEdit className="mr-2 h-4 w-4" />
                  <span className="text-sm md:text-base">Self-Assessment</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[800px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                <DialogHeader>
                  <DialogTitle>Employee Performance Assessment Form</DialogTitle>
                  <DialogDescription>
                    Complete your self-assessment. This will be sent to your line manager for review.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  {/* Section A: Job Performance */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Section A: Job Performance</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="responsibilities">1. What are your main responsibilities in your current position? *</Label>
                      <Textarea
                        id="responsibilities"
                        placeholder="List your key responsibilities..."
                        value={selfAssessmentForm.responsibilities}
                        onChange={(e) => setSelfAssessmentForm({...selfAssessmentForm, responsibilities: e.target.value})}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="achievements">2. What achievements are you most proud of during this review period? *</Label>
                      <Textarea
                        id="achievements"
                        placeholder="Describe your key achievements..."
                        value={selfAssessmentForm.achievements}
                        onChange={(e) => setSelfAssessmentForm({...selfAssessmentForm, achievements: e.target.value})}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="goalsCompleted">3. Which goals or tasks did you complete successfully?</Label>
                      <Textarea
                        id="goalsCompleted"
                        placeholder="List completed goals and tasks..."
                        value={selfAssessmentForm.goalsCompleted}
                        onChange={(e) => setSelfAssessmentForm({...selfAssessmentForm, goalsCompleted: e.target.value})}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="goalsNotAchieved">4. Were there any goals you did not achieve? If yes, please explain.</Label>
                      <Textarea
                        id="goalsNotAchieved"
                        placeholder="Explain any unachieved goals..."
                        value={selfAssessmentForm.goalsNotAchieved}
                        onChange={(e) => setSelfAssessmentForm({...selfAssessmentForm, goalsNotAchieved: e.target.value})}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="workQuality">5. How would you rate the quality and accuracy of your work?</Label>
                      <Select value={selfAssessmentForm.workQuality} onValueChange={(value) => setSelfAssessmentForm({...selfAssessmentForm, workQuality: value})}>
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
                    <h3 className="text-lg font-semibold text-foreground">Section B: Work Attitude & Behavior</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="timeManagement">6. How do you manage your time and meet deadlines?</Label>
                      <Textarea
                        id="timeManagement"
                        placeholder="Describe your time management approach..."
                        value={selfAssessmentForm.timeManagement}
                        onChange={(e) => setSelfAssessmentForm({...selfAssessmentForm, timeManagement: e.target.value})}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="teamCommunication">7. How well do you work and communicate with your team and supervisor?</Label>
                      <Textarea
                        id="teamCommunication"
                        placeholder="Describe your team collaboration..."
                        value={selfAssessmentForm.teamCommunication}
                        onChange={(e) => setSelfAssessmentForm({...selfAssessmentForm, teamCommunication: e.target.value})}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="feedbackResponse">8. How do you respond to feedback or constructive criticism?</Label>
                      <Textarea
                        id="feedbackResponse"
                        placeholder="Describe how you handle feedback..."
                        value={selfAssessmentForm.feedbackResponse}
                        onChange={(e) => setSelfAssessmentForm({...selfAssessmentForm, feedbackResponse: e.target.value})}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="professionalism">9. How do you demonstrate professionalism and a positive attitude at work?</Label>
                      <Textarea
                        id="professionalism"
                        placeholder="Describe your professional approach..."
                        value={selfAssessmentForm.professionalism}
                        onChange={(e) => setSelfAssessmentForm({...selfAssessmentForm, professionalism: e.target.value})}
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Section C: Development & Improvement */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Section C: Development & Improvement</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="challenges">10. What challenges affected your performance during this period?</Label>
                      <Textarea
                        id="challenges"
                        placeholder="Describe any challenges faced..."
                        value={selfAssessmentForm.challenges}
                        onChange={(e) => setSelfAssessmentForm({...selfAssessmentForm, challenges: e.target.value})}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="resourcesNeeded">11. What resources or support do you need to do your job better?</Label>
                      <Textarea
                        id="resourcesNeeded"
                        placeholder="List needed resources or support..."
                        value={selfAssessmentForm.resourcesNeeded}
                        onChange={(e) => setSelfAssessmentForm({...selfAssessmentForm, resourcesNeeded: e.target.value})}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="skillsToLearn">12. What new skills would you like to learn or improve on?</Label>
                      <Textarea
                        id="skillsToLearn"
                        placeholder="List skills you want to develop..."
                        value={selfAssessmentForm.skillsToLearn}
                        onChange={(e) => setSelfAssessmentForm({...selfAssessmentForm, skillsToLearn: e.target.value})}
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Section D: Future Goals */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Section D: Future Goals</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="futureGoals">13. What are your key goals for the next review period?</Label>
                      <Textarea
                        id="futureGoals"
                        placeholder="List your future goals..."
                        value={selfAssessmentForm.futureGoals}
                        onChange={(e) => setSelfAssessmentForm({...selfAssessmentForm, futureGoals: e.target.value})}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="teamContribution">14. How do you plan to contribute to your team or department's success?</Label>
                      <Textarea
                        id="teamContribution"
                        placeholder="Describe your planned contributions..."
                        value={selfAssessmentForm.teamContribution}
                        onChange={(e) => setSelfAssessmentForm({...selfAssessmentForm, teamContribution: e.target.value})}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="suggestions">15. Do you have any suggestions for improving workplace processes or communication?</Label>
                      <Textarea
                        id="suggestions"
                        placeholder="Share your suggestions..."
                        value={selfAssessmentForm.suggestions}
                        onChange={(e) => setSelfAssessmentForm({...selfAssessmentForm, suggestions: e.target.value})}
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Section E: Self-Rating */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Section E: Self-Rating</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="overallRating">16. How would you rate your overall performance on a scale of 1–5?</Label>
                      <Select value={selfAssessmentForm.overallRating} onValueChange={(value) => setSelfAssessmentForm({...selfAssessmentForm, overallRating: value})}>
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
                  <Button variant="outline" onClick={() => {
                    setSelfAssessmentDialogOpen(false);
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmitSelfAssessmentForm} className="bg-blue-600 hover:bg-blue-700 text-white">
                    Submit Assessment
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                  <TableHead className="hidden lg:table-cell text-xs md:text-sm">Status</TableHead>
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
                    <TableCell className="hidden lg:table-cell text-xs md:text-sm">{review.reviewer}</TableCell>
                    <TableCell className="hidden sm:table-cell text-xs md:text-sm">{renderStars(review.rating)}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge className={review.status === 'Completed' ? 'bg-success/10 text-success border-success/20 text-xs' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 text-xs'}>
                        {review.status}
                      </Badge>
                    </TableCell>
                     <TableCell className="text-right">
                      <div className="flex justify-end gap-1 md:gap-2 flex-wrap">
                        {/* View button - everyone can view */}
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => {
                          setSelectedReview(review)
                          setViewDialogOpen(true)
                        }}>
                          <Eye className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                        
                        {/* Employee actions */}
                        {isGeneralEmployee && review.employeeId === currentEmployeeId && (
                          <>
                            {/* Update Self-Assessment button - only if not yet submitted or still in draft */}
                            {(!review.selfAssessmentStatus || review.selfAssessmentStatus === 'Draft') && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 px-2" 
                                onClick={() => {
                                  setSelectedReview(review)
                                  setSelfAssessmentDialogOpen(true)
                                }} 
                                title="Update Self-Assessment"
                              >
                                <FileEdit className="h-3 w-3 md:h-4 md:w-4 mr-1 text-blue-600" />
                                <span className="text-xs hidden lg:inline">Update</span>
                              </Button>
                            )}
                            
                            {/* Sign Off button - only if reviewed by line manager */}
                            {review.selfAssessmentStatus === 'Reviewed by Line Manager' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 px-2" 
                                onClick={() => {
                                  const updatedReviews = reviews.map(r => 
                                    r.id === review.id 
                                      ? { ...r, selfAssessmentStatus: 'Signed Off' as const, employeeSignedDate: new Date().toISOString().split('T')[0] }
                                      : r
                                  )
                                  setReviews(updatedReviews)
                                  toast({
                                    title: "Assessment Signed Off",
                                    description: "You have successfully signed off on your self-assessment."
                                  })
                                }} 
                                title="Sign Off Self-Assessment"
                              >
                                <CheckCircle className="h-3 w-3 md:h-4 md:w-4 mr-1 text-green-600" />
                                <span className="text-xs hidden lg:inline">Sign Off</span>
                              </Button>
                            )}
                          </>
                        )}
                        
                        {/* Line Manager and Executive actions */}
                        {(isLineManager || user?.role === 'executive') && review.employeeId !== currentEmployeeId && (
                          <>
                            {/* View and Comment button for self-assessments */}
                            {review.selfAssessment && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 px-2" 
                                onClick={() => {
                                  setSelectedReview(review)
                                  setViewDialogOpen(true)
                                }} 
                                title="View and Comment on Self-Assessment"
                              >
                                <MessageSquare className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                                <span className="text-xs hidden lg:inline">View & Comment</span>
                              </Button>
                            )}
                            
                            {/* Review button - to mark as reviewed */}
                            {review.selfAssessmentStatus === 'Sent to Line Manager' && isLineManager && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 px-2" 
                                onClick={() => {
                                  setSelectedReview(review)
                                  setManagerNotes(review.managerReviewComments || "")
                                  setManageReviewDialogOpen(true)
                                }} 
                                title="Review Self-Assessment"
                              >
                                <ClipboardCheck className="h-3 w-3 md:h-4 md:w-4 mr-1 text-orange-600" />
                                <span className="text-xs hidden lg:inline">Review</span>
                              </Button>
                            )}
                          </>
                        )}
                        
                        {/* HR actions */}
                        {(user?.role === 'hr_manager' || user?.role === 'executive') && (
                          <>
                            {/* HR Review/Approve button (only after both signed) */}
                            {review.employeeSignedDate && review.managerSignedDate && !review.hrApprovedDate && (
                              <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => {
                                setSelectedReview(review)
                                setHrComments("")
                                setHrReviewDialogOpen(true)
                              }}>
                                <ClipboardCheck className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                                <span className="text-xs hidden lg:inline">Approve</span>
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
              
              {selectedReview.selfAssessment && (
                <>
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm text-muted-foreground">Self-Assessment</Label>
                      {selectedReview.selfAssessmentStatus && (
                        <Badge className="text-xs">
                          {selectedReview.selfAssessmentStatus}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 bg-blue-50 dark:bg-blue-950/20 p-3 rounded whitespace-pre-wrap">{selectedReview.selfAssessment}</p>
                    {selectedReview.selfAssessmentDate && (
                      <p className="text-xs text-muted-foreground mt-1">Submitted: {selectedReview.selfAssessmentDate}</p>
                    )}
                  </div>
                  
                  {selectedReview.managerReviewComments && (
                    <div>
                      <Label className="text-sm text-muted-foreground">Manager Review Comments</Label>
                      <p className="mt-1 bg-green-50 dark:bg-green-950/20 p-3 rounded">{selectedReview.managerReviewComments}</p>
                      {selectedReview.managerReviewDate && (
                        <p className="text-xs text-muted-foreground mt-1">Reviewed: {selectedReview.managerReviewDate}</p>
                      )}
                    </div>
                  )}
                </>
              )}
              
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
            <Button variant="outline" onClick={() => setCommentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEmployeeComment} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Submit Comment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      
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
    </div>
  )
}