import jsPDF from "jspdf";

const ngn = (v: any) =>
  v == null || v === ""
    ? "—"
    : new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 2 }).format(Number(v) || 0);

export interface PayslipLike {
  employeeName?: string;
  employeeCode?: string;
  department?: string;
  jobTitle?: string;
  payPeriod?: string;
  payDate?: string;
  status?: string;
  basicSalary?: number | string;
  housing?: number | string;
  transport?: number | string;
  other?: number | string;
  bonus?: number | string;
  gross?: number | string;
  tax?: number | string;
  pension?: number | string;
  nhf?: number | string;
  totalDeductions?: number | string;
  net?: number | string;
}

/** Normalize a raw payroll record or payslip-detail API response. */
export function toPayslipLike(src: any): PayslipLike {
  if (!src) return {};
  const e = src.earnings || {};
  const d = src.deductions || {};
  const t = src.totals || {};
  const s = src.summary || {};
  const emp = src.employee || {};
  return {
    employeeName:
      src.employeeName ||
      (emp.first_name ? `${emp.first_name} ${emp.last_name || ""}`.trim() : undefined),
    employeeCode: src.employeeCode || emp.employee_id || emp.id,
    department: src.department || emp.department,
    jobTitle: src.jobTitle || emp.job_title,
    payPeriod: src.payPeriodLabel || src.pay_period || src.payPeriod,
    payDate: src.payDate || src.pay_date,
    status: src.status,
    basicSalary: e.baseSalary ?? src.basic_salary,
    housing: e.housingAllowance ?? src.housing_allowance,
    transport: e.transportAllowance ?? src.transport_allowance,
    other: e.otherAllowance ?? src.other_allowance,
    bonus: src.bonus,
    gross: t.grossSalary ?? src.gross_pay,
    tax: d.incomeTax ?? src.income_tax ?? src.tax,
    pension: d.pensionContribution ?? src.pension,
    nhf: d.nhf,
    totalDeductions: s.totalDeductions ?? src.total_deductions,
    net: s.netSalary ?? src.net_pay,
  };
}

/** Generate a single-employee payslip PDF entirely on the client. */
export function generatePayslipPdf(p: PayslipLike, filename: string) {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();

  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.text("PAYSLIP", pageWidth / 2, 20, { align: "center" });

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  let y = 35;
  const line = (label: string, value: string) => {
    pdf.text(label, 20, y);
    pdf.text(value, pageWidth - 20, y, { align: "right" });
    y += 7;
  };

  line("Employee:", p.employeeName || "—");
  if (p.employeeCode) line("Employee ID:", String(p.employeeCode));
  if (p.department) line("Department:", String(p.department));
  if (p.jobTitle) line("Job Title:", String(p.jobTitle));
  line("Pay Period:", p.payPeriod || "—");
  if (p.payDate) line("Pay Date:", String(p.payDate));
  if (p.status) line("Status:", String(p.status));

  y += 4;
  pdf.setFont("helvetica", "bold");
  pdf.text("Earnings", 20, y); y += 6;
  pdf.line(20, y - 4, pageWidth - 20, y - 4);
  pdf.setFont("helvetica", "normal");
  line("Basic Salary", ngn(p.basicSalary));
  line("Housing Allowance", ngn(p.housing));
  line("Transport Allowance", ngn(p.transport));
  line("Other Allowance", ngn(p.other));
  if (p.bonus) line("Bonus", ngn(p.bonus));
  pdf.setFont("helvetica", "bold");
  line("Gross Pay", ngn(p.gross));

  y += 4;
  pdf.text("Deductions", 20, y); y += 6;
  pdf.line(20, y - 4, pageWidth - 20, y - 4);
  pdf.setFont("helvetica", "normal");
  line("Income Tax (PAYE)", ngn(p.tax));
  line("Pension", ngn(p.pension));
  line("NHF", ngn(p.nhf));
  pdf.setFont("helvetica", "bold");
  line("Total Deductions", ngn(p.totalDeductions));

  y += 4;
  pdf.setFontSize(12);
  pdf.text("Net Pay", 20, y);
  pdf.text(ngn(p.net), pageWidth - 20, y, { align: "right" });

  pdf.save(filename);
}

/** Generate a single-row CSV for one payslip. */
export function generatePayslipCsv(p: PayslipLike, filename: string) {
  const rows: Array<[string, string]> = [
    ["Employee", p.employeeName || ""],
    ["Employee ID", String(p.employeeCode || "")],
    ["Department", p.department || ""],
    ["Job Title", p.jobTitle || ""],
    ["Pay Period", p.payPeriod || ""],
    ["Pay Date", p.payDate || ""],
    ["Status", p.status || ""],
    ["Basic Salary", String(p.basicSalary ?? "")],
    ["Housing", String(p.housing ?? "")],
    ["Transport", String(p.transport ?? "")],
    ["Other", String(p.other ?? "")],
    ["Bonus", String(p.bonus ?? "")],
    ["Gross Pay", String(p.gross ?? "")],
    ["Income Tax", String(p.tax ?? "")],
    ["Pension", String(p.pension ?? "")],
    ["NHF", String(p.nhf ?? "")],
    ["Total Deductions", String(p.totalDeductions ?? "")],
    ["Net Pay", String(p.net ?? "")],
  ];
  const esc = (s: string) => `"${(s || "").replace(/"/g, '""')}"`;
  const csv = rows.map(([k, v]) => `${esc(k)},${esc(v)}`).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}