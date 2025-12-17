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
  'gender': ALLOWED_VALUES.gender,
  'marital status': ALLOWED_VALUES.maritalStatus,
  'employment type': ALLOWED_VALUES.employmentType,
  'employment status': ALLOWED_VALUES.employmentStatus,
  'grade level': ALLOWED_VALUES.gradeLevel,
  'next of kin relationship': ALLOWED_VALUES.relationship,
  'bank name': ALLOWED_VALUES.bankNames,
  'department': [...DEPARTMENTS],
  'probation period (in months)': ALLOWED_VALUES.probationPeriod,
};

// Normalize header for matching
const normalizeHeader = (header: string): string => {
  return header.toLowerCase().trim();
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

// Validate a single row
const validateRow = (rowData: Record<string, string>, rowNumber: number): ValidatedRow => {
  const errors: ValidationError[] = [];
  
  Object.entries(rowData).forEach(([header, value]) => {
    const normalizedHeader = normalizeHeader(header);
    const allowedValues = fieldValidationMap[normalizedHeader];
    
    if (allowedValues && value && value.trim() !== '') {
      if (!isValidValue(value, allowedValues)) {
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
