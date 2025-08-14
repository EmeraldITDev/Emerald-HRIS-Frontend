import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Upload, Info, Save, Send, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const formSchema = z.object({
  employeeName: z.string().min(2, "Employee name is required"),
  employeeId: z.string().min(1, "Employee ID is required"),
  department: z.string().min(1, "Department is required"),
  jobTitle: z.string().min(1, "Job title is required"),
  reportingManager: z.string().min(1, "Reporting manager is required"),
  appraisalPeriod: z.object({
    from: z.date(),
    to: z.date(),
  }),
})

interface KPA {
  id: string
  name: string
  description: string
  rating: number
  justification: string
}

interface BehavioralCompetency {
  id: string
  name: string
  rating: number
  comment: string
}

interface PerformanceReviewData {
  // Employee Information
  employeeName: string
  employeeId: string
  department: string
  jobTitle: string
  reportingManager: string
  appraisalPeriod: { from: Date; to: Date }
  
  // KPAs
  kpas: KPA[]
  
  // Behavioral Competencies
  competencies: BehavioralCompetency[]
  
  // Development & Feedback
  strengths: string
  areasForImprovement: string
  trainingNeeds: string
  careerAspirations: string
  
  // Overall Performance
  overallRating: number
  performanceSummary: string
  managerComment: string
  employeeComment: string
  
  // Sign-off
  employeeSignOff: boolean
  managerSignOff: boolean
  hrSignOff: boolean
  
  // Workflow
  stage: 'self-assessment' | 'manager-review' | 'hr-validation' | 'final-approval'
  status: 'draft' | 'submitted' | 'completed'
}

interface PerformanceReviewFormProps {
  reviewData?: PerformanceReviewData
  onSave: (data: PerformanceReviewData) => void
  onSubmit: (data: PerformanceReviewData) => void
  isReadOnly?: boolean
  currentUserRole: 'employee' | 'manager' | 'hr'
}

const defaultKPAs: KPA[] = [
  { id: '1', name: 'Goal Achievement', description: 'Ability to meet and exceed set objectives and targets', rating: 0, justification: '' },
  { id: '2', name: 'Quality of Work', description: 'Consistency and excellence in work output and deliverables', rating: 0, justification: '' },
  { id: '3', name: 'Productivity & Efficiency', description: 'Effective use of time and resources to maximize output', rating: 0, justification: '' },
  { id: '4', name: 'Problem Solving & Decision Making', description: 'Ability to analyze issues and make sound decisions', rating: 0, justification: '' },
  { id: '5', name: 'Initiative & Innovation', description: 'Proactive approach and creative problem-solving abilities', rating: 0, justification: '' },
  { id: '6', name: 'Teamwork & Collaboration', description: 'Effective collaboration and contribution to team success', rating: 0, justification: '' },
  { id: '7', name: 'Communication Skills', description: 'Clear and effective verbal and written communication', rating: 0, justification: '' },
]

const managerKPA: KPA = {
  id: '8', 
  name: 'Leadership & Management', 
  description: 'Ability to lead, motivate, and develop team members', 
  rating: 0, 
  justification: ''
}

const defaultCompetencies: BehavioralCompetency[] = [
  { id: '1', name: 'Adaptability & Flexibility', rating: 0, comment: '' },
  { id: '2', name: 'Professionalism & Integrity', rating: 0, comment: '' },
  { id: '3', name: 'Learning & Development Mindset', rating: 0, comment: '' },
  { id: '4', name: 'Customer/Stakeholder Orientation', rating: 0, comment: '' },
]

