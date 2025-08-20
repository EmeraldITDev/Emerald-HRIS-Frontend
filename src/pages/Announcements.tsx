import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { 
  Plus, 
  Save, 
  Send, 
  Eye, 
  Calendar, 
  User,
  ImageIcon,
  LinkIcon,
  Type,
  Palette,
  FileText,
  Upload,
  Download,
  Trash2
} from "lucide-react"
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

interface Announcement {
  id: string
  title: string
  content: string
  author: string
  createdAt: string
  status: 'draft' | 'published'
  recipients?: string[]
}

interface Policy {
  id: string
  name: string
  file: File
  uploadedAt: string
  uploadedBy: string
  size: string
  type: string
}

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: '1',
      title: 'Company Holiday Schedule',
      content: '<p>Please be advised of the upcoming holiday schedule...</p>',
      author: 'HR Department',
      createdAt: '2024-01-15',
      status: 'published',
      recipients: ['all_employees']
    }
  ])
  
  const [isCreating, setIsCreating] = useState(false)
  const [currentAnnouncement, setCurrentAnnouncement] = useState<Partial<Announcement>>({
    title: '',
    content: '',
    author: 'HR Department',
    status: 'draft'
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const policyFileInputRef = useRef<HTMLInputElement>(null)
  const [policies, setPolicies] = useState<Policy[]>([])
  const { toast } = useToast()

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['blockquote', 'code-block'],
      ['clean']
    ]
  }

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'list', 'bullet', 'indent',
    'direction', 'align',
    'link', 'image', 'video',
    'blockquote', 'code-block'
  ]

  const handleSave = () => {
    if (!currentAnnouncement.title || !currentAnnouncement.content) {
      toast({
        title: "Error",
        description: "Please provide both title and content",
        variant: "destructive"
      })
      return
    }

    const newAnnouncement: Announcement = {
      id: Date.now().toString(),
      title: currentAnnouncement.title!,
      content: currentAnnouncement.content!,
      author: currentAnnouncement.author || 'HR Department',
      createdAt: new Date().toISOString().split('T')[0],
      status: 'draft'
    }

    setAnnouncements(prev => [newAnnouncement, ...prev])
    setCurrentAnnouncement({ title: '', content: '', author: 'HR Department', status: 'draft' })
    setIsCreating(false)
    
    toast({
      title: "Success",
      description: "Announcement saved as draft"
    })
  }

  const handleShare = () => {
    if (!currentAnnouncement.title || !currentAnnouncement.content) {
      toast({
        title: "Error",
        description: "Please provide both title and content",
        variant: "destructive"
      })
      return
    }

    const newAnnouncement: Announcement = {
      id: Date.now().toString(),
      title: currentAnnouncement.title!,
      content: currentAnnouncement.content!,
      author: currentAnnouncement.author || 'HR Department',
      createdAt: new Date().toISOString().split('T')[0],
      status: 'published',
      recipients: ['all_employees']
    }

    setAnnouncements(prev => [newAnnouncement, ...prev])
    setCurrentAnnouncement({ title: '', content: '', author: 'HR Department', status: 'draft' })
    setIsCreating(false)

    // Simulate sending newsletter to all employees
    toast({
      title: "Newsletter Sent!",
      description: "Announcement has been shared with all employees via email"
    })
  }

  const handleImageUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // In a real app, you would upload the file and get a URL
      toast({
        title: "Image Selected",
        description: `${file.name} ready to upload`
      })
    }
  }

  const publishDraft = (id: string) => {
    setAnnouncements(prev => 
      prev.map(ann => 
        ann.id === id 
          ? { ...ann, status: 'published' as const, recipients: ['all_employees'] }
          : ann
      )
    )
    
    toast({
      title: "Published!",
      description: "Announcement has been shared with all employees"
    })
  }

  const handlePolicyUpload = () => {
    policyFileInputRef.current?.click()
  }

  const handlePolicyFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive"
        })
        return
      }

      const policy: Policy = {
        id: Date.now().toString(),
        name: file.name,
        file: file,
        uploadedAt: new Date().toISOString().split('T')[0],
        uploadedBy: 'HR Department',
        size: formatFileSize(file.size),
        type: file.type || 'Unknown'
      }

      setPolicies(prev => [policy, ...prev])
      
      toast({
        title: "Policy Uploaded",
        description: `${file.name} has been uploaded successfully`
      })
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const downloadPolicy = (policy: Policy) => {
    const url = URL.createObjectURL(policy.file)
    const a = document.createElement('a')
    a.href = url
    a.download = policy.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Download Started",
      description: `Downloading ${policy.name}`
    })
  }

  const previewPolicy = (policy: Policy) => {
    const url = URL.createObjectURL(policy.file)
    window.open(url, '_blank')
    
    toast({
      title: "Opening Preview",
      description: `Opening ${policy.name} in new tab`
    })
  }

  const deletePolicy = (policyId: string) => {
    setPolicies(prev => prev.filter(p => p.id !== policyId))
    
    toast({
      title: "Policy Deleted",
      description: "Policy has been removed"
    })
  }

  if (isCreating) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Create Announcement</h1>
            <p className="text-muted-foreground">Write and share updates with your team</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setIsCreating(false)}
          >
            Back to Announcements
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Type className="mr-2 h-5 w-5" />
              Announcement Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter announcement title"
                value={currentAnnouncement.title}
                onChange={(e) => setCurrentAnnouncement(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                placeholder="Enter author name"
                value={currentAnnouncement.author}
                onChange={(e) => setCurrentAnnouncement(prev => ({ ...prev, author: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Content</Label>
              <div className="border rounded-md">
                <ReactQuill
                  theme="snow"
                  value={currentAnnouncement.content}
                  onChange={(content) => setCurrentAnnouncement(prev => ({ ...prev, content }))}
                  modules={modules}
                  formats={formats}
                  placeholder="Write your announcement here..."
                  style={{ minHeight: '300px' }}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleImageUpload}
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                Add Image
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              {selectedFile && (
                <Badge variant="secondary">
                  {selectedFile.name}
                </Badge>
              )}
            </div>

            <Separator />

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </Button>
              <Button onClick={handleShare}>
                <Send className="mr-2 h-4 w-4" />
                Share with Employees
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Announcements & Policies</h1>
          <p className="text-muted-foreground">Company communications, updates, and policy documents</p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Announcement
        </Button>
      </div>

      {/* Company Policies Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              <CardTitle>Company Policies</CardTitle>
            </div>
            <Button onClick={handlePolicyUpload} size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Upload Policy
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <input
            type="file"
            ref={policyFileInputRef}
            onChange={handlePolicyFileChange}
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
          />
          
          {policies.length > 0 ? (
            <div className="space-y-3">
              {policies.map((policy) => (
                <div key={policy.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-medium">{policy.name}</h4>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{policy.size}</span>
                        <span>•</span>
                        <span>Uploaded on {policy.uploadedAt}</span>
                        <span>•</span>
                        <span>By {policy.uploadedBy}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => previewPolicy(policy)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => downloadPolicy(policy)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deletePolicy(policy.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No policies uploaded yet</h3>
              <p className="text-muted-foreground mb-4">
                Upload company policy documents for employees to access
              </p>
              <Button onClick={handlePolicyUpload} variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Upload Your First Policy
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {announcements.map((announcement) => (
          <Card key={announcement.id} className="border-border/50 shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-xl">{announcement.title}</CardTitle>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <User className="mr-1 h-4 w-4" />
                      {announcement.author}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="mr-1 h-4 w-4" />
                      {announcement.createdAt}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={announcement.status === 'published' ? 'default' : 'secondary'}
                  >
                    {announcement.status}
                  </Badge>
                  {announcement.status === 'draft' && (
                    <Button
                      size="sm"
                      onClick={() => publishDraft(announcement.id)}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Publish
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: announcement.content }}
              />
              {announcement.recipients && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Sent to: {announcement.recipients.includes('all_employees') ? 'All Employees' : announcement.recipients.join(', ')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {announcements.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="space-y-4">
                <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">No announcements yet</h3>
                  <p className="text-muted-foreground">
                    Create your first announcement to share updates with your team
                  </p>
                </div>
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Announcement
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}