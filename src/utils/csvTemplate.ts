// CSV Template utility for employee data import
import { DEPARTMENTS } from '@/constants/departments';

// Predefined allowed values for selection fields
export const ALLOWED_VALUES = {
  gender: ['Male', 'Female', 'Other'],
  maritalStatus: ['Single', 'Married', 'Divorced', 'Widowed'],
  employmentType: ['Full-time', 'Part-time', 'Contract', 'Intern'],
  employmentStatus: ['Active', 'On Leave', 'Suspended', 'Terminated'],
  gradeLevel: ['Entry', 'Junior', 'Mid-Level', 'Senior', 'Lead', 'Manager', 'Director', 'Executive'],
  relationship: ['Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Other'],
  bankNames: [
    'Access Bank', 'GTBank', 'First Bank', 'UBA', 'Zenith Bank', 
    'Fidelity Bank', 'Union Bank', 'Sterling Bank', 'Stanbic IBTC', 
    'Ecobank', 'FCMB', 'Polaris Bank', 'Wema Bank', 'Keystone Bank'
  ]
} as const;

export interface CSVTemplateField {
  header: string;
  description: string;
  example: string;
  required: boolean;
  allowedValues?: readonly string[] | string[];
  format?: string;
}

export const csvTemplateFields: CSVTemplateField[] = [
  // Personal Information
  { header: "First Name", description: "Employee's first name", example: "John", required: true },
  { header: "Middle Name", description: "Employee's middle name (optional)", example: "Michael", required: false },
  { header: "Last Name", description: "Employee's last name", example: "Doe", required: true },
  { header: "Email", description: "Employee's email address", example: "john.doe@company.com", required: true, format: "email@domain.com" },
  { header: "Phone Number", description: "Employee's phone number", example: "+234 803 123 4567", required: true, format: "+234 XXX XXX XXXX" },
  { header: "Date of Birth", description: "Employee's date of birth", example: "1990-05-15", required: false, format: "YYYY-MM-DD" },
  { header: "Gender", description: "Employee's gender", example: "Male", required: false, allowedValues: ALLOWED_VALUES.gender },
  { header: "Marital Status", description: "Employee's marital status", example: "Single", required: false, allowedValues: ALLOWED_VALUES.maritalStatus },
  { header: "Nationality", description: "Employee's nationality", example: "Nigerian", required: false },
  { header: "Home Address", description: "Employee's home address", example: "123 Main St, Lagos", required: false },
  
  // Emergency Contact
  { header: "Emergency Contact", description: "Emergency contact name", example: "Jane Doe", required: false },
  { header: "Emergency Contact Number", description: "Emergency contact phone", example: "+234 803 123 4568", required: false, format: "+234 XXX XXX XXXX" },
  
  // Next of Kin
  { header: "Next of Kin Name", description: "Next of kin full name", example: "Jane Doe", required: false },
  { header: "Next of Kin Relationship", description: "Relationship to employee", example: "Spouse", required: false, allowedValues: ALLOWED_VALUES.relationship },
  { header: "Next of Kin Phone", description: "Next of kin phone number", example: "+234 803 123 4569", required: false, format: "+234 XXX XXX XXXX" },
  { header: "Next of Kin Address", description: "Next of kin address", example: "456 Side St, Lagos", required: false },
  { header: "Next of Kin Email", description: "Next of kin email", example: "jane.doe@email.com", required: false, format: "email@domain.com" },
  
  // Employment Information
  { header: "Job Title", description: "Employee's job title/position", example: "Software Engineer", required: true },
  { header: "Department", description: "Employee's department", example: "IT", required: true, allowedValues: [...DEPARTMENTS] },
  { header: "Employment Type", description: "Type of employment", example: "Full-time", required: true, allowedValues: ALLOWED_VALUES.employmentType },
  { header: "Grade Level", description: "Employee's grade level", example: "Senior", required: false, allowedValues: ALLOWED_VALUES.gradeLevel },
  { header: "Supervisor Name", description: "Name of direct supervisor", example: "Jane Smith", required: false },
  { header: "Work Location", description: "Primary work location", example: "Lagos Office", required: false },
  { header: "Hire Date", description: "Employee's hire date", example: "2023-01-15", required: true, format: "YYYY-MM-DD" },
  { header: "Probation Period", description: "Probation period in months", example: "6", required: false, format: "Number (months)" },
  { header: "Confirmation Date", description: "Date of confirmation", example: "2023-07-15", required: false, format: "YYYY-MM-DD" },
  { header: "Employment Status", description: "Current employment status", example: "Active", required: false, allowedValues: ALLOWED_VALUES.employmentStatus },
  
  // Financial Information
  { header: "Gross Salary", description: "Employee's gross salary amount", example: "1500000", required: false, format: "Number (no commas)" },
  { header: "Basic Salary", description: "Basic salary (40% of gross)", example: "600000", required: false, format: "Number (no commas)" },
  { header: "Housing Allowance", description: "Housing allowance (20% of gross)", example: "300000", required: false, format: "Number (no commas)" },
  { header: "Transport Allowance", description: "Transport allowance (9% of gross)", example: "135000", required: false, format: "Number (no commas)" },
  { header: "Other Allowance", description: "Other allowances (31% of gross)", example: "465000", required: false, format: "Number (no commas)" },
  { header: "Meal Allowance", description: "Meal allowance amount", example: "50000", required: false, format: "Number (no commas)" },
  
  // Bank Details
  { header: "Bank Name", description: "Employee's bank name", example: "GTBank", required: false, allowedValues: ALLOWED_VALUES.bankNames },
  { header: "Account Number", description: "Bank account number", example: "0123456789", required: false, format: "10 digits" },
  { header: "NUBAN", description: "NUBAN account number", example: "0123456789012", required: false, format: "13 digits" },
  { header: "Sort Code", description: "Bank sort code", example: "058", required: false, format: "3 digits" },
  
  // Employee Identification
  { header: "Employee Code", description: "Custom employee code (auto-generated if empty)", example: "EMR001", required: false, format: "EMR followed by numbers" },
  { header: "National ID (NIN)", description: "National Identification Number", example: "12345678901", required: true, format: "11 digits" },
  { header: "Passport Number", description: "Passport number (optional)", example: "A12345678", required: false },
  { header: "BVN", description: "Bank Verification Number", example: "12345678901", required: false, format: "11 digits" },
  { header: "TIN", description: "Tax Identification Number", example: "1234567890", required: false, format: "10 digits" },
  { header: "Pension PIN", description: "Pension fund PIN", example: "PEN123456789", required: false },
  { header: "NHF Number", description: "National Housing Fund number", example: "NHF123456789", required: false },
  { header: "Tax ID", description: "Tax identification", example: "TAX123456789", required: false },
  { header: "Vacation Days", description: "Annual vacation days entitlement", example: "25", required: false, format: "Number" }
];

