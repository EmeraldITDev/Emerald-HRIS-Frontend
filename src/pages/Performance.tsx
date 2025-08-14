import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Star, TrendingUp, Target, Edit, Users, Plus, Search, Filter, FileText, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import PerformanceReviewForm from "@/components/PerformanceReviewForm"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PerformanceReview {
  id: string
  employeeId: string
  employeeName: string
  department: string
  jobTitle: string
  managerId: string
  managerName: string
  reviewPeriod: string
  status: 'draft' | 'submitted' | 'in-review' | 'completed' | 'overdue'
  stage: 'self-assessment' | 'manager-review' | 'hr-validation' | 'final-approval'
  overallRating: number
  lastUpdated: string
  dueDate: string
  progress: number
}

const employees = [
  { id: "EMP001", name: "Adebayo Johnson", department: "Engineering", jobTitle: "Senior Software Engineer" },
  { id: "EMP002", name: "Fatima Abdul", department: "Sales", jobTitle: "Sales Manager" },
  { id: "EMP003", name: "Chinedu Okafor", department: "Marketing", jobTitle: "Marketing Specialist" },
  { id: "EMP004", name: "Kemi Adeleke", department: "HR", jobTitle: "HR Business Partner" },
  { id: "EMP005", name: "Babatunde Okafor", department: "Finance", jobTitle: "Financial Analyst" },
  { id: "EMP006", name: "Amina Hassan", department: "Operations", jobTitle: "Operations Coordinator" }
]

