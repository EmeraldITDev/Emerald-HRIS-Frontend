import Papa from 'papaparse';
import { ALLOWED_VALUES, csvTemplateFields, getAllowedValuesForField } from './csvTemplate';
import { DEPARTMENTS } from '@/constants/departments';

export interface EmployeeData {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  salary: string;
  status: string;
  joinDate: string;
  phone: string;
  vacationDays: number;
  employmentType: string;
  workLocation?: string;
  gender?: string;
  maritalStatus?: string;
  gradeLevel?: string;
  bankName?: string;
  nationalId?: string;
  [key: string]: any;
}

export interface ValidationError {
  row: number;
  field: string;
  value: string;
  allowedValues: string[];
  message: string;
}

export interface CSVImportResult {
  success: boolean;
  data: EmployeeData[];
  errors: string[];
  validationErrors: ValidationError[];
  warnings: string[];
}

// Field validation rules with allowed values
const VALIDATION_RULES: { [key: string]: { allowedValues?: string[]; required?: boolean; format?: RegExp; formatMessage?: string } } = {
  'Gender': { allowedValues: [...ALLOWED_VALUES.gender] },
  'Marital Status': { allowedValues: [...ALLOWED_VALUES.maritalStatus] },
  'Employment Type': { allowedValues: [...ALLOWED_VALUES.employmentType], required: true },
  'Employment Status': { allowedValues: [...ALLOWED_VALUES.employmentStatus] },
  'Grade Level': { allowedValues: [...ALLOWED_VALUES.gradeLevel] },
  'Department': { allowedValues: [...DEPARTMENTS], required: true },
  'Bank Name': { allowedValues: [...ALLOWED_VALUES.bankNames] },
  'Next of Kin Relationship': { allowedValues: [...ALLOWED_VALUES.relationship] },
  'Email': { format: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, formatMessage: 'Invalid email format', required: true },
  'First Name': { required: true },
  'Last Name': { required: true },
  'Job Title': { required: true },
  'Phone Number': { required: true },
  'Hire Date': { format: /^\d{4}-\d{2}-\d{2}$/, formatMessage: 'Date must be in YYYY-MM-DD format', required: true },
  'Date of Birth': { format: /^\d{4}-\d{2}-\d{2}$/, formatMessage: 'Date must be in YYYY-MM-DD format' },
  'Confirmation Date': { format: /^\d{4}-\d{2}-\d{2}$/, formatMessage: 'Date must be in YYYY-MM-DD format' },
  'National ID (NIN)': { format: /^\d{11}$/, formatMessage: 'NIN must be 11 digits', required: true },
  'BVN': { format: /^\d{11}$/, formatMessage: 'BVN must be 11 digits' },
  'Account Number': { format: /^\d{10}$/, formatMessage: 'Account number must be 10 digits' },
};

// Validate a single field value against rules
export const validateFieldValue = (field: string, value: string): { isValid: boolean; error?: ValidationError } => {
  const rule = VALIDATION_RULES[field];
  
  if (!rule) return { isValid: true };
  
  // Skip validation for empty optional fields
  if (!value || value.trim() === '') {
    if (rule.required) {
      return {
        isValid: false,
        error: {
          row: 0,
          field,
          value,
          allowedValues: rule.allowedValues || [],
          message: `${field} is required`
        }
      };
    }
    return { isValid: true };
  }
  
  const trimmedValue = value.trim();
  
  // Check allowed values (case-insensitive)
  if (rule.allowedValues && rule.allowedValues.length > 0) {
    const isValidValue = rule.allowedValues.some(
      allowed => allowed.toLowerCase() === trimmedValue.toLowerCase()
    );
    
    if (!isValidValue) {
      return {
        isValid: false,
        error: {
          row: 0,
          field,
          value: trimmedValue,
          allowedValues: rule.allowedValues,
          message: `"${trimmedValue}" is not a valid option for ${field}`
        }
      };
    }
  }
  
  // Check format
  if (rule.format && !rule.format.test(trimmedValue)) {
    return {
      isValid: false,
      error: {
        row: 0,
        field,
        value: trimmedValue,
        allowedValues: [],
        message: rule.formatMessage || `Invalid format for ${field}`
      }
    };
  }
  
  return { isValid: true };
};

