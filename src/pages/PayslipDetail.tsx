import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, ArrowLeft, Printer } from "lucide-react";
import { apiService } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { generatePayslipPdf, toPayslipLike } from "@/utils/payslipPdf";
import { normalizePayslipDetail } from "@/lib/payrollCalc";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
const ngn = (v: any) => v == null ? "—" : new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(Number(v) || 0);

export default function PayslipDetail() {
  const { period } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!period || !user?.employee_id) { setLoading(false); return; }
      try {
        const [res, profile] = await Promise.all([
          apiService.getPayslipDetail(user.employee_id, period),
          apiService.getMyProfile().catch(() => null),
        ]);
        setData(normalizePayslipDetail(res, profile));
      } catch (e: any) {
        const msg = e?.message || "Unable to load payslip.";
        setErrorMsg(msg);
        toast({ title: "Failed to load payslip", description: msg, variant: "destructive" });
      } finally { setLoading(false); }
    };
    load();
  }, [period, user?.employee_id]);

  if (loading) return <p className="text-sm text-muted-foreground p-6">Loading…</p>;
  if (!data) {
    const isMissingSalary = /gross_salary/i.test(errorMsg || "");
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />Back
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Payslip unavailable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {isMissingSalary ? (
              <>
                <p className="text-destructive font-medium">
                  Your gross salary has not been configured yet.
                </p>
                <p className="text-muted-foreground">
                  Payroll cannot be generated until HR sets a gross salary on your
                  employee record. Please contact your HR Manager to update this,
                  then refresh this page.
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">
                {errorMsg || `No payslip found for the period ${period}.`}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const e = data.earnings || {};
  const d = data.deductions || {};
  const t = data.totals || {};
  const s = data.summary || {};

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />Back
        </Button>
        <div className="space-x-2">
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />Print
          </Button>
          <Button size="sm" variant="outline" onClick={async () => {
            try {
              const blob = await apiService.exportMyPayslipPdf(period!);
              downloadBlob(blob, `Payslip_${period}.pdf`);
            } catch (err: any) {
              try {
                generatePayslipPdf(toPayslipLike(data), `Payslip_${period}.pdf`);
                toast({ title: "PDF generated locally", description: "Server export failed; built from this payslip." });
              } catch {
                toast({ title: "PDF failed", description: err?.message, variant: "destructive" });
              }
            }
          }}>
            <Download className="h-4 w-4 mr-2" />PDF
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Payslip — {data.payPeriodLabel || period}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{data.employeeCode} · {data.employeeName}</p>
              <p className="text-xs text-muted-foreground">{data.department} · {data.jobTitle}</p>
            </div>
            <Badge variant="outline">{data.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Pay Date:</span> {data.payDate || "—"}</div>
            <div><span className="text-muted-foreground">Prepared by:</span> {data.preparedBy?.name || "—"} ({data.preparedBy?.role || ""})</div>
          </div>
          <Separator />
          <div>
            <h3 className="font-semibold mb-2">Earnings</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Basic Salary</span><span>{ngn(e.baseSalary)}</span></div>
              <div className="flex justify-between"><span>Housing</span><span>{ngn(e.housingAllowance)}</span></div>
              <div className="flex justify-between"><span>Transport</span><span>{ngn(e.transportAllowance)}</span></div>
              <div className="flex justify-between"><span>Other</span><span>{ngn(e.otherAllowance)}</span></div>
              <Separator className="my-2" />
              <div className="flex justify-between font-medium"><span>Gross</span><span>{ngn(t.grossSalary)}</span></div>
            </div>
          </div>
          <Separator />
          <div>
            <h3 className="font-semibold mb-2">Deductions</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Income Tax (PAYE)</span><span>{ngn(d.incomeTax)}</span></div>
              <div className="flex justify-between"><span>Pension</span><span>{ngn(d.pensionContribution)}</span></div>
              <div className="flex justify-between"><span>NHF</span><span>{ngn(d.nhf)}</span></div>
              <Separator className="my-2" />
              <div className="flex justify-between font-medium"><span>Total Deductions</span><span>{ngn(s.totalDeductions)}</span></div>
            </div>
          </div>
          <Separator />
          <div className="flex justify-between items-center bg-primary/10 p-3 rounded">
            <span className="font-semibold">Net Pay</span>
            <span className="text-xl font-bold">{ngn(s.netSalary)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}