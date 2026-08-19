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
import { generatePayslipPdf, generatePayslipCsv, toPayslipLike } from "@/utils/payslipPdf";
import { normalizePayrollRecord, normalizePayslipDetail } from "@/lib/payrollCalc";
import { formatNaira } from "@/lib/currency";

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
  v == null ? "—" : formatNaira(v);

const uniqueStrings = (values: any[]) => Array.from(new Set(values.filter(Boolean).map(String)));

const fetchPayslipDetailForIds = async (period: string, ids: any[]) => {
  for (const id of uniqueStrings(ids)) {
    try {
      return await apiService.getPayslipDetail(id, period);
    } catch {
      continue;
    }
  }
  return null;
};

export default function MyPayslips() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [detailsByPeriod, setDetailsByPeriod] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [res, profile] = await Promise.all([
          apiService.getMyPayslips(1),
          apiService.getMyProfile().catch(() => null),
        ]);
        const rows = Array.isArray((res as any)?.data) ? (res as any).data : [];
        setEmployee(profile);
        setItems(rows);

        const entries = await Promise.all(
          rows.map(async (row: any) => {
            const period = row.pay_period || row.payPeriod;
            if (!period) return null;
            const detail = await fetchPayslipDetailForIds(period, [
              user?.employee_id,
              row.employee_id,
              row.employee?.id,
              row.employee?.employee_id,
              row.employeeCode,
              profile?.id,
              profile?.employee_id,
              profile?.employee_code,
            ]);
            return detail ? [period, detail] as const : null;
          })
        );
        setDetailsByPeriod(Object.fromEntries(entries.filter(Boolean) as Array<readonly [string, any]>));
      } catch (e: any) {
        toast({ title: "Failed to load payslips", description: e?.message, variant: "destructive" });
      } finally { setLoading(false); }
    };

    load();
  }, [user?.employee_id]);

  const normalizedItems = items.map((r) => {
    const period = r.pay_period || r.payPeriod;
    const detail = period ? detailsByPeriod[period] : null;
    if (!detail) return normalizePayrollRecord(r as any, employee);
    const normalizedDetail = normalizePayslipDetail(detail, employee);
    return {
      ...normalizePayrollRecord(r as any, employee),
      pay_period: period,
      pay_date: normalizedDetail.payDate || normalizedDetail.pay_date || r.pay_date || r.payDate,
      status: normalizedDetail.status || r.status,
      gross_pay: normalizedDetail.summary?.grossSalary ?? normalizedDetail.totals?.grossSalary ?? r.gross_pay,
      total_deductions: normalizedDetail.summary?.totalDeductions ?? r.total_deductions,
      net_pay: normalizedDetail.summary?.netSalary ?? r.net_pay,
    };
  });

  const buildLocal = async (period: string) => {
    const detailFromList = detailsByPeriod[period];
    if (detailFromList) return toPayslipLike(normalizePayslipDetail(detailFromList, employee));
    try {
      const detail = await fetchPayslipDetailForIds(period, [
        user?.employee_id,
        employee?.id,
        employee?.employee_id,
        employee?.employee_code,
      ]);
      if (!detail) throw new Error("Payslip detail not found");
      return toPayslipLike(normalizePayslipDetail(detail, employee));
    } catch {
      const row = normalizedItems.find((r: any) => (r.pay_period || r.payPeriod) === period);
      return row ? toPayslipLike(row) : null;
    }
  };
  const handlePdf = async (period: string) => {
    try {
      const blob = await apiService.exportMyPayslipPdf(period);
      triggerDownload(blob, `Payslip_${period}.pdf`);
    } catch (e: any) {
      const p = await buildLocal(period);
      if (p) {
        generatePayslipPdf(p, `Payslip_${period}.pdf`);
        toast({ title: "PDF generated locally", description: "Server export failed; built from your payslip data." });
      } else {
        toast({ title: "PDF export failed", description: e?.message, variant: "destructive" });
      }
    }
  };
  const handleCsv = async (period: string) => {
    try {
      const blob = await apiService.exportMyPayslipCsv(period);
      triggerDownload(blob, `Payslip_${period}.csv`);
    } catch (e: any) {
      const p = await buildLocal(period);
      if (p) {
        generatePayslipCsv(p, `Payslip_${period}.csv`);
        toast({ title: "CSV generated locally", description: "Server export failed; built from your payslip data." });
      } else {
        toast({ title: "CSV export failed", description: e?.message, variant: "destructive" });
      }
    }
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
                {normalizedItems.map((r: any) => {
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