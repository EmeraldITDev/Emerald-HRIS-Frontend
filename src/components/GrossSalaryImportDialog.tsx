import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";

interface ImportRow {
  line?: number;
  employee_name?: string;
  employee_id?: number | null;
  gross_salary?: number | null;
  status: string;
  reason?: string;
}

interface ImportResponse {
  success: boolean;
  message?: string;
  summary?: {
    total_rows: number;
    updated: number;
    skipped: number;
    failed: number;
    dry_run: boolean;
  };
  rows?: ImportRow[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatNaira = (n: number | null | undefined) =>
  typeof n === "number"
    ? `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`
    : "—";

const statusTone = (status: string): { label: string; cls: string } => {
  const s = status.toLowerCase();
  if (s === "updated" || s === "would_update")
    return { label: status, cls: "bg-green-500/15 text-green-600 border-green-500/30" };
  if (s === "skipped")
    return { label: status, cls: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30" };
  if (s === "failed")
    return { label: status, cls: "bg-destructive/15 text-destructive border-destructive/30" };
  return { label: status, cls: "bg-muted text-foreground border-border" };
};

export function GrossSalaryImportDialog({ open, onOpenChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<"preview" | "apply" | "template" | null>(null);
  const [preview, setPreview] = useState<ImportResponse | null>(null);
  const [applied, setApplied] = useState<ImportResponse | null>(null);

  const reset = () => {
    setFile(null);
    setPreview(null);
    setApplied(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const token = () => localStorage.getItem("auth_token") || "";

  const downloadTemplate = async () => {
    try {
      setBusy("template");
      const res = await fetch(
        `${API_BASE_URL}/employees-full/import-gross-salary/template`,
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "gross-salary-import-template.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Template downloaded");
    } catch (e: any) {
      toast.error("Failed to download template", { description: e?.message });
    } finally {
      setBusy(null);
    }
  };

  const submit = async (dryRun: boolean) => {
    if (!file) {
      toast.error("Please select a CSV or XLSX file");
      return;
    }
    try {
      setBusy(dryRun ? "preview" : "apply");
      const fd = new FormData();
      fd.append("file", file);
      fd.append("dry_run", dryRun ? "1" : "0");
      const res = await fetch(
        `${API_BASE_URL}/employees-full/import-gross-salary`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token()}` },
          body: fd,
        }
      );
      const json: ImportResponse = await res.json().catch(() => ({
        success: false,
        message: `HTTP ${res.status}`,
      }));
      if (dryRun) {
        setPreview(json);
        setApplied(null);
      } else {
        setApplied(json);
      }
      if (!res.ok && res.status !== 207) {
        toast.error(json.message || `Import failed (${res.status})`);
      } else if (!dryRun) {
        toast.success(json.message || "Import complete");
      } else {
        toast.success("Preview ready");
      }
    } catch (e: any) {
      toast.error("Request failed", { description: e?.message });
    } finally {
      setBusy(null);
    }
  };

  const result = applied ?? preview;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl flex flex-col" style={{ maxHeight: "85vh" }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Gross Salary
          </DialogTitle>
          <DialogDescription>
            Backfill annual gross salary for existing employees from a CSV or XLSX file.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
          <Alert>
            <AlertDescription className="text-sm">
              Required columns: <strong>Employee Name</strong> and{" "}
              <strong>Gross Salary (Annual)</strong>. Use the template for the exact format.
            </AlertDescription>
          </Alert>

          <div className="flex flex-wrap gap-2 items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              disabled={busy !== null}
            >
              {busy === "template" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Download Template
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx"
              className="text-sm"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setPreview(null);
                setApplied(null);
              }}
            />
          </div>

          {file && (
            <div className="text-sm text-muted-foreground">
              Selected: <span className="font-medium text-foreground">{file.name}</span>
            </div>
          )}

          {result?.summary && (
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-muted rounded-lg p-3 text-center">
                <p className="text-xl font-bold">{result.summary.total_rows}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="bg-green-500/10 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-green-600">{result.summary.updated}</p>
                <p className="text-xs text-muted-foreground">
                  {result.summary.dry_run ? "Would update" : "Updated"}
                </p>
              </div>
              <div className="bg-yellow-500/10 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-yellow-600">{result.summary.skipped}</p>
                <p className="text-xs text-muted-foreground">Skipped</p>
              </div>
              <div className="bg-destructive/10 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-destructive">{result.summary.failed}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </div>
          )}

          {result && (
            result.success ? (
              <Alert className="border-green-500 bg-green-500/10">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-600">
                  {result.message || (result.summary?.dry_run ? "Preview successful." : "Import successful.")}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {result.message || "Some rows failed validation. Review the details below."}
                </AlertDescription>
              </Alert>
            )
          )}

          {result?.rows && result.rows.length > 0 && (
            <ScrollArea className="h-[260px] border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Line</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Gross Salary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.rows.map((r, i) => {
                    const tone = statusTone(r.status);
                    return (
                      <TableRow key={i}>
                        <TableCell className="text-xs">{r.line ?? "—"}</TableCell>
                        <TableCell className="text-xs">{r.employee_name ?? "—"}</TableCell>
                        <TableCell className="text-xs">{formatNaira(r.gross_salary)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={tone.cls}>
                            {tone.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.reason ?? "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="flex-row gap-2 justify-end pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => handleClose(false)} disabled={busy !== null}>
            Close
          </Button>
          <Button
            variant="outline"
            onClick={() => submit(true)}
            disabled={!file || busy !== null || !!applied}
          >
            {busy === "preview" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="mr-2 h-4 w-4" />
            )}
            Preview (Dry Run)
          </Button>
          <Button
            onClick={() => submit(false)}
            disabled={!file || busy !== null || !preview?.summary || applied !== null}
            className="bg-green-600 hover:bg-green-700"
          >
            {busy === "apply" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Apply Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default GrossSalaryImportDialog;