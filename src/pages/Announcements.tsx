import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import apiService, { type Announcement as APIAnnouncement } from "@/lib/api"
import { DEPARTMENTS } from "@/constants/departments"
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
  MessageSquare,
  Pencil,
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
  createdById?: string
}

interface AnnouncementComment {
  id: string | number
  author: string
  content: string
  createdAt: string
}


export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [allEmployees, setAllEmployees] = useState<any[]>([])
  const [targetMode, setTargetMode] = useState<'all' | 'department' | 'individual'>('all')
  const [targetDepartments, setTargetDepartments] = useState<string[]>([])
  const [targetEmployeeIds, setTargetEmployeeIds] = useState<number[]>([])
  const [comments, setComments] = useState<Record<string, AnnouncementComment[]>>({})
  const [newCommentText, setNewCommentText] = useState<Record<string, string>>({})
  
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [currentAnnouncement, setCurrentAnnouncement] = useState<Partial<Announcement>>({
    title: '',
    content: '',
    author: 'HR Department',
    status: 'draft'
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { user } = useAuth()
  
  const canCreateAnnouncements = user?.role === 'hr_manager' || user?.role === 'executive'
  
  // Fetch announcements from API
  useEffect(() => {
    fetchAnnouncements()
    apiService.getEmployees().then((d) => setAllEmployees(Array.isArray(d) ? d : [])).catch(() => setAllEmployees([]))
  }, [])
  
  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true)
      const data = await apiService.getAnnouncements()
      // Map API data to local format
      const mappedAnnouncements: Announcement[] = data.map(ann => ({
        id: ann.id?.toString() || '',
        title: ann.title,
        content: ann.content,
        author: (ann as any).createdBy?.name || (user?.firstName ? `${user.firstName} ${user.lastName}` : 'HR Department'),
        createdAt: ann.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        status: 'published',
        recipients: ann.target_audience ? [ann.target_audience] : ['all_employees'],
        createdById: ((ann as any).createdBy?.id ?? ann.created_by)?.toString(),
      }))
      setAnnouncements(mappedAnnouncements)
      // Fetch comment threads for each announcement in parallel
      const threads = await Promise.all(
        mappedAnnouncements.map(async (a) => {
          try {
            const detail = await apiService.getAnnouncement(a.id)
            const flat: AnnouncementComment[] = []
            const walk = (list: any[]) => {
              if (!Array.isArray(list)) return
              list.forEach((c) => {
                flat.push({
                  id: c.id,
                  author: c.author?.name || 'User',
                  content: c.content,
                  createdAt: c.created_at,
                })
                if (Array.isArray(c.replies)) walk(c.replies)
              })
            }
            walk(detail?.comments || [])
            return [a.id, flat] as [string, AnnouncementComment[]]
          } catch {
            return [a.id, [] as AnnouncementComment[]] as [string, AnnouncementComment[]]
          }
        })
      )
      const map: Record<string, AnnouncementComment[]> = {}
      threads.forEach(([id, list]) => { map[id] = list })
      setComments(map)
    } catch (error) {
      console.error('Failed to fetch announcements:', error)
      setAnnouncements([])
    } finally {
      setIsLoading(false)
    }
  }

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

  const handleSave = async () => {
    if (!currentAnnouncement.title || !currentAnnouncement.content) {
      toast({
        title: "Error",
        description: "Please provide both title and content",
        variant: "destructive"
      })
      return
    }

    try {
      const announcementData = {
        title: currentAnnouncement.title!,
        content: currentAnnouncement.content!,
        priority: 'medium' as const,
        target_audience: buildTargetAudience(),
        target_department_ids: targetMode === 'department' ? targetDepartments : undefined,
        target_employee_ids: targetMode === 'individual' ? targetEmployeeIds : undefined,
      } as any

      if (editingId) {
        await apiService.updateAnnouncement(Number(editingId), announcementData)
      } else {
        await apiService.createAnnouncement(announcementData)
      }
      await fetchAnnouncements()
      
      setCurrentAnnouncement({ title: '', content: '', author: 'HR Department', status: 'draft' })
      resetTargeting()
      setIsCreating(false)
      setEditingId(null)
      
      toast({
        title: "Success",
        description: editingId ? "Announcement updated" : "Announcement saved as draft"
      })
    } catch (error) {
      console.error('Failed to save announcement:', error)
      toast({
        title: "Error",
        description: "Failed to save announcement. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleShare = async () => {
    if (!currentAnnouncement.title || !currentAnnouncement.content) {
      toast({
        title: "Error",
        description: "Please provide both title and content",
        variant: "destructive"
      })
      return
    }

    try {
      const announcementData = {
        title: currentAnnouncement.title!,
        content: currentAnnouncement.content!,
        priority: 'high' as const,
        target_audience: buildTargetAudience(),
        target_department_ids: targetMode === 'department' ? targetDepartments : undefined,
        target_employee_ids: targetMode === 'individual' ? targetEmployeeIds : undefined,
      } as any

      if (editingId) {
        await apiService.updateAnnouncement(Number(editingId), announcementData)
      } else {
        await apiService.createAnnouncement(announcementData)
      }
      await fetchAnnouncements()
      
      setCurrentAnnouncement({ title: '', content: '', author: 'HR Department', status: 'draft' })
      resetTargeting()
      setIsCreating(false)
      setEditingId(null)

      // Simulate sending newsletter to all employees
      toast({
        title: editingId ? "Announcement updated" : "Newsletter Sent!",
        description: editingId ? "Your changes are live" : "Announcement has been shared with all employees via email"
      })
    } catch (error) {
      console.error('Failed to publish announcement:', error)
      toast({
        title: "Error",
        description: "Failed to publish announcement. Please try again.",
        variant: "destructive"
      })
    }
  }

  const buildTargetAudience = () => {
    if (targetMode === 'all') return 'all_employees'
    if (targetMode === 'department') return 'department'
    return 'individual'
  }

  const resetTargeting = () => {
    setTargetMode('all')
    setTargetDepartments([])
    setTargetEmployeeIds([])
  }

  const startEdit = (ann: Announcement) => {
    setCurrentAnnouncement({
      title: ann.title,
      content: ann.content,
      author: ann.author,
      status: ann.status,
    })
    setEditingId(ann.id)
    setIsCreating(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement? This cannot be undone.')) return
    try {
      await apiService.deleteAnnouncement(Number(id))
      setAnnouncements((prev) => prev.filter((a) => a.id !== id))
      toast({ title: 'Deleted', description: 'Announcement removed' })
    } catch (e: any) {
      toast({ title: 'Failed to delete', description: e?.message, variant: 'destructive' })
    }
  }

  const canManage = (ann: Announcement) => {
    if (!user) return false
    if (user.role === 'hr_manager' || user.role === 'executive') return true
    return !!ann.createdById && ann.createdById === user.id
  }

  const addComment = async (announcementId: string) => {
    const text = (newCommentText[announcementId] || '').trim()
    if (!text) return
    try {
      await apiService.addAnnouncementComment(announcementId, text)
      // Reload thread for this announcement
      const detail = await apiService.getAnnouncement(announcementId)
      const flat: AnnouncementComment[] = []
      const walk = (list: any[]) => {
        if (!Array.isArray(list)) return
        list.forEach((c) => {
          flat.push({
            id: c.id,
            author: c.author?.name || 'User',
            content: c.content,
            createdAt: c.created_at,
          })
          if (Array.isArray(c.replies)) walk(c.replies)
        })
      }
      walk(detail?.comments || [])
      setComments((prev) => ({ ...prev, [announcementId]: flat }))
      setNewCommentText((prev) => ({ ...prev, [announcementId]: '' }))
      toast({ title: 'Comment posted' })
    } catch (e: any) {
      toast({ title: 'Failed to post comment', description: e?.message, variant: 'destructive' })
    }
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
            onClick={() => { setIsCreating(false); setEditingId(null); }}
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

            {/* Recipient Targeting */}
            <div className="space-y-3 rounded-md border p-4">
              <Label className="font-semibold">Who should receive this announcement?</Label>
              <Select value={targetMode} onValueChange={(v: any) => setTargetMode(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Entire Company</SelectItem>
                  <SelectItem value="department">Specific Department(s)</SelectItem>
                  <SelectItem value="individual">Individual Staff</SelectItem>
                </SelectContent>
              </Select>

              {targetMode === 'department' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{targetDepartments.length} department(s) selected</span>
                    <Button type="button" size="sm" variant="outline" onClick={() => setTargetDepartments(targetDepartments.length === DEPARTMENTS.length ? [] : [...DEPARTMENTS])}>
                      {targetDepartments.length === DEPARTMENTS.length ? 'Clear All' : 'Select All'}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                    {DEPARTMENTS.map((dept) => (
                      <label key={dept} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={targetDepartments.includes(dept)}
                          onCheckedChange={(c) =>
                            setTargetDepartments((prev) => c ? [...prev, dept] : prev.filter((d) => d !== dept))
                          }
                        />
                        {dept}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {targetMode === 'individual' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{targetEmployeeIds.length} employee(s) selected</span>
                    <Button type="button" size="sm" variant="outline" onClick={() => {
                      const all = allEmployees.map(e => e.id).filter(Boolean)
                      setTargetEmployeeIds(targetEmployeeIds.length === all.length ? [] : all)
                    }}>
                      {targetEmployeeIds.length === allEmployees.length && allEmployees.length > 0 ? 'Clear All' : 'Select All'}
                    </Button>
                  </div>
                  <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1">
                    {allEmployees.map((emp) => (
                      <label key={emp.id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={targetEmployeeIds.includes(emp.id)}
                          onCheckedChange={(c) =>
                            setTargetEmployeeIds((prev) => c ? [...prev, emp.id] : prev.filter((id) => id !== emp.id))
                          }
                        />
                        {emp.first_name} {emp.last_name} {emp.department ? `— ${emp.department}` : ''}
                      </label>
                    ))}
                  </div>
                </div>
              )}
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
          <h1 className="text-3xl font-bold text-foreground">Announcements</h1>
          <p className="text-muted-foreground">Company communications and updates</p>
        </div>
        {canCreateAnnouncements && (
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Announcement
          </Button>
        )}
      </div>


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
                  {canManage(announcement) && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => startEdit(announcement)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(announcement.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </>
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

              {/* Comments */}
              <div className="mt-4 pt-4 border-t space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MessageSquare className="h-4 w-4" />
                  Comments ({(comments[announcement.id] || []).length})
                </div>
                <div className="space-y-2">
                  {(comments[announcement.id] || []).map((c) => (
                    <div key={c.id} className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{c.author}</span>
                        <span>{new Date(c.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap">{c.content}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Textarea
                    rows={2}
                    placeholder="Write a comment…"
                    value={newCommentText[announcement.id] || ''}
                    onChange={(e) => setNewCommentText((prev) => ({ ...prev, [announcement.id]: e.target.value }))}
                  />
                  <Button size="sm" onClick={() => addComment(announcement.id)}>Post</Button>
                </div>
              </div>
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
                    {canCreateAnnouncements 
                      ? "Create your first announcement to share updates with your team"
                      : "Check back later for company updates"
                    }
                  </p>
                </div>
                {canCreateAnnouncements && (
                  <Button onClick={() => setIsCreating(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Announcement
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}