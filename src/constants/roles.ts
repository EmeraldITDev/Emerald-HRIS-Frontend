export const ROLES = {
  EXECUTIVE: 'executive',
  HR_MANAGER: 'hr_manager',
  CORPORATE_HR: 'corporate_hr',
  LINE_MANAGER: 'line_manager',
  FINANCE: 'finance_manager',
  IT_POWER: 'it_power_user',
  CONTRACT_EMPLOYEE: 'contract_employee',
  EMPLOYEE: 'general_employee',
} as const;

export const PERMISSIONS = {
  FULL: [ROLES.EXECUTIVE, ROLES.HR_MANAGER],
  EMPLOYEE_MGMT: [ROLES.CORPORATE_HR, ROLES.HR_MANAGER, ROLES.EXECUTIVE],
  APPROVALS: [ROLES.LINE_MANAGER, ROLES.CORPORATE_HR, ROLES.HR_MANAGER, ROLES.EXECUTIVE],
  REPORTS: [ROLES.LINE_MANAGER, ROLES.HR_MANAGER, ROLES.EXECUTIVE, ROLES.FINANCE],
  FINANCIALS: [ROLES.FINANCE, ROLES.HR_MANAGER, ROLES.EXECUTIVE],
  ADMIN_TOOLS: [ROLES.IT_POWER, ROLES.EXECUTIVE],
  SELF_SERVICE: [ROLES.EMPLOYEE, ROLES.LINE_MANAGER, ROLES.CORPORATE_HR, ROLES.HR_MANAGER, ROLES.EXECUTIVE],
} as const;

export const ROLE_OPTIONS = [
  { label: 'Executive', value: 'executive' },
  { label: 'HR Manager', value: 'hr_manager' },
  { label: 'Corporate HR', value: 'corporate_hr' },
  { label: 'Line Manager', value: 'line_manager' },
  { label: 'Finance Manager', value: 'finance_manager' },
  { label: 'IT (Power User)', value: 'it_power_user' },
  { label: 'Contract Employee', value: 'contract_employee' },
  { label: 'General Employee', value: 'general_employee' },
];

export const ROLE_PREFIX: Record<string, string> = {
  executive: 'EX',
  hr_manager: 'HR',
  corporate_hr: 'CH',
  line_manager: 'LM',
  finance_manager: 'FIN',
  it_admin: 'ITA',
  it_power_user: 'ITP',
  consulting_hr: 'COH',
  contract_hr: 'CRH',
  corporate_user: 'CU',
  contract_staff: 'CS',
  contract_employee: 'CE',
  general_employee: 'EMP',
};