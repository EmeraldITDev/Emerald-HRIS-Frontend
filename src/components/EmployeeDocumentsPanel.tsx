import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
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
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import apiService from "@/lib/api"
import {
  Upload,
  Download,
  Eye,
  Trash2,
  FileText,
  RefreshCw,
  Loader2,
  File,
  Image,
  FileArchive,
  AlertCircle,
} from "lucide-react"

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  national_id: "National ID",
  passport: "Passport",
  bvn_doc: "BVN Document",
  tin_doc: "TIN Document",
  pension_doc: "Pension Document",
  nhf_doc: "NHF Document",
  contract: "Contract",
  certificate: "Certificate",
  onboarding: "Onboarding Document",
  profile_picture: "Profile Picture",
  supporting_docs: "Supporting Documents",
}

const DOCUMENT_TYPE_ICONS: Record<string, typeof FileText> = {
  profile_picture: Image,
  national_id: FileText,
  passport: FileText,
  certificate: FileArchive,
  contract: FileText,
}

interface EmployeeDocument {
  type: string
  filename: string
  size?: number
  uploaded_by?: string
  uploaded_at?: string
  key: string
}

interface EmployeeDocumentsPanelProps {
  employeeId: number
  employeeName: string
}

export function EmployeeDocumentsPanel({ employeeId, employeeName }: EmployeeDocumentsPanelProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [documents, setDocuments] = useState<EmployeeDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [uploadingType, setUploadingType] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedType, setSelectedType] = useState<string>("supporting_docs")
  const [deleteTarget, setDeleteTarget] = useState<EmployeeDocument | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const isAdmin = user?.role && ['executive', 'hr_manager', 'corporate_hr'].includes(user.role)

  useEffect(() => {
    fetchDocuments()
  }, [employeeId])

  const fetchDocuments = async () => {
    setIsLoading(true)
    try {
      const response = await apiService.getEmployeeDocuments(employeeId)
      setDocuments(response.documents || [])
    } catch (error: any) {
      console.error("Failed to fetch documents:", error)
      // Gracefully handle - employee may have no documents yet (404)
      if (error?.message?.includes("404")) {
        setDocuments([])
      } else {
        toast({
          title: "Error",
          description: "Failed to load documents. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Maximum file size is 10MB.",
        variant: "destructive",
      })
      return
    }

    setUploadingType(selectedType)
    setUploadProgress(0)

    try {
      await apiService.uploadDocument(employeeId, selectedType, file, (percent) => {
        setUploadProgress(percent)
      })

      toast({
        title: "Upload Successful",
        description: `${file.name} has been uploaded as ${DOCUMENT_TYPE_LABELS[selectedType] || selectedType}.`,
      })

      await fetchDocuments()
    } catch (error: any) {
      console.error("Upload failed:", error)
      const message = error?.message?.includes("403")
        ? "You don't have permission to upload documents."
        : error?.message?.includes("404")
        ? "Upload endpoint not found. Please check backend configuration."
        : "Failed to upload document. Please try again."

      toast({
        title: "Upload Failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setUploadingType(null)
      setUploadProgress(0)
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleView = async (doc: EmployeeDocument) => {
    setActionLoading(`view-${doc.key}`)
    try {
      const { url } = await apiService.getDocumentUrl(employeeId, doc.type, false)
      window.open(url, "_blank")
    } catch (error: any) {
      console.error("Failed to get view URL:", error)
      toast({
        title: "View Failed",
        description: error?.message?.includes("404")
          ? "Document not found on storage."
          : "Failed to generate view link.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDownload = async (doc: EmployeeDocument) => {
    setActionLoading(`download-${doc.key}`)
    try {
      const { url } = await apiService.getDocumentUrl(employeeId, doc.type, true)
      const a = document.createElement("a")
      a.href = url
      a.download = doc.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      toast({
        title: "Download Started",
        description: `Downloading ${doc.filename}`,
      })
    } catch (error: any) {
      console.error("Failed to get download URL:", error)
      toast({
        title: "Download Failed",
        description: error?.message?.includes("404")
          ? "Document not found on storage."
          : "Failed to generate download link.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return

    setIsDeleting(true)
    try {
      await apiService.deleteDocument(employeeId, deleteTarget.type, deleteTarget.filename)
      toast({
        title: "Document Deleted",
        description: `${deleteTarget.filename} has been removed.`,
      })
      await fetchDocuments()
    } catch (error: any) {
      console.error("Failed to delete document:", error)
      toast({
        title: "Delete Failed",
        description: error?.message?.includes("403")
          ? "You don't have permission to delete this document."
          : "Failed to delete document.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "—"
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getDocIcon = (doc: EmployeeDocument) => {
    const IconComp = DOCUMENT_TYPE_ICONS[doc.type] || File
    return <IconComp className="h-5 w-5 text-muted-foreground" />
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Documents</span>
            <Badge variant="secondary" className="ml-2">{documents.length}</Badge>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={fetchDocuments} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Upload Section - only for admins */}
          {isAdmin && (
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-semibold">Upload Document</h4>
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
                <div className="flex-1 w-full sm:w-auto">
                  <label className="text-xs text-muted-foreground mb-1 block">Document Type</label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-full sm:w-[220px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleUploadClick}
                  disabled={!!uploadingType}
                  size="sm"
                >
                  {uploadingType ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-1" />
                  )}
                  {uploadingType ? "Uploading..." : "Choose File"}
                </Button>
              </div>

              {uploadingType && (
                <div className="space-y-1">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground">{uploadProgress}% uploaded</p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                onChange={handleFileSelected}
              />
              <p className="text-xs text-muted-foreground">
                Accepted: PDF, DOC, DOCX, JPG, PNG, WEBP • Max 10MB
              </p>
            </div>
          )}

          <Separator />

          {/* Document List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
              {isAdmin && (
                <p className="text-xs text-muted-foreground mt-1">
                  Use the upload section above to add documents.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc, index) => (
                <div
                  key={`${doc.key}-${index}`}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getDocIcon(doc)}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{doc.filename}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-xs">
                          {DOCUMENT_TYPE_LABELS[doc.type] || doc.type}
                        </Badge>
                        {doc.size && (
                          <span className="text-xs text-muted-foreground">{formatFileSize(doc.size)}</span>
                        )}
                        {doc.uploaded_at && (
                          <span className="text-xs text-muted-foreground">{formatDate(doc.uploaded_at)}</span>
                        )}
                        {doc.uploaded_by && (
                          <span className="text-xs text-muted-foreground">by {doc.uploaded_by}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleView(doc)}
                      disabled={actionLoading === `view-${doc.key}`}
                      title="View"
                    >
                      {actionLoading === `view-${doc.key}` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownload(doc)}
                      disabled={actionLoading === `download-${doc.key}`}
                      title="Download"
                    >
                      {actionLoading === `download-${doc.key}` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(doc)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.filename}</strong>?
              This action cannot be undone and will permanently remove the file from storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
