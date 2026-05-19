import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, Eye } from "lucide-react";
import { apiService } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const ngn = (v: number | string | undefined) =>
  v == null ? "—" : new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(Number(v) || 0);

export default function MyPayslips() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res: any = await apiService.getMyPayslips(1);
      setItems(res?.data || []);
    } catch (e: any) {
      toast({ title: "Failed to load payslips", description: e?.message, variant: "destructive" });
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handlePdf = async (period: string) => {
    try {
      const blob = await apiService.exportMyPayslipPdf(period);
      triggerDownload(blob, `Payslip_${period}.pdf`);
    } catch (e: any) { toast({ title: "PDF export failed", description: e?.message, variant: "destructive" }); }
  };
  const handleCsv = async (period: string) => {
    try {
      const blob = await apiService.exportMyPayslipCsv(period);
      triggerDownload(blob, `Payslip_${period}.csv`);
    } catch (e: any) { toast({ title: "CSV export failed", description: e?.message, variant: "destructive" }); }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">My Payslips</h1>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Processed & paid payslips</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payslips yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Pay Date</TableHead>
                  <TableHead>Net Pay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((r) => {
                  const period = r.pay_period || r.payPeriod;
                  return (
                    <TableRow key={r.id || period}>
                      <TableCell className="font-medium">{period}</TableCell>
                      <TableCell>{r.pay_date || r.payDate || "—"}</TableCell>
                      <TableCell>{ngn(r.net_pay ?? r.netSalary)}</TableCell>
                      <TableCell><Badge variant="outline">{r.status}</Badge></TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/payroll/my-payslips/${period}`)}>
                          <Eye className="h-4 w-4 mr-1" />View
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handlePdf(period)}>
                          <Download className="h-4 w-4 mr-1" />PDF
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleCsv(period)}>
                          <Download className="h-4 w-4 mr-1" />CSV
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}