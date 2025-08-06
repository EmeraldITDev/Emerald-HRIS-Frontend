import Papa from 'papaparse';

export interface EmployeeData {
  id: string;
  firstName: string;
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
}

export interface CSVImportResult {
  success: boolean;
  data: EmployeeData[];
  errors: string[];
}

// Generate unique employee ID
const generateEmployeeId = (existingIds: string[]): string => {
  let counter = 1;
  let newId = `EMP${counter.toString().padStart(3, '0')}`;
  
  while (existingIds.includes(newId)) {
    counter++;
    newId = `EMP${counter.toString().padStart(3, '0')}`;
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

// Map CSV column headers to employee fields
const mapCSVFields = (csvData: any): EmployeeData | null => {
  const fieldMapping: { [key: string]: string } = {
    'first name': 'firstName',
    'firstname': 'firstName',
    'fname': 'firstName',
    'last name': 'lastName',
    'lastname': 'lastName',
    'lname': 'lastName',
    'email': 'email',
    'email address': 'email',
    'department': 'department',
    'dept': 'department',
    'position': 'position',
    'job title': 'position',
    'title': 'position',
    'salary': 'salary',
    'pay': 'salary',
    'status': 'status',
    'employment status': 'status',
    'join date': 'joinDate',
    'start date': 'joinDate',
    'hire date': 'joinDate',
    'phone': 'phone',
    'phone number': 'phone',
    'mobile': 'phone',
    'vacation days': 'vacationDays',
    'leave days': 'vacationDays',
    'employment type': 'employmentType',
    'type': 'employmentType',
    'contract type': 'employmentType'
  };

  const mappedData: any = {};
  
  // Map CSV fields to employee fields
  Object.keys(csvData).forEach(key => {
    const normalizedKey = key.toLowerCase().trim();
    const mappedField = fieldMapping[normalizedKey];
    
    if (mappedField) {
      mappedData[mappedField] = csvData[key];
    }
  });

  // Set defaults for missing fields
  return {
    id: '', // Will be generated later
    firstName: mappedData.firstName || '',
    lastName: mappedData.lastName || '',
    email: mappedData.email || '',
    department: mappedData.department || '',
    position: mappedData.position || '',
    salary: mappedData.salary || '₦0',
    status: mappedData.status || 'Active',
    joinDate: mappedData.joinDate || new Date().toISOString().split('T')[0],
    phone: mappedData.phone || '',
    vacationDays: parseInt(mappedData.vacationDays) || 25,
    employmentType: mappedData.employmentType || 'FTE'
  };
};

// Parse CSV file and return employee data
export const parseCSVFile = async (
  file: File, 
  existingEmployees: EmployeeData[]
): Promise<CSVImportResult> => {
  return new Promise((resolve) => {
    const existingIds = existingEmployees.map(emp => emp.id);
    const importedData: EmployeeData[] = [];
    const errors: string[] = [];

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          errors.push(...results.errors.map(err => err.message));
        }

        results.data.forEach((row: any, index: number) => {
          const mappedEmployee = mapCSVFields(row);
          
          if (mappedEmployee) {
            const validationErrors = validateEmployeeData(mappedEmployee);
            
            if (validationErrors.length > 0) {
              errors.push(`Row ${index + 1}: ${validationErrors.join(', ')}`);
            } else {
              // Generate unique ID
              mappedEmployee.id = generateEmployeeId([...existingIds, ...importedData.map(emp => emp.id)]);
              importedData.push(mappedEmployee);
            }
          }
        });

        resolve({
          success: errors.length === 0,
          data: importedData,
          errors
        });
      },
      error: (error) => {
        resolve({
          success: false,
          data: [],
          errors: [error.message]
        });
      }
    });
  });
};

// Export function for future PHP integration
export const formatDataForPHP = (employees: EmployeeData[]): string => {
  // Structure data in a format that can be easily sent to PHP backend
  const phpData = {
    action: 'import_employees',
    data: employees,
    timestamp: new Date().toISOString()
  };
  
  return JSON.stringify(phpData);
};