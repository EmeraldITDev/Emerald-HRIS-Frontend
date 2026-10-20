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
import { formatPayDate } from "@/lib/formatPayDate";
import { formatNaira } from "@/lib/currency";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
/** Salary lines always show kobo (2 d.p.) — never round to whole naira. */
const ngn = (v: any) => (v == null || v === "" ? "—" : formatNaira(v, { decimals: 2 }));

export default function PayslipDetail() {
  const { period } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!period || !user?.employee_id) { setLoading(false); return; }
      setUnavailable(false);
      try {
        const [res, profile] = await Promise.all([
          apiService.getPayslipDetail(user.employee_id, period),
          apiService.getMyProfile().catch(() => null),
        ]);
        setData(normalizePayslipDetail(res, profile));
      } catch (e: any) {
        const status = e?.status ?? e?.response?.status ?? e?.data?.status;
        const code = String(e?.data?.error || e?.error || "").toUpperCase();
        const msg = String(e?.data?.message || e?.message || "").toLowerCase();
        const isMissing =
          status === 404 ||
          code === "NOT_FOUND" ||
          /not found|no longer available|deleted/i.test(msg);
        setData(null);
        if (isMissing) {
          setUnavailable(true);
        } else {
          toast({ title: "Failed to load payslip", description: e?.message, variant: "destructive" });
        }
      } finally { setLoading(false); }
    };
    load();
  }, [period, user?.employee_id]);

  if (loading) return <p className="text-sm text-muted-foreground p-6">Loading…</p>;
  if (unavailable || !data) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 p-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/payroll/my-payslips")}>
          <ArrowLeft className="h-4 w-4 mr-2" />Back to My Payslips
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Payslip unavailable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              This payslip is no longer available
              {period ? ` for ${period}` : ""}. It may have been removed by HR.
            </p>
            <p>If you still need a copy, contact HR or Finance.</p>
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
                await generatePayslipPdf(toPayslipLike(data), `Payslip_${period}.pdf`);
                toast({ title: "Backup PDF downloaded", description: `The official PDF service failed (${err?.message || "unknown"}), so a clearly marked backup copy was created.` });
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
              {(data.staffId || data.staff_id) && (
                <p className="text-xs text-muted-foreground mt-0.5">Staff ID: {data.staffId || data.staff_id}</p>
              )}
              <p className="text-xs text-muted-foreground">{data.department} · {data.jobTitle}</p>
            </div>
            <Badge variant="outline">{data.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Pay Date:</span> {formatPayDate(data.payDate || data.pay_date)}</div>
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
              {Number(d.rentReliefSaving) > 0 && (
                <div className="flex justify-between text-success">
                  <span>
                    Rent Relief Tax Saving
                    <span className="text-xs text-muted-foreground ml-1">
                      (on {ngn(d.rentRelief)} /mo relief)
                    </span>
                  </span>
                  <span>− {ngn(d.rentReliefSaving)}</span>
                </div>
              )}
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