// Generate CSV template content with instructions
export const generateCSVTemplate = (): string => {
  const headers = csvTemplateFields.map(field => field.header);
  
  // Row 2: Instructions with allowed values or format
  const instructions = csvTemplateFields.map(field => {
    if (field.allowedValues && field.allowedValues.length > 0) {
      return `CHOOSE: ${field.allowedValues.join(' | ')}`;
    }
    if (field.format) {
      return `FORMAT: ${field.format}`;
    }
    return field.required ? 'REQUIRED' : 'Optional';
  });
  
  // Row 3: Example data
  const examples = csvTemplateFields.map(field => field.example);
  
  return [
    headers.join(','),
    instructions.join(','),
    examples.join(',')
  ].join('\n');
};

// Generate an Excel-compatible CSV with data validation guidance
export const generateSmartCSVTemplate = (): string => {
  const headers = csvTemplateFields.map(field => field.header);
  
  // Create instruction rows for better clarity
  const requiredRow = csvTemplateFields.map(field => field.required ? '* REQUIRED' : '');
  const instructionRow = csvTemplateFields.map(field => {
    if (field.allowedValues && field.allowedValues.length > 0) {
      return `[${field.allowedValues.join(' / ')}]`;
    }
    if (field.format) {
      return `(${field.format})`;
    }
    return '';
  });
  const exampleRow = csvTemplateFields.map(field => field.example);
  
  // Build CSV with clear sections
  const csvLines = [
    '# EMPLOYEE IMPORT TEMPLATE - Instructions',
    '# Fields marked with * are REQUIRED',
    '# Fields with [options] must use one of the listed values',
    '# Fields with (format) must follow the specified format',
    '# Delete these instruction rows (rows 1-6) before importing',
    '#',
    headers.join(','),
    requiredRow.join(','),
    instructionRow.join(','),
    exampleRow.join(','),
    '' // Empty row for user data entry
  ];
  
  return csvLines.join('\n');
};

