import jsPDF from 'jspdf';
import { Employee } from '@/lib/api';
import emeraldLogo from '@/assets/emerald-logo.jpg';

export interface PayrollData {
  employee: Employee;
  month: string;
  year: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  grossSalary: number;
  paye: number;
  pension: number;
  nhf: number;
  totalDeductions: number;
  netPay: number;
}

export interface ContractorPayrollData {
  employee: Employee;
  month: string;
  year: string;
  contractFee: number;
  withholdingTax: number;
  netPay: number;
}

export const generateEmployeePayslipPDF = (data: PayrollData): jsPDF => {
  const doc = new jsPDF();
  
  // Add logo
  try {
    doc.addImage(emeraldLogo, 'JPEG', 15, 10, 40, 15);
  } catch (e) {
    console.error('Logo loading error:', e);
  }
  
  // Company details
  doc.setFontSize(10);
  doc.text('Sapetro Towers,', 150, 15);
  doc.text('5th Floor Aureum Suite 1,', 150, 20);
  doc.text('Adeola Odeku Street,', 150, 25);
  doc.text('Victoria Island, Lagos, Nigeria.', 150, 30);
  doc.text('+234 123 456 7890', 150, 35);
  doc.text('employee@emeraldcfze.com', 150, 40);
  
  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYSLIP', 105, 55, { align: 'center' });
  
  // Employee details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Employee Name: ${data.employee.first_name} ${data.employee.last_name}`, 20, 70);
  doc.text(`Month and Year: ${data.month} ${data.year}`, 20, 78);
  
  // Pay Components Table
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Pay Component', 20, 95);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const tableStartY = 105;
  doc.text('Pay Component', 20, tableStartY);
  doc.text('Amount (₦)', 110, tableStartY);
  doc.text('Remarks', 150, tableStartY);
  
  // Table lines
  doc.line(15, tableStartY + 2, 195, tableStartY + 2);
  
  // Pay components
  doc.setFont('helvetica', 'normal');
  let y = tableStartY + 10;
  doc.text('Basic Salary (40%)', 20, y);
  doc.text(data.basicSalary.toLocaleString('en-NG', { minimumFractionDigits: 2 }), 110, y);
  doc.text('40% of Gross', 150, y);
  
  y += 8;
  doc.text('Housing Allowance (20%)', 20, y);
  doc.text(data.housingAllowance.toLocaleString('en-NG', { minimumFractionDigits: 2 }), 110, y);
  doc.text('20% of Gross', 150, y);
  
  y += 8;
  doc.text('Transport Allowance (9%)', 20, y);
  doc.text(data.transportAllowance.toLocaleString('en-NG', { minimumFractionDigits: 2 }), 110, y);
  doc.text('9% of Gross', 150, y);
  
  y += 8;
  doc.text('All Other Allowances (31%)', 20, y);
  doc.text(data.otherAllowances.toLocaleString('en-NG', { minimumFractionDigits: 2 }), 110, y);
  doc.text('31% of Gross', 150, y);
  
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Gross Monthly Salary', 20, y);
  doc.text(data.grossSalary.toLocaleString('en-NG', { minimumFractionDigits: 2 }), 110, y);
  
  doc.line(15, y + 2, 195, y + 2);
  
  // Deductions Table
  y += 15;
  doc.setFontSize(14);
  doc.text('Deductions', 20, y);
  
  y += 10;
  doc.setFontSize(10);
  doc.text('Deductions', 20, y);
  doc.text('Amount (₦)', 110, y);
  doc.text('Remarks', 150, y);
  
  doc.line(15, y + 2, 195, y + 2);
  
  doc.setFont('helvetica', 'normal');
  y += 10;
  doc.text('PAYE', 20, y);
  doc.text(data.paye.toLocaleString('en-NG', { minimumFractionDigits: 2 }), 110, y);
  doc.text('Statutory tax', 150, y);
  
  y += 8;
  doc.text('Pension (Employee)', 20, y);
  doc.text(data.pension.toLocaleString('en-NG', { minimumFractionDigits: 2 }), 110, y);
  doc.text('8% of BHT', 150, y);
  
  y += 8;
  doc.text('NHF (2.5%)', 20, y);
  doc.text(data.nhf.toLocaleString('en-NG', { minimumFractionDigits: 2 }), 110, y);
  doc.text('2.5% of Basic Salary', 150, y);
  
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Total Deductions', 20, y);
  doc.text(data.totalDeductions.toLocaleString('en-NG', { minimumFractionDigits: 2 }), 110, y);
  
  y += 8;
  doc.setFontSize(12);
  doc.text('Net Monthly Pay', 20, y);
  doc.text(data.netPay.toLocaleString('en-NG', { minimumFractionDigits: 2 }), 110, y);
  
  doc.line(15, y + 2, 195, y + 2);
  
  // Signature
  y += 20;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Signature: _______________________', 20, y);
  
  y += 10;
  doc.text('Human Resource Department', 20, y);
  
  return doc;
};

