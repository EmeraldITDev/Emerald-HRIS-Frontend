import { ALLOWED_VALUES, csvTemplateFields } from './csvTemplate';
import { DEPARTMENTS } from '@/constants/departments';

export interface ValidationError {
  row: number;
  column: string;
  value: string;
  expectedValues: string[];
  message: string;
}

export interface ValidatedRow {
  rowNumber: number;
  data: Record<string, string>;
  errors: ValidationError[];
  isValid: boolean;
}

export interface CSVValidationResult {
  isValid: boolean;
  validRows: ValidatedRow[];
  invalidRows: ValidatedRow[];
  totalRows: number;
  totalErrors: number;
}

// Field mapping for CSV headers to allowed values (normalized to lowercase)
const fieldValidationMap: Record<string, readonly string[] | string[]> = {
  'role': ALLOWED_VALUES.systemRole,
  'system role': ALLOWED_VALUES.systemRole,
  'gender': ALLOWED_VALUES.gender,
  'marital status': ALLOWED_VALUES.maritalStatus,
  'employment type': ALLOWED_VALUES.employmentType,
  'employment status': ALLOWED_VALUES.employmentStatus,
  'grade level': ALLOWED_VALUES.gradeLevel,
  'next of kin relationship': ALLOWED_VALUES.relationship,
  'bank name': ALLOWED_VALUES.bankNames,
  'department': [...DEPARTMENTS],
  'probation period (in months)': [...ALLOWED_VALUES.probationPeriod],
};

// Role label to value mapping (accepts both label and value)
const roleLabelToValue: Record<string, string> = {
  'executive': 'executive',
  'hr manager': 'hr_manager',
  'hr_manager': 'hr_manager',
  'corporate hr': 'corporate_hr',
  'corporate_hr': 'corporate_hr',
  'line manager': 'line_manager',
  'line_manager': 'line_manager',
  'finance manager': 'finance',
  'finance': 'finance',
  'it (power user)': 'it_power_user',
  'it power user': 'it_power_user',
  'it_power_user': 'it_power_user',
  'contract employee': 'contract_employee',
  'contract_employee': 'contract_employee',
  'general employee': 'general_employee',
  'general_employee': 'general_employee',
};

// Bank name normalization (treat variations as the same)
const bankNameAliases: Record<string, string[]> = {
  'guaranty trust bank': ['gtbank', 'gt bank', 'guaranty trust bank'],
  'first bank': ['first bank', 'first bank of nigeria'],
  'united bank for africa': ['uba', 'united bank for africa'],
};

// Normalize header for matching
const normalizeHeader = (header: string): string => {
  return header.toLowerCase().trim();
};

// Check if a role value is valid (accepts both labels and values)
const isValidRoleValue = (value: string): boolean => {
  if (!value || value.trim() === '') return true;
  const normalizedValue = value.trim().toLowerCase();
  return normalizedValue in roleLabelToValue;
};

// Check if a bank name is valid (with alias support)
const isValidBankName = (value: string, allowedValues: readonly string[] | string[]): boolean => {
  if (!value || value.trim() === '') return true;
  const normalizedValue = value.trim().toLowerCase();
  
  // Check direct match
  if (allowedValues.some(allowed => allowed.toLowerCase() === normalizedValue)) {
    return true;
  }
  
  // Check aliases
  for (const [canonical, aliases] of Object.entries(bankNameAliases)) {
    if (aliases.includes(normalizedValue) || canonical === normalizedValue) {
      return true;
    }
  }
  
  return false;
};

// Check if a value matches allowed values (case-insensitive)
const isValidValue = (value: string, allowedValues: readonly string[] | string[]): boolean => {
  if (!value || value.trim() === '') return true; // Empty values are handled by required field validation
  const normalizedValue = value.trim().toLowerCase();
  return allowedValues.some(allowed => allowed.toLowerCase() === normalizedValue);
};

// Get the correct case version of a value
export const getCorrectCaseValue = (value: string, allowedValues: readonly string[] | string[]): string | null => {
  const normalizedValue = value.trim().toLowerCase();
  const match = allowedValues.find(allowed => allowed.toLowerCase() === normalizedValue);
  return match || null;
};

// Get the system role value from a label or value
export const getRoleValue = (value: string): string | null => {
  if (!value || value.trim() === '') return null;
  const normalizedValue = value.trim().toLowerCase();
  return roleLabelToValue[normalizedValue] || null;
};

