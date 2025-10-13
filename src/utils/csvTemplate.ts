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
  { header: "Emergency Contact", description: "Emergency contact name", example: "Jane Doe", required: false },
  { header: "Emergency Contact Number", description: "Emergency contact phone", example: "+234 803 123 4568", required: false },
  { header: "Next of Kin Name", description: "Next of kin full name", example: "Jane Doe", required: false },
  { header: "Next of Kin Relationship", description: "Relationship to employee", example: "Spouse", required: false },
  { header: "Next of Kin Phone", description: "Next of kin phone number", example: "+234 803 123 4569", required: false },
  { header: "Next of Kin Address", description: "Next of kin address", example: "456 Side St, Lagos", required: false },
  { header: "Next of Kin Email", description: "Next of kin email", example: "jane.doe@email.com", required: false },
  { header: "Job Title", description: "Employee's job title/position", example: "Software Engineer", required: true },
  { header: "Department", description: "Employee's department", example: "Engineering", required: true },
  { header: "Employment Type", description: "Type of employment", example: "Full-time", required: true },
  { header: "Grade Level", description: "Employee's grade level", example: "Senior", required: false },
  { header: "Supervisor Name", description: "Name of direct supervisor", example: "Jane Smith", required: false },
  { header: "Work Location", description: "Primary work location", example: "Lagos Office", required: false },
  { header: "Hire Date", description: "Employee's hire date (YYYY-MM-DD)", example: "2023-01-15", required: true },
  { header: "Probation Period", description: "Probation period in months", example: "6", required: false },
  { header: "Confirmation Date", description: "Date of confirmation (YYYY-MM-DD)", example: "2023-07-15", required: false },
  { header: "Employment Status", description: "Current employment status", example: "Active", required: false },
  { header: "Gross Salary", description: "Employee's gross salary amount", example: "1500000", required: false },
  { header: "Basic Salary", description: "Basic salary (40% of gross)", example: "600000", required: false },
  { header: "Housing Allowance", description: "Housing allowance (20% of gross)", example: "300000", required: false },
  { header: "Transport Allowance", description: "Transport allowance (9% of gross)", example: "135000", required: false },
  { header: "Other Allowance", description: "Other allowances (31% of gross)", example: "465000", required: false },
  { header: "Meal Allowance", description: "Meal allowance amount", example: "50000", required: false },
  { header: "Bank Name", description: "Employee's bank name", example: "GTBank", required: false },
  { header: "Account Number", description: "Bank account number", example: "0123456789", required: false },
  { header: "NUBAN", description: "NUBAN account number", example: "0123456789012", required: false },
  { header: "Sort Code", description: "Bank sort code", example: "058", required: false },
  { header: "Employee Code", description: "Custom employee code (auto-generated if empty)", example: "EMP001", required: false },
  { header: "National ID (NIN)", description: "National Identification Number", example: "12345678901", required: true },
  { header: "Passport Number", description: "Passport number (optional)", example: "A12345678", required: false },
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