// Download CSV template
export const downloadCSVTemplate = (): void => {
  const csvContent = generateSmartCSVTemplate();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'employee_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Download a separate reference guide
export const downloadTemplateGuide = (): void => {
  const guide = generateFieldGuide();
  const blob = new Blob([guide], { type: 'text/plain;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'employee_import_guide.txt');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Generate a comprehensive field guide
export const generateFieldGuide = (): string => {
  const lines: string[] = [
    '═══════════════════════════════════════════════════════════════',
    '           EMPLOYEE IMPORT TEMPLATE - FIELD GUIDE',
    '═══════════════════════════════════════════════════════════════',
    '',
    'INSTRUCTIONS:',
    '1. Download the CSV template',
    '2. Delete the instruction rows (rows starting with #)',
    '3. Fill in employee data starting from row 2',
    '4. For fields with predefined values, use ONLY the listed options',
    '5. Save the file and upload for import',
    '',
    '═══════════════════════════════════════════════════════════════',
    '                    FIELD DEFINITIONS',
    '═══════════════════════════════════════════════════════════════',
    ''
  ];
  
  // Group fields by category
  const categories = [
    { name: 'PERSONAL INFORMATION', start: 0, end: 9 },
    { name: 'EMERGENCY CONTACT', start: 10, end: 11 },
    { name: 'NEXT OF KIN', start: 12, end: 16 },
    { name: 'EMPLOYMENT INFORMATION', start: 17, end: 27 },
    { name: 'FINANCIAL INFORMATION', start: 28, end: 33 },
    { name: 'BANK DETAILS', start: 34, end: 37 },
    { name: 'IDENTIFICATION & COMPLIANCE', start: 38, end: 46 }
  ];
  
  categories.forEach(category => {
    lines.push(`\n─── ${category.name} ───\n`);
    
    for (let i = category.start; i <= category.end && i < csvTemplateFields.length; i++) {
      const field = csvTemplateFields[i];
      lines.push(`${field.header}${field.required ? ' *' : ''}`);
      lines.push(`  Description: ${field.description}`);
      lines.push(`  Example: ${field.example}`);
      
      if (field.allowedValues && field.allowedValues.length > 0) {
        lines.push(`  ALLOWED VALUES:`);
        field.allowedValues.forEach(val => {
          lines.push(`    • ${val}`);
        });
      }
      
      if (field.format) {
        lines.push(`  Format: ${field.format}`);
      }
      
      lines.push('');
    }
  });
  
  lines.push('\n═══════════════════════════════════════════════════════════════');
  lines.push('                    QUICK REFERENCE');
  lines.push('═══════════════════════════════════════════════════════════════\n');
  
  lines.push('GENDER OPTIONS:');
  lines.push(`  ${ALLOWED_VALUES.gender.join(', ')}\n`);
  
  lines.push('MARITAL STATUS OPTIONS:');
  lines.push(`  ${ALLOWED_VALUES.maritalStatus.join(', ')}\n`);
  
  lines.push('EMPLOYMENT TYPE OPTIONS:');
  lines.push(`  ${ALLOWED_VALUES.employmentType.join(', ')}\n`);
  
  lines.push('EMPLOYMENT STATUS OPTIONS:');
  lines.push(`  ${ALLOWED_VALUES.employmentStatus.join(', ')}\n`);
  
  lines.push('GRADE LEVEL OPTIONS:');
  lines.push(`  ${ALLOWED_VALUES.gradeLevel.join(', ')}\n`);
  
  lines.push('DEPARTMENT OPTIONS:');
  lines.push(`  ${DEPARTMENTS.join(', ')}\n`);
  
  lines.push('BANK NAME OPTIONS:');
  lines.push(`  ${ALLOWED_VALUES.bankNames.join(', ')}\n`);
  
  lines.push('RELATIONSHIP OPTIONS:');
  lines.push(`  ${ALLOWED_VALUES.relationship.join(', ')}\n`);
  
  lines.push('\n═══════════════════════════════════════════════════════════════');
  lines.push('* Indicates required field');
  lines.push('═══════════════════════════════════════════════════════════════');
  
  return lines.join('\n');
};

// Generate template requirements text
export const getTemplateRequirements = (): string => {
  const requiredFields = csvTemplateFields.filter(field => field.required);
  return `Required fields: ${requiredFields.map(field => field.header).join(', ')}`;
};

// Get all allowed values for validation
export const getAllowedValuesForField = (fieldHeader: string): string[] | null => {
  const field = csvTemplateFields.find(f => f.header === fieldHeader);
  if (field?.allowedValues) {
    return [...field.allowedValues];
  }
  return null;
};