export default function PerformanceReviewForm({ 
  reviewData, 
  onSave, 
  onSubmit, 
  isReadOnly = false,
  currentUserRole 
}: PerformanceReviewFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<PerformanceReviewData>(() => {
    if (reviewData) return reviewData
    
    return {
      employeeName: '',
      employeeId: '',
      department: '',
      jobTitle: '',
      reportingManager: '',
      appraisalPeriod: { 
        from: new Date(new Date().getFullYear(), 0, 1),
        to: new Date(new Date().getFullYear(), 11, 31)
      },
      kpas: defaultKPAs,
      competencies: defaultCompetencies,
      strengths: '',
      areasForImprovement: '',
      trainingNeeds: '',
      careerAspirations: '',
      overallRating: 0,
      performanceSummary: '',
      managerComment: '',
      employeeComment: '',
      employeeSignOff: false,
      managerSignOff: false,
      hrSignOff: false,
      stage: 'self-assessment',
      status: 'draft'
    }
  })

  const { toast } = useToast()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeName: formData.employeeName,
      employeeId: formData.employeeId,
      department: formData.department,
      jobTitle: formData.jobTitle,
      reportingManager: formData.reportingManager,
      appraisalPeriod: formData.appraisalPeriod,
    }
  })

  // Auto-calculate overall rating
  useEffect(() => {
    const totalRatings = [...formData.kpas, ...formData.competencies]
    const avgRating = totalRatings.length > 0 
      ? totalRatings.reduce((sum, item) => sum + item.rating, 0) / totalRatings.length 
      : 0
    
    setFormData(prev => ({ ...prev, overallRating: Math.round(avgRating * 10) / 10 }))
  }, [formData.kpas, formData.competencies])

  // Auto-generate performance summary
  useEffect(() => {
    if (formData.overallRating > 0) {
      let summary = ''
      if (formData.overallRating >= 4.5) summary = 'Exceptional performance with outstanding contributions'
      else if (formData.overallRating >= 3.5) summary = 'Strong performance exceeding expectations'
      else if (formData.overallRating >= 2.5) summary = 'Good performance meeting expectations'
      else if (formData.overallRating >= 1.5) summary = 'Performance requires improvement'
      else summary = 'Performance significantly below expectations'
      
      setFormData(prev => ({ ...prev, performanceSummary: summary }))
    }
  }, [formData.overallRating])

  const handleKPAChange = (kpaId: string, field: 'rating' | 'justification', value: number | string) => {
    setFormData(prev => ({
      ...prev,
      kpas: prev.kpas.map(kpa => 
        kpa.id === kpaId ? { ...kpa, [field]: value } : kpa
      )
    }))
  }

  const handleCompetencyChange = (compId: string, field: 'rating' | 'comment', value: number | string) => {
    setFormData(prev => ({
      ...prev,
      competencies: prev.competencies.map(comp => 
        comp.id === compId ? { ...comp, [field]: value } : comp
      )
    }))
  }

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 5: return 'Exceptional'
      case 4: return 'Exceeds Expectations'
      case 3: return 'Meets Expectations'
      case 2: return 'Needs Improvement'
      case 1: return 'Below Expectations'
      default: return 'Not Rated'
    }
  }

  const getRatingColor = (rating: number) => {
    switch (rating) {
      case 5: return 'text-green-600'
      case 4: return 'text-blue-600'
      case 3: return 'text-yellow-600'
      case 2: return 'text-orange-600'
      case 1: return 'text-red-600'
      default: return 'text-muted-foreground'
    }
  }

  const steps = [
    { id: 1, title: 'Employee Info', description: 'Basic information and period' },
    { id: 2, title: 'KPAs', description: 'Key Performance Areas' },
    { id: 3, title: 'Competencies', description: 'Behavioral assessment' },
    { id: 4, title: 'Development', description: 'Growth and feedback' },
    { id: 5, title: 'Summary', description: 'Overall assessment' },
    { id: 6, title: 'Sign-off', description: 'Approval and submission' },
  ]

  const totalSteps = steps.length
  const progress = (currentStep / totalSteps) * 100

  const isManager = formData.jobTitle.toLowerCase().includes('manager') || 
                   formData.jobTitle.toLowerCase().includes('lead') ||
                   formData.jobTitle.toLowerCase().includes('supervisor')

  const kpasToShow = isManager ? [...formData.kpas, managerKPA] : formData.kpas

  const canEditStep = (step: number) => {
    if (isReadOnly) return false
    
    switch (formData.stage) {
      case 'self-assessment':
        return currentUserRole === 'employee' && step <= 4
      case 'manager-review':
        return currentUserRole === 'manager' && step >= 2
      case 'hr-validation':
        return currentUserRole === 'hr'
      case 'final-approval':
        return false
      default:
        return true
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Indicator */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Performance Review</h2>
              <p className="text-muted-foreground">Step {currentStep} of {totalSteps}</p>
            </div>
            <Badge variant="outline" className="capitalize">
              {formData.stage.replace('-', ' ')}
            </Badge>
          </div>
          <Progress value={progress} className="mt-4" />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            {steps.map((step) => (
              <span key={step.id} className={step.id === currentStep ? 'text-primary font-medium' : ''}>
                {step.title}
              </span>
            ))}
          </div>
        </CardHeader>
      </Card>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {steps[currentStep - 1]?.title}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{steps[currentStep - 1]?.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Employee Information */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employeeName">Employee Name</Label>
                <Input
                  id="employeeName"
                  value={formData.employeeName}
                  onChange={(e) => setFormData(prev => ({ ...prev, employeeName: e.target.value }))}
                  disabled={!canEditStep(1)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input
                  id="employeeId"
                  value={formData.employeeId}
                  onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                  disabled={!canEditStep(1)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="department">Department/Team</Label>
                <Select 
                  value={formData.department}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                  disabled={!canEditStep(1)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="HR">Human Resources</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                  disabled={!canEditStep(1)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reportingManager">Reporting Manager</Label>
                <Input
                  id="reportingManager"
                  value={formData.reportingManager}
                  onChange={(e) => setFormData(prev => ({ ...prev, reportingManager: e.target.value }))}
                  disabled={!canEditStep(1)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Appraisal Period</Label>
                <div className="flex items-center space-x-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" disabled={!canEditStep(1)}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.appraisalPeriod.from, "MMM dd, yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.appraisalPeriod.from}
                        onSelect={(date) => date && setFormData(prev => ({ 
                          ...prev, 
                          appraisalPeriod: { ...prev.appraisalPeriod, from: date } 
                        }))}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <span>to</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" disabled={!canEditStep(1)}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.appraisalPeriod.to, "MMM dd, yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.appraisalPeriod.to}
                        onSelect={(date) => date && setFormData(prev => ({ 
                          ...prev, 
                          appraisalPeriod: { ...prev.appraisalPeriod, to: date } 
                        }))}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Key Performance Areas */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {kpasToShow.map((kpa) => (
                <div key={kpa.id} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{kpa.name}</h4>
                      <p className="text-sm text-muted-foreground">{kpa.description}</p>
                    </div>
                    <Badge className={getRatingColor(kpa.rating)}>
                      {getRatingLabel(kpa.rating)}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label>Rating (1-5 scale)</Label>
                      <RadioGroup
                        value={kpa.rating.toString()}
                        onValueChange={(value) => handleKPAChange(kpa.id, 'rating', parseInt(value))}
                        className="flex gap-4 mt-2"
                        disabled={!canEditStep(2)}
                      >
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <div key={rating} className="flex items-center space-x-2">
                            <RadioGroupItem value={rating.toString()} id={`kpa-${kpa.id}-${rating}`} />
                            <Label htmlFor={`kpa-${kpa.id}-${rating}`} className="text-sm">
                              {rating}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                    
                    <div>
                      <Label>Examples/Justification</Label>
                      <Textarea
                        value={kpa.justification}
                        onChange={(e) => handleKPAChange(kpa.id, 'justification', e.target.value)}
                        placeholder="Provide specific examples and justification for this rating..."
                        className="min-h-[80px] mt-1"
                        disabled={!canEditStep(2)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 3: Behavioral Competencies */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {formData.competencies.map((competency) => (
                <div key={competency.id} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{competency.name}</h4>
                    <Badge className={getRatingColor(competency.rating)}>
                      {getRatingLabel(competency.rating)}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label>Rating (1-5 scale)</Label>
                      <RadioGroup
                        value={competency.rating.toString()}
                        onValueChange={(value) => handleCompetencyChange(competency.id, 'rating', parseInt(value))}
                        className="flex gap-4 mt-2"
                        disabled={!canEditStep(3)}
                      >
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <div key={rating} className="flex items-center space-x-2">
                            <RadioGroupItem value={rating.toString()} id={`comp-${competency.id}-${rating}`} />
                            <Label htmlFor={`comp-${competency.id}-${rating}`} className="text-sm">
                              {rating}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                    
                    <div>
                      <Label>Comments (Optional)</Label>
                      <Textarea
                        value={competency.comment}
                        onChange={(e) => handleCompetencyChange(competency.id, 'comment', e.target.value)}
                        placeholder="Additional comments about this competency..."
                        className="min-h-[60px] mt-1"
                        disabled={!canEditStep(3)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 4: Development & Feedback */}
          {currentStep === 4 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Strengths</Label>
                <Textarea
                  value={formData.strengths}
                  onChange={(e) => setFormData(prev => ({ ...prev, strengths: e.target.value }))}
                  placeholder="Key strengths demonstrated during this period..."
                  className="min-h-[100px]"
                  disabled={!canEditStep(4)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Areas for Improvement</Label>
                <Textarea
                  value={formData.areasForImprovement}
                  onChange={(e) => setFormData(prev => ({ ...prev, areasForImprovement: e.target.value }))}
                  placeholder="Areas where improvement is needed..."
                  className="min-h-[100px]"
                  disabled={!canEditStep(4)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Training Needs</Label>
                <Textarea
                  value={formData.trainingNeeds}
                  onChange={(e) => setFormData(prev => ({ ...prev, trainingNeeds: e.target.value }))}
                  placeholder="Recommended training and development opportunities..."
                  className="min-h-[100px]"
                  disabled={!canEditStep(4)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Career Aspirations</Label>
                <Textarea
                  value={formData.careerAspirations}
                  onChange={(e) => setFormData(prev => ({ ...prev, careerAspirations: e.target.value }))}
                  placeholder="Employee's career goals and aspirations..."
                  className="min-h-[100px]"
                  disabled={!canEditStep(4)}
                />
              </div>
              
              <div className="md:col-span-2">
                <Label>Supporting Documents</Label>
                <div className="mt-2 p-4 border-2 border-dashed rounded-lg text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Upload supporting evidence, certificates, or project documentation
                  </p>
                  <Button variant="outline" className="mt-2" size="sm" disabled={!canEditStep(4)}>
                    Choose Files
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Overall Performance Summary */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="text-center p-6 bg-muted/50 rounded-lg">
                <h3 className="text-2xl font-bold mb-2">Overall Rating</h3>
                <div className="text-4xl font-bold mb-2 text-primary">
                  {formData.overallRating}/5.0
                </div>
                <Badge className={`text-lg px-4 py-2 ${getRatingColor(Math.round(formData.overallRating))}`}>
                  {getRatingLabel(Math.round(formData.overallRating))}
                </Badge>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label>Auto-Generated Performance Summary</Label>
                  <Textarea
                    value={formData.performanceSummary}
                    onChange={(e) => setFormData(prev => ({ ...prev, performanceSummary: e.target.value }))}
                    className="min-h-[100px] mt-2"
                    disabled={!canEditStep(5)}
                  />
                </div>
                
                <div>
                  <Label>Manager Comments</Label>
                  <Textarea
                    value={formData.managerComment}
                    onChange={(e) => setFormData(prev => ({ ...prev, managerComment: e.target.value }))}
                    placeholder="Manager's detailed assessment and feedback..."
                    className="min-h-[100px] mt-2"
                    disabled={!canEditStep(5) || currentUserRole !== 'manager'}
                  />
                </div>
                
                <div>
                  <Label>Employee Response</Label>
                  <Textarea
                    value={formData.employeeComment}
                    onChange={(e) => setFormData(prev => ({ ...prev, employeeComment: e.target.value }))}
                    placeholder="Employee's response and acknowledgment..."
                    className="min-h-[100px] mt-2"
                    disabled={!canEditStep(5) || currentUserRole !== 'employee'}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Sign-off / Acknowledgment */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Important Notice</h4>
                <p className="text-sm text-yellow-700">
                  By signing off on this performance review, you acknowledge that you have reviewed 
                  and agree with the assessment. Once all parties have signed off, this review will be locked.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="employee-signoff"
                      checked={formData.employeeSignOff}
                      onCheckedChange={(checked) => setFormData(prev => ({ 
                        ...prev, 
                        employeeSignOff: checked as boolean 
                      }))}
                      disabled={currentUserRole !== 'employee'}
                    />
                    <div>
                      <Label htmlFor="employee-signoff" className="font-medium">Employee Acknowledgment</Label>
                      <p className="text-sm text-muted-foreground">
                        I acknowledge that I have reviewed this performance assessment
                      </p>
                    </div>
                  </div>
                  {formData.employeeSignOff && <CheckCircle className="h-5 w-5 text-green-600" />}
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="manager-signoff"
                      checked={formData.managerSignOff}
                      onCheckedChange={(checked) => setFormData(prev => ({ 
                        ...prev, 
                        managerSignOff: checked as boolean 
                      }))}
                      disabled={currentUserRole !== 'manager'}
                    />
                    <div>
                      <Label htmlFor="manager-signoff" className="font-medium">Manager Approval</Label>
                      <p className="text-sm text-muted-foreground">
                        I approve this performance assessment as accurate
                      </p>
                    </div>
                  </div>
                  {formData.managerSignOff && <CheckCircle className="h-5 w-5 text-green-600" />}
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="hr-signoff"
                      checked={formData.hrSignOff}
                      onCheckedChange={(checked) => setFormData(prev => ({ 
                        ...prev, 
                        hrSignOff: checked as boolean 
                      }))}
                      disabled={currentUserRole !== 'hr'}
                    />
                    <div>
                      <Label htmlFor="hr-signoff" className="font-medium">HR Validation</Label>
                      <p className="text-sm text-muted-foreground">
                        HR has validated this performance review for compliance
                      </p>
                    </div>
                  </div>
                  {formData.hrSignOff && <CheckCircle className="h-5 w-5 text-green-600" />}
                </div>
              </div>
              
              <div className="p-4 bg-muted/50 rounded-lg">
                <h5 className="font-medium mb-2">Audit Trail</h5>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Created: {format(new Date(), 'PPpp')}</div>
                  <div>Last Modified: {format(new Date(), 'PPpp')}</div>
                  <div>Status: {formData.status}</div>
                  <div>Stage: {formData.stage}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
        >
          Previous
        </Button>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onSave(formData)}
            disabled={isReadOnly}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          
          {currentStep < totalSteps ? (
            <Button
              onClick={() => setCurrentStep(Math.min(totalSteps, currentStep + 1))}
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={() => onSubmit(formData)}
              disabled={!formData.employeeSignOff || !formData.managerSignOff || !formData.hrSignOff}
              className="bg-green-600 hover:bg-green-700"
            >
              <Send className="h-4 w-4 mr-2" />
              Submit Review
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}