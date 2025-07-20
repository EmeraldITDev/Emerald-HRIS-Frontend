import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Star, TrendingUp, Target, Edit, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PerformanceReview {
  id: string
  employeeId: string
  employeeName: string
  reviewPeriod: string
  status: 'Completed' | 'Pending' | 'In Progress'
  overallRating: 'Exceptional' | 'Exceeds Expectations' | 'Meets Expectations' | 'Needs Improvement' | 'Below Expectations'
  achievements: string
  improvements: string
  managerSummary: string
  lastUpdated: string
}

const employees = [
  { id: "EMP001", name: "Adebayo Johnson" },
  { id: "EMP002", name: "Fatima Abdul" },
  { id: "EMP003", name: "Chinedu Okafor" },
  { id: "EMP004", name: "Kemi Adeleke" }
]

export default function Performance() {
  const [reviews, setReviews] = useState<PerformanceReview[]>([
    {
      id: '1',
      employeeId: 'EMP001',
      employeeName: 'Adebayo Johnson',
      reviewPeriod: '2024 Q1',
      status: 'Pending',
      overallRating: 'Meets Expectations',
      achievements: '',
      improvements: '',
      managerSummary: '',
      lastUpdated: '2024-01-20'
    },
    {
      id: '2',
      employeeId: 'EMP002',
      employeeName: 'Fatima Abdul',
      reviewPeriod: '2024 Q1',
      status: 'Pending',
      overallRating: 'Meets Expectations',
      achievements: '',
      improvements: '',
      managerSummary: '',
      lastUpdated: '2024-01-20'
    },
    {
      id: '3',
      employeeId: 'EMP003',
      employeeName: 'Chinedu Okafor',
      reviewPeriod: '2024 Q1',
      status: 'Completed',
      overallRating: 'Exceeds Expectations',
      achievements: 'Led successful project migration, improved team efficiency by 25%',
      improvements: 'Could improve communication with stakeholders',
      managerSummary: 'Excellent performer with strong technical skills and leadership potential.',
      lastUpdated: '2024-01-15'
    },
    {
      id: '4',
      employeeId: 'EMP004',
      employeeName: 'Kemi Adeleke',
      reviewPeriod: '2024 Q1',
      status: 'Pending',
      overallRating: 'Meets Expectations',
      achievements: '',
      improvements: '',
      managerSummary: '',
      lastUpdated: '2024-01-20'
    }
  ])

  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  const handleSaveReview = () => {
    if (!selectedReview) return

    setReviews(reviews.map(review => 
      review.id === selectedReview.id 
        ? { ...selectedReview, status: 'Completed', lastUpdated: new Date().toISOString().split('T')[0] }
        : review
    ))

    toast({
      title: "Review saved",
      description: `Performance review for ${selectedReview.employeeName} has been updated.`
    })

    setIsDialogOpen(false)
    setSelectedReview(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return <Badge className="bg-success/10 text-success border-success/20">Completed</Badge>
      case 'In Progress':
        return <Badge className="bg-warning/10 text-warning border-warning/20">In Progress</Badge>
      case 'Pending':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getRatingBadge = (rating: string) => {
    switch (rating) {
      case 'Exceptional':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">Exceptional</Badge>
      case 'Exceeds Expectations':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">Exceeds Expectations</Badge>
      case 'Meets Expectations':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">Meets Expectations</Badge>
      case 'Needs Improvement':
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">Needs Improvement</Badge>
      case 'Below Expectations':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">Below Expectations</Badge>
      default:
        return <Badge variant="secondary">{rating}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Performance Reviews</h1>
          <p className="text-muted-foreground">Manage employee performance evaluations and feedback</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{reviews.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {reviews.filter(r => r.status === 'Completed').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {reviews.filter(r => r.status === 'Pending').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">4.2/5</div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews Table */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Reviews</CardTitle>
          <CardDescription>
            Track and manage employee performance evaluations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Review Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Overall Rating</TableHead>
                  <TableHead className="hidden md:table-cell">Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell className="font-medium">{review.employeeName}</TableCell>
                    <TableCell>{review.reviewPeriod}</TableCell>
                    <TableCell>{getStatusBadge(review.status)}</TableCell>
                    <TableCell>{getRatingBadge(review.overallRating)}</TableCell>
                    <TableCell className="hidden md:table-cell">{review.lastUpdated}</TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedReview(review)
                          setIsDialogOpen(true)
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        {review.status === 'Completed' ? 'View' : 'Edit'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Performance Review Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Performance Review - {selectedReview?.employeeName}</DialogTitle>
            <DialogDescription>
              {selectedReview?.reviewPeriod} Performance Evaluation
            </DialogDescription>
          </DialogHeader>
          
          {selectedReview && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="achievements">Key Achievements</Label>
                <Textarea
                  id="achievements"
                  value={selectedReview.achievements}
                  onChange={(e) => setSelectedReview({...selectedReview, achievements: e.target.value})}
                  placeholder="List key accomplishments and achievements..."
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="improvements">Areas for Improvement</Label>
                <Textarea
                  id="improvements"
                  value={selectedReview.improvements}
                  onChange={(e) => setSelectedReview({...selectedReview, improvements: e.target.value})}
                  placeholder="Identify areas where the employee can improve..."
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="summary">Manager Summary</Label>
                <Textarea
                  id="summary"
                  value={selectedReview.managerSummary}
                  onChange={(e) => setSelectedReview({...selectedReview, managerSummary: e.target.value})}
                  placeholder="Overall manager assessment and feedback..."
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rating">Overall Rating</Label>
                <Select 
                  value={selectedReview.overallRating} 
                  onValueChange={(value) => setSelectedReview({...selectedReview, overallRating: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Exceptional">Exceptional</SelectItem>
                    <SelectItem value="Exceeds Expectations">Exceeds Expectations</SelectItem>
                    <SelectItem value="Meets Expectations">Meets Expectations</SelectItem>
                    <SelectItem value="Needs Improvement">Needs Improvement</SelectItem>
                    <SelectItem value="Below Expectations">Below Expectations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveReview} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Save Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}