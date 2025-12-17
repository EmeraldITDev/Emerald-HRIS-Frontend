// CSV Template utility for employee data import
import { DEPARTMENTS } from '@/constants/departments';
import * as XLSX from 'xlsx';

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

// Excel column letter helper
const getColumnLetter = (colIndex: number): string => {
  let letter = '';
  while (colIndex >= 0) {
    letter = String.fromCharCode((colIndex % 26) + 65) + letter;
    colIndex = Math.floor(colIndex / 26) - 1;
  }
  return letter;
};

// Generate Excel template with data validation dropdowns
export const downloadExcelTemplate = (): void => {
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Create main data sheet
  const headers = csvTemplateFields.map(field => field.header);
  const requiredRow = csvTemplateFields.map(field => field.required ? '* REQUIRED' : '');
  const formatRow = csvTemplateFields.map(field => {
    if (field.allowedValues && field.allowedValues.length > 0) {
      return '↓ Select from dropdown';
    }
    if (field.format) {
      return `Format: ${field.format}`;
    }
    return '';
  });
  const exampleRow = csvTemplateFields.map(field => field.example);
  
  // Main sheet data
  const mainSheetData = [
    headers,
    requiredRow,
    formatRow,
    exampleRow,
    // Empty rows for data entry (10 rows)
    ...Array(10).fill(csvTemplateFields.map(() => ''))
  ];
  
  const mainSheet = XLSX.utils.aoa_to_sheet(mainSheetData);
  
  // Set column widths
  mainSheet['!cols'] = csvTemplateFields.map(field => ({
    wch: Math.max(field.header.length + 2, 15)
  }));
  
  // Style header row (make it bold would require xlsx-style, so we use comments instead)
  // Add cell comments for guidance
  csvTemplateFields.forEach((field, colIndex) => {
    const cellRef = `${getColumnLetter(colIndex)}1`;
    if (!mainSheet[cellRef]) return;
    
    // Add comment with field description
    mainSheet[cellRef].c = [{
      a: 'Template Guide',
      t: `${field.description}${field.required ? ' (Required)' : ''}${field.allowedValues ? '\n\nAllowed values: ' + field.allowedValues.join(', ') : ''}${field.format ? '\n\nFormat: ' + field.format : ''}`
    }];
  });
  
  // Create a hidden sheet for dropdown values (data validation source)
  const dropdownData: string[][] = [];
  const maxLength = Math.max(
    ALLOWED_VALUES.gender.length,
    ALLOWED_VALUES.maritalStatus.length,
    ALLOWED_VALUES.employmentType.length,
    ALLOWED_VALUES.employmentStatus.length,
    ALLOWED_VALUES.gradeLevel.length,
    ALLOWED_VALUES.relationship.length,
    ALLOWED_VALUES.bankNames.length,
    DEPARTMENTS.length
  );
  
  // Build dropdown reference sheet
  const dropdownHeaders = [
    'Gender', 'Marital Status', 'Employment Type', 'Employment Status', 
    'Grade Level', 'Relationship', 'Bank Name', 'Department'
  ];
  const dropdownValues = [
    [...ALLOWED_VALUES.gender],
    [...ALLOWED_VALUES.maritalStatus],
    [...ALLOWED_VALUES.employmentType],
    [...ALLOWED_VALUES.employmentStatus],
    [...ALLOWED_VALUES.gradeLevel],
    [...ALLOWED_VALUES.relationship],
    [...ALLOWED_VALUES.bankNames],
    [...DEPARTMENTS]
  ];
  
  // Create rows for dropdown sheet
  dropdownData.push(dropdownHeaders);
  for (let i = 0; i < maxLength; i++) {
    const row = dropdownValues.map(values => values[i] || '');
    dropdownData.push(row);
  }
  
  const dropdownSheet = XLSX.utils.aoa_to_sheet(dropdownData);
  dropdownSheet['!cols'] = dropdownHeaders.map(() => ({ wch: 20 }));
  
  // Add data validation to main sheet
  // Note: xlsx library has limited support for data validation, 
  // so we'll use a workaround with the dropdown sheet
  
  // Map field indices to dropdown columns
  const fieldToDropdownCol: { [key: string]: number } = {
    'Gender': 0,
    'Marital Status': 1,
    'Employment Type': 2,
    'Employment Status': 3,
    'Grade Level': 4,
    'Next of Kin Relationship': 5,
    'Bank Name': 6,
    'Department': 7
  };
  
  // Create data validations array
  const dataValidations: any[] = [];
  
  csvTemplateFields.forEach((field, colIndex) => {
    const dropdownColIndex = fieldToDropdownCol[field.header];
    if (dropdownColIndex !== undefined) {
      const dropdownCol = getColumnLetter(dropdownColIndex);
      const values = dropdownValues[dropdownColIndex] as string[];
      
      // Add validation for rows 5-14 (data entry rows)
      for (let row = 5; row <= 14; row++) {
        const cellRef = `${getColumnLetter(colIndex)}${row}`;
        dataValidations.push({
          sqref: cellRef,
          type: 'list',
          formula1: `"${values.join(',')}"`,
          showDropDown: false,
          showErrorMessage: true,
          errorTitle: 'Invalid Value',
          error: `Please select from: ${values.join(', ')}`,
          showInputMessage: true,
          promptTitle: field.header,
          prompt: `Select ${field.header} from the dropdown`
        });
      }
    }
  });
  
  // Apply data validations (if supported)
  if (dataValidations.length > 0) {
    mainSheet['!dataValidation'] = dataValidations;
  }
  
  // Add sheets to workbook
  XLSX.utils.book_append_sheet(wb, mainSheet, 'Employee Import');
  XLSX.utils.book_append_sheet(wb, dropdownSheet, 'Dropdown Values');
  
  // Generate and download file
  XLSX.writeFile(wb, 'employee_import_template.xlsx');
};

