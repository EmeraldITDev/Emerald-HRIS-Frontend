import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { CSVValidationResult, ValidatedRow, getAllowedValuesForValidation } from '@/utils/csvValidation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CSVValidationPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmImport: (validRows: ValidatedRow[]) => void;
  validationResult: CSVValidationResult | null;
  fileName: string;
}

export function CSVValidationPreview({
  isOpen,
  onClose,
  onConfirmImport,
  validationResult,
  fileName
}: CSVValidationPreviewProps) {
  const [activeTab, setActiveTab] = useState<string>('summary');

  if (!validationResult) return null;

  const { isValid, validRows, invalidRows, totalRows, totalErrors } = validationResult;

  const handleImport = () => {
    onConfirmImport(validRows);
    onClose();
  };

  const renderCellValue = (row: ValidatedRow, column: string) => {
    const error = row.errors.find(e => e.column === column);
    const value = row.data[column] || '';

    if (error) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="bg-destructive/20 text-destructive px-2 py-1 rounded border border-destructive/30 cursor-help inline-block">
                {value || '(empty)'}
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-semibold text-destructive">{error.message}</p>
              {error.expectedValues.length > 0 && (
                <div className="mt-1">
                  <p className="text-xs text-muted-foreground">Allowed values:</p>
                  <p className="text-xs">{error.expectedValues.slice(0, 5).join(', ')}{error.expectedValues.length > 5 ? '...' : ''}</p>
                </div>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return <span className="text-foreground">{value}</span>;
  };

  const getColumnHeaders = () => {
    const allRows = [...validRows, ...invalidRows];
    if (allRows.length === 0) return [];
    return Object.keys(allRows[0].data);
  };

  const columns = getColumnHeaders();
  const displayColumns = columns.slice(0, 8); // Show first 8 columns for readability

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            CSV Import Validation - {fileName}
          </DialogTitle>
          <DialogDescription>
            Review validation results before importing employees
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-muted rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{totalRows}</p>
              <p className="text-xs text-muted-foreground">Total Rows</p>
            </div>
            <div className="bg-green-500/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{validRows.length}</p>
              <p className="text-xs text-muted-foreground">Valid Rows</p>
            </div>
            <div className="bg-destructive/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-destructive">{invalidRows.length}</p>
              <p className="text-xs text-muted-foreground">Invalid Rows</p>
            </div>
            <div className="bg-orange-500/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-orange-600">{totalErrors}</p>
              <p className="text-xs text-muted-foreground">Total Errors</p>
            </div>
          </div>

          {/* Status Alert */}
          {isValid ? (
            <Alert className="border-green-500 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                All rows passed validation. Ready to import {validRows.length} employees.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {invalidRows.length} row(s) have validation errors. You can still import {validRows.length} valid row(s).
              </AlertDescription>
            </Alert>
          )}

          {/* Tabs for different views */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="errors" className="flex items-center gap-1">
                Errors
                {invalidRows.length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                    {invalidRows.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="valid" className="flex items-center gap-1">
                Valid
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 bg-green-500/20 text-green-600">
                  {validRows.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="mt-4">
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {invalidRows.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-destructive mb-2">Errors by Row:</h4>
                      {invalidRows.map((row) => (
                        <div key={row.rowNumber} className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 mb-2">
                          <p className="font-medium text-sm">Row {row.rowNumber}:</p>
                          <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                            {row.errors.map((error, idx) => (
                              <li key={idx}>
                                <span className="font-medium">{error.column}:</span> {error.message}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                  {invalidRows.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                      <p>No validation errors found!</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="errors" className="mt-4">
              <ScrollArea className="h-[300px]">
                {invalidRows.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Row</TableHead>
                        {displayColumns.map((col) => (
                          <TableHead key={col} className="text-xs">{col}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invalidRows.map((row) => (
                        <TableRow key={row.rowNumber} className="bg-destructive/5">
                          <TableCell className="font-medium">{row.rowNumber}</TableCell>
                          {displayColumns.map((col) => (
                            <TableCell key={col} className="text-xs">
                              {renderCellValue(row, col)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p>No invalid rows</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="valid" className="mt-4">
              <ScrollArea className="h-[300px]">
                {validRows.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Row</TableHead>
                        {displayColumns.map((col) => (
                          <TableHead key={col} className="text-xs">{col}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {validRows.map((row) => (
                        <TableRow key={row.rowNumber}>
                          <TableCell className="font-medium">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                              {row.rowNumber}
                            </span>
                          </TableCell>
                          {displayColumns.map((col) => (
                            <TableCell key={col} className="text-xs">
                              {row.data[col] || '-'}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <XCircle className="h-12 w-12 mx-auto mb-2 text-destructive" />
                    <p>No valid rows to import</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={validRows.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            Import {validRows.length} Valid Employee{validRows.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
