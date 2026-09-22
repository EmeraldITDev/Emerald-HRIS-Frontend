import jsPDF from "jspdf";

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

export interface PerformanceReviewPdfData {
  employeeName?: string;
  employeeId?: string | number;
  department?: string;
  period?: string;
  reviewer?: string;
  status?: string;
  rating?: number | string;
  sections: Array<{ heading: string; entries: Array<[label: string, value: string]> }>;
}

/** Build a printable performance review document. */
export async function generatePerformanceReviewPdf(
  data: PerformanceReviewPdfData,
  filename: string,
) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const M = 18;
  const contentW = pageWidth - M * 2;

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
  pdf.text("CONFIDENTIAL HR DOCUMENT", pageWidth - M, y, { align: "right" });
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

  y += 9;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text("PERFORMANCE REVIEW", pageWidth / 2, y, { align: "center" });
  y += 4;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(90);
  pdf.text(`Review period: ${data.period || "—"}`, pageWidth / 2, y, { align: "center" });
  pdf.setTextColor(0);

  // Meta block
  y += 8;
  const metaLeft: Array<[string, string]> = [
    ["Employee", data.employeeName || "—"],
    ["Employee ID", String(data.employeeId ?? "—")],
    ["Department", data.department || "—"],
  ];
  const metaRight: Array<[string, string]> = [
    ["Reviewer", data.reviewer || "—"],
    ["Status", data.status || "—"],
    ["Overall rating", data.rating ? `${data.rating} / 5` : "—"],
  ];
  const metaRowH = 6.5;
  const metaH = metaRowH * metaLeft.length + 4;
  pdf.setFillColor(245, 247, 246);
  pdf.rect(M, y, contentW, metaH, "F");
  pdf.setDrawColor(200);
  pdf.rect(M, y, contentW, metaH);
  const colW = contentW / 2;
  const my = y + 6;
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

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 20) {
      pdf.addPage();
      y = 20;
    }
  };

  data.sections.forEach((section) => {
    const entries = section.entries.filter(([, v]) => v && v.trim());
    if (!entries.length) return;
    ensureSpace(16);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10.5);
    pdf.setTextColor(0);
    pdf.text(section.heading, M, y);
    y += 2;
    pdf.setDrawColor(200);
    pdf.line(M, y, pageWidth - M, y);
    y += 6;

    entries.forEach(([label, value]) => {
      const lines = pdf.splitTextToSize(value, contentW);
      ensureSpace(6 + lines.length * 4.6);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8.5);
      pdf.setTextColor(110);
      pdf.text(label.toUpperCase(), M, y);
      y += 4.4;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9.5);
      pdf.setTextColor(0);
      pdf.text(lines, M, y);
      y += lines.length * 4.6 + 3.5;
    });
    y += 3;
  });

  // Footer
  const pages = pdf.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(120);
    pdf.text(
      `Generated ${new Date().toLocaleString()} — ${COMPANY_NAME}`,
      M,
      pageHeight - 10,
    );
    pdf.text(`Page ${i} of ${pages}`, pageWidth - M, pageHeight - 10, { align: "right" });
  }

  pdf.save(filename);
}