export default function Performance() {
  const [reviews, setReviews] = useState<PerformanceReview[]>([
    {
      id: '1',
      employeeId: 'EMP001',
      employeeName: 'Adebayo Johnson',
      department: 'Engineering',
      jobTitle: 'Senior Software Engineer',
      managerId: 'EMP002',
      managerName: 'Fatima Abdul',
      reviewPeriod: '2024 Annual Review',
      status: 'in-review',
      stage: 'manager-review',
      overallRating: 4.2,
      lastUpdated: '2024-01-20',
      dueDate: '2024-02-15',
      progress: 75
    },
    {
      id: '2',
      employeeId: 'EMP002',
      employeeName: 'Fatima Abdul',
      department: 'Sales',
      jobTitle: 'Sales Manager',
      managerId: 'EMP005',
      managerName: 'Babatunde Okafor',
      reviewPeriod: '2024 Annual Review',
      status: 'submitted',
      stage: 'hr-validation',
      overallRating: 4.7,
      lastUpdated: '2024-01-18',
      dueDate: '2024-02-15',
      progress: 90
    },
    {
      id: '3',
      employeeId: 'EMP003',
      employeeName: 'Chinedu Okafor',
      department: 'Marketing',
      jobTitle: 'Marketing Specialist',
      managerId: 'EMP002',
      managerName: 'Fatima Abdul',
      reviewPeriod: '2024 Annual Review',
      status: 'completed',
      stage: 'final-approval',
      overallRating: 4.5,
      lastUpdated: '2024-01-15',
      dueDate: '2024-02-15',
      progress: 100
    },
    {
      id: '4',
      employeeId: 'EMP004',
      employeeName: 'Kemi Adeleke',
      department: 'HR',
      jobTitle: 'HR Business Partner',
      managerId: 'EMP001',
      managerName: 'Adebayo Johnson',
      reviewPeriod: '2024 Annual Review',
      status: 'draft',
      stage: 'self-assessment',
      overallRating: 0,
      lastUpdated: '2024-01-22',
      dueDate: '2024-02-15',
      progress: 25
    },
    {
      id: '5',
      employeeId: 'EMP005',
      employeeName: 'Babatunde Okafor',
      department: 'Finance',
      jobTitle: 'Financial Analyst',
      managerId: 'EMP004',
      managerName: 'Kemi Adeleke',
      reviewPeriod: '2024 Annual Review',
      status: 'overdue',
      stage: 'self-assessment',
      overallRating: 0,
      lastUpdated: '2024-01-10',
      dueDate: '2024-02-01',
      progress: 10
    }
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [currentReviewId, setCurrentReviewId] = useState<string | null>(null)
  const [currentUserRole] = useState<'employee' | 'manager' | 'hr'>('manager') // This would come from auth context

  // Transform PerformanceReview to PerformanceReviewData for form component
  const transformReviewToFormData = (review: PerformanceReview) => {
    const employee = employees.find(emp => emp.id === review.employeeId)
    const manager = employees.find(emp => emp.id === review.managerId)
    
    // Map status to form-compatible values
    const mapStatus = (status: string): 'draft' | 'submitted' | 'completed' => {
      switch (status) {
        case 'in-review':
        case 'overdue':
          return 'draft'
        case 'submitted':
          return 'submitted'
        case 'completed':
          return 'completed'
        default:
          return 'draft'
      }
    }
    
    return {
      employeeName: review.employeeName,
      employeeId: review.employeeId,
      department: review.department,
      jobTitle: review.jobTitle,
      reportingManager: review.managerName,
      appraisalPeriod: { 
        from: new Date(new Date().getFullYear(), 0, 1),
        to: new Date(new Date().getFullYear(), 11, 31)
      },
      kpas: [
        { id: '1', name: 'Goal Achievement', description: 'Ability to meet and exceed set objectives and targets', rating: Math.floor(review.overallRating || 3), justification: '' },
        { id: '2', name: 'Quality of Work', description: 'Consistency and excellence in work output and deliverables', rating: Math.floor(review.overallRating || 3), justification: '' },
        { id: '3', name: 'Productivity & Efficiency', description: 'Effective use of time and resources to maximize output', rating: Math.floor(review.overallRating || 3), justification: '' },
        { id: '4', name: 'Problem Solving & Decision Making', description: 'Ability to analyze issues and make sound decisions', rating: Math.floor(review.overallRating || 3), justification: '' },
        { id: '5', name: 'Initiative & Innovation', description: 'Proactive approach and creative problem-solving abilities', rating: Math.floor(review.overallRating || 3), justification: '' },
        { id: '6', name: 'Teamwork & Collaboration', description: 'Effective collaboration and contribution to team success', rating: Math.floor(review.overallRating || 3), justification: '' },
        { id: '7', name: 'Communication Skills', description: 'Clear and effective verbal and written communication', rating: Math.floor(review.overallRating || 3), justification: '' },
      ],
      competencies: [
        { id: '1', name: 'Adaptability & Flexibility', rating: Math.floor(review.overallRating || 3), comment: '' },
        { id: '2', name: 'Professionalism & Integrity', rating: Math.floor(review.overallRating || 3), comment: '' },
        { id: '3', name: 'Learning & Development Mindset', rating: Math.floor(review.overallRating || 3), comment: '' },
        { id: '4', name: 'Customer/Stakeholder Orientation', rating: Math.floor(review.overallRating || 3), comment: '' },
      ],
      strengths: '',
      areasForImprovement: '',
      trainingNeeds: '',
      careerAspirations: '',
      overallRating: review.overallRating,
      performanceSummary: '',
      managerComment: '',
      employeeComment: '',
      employeeSignOff: review.status === 'completed',
      managerSignOff: review.status === 'completed',
      hrSignOff: review.status === 'completed',
      stage: review.stage,
      status: mapStatus(review.status)
    }
  }

  const { toast } = useToast()

  // Filtered reviews based on search and status
  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || review.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const handleCreateNewReview = () => {
    setCurrentReviewId(null)
    setShowReviewForm(true)
  }

  const handleEditReview = (reviewId: string) => {
    setCurrentReviewId(reviewId)
    setShowReviewForm(true)
  }

  const handleSaveReview = (reviewData: any) => {
    if (currentReviewId) {
      // Update existing review
      setReviews(prev => prev.map(review => 
        review.id === currentReviewId 
          ? { 
              ...review, 
              employeeName: reviewData.employeeName,
              employeeId: reviewData.employeeId,
              department: reviewData.department,
              jobTitle: reviewData.jobTitle,
              managerName: reviewData.reportingManager,
              overallRating: reviewData.overallRating,
              lastUpdated: new Date().toISOString().split('T')[0],
              progress: Math.min(100, review.progress + 10)
            }
          : review
      ))
    }
    
    toast({
      title: "Review saved",
      description: "Performance review has been saved as draft."
    })
  }

  const handleSubmitReview = (reviewData: any) => {
    if (currentReviewId) {
      setReviews(prev => prev.map(review => 
        review.id === currentReviewId 
          ? { 
              ...review, 
              employeeName: reviewData.employeeName,
              employeeId: reviewData.employeeId,
              department: reviewData.department,
              jobTitle: reviewData.jobTitle,
              managerName: reviewData.reportingManager,
              overallRating: reviewData.overallRating,
              status: reviewData.employeeSignOff && reviewData.managerSignOff && reviewData.hrSignOff 
                ? 'completed' 
                : 'submitted',
              stage: reviewData.stage,
              progress: 100,
              lastUpdated: new Date().toISOString().split('T')[0]
            }
          : review
      ))
    } else {
      // Create new review
      const newReview: PerformanceReview = {
        id: (reviews.length + 1).toString(),
        employeeName: reviewData.employeeName,
        employeeId: reviewData.employeeId,
        department: reviewData.department,
        jobTitle: reviewData.jobTitle,
        managerId: 'EMP002', // Default manager - would come from form
        managerName: reviewData.reportingManager,
        reviewPeriod: '2024 Annual Review',
        status: reviewData.employeeSignOff && reviewData.managerSignOff && reviewData.hrSignOff 
          ? 'completed' 
          : 'submitted',
        stage: reviewData.stage,
        overallRating: reviewData.overallRating,
        lastUpdated: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        progress: 100
      }
      
      setReviews(prev => [...prev, newReview])
    }

    toast({
      title: "Review submitted",
      description: "Performance review has been submitted for approval."
    })
    
    setShowReviewForm(false)
    setCurrentReviewId(null)
  }

  // Email notification function for overdue reviews
  const sendOverdueNotifications = () => {
    const overdueReviews = reviews.filter(review => 
      review.status === 'overdue' || 
      (new Date() > new Date(review.dueDate) && review.status !== 'completed')
    )

    overdueReviews.forEach(review => {
      toast({
        title: "Overdue Review Alert",
        description: `Performance review for ${review.employeeName} is overdue. Due date was ${review.dueDate}.`,
        variant: "destructive"
      })
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">Completed</Badge>
      case 'submitted':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">Submitted</Badge>
      case 'in-review':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">In Review</Badge>
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">Draft</Badge>
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">Overdue</Badge>
      default:
        return <Badge variant="secondary" className="capitalize">{status}</Badge>
    }
  }

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case 'self-assessment': return 'Employee Self-Assessment'
      case 'manager-review': return 'Manager Review'
      case 'hr-validation': return 'HR Validation'
      case 'final-approval': return 'Final Approval'
      default: return stage
    }
  }

  const getRatingDisplay = (rating: number) => {
    if (rating === 0) return <span className="text-muted-foreground">Not rated</span>
    
    const getRatingColor = (rating: number) => {
      if (rating >= 4.5) return 'text-green-600'
      if (rating >= 3.5) return 'text-blue-600'
      if (rating >= 2.5) return 'text-yellow-600'
      if (rating >= 1.5) return 'text-orange-600'
      return 'text-red-600'
    }

    return (
      <div className="flex items-center gap-2">
        <span className={`font-semibold ${getRatingColor(rating)}`}>
          {rating.toFixed(1)}/5.0
        </span>
        <div className="flex">
          {[1, 2, 3, 4, 5].map(star => (
            <Star 
              key={star}
              className={`h-4 w-4 ${
                star <= rating 
                  ? 'text-yellow-400 fill-current' 
                  : 'text-gray-300'
              }`} 
            />
          ))}
        </div>
      </div>
    )
  }

  if (showReviewForm) {
    const currentReview = currentReviewId ? reviews.find(r => r.id === currentReviewId) : undefined
    const formData = currentReview ? transformReviewToFormData(currentReview) : undefined
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setShowReviewForm(false)}>
            ← Back to Reviews
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {currentReview ? 'Edit Performance Review' : 'New Performance Review'}
            </h1>
            <p className="text-muted-foreground">
              {currentReview ? `${currentReview.employeeName} - ${currentReview.reviewPeriod}` : 'Create a comprehensive performance evaluation'}
            </p>
          </div>
        </div>
        
        <PerformanceReviewForm
          reviewData={formData}
          onSave={handleSaveReview}
          onSubmit={handleSubmitReview}
          currentUserRole={currentUserRole}
          isReadOnly={false}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Performance Reviews</h1>
          <p className="text-muted-foreground">Comprehensive employee performance management system</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={sendOverdueNotifications}>
            <FileText className="h-4 w-4 mr-2" />
            Check Overdue
          </Button>
          <Button onClick={handleCreateNewReview}>
            <Plus className="h-4 w-4 mr-2" />
            New Review
          </Button>
        </div>
      </div>
      
      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by employee name, department, or job title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="in-review">In Review</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{reviews.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {reviews.filter(r => r.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {reviews.filter(r => ['draft', 'submitted', 'in-review'].includes(r.status)).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {reviews.filter(r => r.status === 'overdue').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {(reviews.filter(r => r.overallRating > 0).reduce((sum, r) => sum + r.overallRating, 0) / 
                reviews.filter(r => r.overallRating > 0).length || 0).toFixed(1)}/5
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews Table */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Reviews Dashboard</CardTitle>
          <CardDescription>
            Comprehensive performance evaluation tracking with workflow management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Review Period</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="hidden md:table-cell">Due Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{review.employeeName}</div>
                        <div className="text-sm text-muted-foreground">{review.jobTitle}</div>
                      </div>
                    </TableCell>
                    <TableCell>{review.department}</TableCell>
                    <TableCell>{review.reviewPeriod}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {getStageLabel(review.stage)}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(review.status)}</TableCell>
                    <TableCell>{getRatingDisplay(review.overallRating)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${review.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-muted-foreground">{review.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className={new Date(review.dueDate) < new Date() && review.status !== 'completed' ? 'text-red-600 font-medium' : ''}>
                        {review.dueDate}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditReview(review.id)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          {review.status === 'completed' ? 'View' : 'Edit'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredReviews.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No performance reviews found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}