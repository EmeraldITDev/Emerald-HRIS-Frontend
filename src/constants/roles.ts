export const ROLES = {
  EXECUTIVE: 'executive',
  HR_MANAGER: 'hr_manager',
  CORPORATE_HR: 'corporate_hr',
  LINE_MANAGER: 'line_manager',
  FINANCE: 'finance',
  IT_POWER: 'it_power_user',
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
  { label: 'Executives & HR Managers', value: 'full' },
  { label: 'Corporate HR', value: 'corporate_hr' },
  { label: 'Line Managers', value: 'line_manager' },
  { label: 'Finance Team', value: 'finance' },
  { label: 'IT (Power User)', value: 'it_power_user' },
  { label: 'General Employees', value: 'general_employee' },
];

export const ROLE_PREFIX: Record<string, string> = {
  full: 'EX',
  corporate_hr: 'CH',
  line_manager: 'LM',
  finance: 'FIN',
  it_power_user: 'IT',
  general_employee: 'EMP',
};