export const generateContractorPayslipPDF = (data: ContractorPayrollData): jsPDF => {
  const doc = new jsPDF();
  
  // Add logo
  try {
    doc.addImage(emeraldLogo, 'JPEG', 15, 10, 40, 15);
  } catch (e) {
    console.error('Logo loading error:', e);
  }
  
  // Company details
  doc.setFontSize(10);
  doc.text('Sapetro Towers,', 150, 15);
  doc.text('5th Floor Aureum Suite 1,', 150, 20);
  doc.text('Adeola Odeku Street,', 150, 25);
  doc.text('Victoria Island, Lagos, Nigeria.', 150, 30);
  doc.text('+234 123 456 7890', 150, 35);
  doc.text('employee@emeraldcfze.com', 150, 40);
  
  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYSLIP', 105, 55, { align: 'center' });
  
  // Contractor details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Contractor Name: ${data.employee.first_name} ${data.employee.last_name}`, 20, 70);
  doc.text(`Month and Year: ${data.month} ${data.year}`, 20, 78);
  
  // Pay Component Table
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const tableStartY = 95;
  doc.text('Pay Component', 20, tableStartY);
  doc.text('Amount (₦)', 110, tableStartY);
  doc.text('Remarks', 150, tableStartY);
  
  doc.line(15, tableStartY + 2, 195, tableStartY + 2);
  
  doc.setFont('helvetica', 'normal');
  let y = tableStartY + 10;
  doc.text('Contract Fee (Gross)', 20, y);
  doc.text('₦' + data.contractFee.toLocaleString('en-NG', { minimumFractionDigits: 2 }), 110, y);
  
  doc.line(15, y + 2, 195, y + 2);
  
  // Deductions Table
  y += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('Deductions', 20, y);
  doc.text('Amount (₦)', 110, y);
  doc.text('Remarks', 150, y);
  
  doc.line(15, y + 2, 195, y + 2);
  
  doc.setFont('helvetica', 'normal');
  y += 10;
  doc.text('Withholding Tax (2%)', 20, y);
  doc.text(data.withholdingTax.toLocaleString('en-NG', { minimumFractionDigits: 2 }), 110, y);
  
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Total Deductions', 20, y);
  doc.text(data.withholdingTax.toLocaleString('en-NG', { minimumFractionDigits: 2 }), 110, y);
  
  y += 8;
  doc.setFontSize(12);
  doc.text('Net Pay', 20, y);
  doc.text(data.netPay.toLocaleString('en-NG', { minimumFractionDigits: 2 }), 110, y);
  doc.text('Gross minus deduction', 150, y);
  
  doc.line(15, y + 2, 195, y + 2);
  
  // Signature
  y += 20;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Signature: _______________________', 20, y);
  
  y += 10;
  doc.text('Human Resource Department', 20, y);
  
  return doc;
};

export const exportPayslipCSV = (data: PayrollData | ContractorPayrollData): string => {
  const isContractor = 'contractFee' in data;
  
  if (isContractor) {
    const contractorData = data as ContractorPayrollData;
    const headers = ['Contractor Name', 'Month', 'Year', 'Contract Fee (Gross)', 'Withholding Tax (2%)', 'Net Pay'];
    const row = [
      `${contractorData.employee.first_name} ${contractorData.employee.last_name}`,
      contractorData.month,
      contractorData.year,
      contractorData.contractFee.toFixed(2),
      contractorData.withholdingTax.toFixed(2),
      contractorData.netPay.toFixed(2)
    ];
    return [headers.join(','), row.join(',')].join('\n');
  } else {
    const employeeData = data as PayrollData;
    const headers = [
      'Employee Name', 'Month', 'Year',
      'Basic Salary', 'Housing Allowance', 'Transport Allowance', 'Other Allowances', 'Gross Salary',
      'PAYE', 'Pension', 'NHF', 'Total Deductions', 'Net Pay'
    ];
    const row = [
      `${employeeData.employee.first_name} ${employeeData.employee.last_name}`,
      employeeData.month,
      employeeData.year,
      employeeData.basicSalary.toFixed(2),
      employeeData.housingAllowance.toFixed(2),
      employeeData.transportAllowance.toFixed(2),
      employeeData.otherAllowances.toFixed(2),
      employeeData.grossSalary.toFixed(2),
      employeeData.paye.toFixed(2),
      employeeData.pension.toFixed(2),
      employeeData.nhf.toFixed(2),
      employeeData.totalDeductions.toFixed(2),
      employeeData.netPay.toFixed(2)
    ];
    return [headers.join(','), row.join(',')].join('\n');
  }
};

export const downloadFile = (blob: Blob, filename: string): void => {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
