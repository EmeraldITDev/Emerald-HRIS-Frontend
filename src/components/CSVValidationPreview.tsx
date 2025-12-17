import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle, AlertTriangle, FileWarning, Info } from "lucide-react";
import { CSVImportResult, ValidationError, getValidationSummary } from "@/utils/csvImport";

interface CSVValidationPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmImport: () => void;
  validationResult: CSVImportResult | null;
  isImporting?: boolean;
}

export function CSVValidationPreview({
  isOpen,
  onClose,
  onConfirmImport,
  validationResult,
  isImporting = false
}: CSVValidationPreviewProps) {
  if (!validationResult) return null;

  const summary = getValidationSummary(validationResult);
  const hasErrors = validationResult.validationErrors.length > 0;
  const hasWarnings = validationResult.warnings.length > 0;

  // Group errors by row
  const errorsByRow = validationResult.validationErrors.reduce((acc, error) => {
    if (!acc[error.row]) {
      acc[error.row] = [];
    }
    acc[error.row].push(error);
    return acc;
  }, {} as Record<number, ValidationError[]>);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileWarning className="h-5 w-5" />
            CSV Import Validation
          </DialogTitle>
          <DialogDescription>
            Review the validation results before importing employees
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{summary.totalRows}</div>
              <div className="text-xs text-muted-foreground">Total Rows</div>
            </div>
            <div className="bg-green-500/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{summary.validRows}</div>
              <div className="text-xs text-muted-foreground">Valid Rows</div>
            </div>
            <div className="bg-destructive/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-destructive">{summary.errorRows}</div>
              <div className="text-xs text-muted-foreground">Rows with Errors</div>
            </div>
            <div className="bg-yellow-500/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-yellow-600">{summary.warningCount}</div>
              <div className="text-xs text-muted-foreground">Warnings</div>
            </div>
          </div>

          {/* Status Alert */}
          {!hasErrors && !hasWarnings && (
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-600">All validations passed!</AlertTitle>
              <AlertDescription>
                {summary.validRows} employee(s) are ready to be imported.
              </AlertDescription>
            </Alert>
          )}

          {hasErrors && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Validation Errors Found</AlertTitle>
              <AlertDescription>
                Please fix the errors below before importing. Rows with errors will be skipped.
              </AlertDescription>
            </Alert>
          )}

          {/* Validation Errors */}
          {hasErrors && (
            <div className="flex-1 min-h-0">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                Validation Errors ({validationResult.validationErrors.length})
              </h4>
              <ScrollArea className="h-[200px] rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Row</TableHead>
                      <TableHead className="w-[120px]">Field</TableHead>
                      <TableHead className="w-[120px]">Value</TableHead>
                      <TableHead>Error / Allowed Values</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validationResult.validationErrors.map((error, index) => (
                      <TableRow key={index} className="text-sm">
                        <TableCell>
                          <Badge variant="outline">{error.row}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{error.field}</TableCell>
                        <TableCell>
                          <code className="bg-destructive/10 text-destructive px-1 rounded text-xs">
                            {error.value || '(empty)'}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-destructive text-xs">{error.message}</p>
                            {error.allowedValues.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                <span className="text-xs text-muted-foreground">Allowed:</span>
                                {error.allowedValues.slice(0, 5).map((val, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {val}
                                  </Badge>
                                ))}
                                {error.allowedValues.length > 5 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{error.allowedValues.length - 5} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}

          {/* Warnings */}
          {hasWarnings && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                Warnings ({validationResult.warnings.length})
              </h4>
              <ScrollArea className="h-[100px] rounded-md border bg-yellow-500/5">
                <div className="p-3 space-y-1">
                  {validationResult.warnings.map((warning, index) => (
                    <p key={index} className="text-sm text-yellow-700">
                      • {warning}
                    </p>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Valid Data Preview */}
          {summary.validRows > 0 && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Ready to Import ({summary.validRows} employees)
              </h4>
              <ScrollArea className="h-[150px] rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validationResult.data.slice(0, 10).map((employee, index) => (
                      <TableRow key={index} className="text-sm">
                        <TableCell className="font-medium">
                          {employee.firstName} {employee.lastName}
                        </TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell>{employee.department}</TableCell>
                        <TableCell>{employee.position}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{employee.employmentType}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {validationResult.data.length > 10 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          ... and {validationResult.data.length - 10} more employees
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}

          {/* Info about skipped rows */}
          {hasErrors && summary.validRows > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>{summary.errorRows}</strong> row(s) with errors will be skipped. 
                Only <strong>{summary.validRows}</strong> valid employee(s) will be imported.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isImporting}>
            Cancel
          </Button>
          <Button 
            onClick={onConfirmImport} 
            disabled={summary.validRows === 0 || isImporting}
          >
            {isImporting ? (
              <>Importing...</>
            ) : (
              <>Import {summary.validRows} Employee{summary.validRows !== 1 ? 's' : ''}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