// Validate a single row
const validateRow = (rowData: Record<string, string>, rowNumber: number): ValidatedRow => {
  const errors: ValidationError[] = [];
  
  Object.entries(rowData).forEach(([header, value]) => {
    const normalizedHeader = normalizeHeader(header);
    const allowedValues = fieldValidationMap[normalizedHeader];
    
    if (allowedValues && value && value.trim() !== '') {
      // Special validation for role field (accepts both labels and values)
      if (normalizedHeader === 'role' || normalizedHeader === 'system role') {
        if (!isValidRoleValue(value)) {
          errors.push({
            row: rowNumber,
            column: header,
            value: value,
            expectedValues: [...allowedValues],
            message: `"${value}" is not a valid option for ${header}. Use values like: executive, hr_manager, finance_manager, etc. or labels like: Executive, HR Manager, Finance Manager, etc.`
          });
        }
      }
      // Special validation for bank name (accepts aliases)
      else if (normalizedHeader === 'bank name') {
        if (!isValidBankName(value, allowedValues)) {
          errors.push({
            row: rowNumber,
            column: header,
            value: value,
            expectedValues: [...allowedValues],
            message: `"${value}" is not a valid option for ${header}`
          });
        }
      }
      // Standard validation for other fields
      else if (!isValidValue(value, allowedValues)) {
        errors.push({
          row: rowNumber,
          column: header,
          value: value,
          expectedValues: [...allowedValues],
          message: `"${value}" is not a valid option for ${header}`
        });
      }
    }
  });

  // Validate date formats (DD/MM/YYYY)
  const dateFields = ['date of birth', 'hire date', 'confirmation date'];
  Object.entries(rowData).forEach(([header, value]) => {
    const normalizedHeader = normalizeHeader(header);
    if (dateFields.includes(normalizedHeader) && value && value.trim() !== '') {
      // Accept DD/MM/YYYY format
      const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
      if (!dateRegex.test(value.trim())) {
        errors.push({
          row: rowNumber,
          column: header,
          value: value,
          expectedValues: ['DD/MM/YYYY'],
          message: `"${value}" is not a valid date format. Use DD/MM/YYYY (e.g., 29/01/1990)`
        });
      }
    }
  });

  // Validate email format
  const emailFields = ['email', 'email address', 'next of kin email'];
  Object.entries(rowData).forEach(([header, value]) => {
    const normalizedHeader = normalizeHeader(header);
    if (emailFields.includes(normalizedHeader) && value && value.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value.trim())) {
        errors.push({
          row: rowNumber,
          column: header,
          value: value,
          expectedValues: ['email@domain.com'],
          message: `"${value}" is not a valid email format`
        });
      }
    }
  });

  // Validate required fields based on current template
  const requiredFields = csvTemplateFields.filter(f => f.required).map(f => normalizeHeader(f.header));
  Object.entries(rowData).forEach(([header, value]) => {
    const normalizedHeader = normalizeHeader(header);
    if (requiredFields.includes(normalizedHeader) && (!value || value.trim() === '')) {
      errors.push({
        row: rowNumber,
        column: header,
        value: '',
        expectedValues: [],
        message: `${header} is required`
      });
    }
  });

  // Validate vacation days range (7-30)
  Object.entries(rowData).forEach(([header, value]) => {
    const normalizedHeader = normalizeHeader(header);
    if (normalizedHeader.includes('vacation days') && value && value.trim() !== '') {
      const days = parseInt(value.trim(), 10);
      if (isNaN(days) || days < 7 || days > 30) {
        errors.push({
          row: rowNumber,
          column: header,
          value: value,
          expectedValues: ['7-30'],
          message: `Vacation days must be a number between 7 and 30`
        });
      }
    }
  });

  return {
    rowNumber,
    data: rowData,
    errors,
    isValid: errors.length === 0
  };
};

// Validate entire CSV data
export const validateCSVData = (data: Record<string, string>[]): CSVValidationResult => {
  const validatedRows = data.map((row, index) => validateRow(row, index + 1));
  
  const validRows = validatedRows.filter(row => row.isValid);
  const invalidRows = validatedRows.filter(row => !row.isValid);
  const totalErrors = invalidRows.reduce((sum, row) => sum + row.errors.length, 0);

  return {
    isValid: invalidRows.length === 0,
    validRows,
    invalidRows,
    totalRows: data.length,
    totalErrors
  };
};

// Get fields that have validation rules
export const getFieldsWithValidation = (): string[] => {
  return Object.keys(fieldValidationMap);
};

// Get allowed values for a specific field
export const getAllowedValuesForValidation = (fieldName: string): string[] | null => {
  const normalizedName = normalizeHeader(fieldName);
  const values = fieldValidationMap[normalizedName];
  return values ? [...values] : null;
};