// Generate CSV template for download
export const generateCSVTemplate = () => {
  const headers = [
    'First Name',
    'Last Name', 
    'Email',
    'Department',
    'Position',
    'Salary',
    'Status',
    'Join Date',
    'Phone',
    'Vacation Days',
    'Employment Type'
  ];
  
  const sampleData = [
    'John',
    'Doe',
    'john.doe@company.com',
    'Engineering',
    'Software Developer',
    '₦500,000',
    'Active',
    '2024-01-15',
    '+234 801 234 5678',
    '25',
    'Full-time'
  ];
  
  const csvContent = [headers, sampleData]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'employee_template.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

// Generate unique employee ID
const generateEmployeeId = (existingIds: string[]): string => {
  let counter = 1;
  let newId = `EMR${counter.toString().padStart(3, '0')}`;
  
  while (existingIds.includes(newId)) {
    counter++;
    newId = `EMR${counter.toString().padStart(3, '0')}`;
  }
  
  return newId;
};

// Validate employee data
const validateEmployeeData = (data: any): string[] => {
  const errors: string[] = [];
  
  if (!data.firstName || data.firstName.trim() === '') {
    errors.push('First name is required');
  }
  
  if (!data.lastName || data.lastName.trim() === '') {
    errors.push('Last name is required');
  }
  
  if (!data.email || !data.email.includes('@')) {
    errors.push('Valid email is required');
  }
  
  if (!data.department || data.department.trim() === '') {
    errors.push('Department is required');
  }
  
  if (!data.position || data.position.trim() === '') {
    errors.push('Position is required');
  }
  
  return errors;
};

// Extended field mapping for comprehensive CSV import
const FIELD_MAPPING: { [key: string]: string } = {
  'first name': 'firstName',
  'firstname': 'firstName',
  'fname': 'firstName',
  'middle name': 'middleName',
  'middlename': 'middleName',
  'last name': 'lastName',
  'lastname': 'lastName',
  'lname': 'lastName',
  'email': 'email',
  'email address': 'email',
  'phone number': 'phone',
  'phone': 'phone',
  'mobile': 'phone',
  'date of birth': 'dateOfBirth',
  'dob': 'dateOfBirth',
  'gender': 'gender',
  'marital status': 'maritalStatus',
  'nationality': 'nationality',
  'home address': 'homeAddress',
  'address': 'homeAddress',
  'emergency contact': 'emergencyContact',
  'emergency contact number': 'emergencyContactNumber',
  'next of kin name': 'nextOfKinName',
  'next of kin relationship': 'nextOfKinRelationship',
  'next of kin phone': 'nextOfKinPhone',
  'next of kin address': 'nextOfKinAddress',
  'next of kin email': 'nextOfKinEmail',
  'job title': 'position',
  'position': 'position',
  'title': 'position',
  'department': 'department',
  'dept': 'department',
  'employment type': 'employmentType',
  'type': 'employmentType',
  'contract type': 'employmentType',
  'grade level': 'gradeLevel',
  'grade': 'gradeLevel',
  'supervisor name': 'supervisorName',
  'supervisor': 'supervisorName',
  'work location': 'workLocation',
  'location': 'workLocation',
  'hire date': 'joinDate',
  'join date': 'joinDate',
  'start date': 'joinDate',
  'probation period': 'probationPeriod',
  'confirmation date': 'confirmationDate',
  'employment status': 'status',
  'status': 'status',
  'gross salary': 'salary',
  'salary': 'salary',
  'pay': 'salary',
  'basic salary': 'basicSalary',
  'housing allowance': 'housingAllowance',
  'transport allowance': 'transportAllowance',
  'other allowance': 'otherAllowance',
  'meal allowance': 'mealAllowance',
  'bank name': 'bankName',
  'bank': 'bankName',
  'account number': 'accountNumber',
  'nuban': 'nuban',
  'sort code': 'sortCode',
  'employee code': 'employeeCode',
  'national id (nin)': 'nationalId',
  'nin': 'nationalId',
  'national id': 'nationalId',
  'passport number': 'passportNumber',
  'bvn': 'bvn',
  'tin': 'tin',
  'tax identification number': 'tin',
  'pension pin': 'pensionPin',
  'nhf number': 'nhfNumber',
  'tax id': 'taxId',
  'vacation days': 'vacationDays',
  'leave days': 'vacationDays'
};

// Map CSV column headers to employee fields
const mapCSVFields = (csvData: any): EmployeeData | null => {
  const mappedData: any = {};
  
  // Map CSV fields to employee fields
  Object.keys(csvData).forEach(key => {
    const normalizedKey = key.toLowerCase().trim();
    const mappedField = FIELD_MAPPING[normalizedKey];
    
    if (mappedField) {
      mappedData[mappedField] = csvData[key];
    }
  });

  // Set defaults for missing fields
  return {
    id: '', // Will be generated later
    firstName: mappedData.firstName || '',
    middleName: mappedData.middleName || '',
    lastName: mappedData.lastName || '',
    email: mappedData.email || '',
    department: mappedData.department || '',
    position: mappedData.position || '',
    salary: mappedData.salary || '₦0',
    status: mappedData.status || 'Active',
    joinDate: mappedData.joinDate || new Date().toISOString().split('T')[0],
    phone: mappedData.phone || '',
    vacationDays: parseInt(mappedData.vacationDays) || 25,
    employmentType: mappedData.employmentType || 'Full-time',
    gender: mappedData.gender || '',
    maritalStatus: mappedData.maritalStatus || '',
    gradeLevel: mappedData.gradeLevel || '',
    bankName: mappedData.bankName || '',
    nationalId: mappedData.nationalId || '',
    ...mappedData
  };
};

// Validate CSV data and return detailed validation results
export const validateCSVData = (data: any[], existingEmployees: EmployeeData[] = []): CSVImportResult => {
  const validationErrors: ValidationError[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  const validData: EmployeeData[] = [];
  const existingIds = existingEmployees.map(emp => emp.id);
  const existingEmails = existingEmployees.map(emp => emp.email.toLowerCase());
  
  data.forEach((row, rowIndex) => {
    const rowNumber = rowIndex + 2; // +2 because row 1 is header
    let rowHasErrors = false;
    
    // Skip instruction/comment rows
    const firstValue = Object.values(row)[0];
    if (typeof firstValue === 'string' && (firstValue.startsWith('#') || firstValue.startsWith('*') || firstValue.includes('REQUIRED') || firstValue.includes('CHOOSE'))) {
      return;
    }
    
    // Validate each field
    Object.keys(row).forEach(header => {
      const value = row[header];
      const validation = validateFieldValue(header, value);
      
      if (!validation.isValid && validation.error) {
        validationErrors.push({
          ...validation.error,
          row: rowNumber
        });
        rowHasErrors = true;
      }
    });
    
    // Check for duplicate emails
    const email = row['Email'] || row['email'];
    if (email && existingEmails.includes(email.toLowerCase())) {
      warnings.push(`Row ${rowNumber}: Email "${email}" already exists in the system`);
    }
    
    // Map and collect valid data
    if (!rowHasErrors) {
      const mappedEmployee = mapCSVFields(row);
      if (mappedEmployee) {
        mappedEmployee.id = generateEmployeeId([...existingIds, ...validData.map(emp => emp.id)]);
        validData.push(mappedEmployee);
      }
    }
  });
  
  return {
    success: validationErrors.length === 0,
    data: validData,
    errors,
    validationErrors,
    warnings
  };
};

// Parse CSV file and return employee data with validation
export const parseCSVFile = async (
  file: File, 
  existingEmployees: EmployeeData[]
): Promise<CSVImportResult> => {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parseErrors: string[] = results.errors.map(err => err.message);
        
        // Filter out instruction rows
        const dataRows = results.data.filter((row: any) => {
          const firstValue = Object.values(row)[0];
          return !(typeof firstValue === 'string' && (
            firstValue.startsWith('#') || 
            firstValue.startsWith('*') || 
            firstValue.includes('REQUIRED') || 
            firstValue.includes('CHOOSE') ||
            firstValue.includes('FORMAT')
          ));
        });
        
        const validationResult = validateCSVData(dataRows, existingEmployees);
        
        resolve({
          ...validationResult,
          errors: [...parseErrors, ...validationResult.errors]
        });
      },
      error: (error) => {
        resolve({
          success: false,
          data: [],
          errors: [error.message],
          validationErrors: [],
          warnings: []
        });
      }
    });
  });
};

// Parse CSV file for API integration
export const parseCSVFileForAPI = async (
  file: File, 
  existingEmployees: EmployeeData[]
): Promise<CSVImportResult> => {
  return parseCSVFile(file, existingEmployees);
};

// Export function for future PHP integration
export const formatDataForPHP = (employees: EmployeeData[]): string => {
  const phpData = {
    action: 'import_employees',
    data: employees,
    timestamp: new Date().toISOString()
  };
  
  return JSON.stringify(phpData);
};

// Get validation summary for display
export const getValidationSummary = (result: CSVImportResult): {
  totalRows: number;
  validRows: number;
  errorRows: number;
  warningCount: number;
} => {
  const errorRows = new Set(result.validationErrors.map(e => e.row)).size;
  return {
    totalRows: result.data.length + errorRows,
    validRows: result.data.length,
    errorRows,
    warningCount: result.warnings.length
  };
};
