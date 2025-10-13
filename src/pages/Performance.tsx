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
import { Star, Plus, Eye, Download, MessageSquare } from "lucide-react"
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
}

export default function Performance() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [reviews, setReviews] = useState<Review[]>([
    {
      id: '1',
      employeeId: '101',
      employeeName: 'Henry Marcus',
      department: 'IT',
      reviewPeriod: 'Q4 2024',
      reviewDate: '2024-12-15',
      rating: 4,
      status: 'Completed',
      reviewer: 'Austin Nwachwukwu',
      goals: 'Complete system integration projects and improve database performance',
      achievements: 'Successfully delivered 4 major projects on time, improved database query performance by 35%',
      areasForImprovement: 'Enhanced communication with cross-functional teams',
      comments: 'Excellent technical performance. Henry has shown strong dedication and problem-solving skills throughout the quarter.'
    },
    {
      id: '2',
      employeeId: '101',
      employeeName: 'Henry Marcus',
      department: 'IT',
      reviewPeriod: 'Q3 2024',
      reviewDate: '2024-09-15',
      rating: 5,
      status: 'Completed',
      reviewer: 'Austin Nwachwukwu',
      goals: 'Lead migration to new infrastructure and mentor junior developers',
      achievements: 'Successfully led cloud migration project, mentored 2 junior developers, reduced system downtime by 40%',
      areasForImprovement: 'Continue developing leadership skills',
      comments: 'Outstanding performance this quarter. Henry exceeded all expectations and demonstrated excellent leadership qualities.',
      employeeComments: 'Thank you for the feedback. I really enjoyed leading the migration project and will continue to focus on my leadership development.'
    },
    {
      id: '3',
      employeeId: '101',
      employeeName: 'Henry Marcus',
      department: 'IT',
      reviewPeriod: 'Q2 2024',
      reviewDate: '2024-06-15',
      rating: 4,
      status: 'Completed',
      reviewer: 'Austin Nwachwukwu',
      goals: 'Implement new security protocols and complete certifications',
      achievements: 'Implemented enhanced security measures, completed AWS certification, improved system security score by 25%',
      areasForImprovement: 'Time management on concurrent projects',
      comments: 'Strong performance with notable achievements in security improvements. Keep up the excellent work.'
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
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [employeeComment, setEmployeeComment] = useState("")
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
  
  const userDepartment = user?.email === 'henry.marcus@emeraldcfze.com' ? 'IT' : undefined
  const isGeneralEmployee = user?.role === 'general_employee'
  const canManageReviews = user?.role === 'executive' || user?.role === 'hr_manager' || user?.role === 'line_manager'

  // Get current employee ID for filtering
  const currentEmployeeId = employees.find(emp => emp.email === user?.email)?.id?.toString()

  const filteredReviews = reviews.filter(review => {
    // General employees can only see their own reviews
    if (isGeneralEmployee) {
      return review.employeeId === currentEmployeeId
    }
    
    // For other roles, show all reviews
    return true
  })
  
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Performance Management</h1>
          <p className="text-muted-foreground">
            {isGeneralEmployee 
              ? "View your performance reviews and add comments"
              : "Track and manage employee performance reviews"
            }
          </p>
        </div>
        
        {canManageReviews && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                New Review
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
                      {employees.filter(emp => !userDepartment || emp.department === userDepartment).map((employee) => (
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

      {/* Performance Reviews Table */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Reviews</CardTitle>
          <CardDescription>
            {isGeneralEmployee 
              ? "Your performance evaluation history"
              : "Track and manage employee performance evaluations"
            }
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
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell className="font-medium">{review.employeeName}</TableCell>
                    <TableCell>{review.department}</TableCell>
                    <TableCell>{review.reviewPeriod}</TableCell>
                    <TableCell>{renderStars(review.rating)}</TableCell>
                    <TableCell>
                      <Badge className={review.status === 'Completed' ? 'bg-success/10 text-success border-success/20' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'}>
                        {review.status}
                      </Badge>
                    </TableCell>
                     <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => {
                          setSelectedReview(review)
                          setViewDialogOpen(true)
                        }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {isGeneralEmployee && review.employeeId === currentEmployeeId && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => {
                              setSelectedReview(review)
                              setEmployeeComment(review.employeeComments || "")
                              setCommentDialogOpen(true)
                            }}>
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleExportReview(review)}>
                              <Download className="h-4 w-4" />
                            </Button>
                          </>
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
            <Button variant="outline" onClick={() => setCommentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEmployeeComment} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Submit Comment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}