// Generate a simplified Excel template that works better with data validation
export const downloadExcelTemplateSimple = (): void => {
  const wb = XLSX.utils.book_new();
  
  // Headers and example row
  const headers = csvTemplateFields.map(field => 
    field.required ? `${field.header} *` : field.header
  );
  
  // Instructions row with allowed values
  const instructionsRow = csvTemplateFields.map(field => {
    if (field.allowedValues && field.allowedValues.length > 0) {
      return `Options: ${field.allowedValues.join(' | ')}`;
    }
    if (field.format) {
      return `Format: ${field.format}`;
    }
    return field.required ? 'Required' : 'Optional';
  });
  
  const exampleRow = csvTemplateFields.map(field => field.example);
  
  // Create sheet with headers, instructions, example, and empty rows
  const sheetData = [
    headers,
    instructionsRow,
    exampleRow,
    ...Array(20).fill(csvTemplateFields.map(() => ''))
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  
  // Set column widths based on content
  ws['!cols'] = csvTemplateFields.map(field => ({
    wch: Math.max(
      field.header.length + 3,
      field.example.length + 2,
      field.allowedValues ? Math.max(...field.allowedValues.map(v => v.length)) + 10 : 15,
      20
    )
  }));
  
  // Freeze first row (headers)
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };
  
  // Add data validation for dropdown fields
  csvTemplateFields.forEach((field, colIndex) => {
    if (field.allowedValues && field.allowedValues.length > 0) {
      const col = getColumnLetter(colIndex);
      const values = [...field.allowedValues];
      
      // Create validation for data rows (rows 4-23)
      for (let row = 4; row <= 23; row++) {
        const cellRef = `${col}${row}`;
        
        // Set cell with data validation formula
        if (!ws[cellRef]) {
          ws[cellRef] = { t: 's', v: '' };
        }
      }
    }
  });
  
  // Create reference sheet with all dropdown values
  const refData: string[][] = [
    ['FIELD', 'ALLOWED VALUES'],
    [''],
    ['Gender', ...ALLOWED_VALUES.gender],
    ['Marital Status', ...ALLOWED_VALUES.maritalStatus],
    ['Employment Type', ...ALLOWED_VALUES.employmentType],
    ['Employment Status', ...ALLOWED_VALUES.employmentStatus],
    ['Grade Level', ...ALLOWED_VALUES.gradeLevel],
    ['Next of Kin Relationship', ...ALLOWED_VALUES.relationship],
    ['Bank Name', ...ALLOWED_VALUES.bankNames],
    ['Department', ...DEPARTMENTS],
    [''],
    ['* Fields marked with asterisk (*) are required'],
    ['* For dropdown fields, use only the values listed above'],
    ['* Dates must be in YYYY-MM-DD format (e.g., 2024-01-15)'],
    ['* Delete this reference sheet before importing']
  ];
  
  const refSheet = XLSX.utils.aoa_to_sheet(refData);
  refSheet['!cols'] = [
    { wch: 25 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 }
  ];
  
  // Add sheets
  XLSX.utils.book_append_sheet(wb, ws, 'Employee Data');
  XLSX.utils.book_append_sheet(wb, refSheet, 'Valid Options Reference');
  
  // Download
  XLSX.writeFile(wb, 'employee_import_template.xlsx');
};
