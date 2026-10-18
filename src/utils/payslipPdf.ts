import jsPDF from "jspdf";
import { formatNairaAmount } from "@/lib/currency";
import { formatPayDate } from "@/lib/formatPayDate";

const amt = (v: any) => (v == null || v === "" ? "—" : formatNairaAmount(v));

const COMPANY_NAME = "Emerald Industrial Co., CFZE";
const COMPANY_ADDRESS =
  "Sapetro Towers, 5th Floor Aureum Suite 1, Adeola Odeku Street, Victoria Island, Lagos, Nigeria";
const COMPANY_CONTACT = "www.emeraldcfze.com | hr@emeraldcfze.com";
const COMPANY_LOGO_URL = "/lovable-uploads/cbfc52d9-b5d8-4ea8-9ec0-98664ee4afad.png";

const loadImageDataUrl = async (src: string): Promise<string | null> => {
  try {
    const response = await fetch(src);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

export interface PayslipLike {
  employeeName?: string;
  employeeCode?: string;
  staffId?: string | null;
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
    staffId: src.staffId ?? src.staff_id ?? emp.staff_id ?? emp.staffId ?? null,
    department: src.department || emp.department,
    jobTitle: src.jobTitle || emp.job_title,
    payPeriod: src.payPeriodLabel || src.pay_period || src.payPeriod,
    payDate: formatPayDate(src.payDate || src.pay_date),
    status: src.status,
    basicSalary: e.baseSalary ?? src.basic_salary,
    housing: e.housingAllowance ?? src.housing_allowance,
    transport: e.transportAllowance ?? src.transport_allowance,
    other: e.otherAllowance ?? src.other_allowance,
    bonus: e.bonus ?? src.bonus,
    gross: t.grossSalary ?? src.gross_pay,
    tax: d.incomeTax ?? src.paye_tax ?? src.income_tax ?? src.tax,
    pension: d.pensionContribution ?? src.pension_employee ?? src.pension,
    nhf: d.nhf ?? src.nhf,
    totalDeductions: s.totalDeductions ?? src.total_deductions,
    net: s.netSalary ?? src.net_pay,
  };
}

type Row = [label: string, value: string, remarks: string, bold?: boolean];

/** Generate an emergency backup payslip when the backend PDF export fails. */
export async function generatePayslipPdf(p: PayslipLike, filename: string) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const M = 18; // margin
  const contentW = pageWidth - M * 2;

  // ---------- Company header ----------
  let y = 16;
  const logo = await loadImageDataUrl(COMPANY_LOGO_URL);
  if (logo) {
    pdf.addImage(logo, "PNG", M, y - 4, 58, 20, undefined, "FAST");
  } else {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.text(COMPANY_NAME, M, y + 5);
  }
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text("CONFIDENTIAL PAYROLL DOCUMENT", pageWidth - M, y, { align: "right" });
  y += 5;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(90);
  pdf.text(COMPANY_ADDRESS, pageWidth - M, y, { align: "right", maxWidth: 92 });
  y += 8;
  pdf.text(COMPANY_CONTACT, pageWidth - M, y, { align: "right" });
  pdf.setTextColor(0);
  y += 7;
  pdf.setDrawColor(180);
  pdf.line(M, y, pageWidth - M, y);

  // ---------- Title ----------
  y += 9;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text("PAYSLIP", pageWidth / 2, y, { align: "center" });
  y += 4;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(90);
  pdf.text(`For the period: ${p.payPeriod || "—"}`, pageWidth / 2, y, { align: "center" });
  pdf.setTextColor(0);

  // ---------- Meta block ----------
  y += 8;
  const metaLeft: Array<[string, string]> = [
    ["Employee Name", p.employeeName || "—"],
    ["Employee ID", String(p.employeeCode || "—")],
  ];
  if (p.staffId) {
    metaLeft.push(["Staff ID", String(p.staffId)]);
  }
  metaLeft.push(["Department", p.department || "—"]);
  const metaRight: Array<[string, string]> = [
    ["Job Title", p.jobTitle || "—"],
    ["Pay Date", p.payDate ? formatPayDate(p.payDate) : "—"],
    ["Status", p.status ? String(p.status) : "—"],
  ];
  const metaRowH = 6.5;
  const metaH = metaRowH * Math.max(metaLeft.length, metaRight.length) + 4;
  pdf.setFillColor(245, 247, 246);
  pdf.rect(M, y, contentW, metaH, "F");
  pdf.setDrawColor(200);
  pdf.rect(M, y, contentW, metaH);

  const colW = contentW / 2;
  let my = y + 6;
  pdf.setFontSize(9);
  const metaLine = (pair: [string, string], x: number, atY: number) => {
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(110);
    pdf.text(`${pair[0]}:`, x + 4, atY);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0);
    pdf.text(pair[1], x + 34, atY, { maxWidth: colW - 40 });
  };
  metaLeft.forEach((pair, i) => metaLine(pair, M, my + i * metaRowH));
  metaRight.forEach((pair, i) => metaLine(pair, M + colW, my + i * metaRowH));
  y += metaH + 10;

  // ---------- Table renderer ----------
  const rowH = 7.5;
  const cAmount = M + contentW * 0.5;
  const cRemarks = M + contentW * 0.72;

  const renderTable = (title: string, rows: Row[]) => {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text(title, M, y);
    y += 3;

    // header row
    pdf.setFillColor(16, 94, 66);
    pdf.rect(M, y, contentW, rowH, "F");
    pdf.setTextColor(255);
    pdf.setFontSize(8.5);
    pdf.text("Pay Component", M + 3, y + 5);
    pdf.text("Amount (NGN)", cAmount + 3, y + 5);
    pdf.text("Remarks", cRemarks + 3, y + 5);
    pdf.setTextColor(0);
    y += rowH;

    rows.forEach((row, i) => {
      const [label, value, remarks, bold] = row;
      if (i % 2 === 1) {
        pdf.setFillColor(248, 250, 249);
        pdf.rect(M, y, contentW, rowH, "F");
      }
      pdf.setDrawColor(215);
      pdf.line(M, y + rowH, pageWidth - M, y + rowH);
      pdf.setFont("helvetica", bold ? "bold" : "normal");
      pdf.setFontSize(9);
      pdf.text(label, M + 3, y + 5);
      pdf.text(value, cRemarks - 3, y + 5, { align: "right" });
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(110);
      pdf.text(remarks, cRemarks + 3, y + 5);
      pdf.setTextColor(0);
      y += rowH;
    });

    // outer border
    pdf.setDrawColor(200);
    pdf.rect(M, y - rowH * (rows.length + 1), contentW, rowH * (rows.length + 1));
    y += 9;
  };

  const earnings: Row[] = [
    ["Basic Salary", amt(p.basicSalary), "40% of monthly gross"],
    ["Housing Allowance", amt(p.housing), "20% of monthly gross"],
    ["Transport Allowance", amt(p.transport), "9% of monthly gross"],
    ["Other Allowances", amt(p.other), "31% of monthly gross"],
  ];
  if (p.bonus) earnings.push(["Bonus / Additional Earnings", amt(p.bonus), "Approved additions"]);
  earnings.push(["Gross Monthly Pay", amt(p.gross), "Total earnings", true]);
  renderTable("Earnings", earnings);

  const deductions: Row[] = [
    ["Income Tax (PAYE)", amt(p.tax), "Statutory — FIRS/LIRS"],
    ["Pension Contribution", amt(p.pension), "Employee contribution"],
    ["NHF", amt(p.nhf), "National Housing Fund"],
    ["Total Deductions", amt(p.totalDeductions), "Sum of deductions", true],
  ];
  renderTable("Deductions", deductions);

  // ---------- Net pay ----------
  pdf.setFillColor(16, 94, 66);
  pdf.rect(M, y, contentW, 12, "F");
  pdf.setTextColor(255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("NET MONTHLY PAY", M + 4, y + 8);
  pdf.text(`NGN ${amt(p.net)}`, pageWidth - M - 4, y + 8, { align: "right" });
  pdf.setTextColor(0);
  y += 22;

  // ---------- Signature block ----------
  const sigW = 60;
  pdf.setDrawColor(120);
  pdf.line(M, y, M + sigW, y);
  pdf.line(pageWidth - M - sigW, y, pageWidth - M, y);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.setTextColor(90);
  pdf.text("Employee Signature / Date", M, y + 5);
  pdf.text("Authorised Signatory (HR)", pageWidth - M - sigW, y + 5);
  pdf.setTextColor(0);

  // ---------- Footer ----------
  pdf.setDrawColor(200);
  pdf.line(M, pageHeight - 22, pageWidth - M, pageHeight - 22);
  pdf.setFontSize(7.5);
  pdf.setTextColor(120);
  pdf.text(
    `${COMPANY_NAME} — ${COMPANY_ADDRESS}`,
    pageWidth / 2,
    pageHeight - 17,
    { align: "center" },
  );
  pdf.text(
    "Backup copy generated by the HRIS after the official PDF service was unavailable.",
    pageWidth / 2,
    pageHeight - 12,
    { align: "center" },
  );
  pdf.setTextColor(0);

  pdf.save(filename);
}

/** Generate a single-row CSV for one payslip. */
export function generatePayslipCsv(p: PayslipLike, filename: string) {
  const rows: Array<[string, string]> = [
    ["Employee", p.employeeName || ""],
    ["Employee ID", String(p.employeeCode || "")],
  ];
  if (p.staffId) {
    rows.push(["Staff ID", String(p.staffId)]);
  }
  rows.push(
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
  );
  const esc = (s: string) => `"${(s || "").replace(/"/g, '""')}"`;
  const csv = rows.map(([k, v]) => `${esc(k)},${esc(v)}`).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
