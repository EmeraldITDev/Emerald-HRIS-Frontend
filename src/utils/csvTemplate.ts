// CSV Template utility for employee data import

export interface CSVTemplateField {
  header: string;
  description: string;
  example: string;
  required: boolean;
}

export const csvTemplateFields: CSVTemplateField[] = [
  { header: "First Name", description: "Employee's first name", example: "John", required: true },
  { header: "Middle Name", description: "Employee's middle name (optional)", example: "Michael", required: false },
  { header: "Last Name", description: "Employee's last name", example: "Doe", required: true },
  { header: "Email", description: "Employee's email address", example: "john.doe@company.com", required: true },
  { header: "Phone Number", description: "Employee's phone number", example: "+234 803 123 4567", required: true },
  { header: "Date of Birth", description: "Employee's date of birth (YYYY-MM-DD)", example: "1990-05-15", required: false },
  { header: "Gender", description: "Employee's gender", example: "Male", required: false },
  { header: "Marital Status", description: "Employee's marital status", example: "Single", required: false },
  { header: "Nationality", description: "Employee's nationality", example: "Nigerian", required: false },
  { header: "Home Address", description: "Employee's home address", example: "123 Main St, Lagos", required: false },
  { header: "Emergency Contact", description: "Emergency contact information", example: "Jane Doe - +234 803 123 4568", required: false },
  { header: "Job Title", description: "Employee's job title/position", example: "Software Engineer", required: true },
  { header: "Department", description: "Employee's department", example: "Engineering", required: true },
  { header: "Employment Type", description: "Type of employment", example: "Full-Time", required: true },
  { header: "Grade Level", description: "Employee's grade level", example: "Senior", required: false },
  { header: "Supervisor Name", description: "Name of direct supervisor", example: "Jane Smith", required: false },
  { header: "Work Location", description: "Primary work location", example: "Lagos Office", required: false },
  { header: "Hire Date", description: "Employee's hire date (YYYY-MM-DD)", example: "2023-01-15", required: true },
  { header: "Probation Period", description: "Probation period in months", example: "6", required: false },
  { header: "Confirmation Date", description: "Date of confirmation (YYYY-MM-DD)", example: "2023-07-15", required: false },
  { header: "Employment Status", description: "Current employment status", example: "Active", required: false },
  { header: "Gross Salary", description: "Employee's gross salary amount", example: "1500000", required: false },
  { header: "Housing Allowance", description: "Housing allowance amount", example: "300000", required: false },
  { header: "Transport Allowance", description: "Transport allowance amount", example: "150000", required: false },
  { header: "Other Allowance", description: "Other allowances amount", example: "100000", required: false },
  { header: "Bank Account", description: "Employee's bank account details", example: "GTBank - 0123456789", required: false },
  { header: "Employee ID", description: "Custom employee ID (auto-generated if empty)", example: "EMP001", required: false },
  { header: "National ID (NIN)", description: "National Identification Number", example: "12345678901", required: true },
  { header: "Passport Number", description: "Passport number", example: "A12345678", required: true },
  { header: "BVN", description: "Bank Verification Number", example: "12345678901", required: false },
  { header: "TIN", description: "Tax Identification Number", example: "1234567890", required: false },
  { header: "Pension PIN", description: "Pension fund PIN", example: "PEN123456789", required: false },
  { header: "NHF Number", description: "National Housing Fund number", example: "NHF123456789", required: false },
  { header: "Tax ID", description: "Tax identification", example: "TAX123456789", required: false },
  { header: "Vacation Days", description: "Annual vacation days entitlement", example: "25", required: false }
];

// Generate CSV template content
export const generateCSVTemplate = (): string => {
  const headers = csvTemplateFields.map(field => field.header);
  const examples = csvTemplateFields.map(field => field.example);
  
  return [
    headers.join(','),
    examples.join(',')
  ].join('\n');
};

// Download CSV template
export const downloadCSVTemplate = (): void => {
  const csvContent = generateCSVTemplate();
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

// Generate template requirements text
export const getTemplateRequirements = (): string => {
  const requiredFields = csvTemplateFields.filter(field => field.required);
  return `Required fields: ${requiredFields.map(field => field.header).join(', ')}`;
};