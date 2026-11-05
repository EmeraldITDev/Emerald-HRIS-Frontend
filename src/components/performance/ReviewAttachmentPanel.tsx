import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileText, Loader2, Trash2, Upload } from "lucide-react";
import { apiService } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export type ReviewAttachment = {
  id: number;
  stage: string;
  original_filename: string;
  locked?: boolean;
  uploaded_by?: string;
  created_at?: string;
  objective_id?: number | null;
};

type Props = {
  reviewId: number;
  stage: "self_assessment" | "discussion" | "acknowledgement" | "objective" | "hr_review";
  objectiveId?: number | null;
  canUpload: boolean;
  title?: string;
  description?: string;
};

export function ReviewAttachmentPanel({
  reviewId,
  stage,
  objectiveId = null,
  canUpload,
  title = "Supporting documents",
  description,
}: Props) {
  const { toast } = useToast();
  const [items, setItems] = useState<ReviewAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await apiService.listPerformanceAttachments(reviewId, stage);
      const rows = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setItems(
        objectiveId != null
          ? rows.filter((r: ReviewAttachment) => Number(r.objective_id) === Number(objectiveId))
          : rows,
      );
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [reviewId, stage, objectiveId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onUpload = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await apiService.uploadPerformanceAttachment(reviewId, file, stage, objectiveId ?? undefined);
      toast({ title: "Document uploaded" });
      await load();
    } catch (e: any) {
      toast({
        title: "Upload failed",
        description: e?.message || "Could not upload the document.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const onDownload = async (attachment: ReviewAttachment) => {
    try {
      const blob = await apiService.downloadPerformanceAttachment(reviewId, attachment.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.original_filename || "document";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast({
        title: "Download failed",
        description: e?.message,
        variant: "destructive",
      });
    }
  };

  const onDelete = async (attachment: ReviewAttachment) => {
    if (attachment.locked) {
      toast({
        title: "Cannot delete",
        description: "Documents cannot be deleted after this stage is submitted.",
        variant: "destructive",
      });
      return;
    }
    try {
      await apiService.deletePerformanceAttachment(reviewId, attachment.id);
      toast({ title: "Document deleted" });
      await load();
    } catch (e: any) {
      toast({
        title: "Delete failed",
        description: e?.message || "This document may already be locked.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-3 rounded-md border p-3">
      <div>
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </div>
      {loading ? (
        <p className="text-xs text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading documents…
        </p>
      ) : items.length === 0 ? (
        <p className="text-xs text-muted-foreground">No documents uploaded yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-2 text-sm border rounded-md px-2 py-1.5"
            >
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <button
                type="button"
                className="flex-1 min-w-0 text-left truncate hover:underline"
                onClick={() => onDownload(item)}
              >
                {item.original_filename}
              </button>
              {canUpload && !item.locked && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => onDelete(item)}
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {canUpload && (
        <div className="space-y-1">
          <Label htmlFor={`perf-attach-${stage}-${objectiveId ?? "x"}`}>Upload document</Label>
          <div className="flex items-center gap-2">
            <InputFile
              id={`perf-attach-${stage}-${objectiveId ?? "x"}`}
              disabled={uploading}
              onChange={onUpload}
            />
            {uploading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
        </div>
      )}
    </div>
  );
}

function InputFile({
  id,
  disabled,
  onChange,
}: {
  id: string;
  disabled?: boolean;
  onChange: (files: FileList | null) => void;
}) {
  return (
    <label
      htmlFor={id}
      className={`inline-flex items-center gap-2 text-xs border rounded-md px-3 py-2 cursor-pointer hover:bg-muted/50 ${
        disabled ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      <Upload className="h-3.5 w-3.5" />
      Upload document
      <input
        id={id}
        type="file"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          onChange(e.target.files);
          e.target.value = "";
        }}
      />
    </label>
  );
}

export default ReviewAttachmentPanel;
