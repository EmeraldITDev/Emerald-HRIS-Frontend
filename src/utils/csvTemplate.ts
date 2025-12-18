// CSV Template utility for employee data import
import { DEPARTMENTS } from '@/constants/departments';

// Predefined allowed values for selection fields
export const ALLOWED_VALUES = {
  gender: ['Male', 'Female', 'Other'],
  maritalStatus: ['Single', 'Married', 'Divorced', 'Widowed'],
  employmentType: ['Full-time', 'Part-time', 'Contract', 'Intern'],
  employmentStatus: ['Active', 'On Leave', 'Suspended', 'Terminated'],
  gradeLevel: ['Entry', 'Junior', 'Mid-Level', 'Senior', 'Lead', 'Manager', 'Director', 'Executive'],
  relationship: ['Spouse', 'Parent', 'Sibling', 'Child', 'Brother', 'Sister', 'Friend', 'Other'],
  bankNames: [
    'Access Bank', 'GT Bank', 'GTBank', 'Guaranty Trust Bank', 'First Bank', 'UBA', 'Zenith Bank', 
    'Fidelity Bank', 'Union Bank', 'Sterling Bank', 'Stanbic IBTC', 
    'Ecobank', 'FCMB', 'Polaris Bank', 'Wema Bank', 'Keystone Bank'
  ],
  probationPeriod: ['3 months', '6 months', '9 months', '12 months'],
  systemRole: ['executive', 'hr_manager', 'corporate_hr', 'line_manager', 'finance', 'it_power_user', 'contract_employee', 'general_employee']
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
  // System Role (for user account creation)
  { header: "Role", description: "System role for login access", example: "general_employee", required: false, allowedValues: ALLOWED_VALUES.systemRole },
  
  // Personal Information
  { header: "First Name", description: "Employee's first name", example: "John", required: true },
  { header: "Middle Name", description: "Employee's middle name (optional)", example: "Michael", required: false },
  { header: "Last Name", description: "Employee's last name", example: "Doe", required: true },
  { header: "Date of Birth", description: "Employee's date of birth", example: "29/01/1990", required: false, format: "DD/MM/YYYY" },
  { header: "Gender", description: "Employee's gender", example: "Male", required: false, allowedValues: ALLOWED_VALUES.gender },
  { header: "Marital Status", description: "Employee's marital status", example: "Single", required: false, allowedValues: ALLOWED_VALUES.maritalStatus },
  { header: "Nationality", description: "Employee's nationality", example: "Nigerian", required: false },
  { header: "Phone Number", description: "Employee's phone number", example: "09045677890", required: true, format: "Phone number" },
  { header: "Email Address", description: "Employee's email address", example: "john.doe@company.com", required: true, format: "email@domain.com" },
  { header: "Home Address", description: "Employee's home address", example: "123 Main St, Lagos", required: false },
  
  // Emergency Contact
  { header: "Emergency Contact Name", description: "Emergency contact full name", example: "Jane Doe", required: false },
  { header: "Emergency Contact Phone", description: "Emergency contact phone number", example: "09038899400", required: false, format: "Phone number" },
  
  // Next of Kin
  { header: "Next of Kin Name", description: "Next of kin full name", example: "Jane Doe", required: false },
  { header: "Next of Kin Relationship", description: "Relationship to employee", example: "Brother", required: false, allowedValues: ALLOWED_VALUES.relationship },
  { header: "Next of Kin Phone", description: "Next of kin phone number", example: "09038899401", required: false, format: "Phone number" },
  { header: "Next of Kin Address", description: "Next of kin address", example: "456 Side St, Lagos", required: false },
  { header: "Next of Kin Email", description: "Next of kin email address", example: "jane.doe@email.com", required: false, format: "email@domain.com" },
  
  // Employment Information
  { header: "Job Title", description: "Employee's job title/position", example: "Senior Dev", required: true },
  { header: "Department", description: "Employee's department", example: "Business Development", required: true, allowedValues: [...DEPARTMENTS] },
  { header: "Employment Type", description: "Type of employment", example: "Full-time", required: true, allowedValues: ALLOWED_VALUES.employmentType },
  { header: "Grade Level", description: "Employee's grade level", example: "Junior", required: false, allowedValues: ALLOWED_VALUES.gradeLevel },
  { header: "Supervisor Name", description: "Name of direct supervisor", example: "Jane Smith", required: false },
  { header: "Work Location", description: "Primary work location", example: "Lagos Office", required: false },
  { header: "Hire Date", description: "Employee's hire date", example: "11/12/2025", required: true, format: "DD/MM/YYYY" },
  { header: "Probation Period (in months)", description: "Probation period", example: "3 months", required: false, allowedValues: ALLOWED_VALUES.probationPeriod },
  
  // Financial Information
  { header: "Gross Salary", description: "Employee's gross salary amount", example: "250000", required: false, format: "Number (no commas)" },
  
  // Bank Details
  { header: "Bank Name", description: "Employee's bank name", example: "GT Bank", required: false, allowedValues: ALLOWED_VALUES.bankNames },
  { header: "Account Number", description: "Bank account number", example: "0525417209", required: false, format: "10 digits" },
  { header: "NUBAN", description: "NUBAN identifier", example: "sa", required: false },
  { header: "Sort Code", description: "Bank sort code", example: "df22", required: false },
  
  // Employee Identification
  { header: "National ID (NIN)", description: "National Identification Number", example: "8900002033", required: false },
  { header: "Passport Number", description: "Passport number (optional)", example: "A12345678", required: false },
  { header: "Tax Identification Number (TIN)", description: "Tax Identification Number", example: "330303", required: false },
  { header: "Pension PIN", description: "Pension fund PIN", example: "PEN123456789", required: false },
  { header: "NHF Number", description: "National Housing Fund number", example: "NHF123456789", required: false },
  { header: "BVN", description: "Bank Verification Number", example: "222300303393", required: false, format: "11 digits" },
  { header: "Vacation Days (7-30 days)", description: "Annual vacation days entitlement (7-30)", example: "23", required: false, format: "Number between 7-30" }
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
    '# Date format: DD/MM/YYYY (e.g. 29/01/1990)',
    '# Delete these instruction rows (rows 1-7) before importing',
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
    '5. Use DD/MM/YYYY format for all dates (e.g., 29/01/1990)',
    '6. Save the file and upload for import',
    '',
    '═══════════════════════════════════════════════════════════════',
    '                    FIELD DEFINITIONS',
    '═══════════════════════════════════════════════════════════════',
    ''
  ];
  
  // Group fields by category
  const categories = [
    { name: 'SYSTEM ROLE', start: 0, end: 0 },
    { name: 'PERSONAL INFORMATION', start: 1, end: 10 },
    { name: 'EMERGENCY CONTACT', start: 11, end: 12 },
    { name: 'NEXT OF KIN', start: 13, end: 17 },
    { name: 'EMPLOYMENT INFORMATION', start: 18, end: 25 },
    { name: 'FINANCIAL INFORMATION', start: 26, end: 26 },
    { name: 'BANK DETAILS', start: 27, end: 30 },
    { name: 'IDENTIFICATION & COMPLIANCE', start: 31, end: 37 }
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
  
  lines.push('SYSTEM ROLE OPTIONS:');
  lines.push(`  ${ALLOWED_VALUES.systemRole.join(', ')}\n`);
  
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
  
  lines.push('PROBATION PERIOD OPTIONS:');
  lines.push(`  ${ALLOWED_VALUES.probationPeriod.join(', ')}\n`);
  
  lines.push('DEPARTMENT OPTIONS:');
  lines.push(`  ${DEPARTMENTS.join(', ')}\n`);
  
  lines.push('BANK NAME OPTIONS:');
  lines.push(`  ${ALLOWED_VALUES.bankNames.join(', ')}\n`);
  
  lines.push('RELATIONSHIP OPTIONS:');
  lines.push(`  ${ALLOWED_VALUES.relationship.join(', ')}\n`);
  
  lines.push('\n═══════════════════════════════════════════════════════════════');
  lines.push('* Indicates required field');
  lines.push('Date format: DD/MM/YYYY');
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
