import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Eye, FileText, Loader2 } from "lucide-react"
import apiService from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

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

interface Doc {
  type: string
  filename: string
  size?: number
  uploaded_at?: string
  key: string
}

const formatSize = (b?: number) => {
  if (!b) return "—"
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

export function EmployeeDocumentsReadOnly({ employeeId }: { employeeId: number }) {
  const { toast } = useToast()
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [busyKey, setBusyKey] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    apiService
      .getEmployeeDocuments(employeeId)
      .then((res: any) => {
        if (!cancelled) setDocs(res?.documents || [])
      })
      .catch(() => {
        if (!cancelled) setDocs([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [employeeId])

  const open = async (doc: Doc, download: boolean) => {
    const tag = `${download ? "dl" : "view"}-${doc.key}`
    setBusyKey(tag)
    try {
      const { url } = await apiService.getDocumentUrl(employeeId, doc.type, download)
      if (download) {
        const a = document.createElement("a")
        a.href = url
        a.download = doc.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } else {
        window.open(url, "_blank")
      }
    } catch (e: any) {
      toast({
        title: download ? "Download failed" : "View failed",
        description: e?.message || "Could not generate document link.",
        variant: "destructive",
      })
    } finally {
      setBusyKey(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading documents…
      </div>
    )
  }

  if (docs.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No documents uploaded.</p>
  }

  return (
    <div className="space-y-2">
      {docs.map((doc) => (
        <div
          key={doc.key}
          className="flex items-center justify-between gap-3 rounded-md border bg-card/40 p-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{doc.filename}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="secondary" className="text-xs">
                  {DOCUMENT_TYPE_LABELS[doc.type] || doc.type}
                </Badge>
                <span className="text-xs text-muted-foreground">{formatSize(doc.size)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => open(doc, false)}
              disabled={busyKey === `view-${doc.key}`}
            >
              {busyKey === `view-${doc.key}` ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => open(doc, true)}
              disabled={busyKey === `dl-${doc.key}`}
            >
              {busyKey === `dl-${doc.key}` ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}