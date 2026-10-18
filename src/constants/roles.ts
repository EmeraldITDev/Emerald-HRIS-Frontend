export const ROLES = {
  EXECUTIVE: 'executive',
  HR_MANAGER: 'hr_manager',
  CORPORATE_HR: 'corporate_hr',
  LINE_MANAGER: 'line_manager',
  FINANCE: 'finance',
  IT_POWER: 'it_power_user',
  CONTRACT_HR: 'contract_hr',
  CONTRACT_STAFF: 'contract_staff',
  CONTRACT_EMPLOYEE: 'contract_employee',
  EMPLOYEE: 'general_employee',
} as const;

/**
 * Login roles that should get the employee self-service dashboard
 * (no org-wide headcount / salary budget KPIs).
 * Distinct from employment_type "Contract", which only changes payroll math.
 */
export const EMPLOYEE_SELF_SERVICE_ROLES = [
  ROLES.EMPLOYEE,
  ROLES.CONTRACT_STAFF,
  ROLES.CONTRACT_EMPLOYEE,
  ROLES.CONTRACT_HR,
  ROLES.FINANCE,
] as const;

export function isEmployeeSelfServiceRole(role?: string | null): boolean {
  return !!role && (EMPLOYEE_SELF_SERVICE_ROLES as readonly string[]).includes(role);
}

export const PERMISSIONS = {
  FULL: [ROLES.EXECUTIVE, ROLES.HR_MANAGER],
  EMPLOYEE_MGMT: [ROLES.CORPORATE_HR, ROLES.HR_MANAGER, ROLES.EXECUTIVE],
  APPROVALS: [ROLES.LINE_MANAGER, ROLES.CORPORATE_HR, ROLES.HR_MANAGER, ROLES.EXECUTIVE],
  REPORTS: [ROLES.LINE_MANAGER, ROLES.HR_MANAGER, ROLES.EXECUTIVE, ROLES.FINANCE],
  FINANCIALS: [ROLES.FINANCE, ROLES.HR_MANAGER, ROLES.EXECUTIVE],
  ADMIN_TOOLS: [ROLES.IT_POWER, ROLES.EXECUTIVE],
  SELF_SERVICE: [
    ROLES.EMPLOYEE,
    ROLES.CONTRACT_STAFF,
    ROLES.CONTRACT_EMPLOYEE,
    ROLES.CONTRACT_HR,
    ROLES.LINE_MANAGER,
    ROLES.CORPORATE_HR,
    ROLES.HR_MANAGER,
    ROLES.EXECUTIVE,
  ],
} as const;

/** Exact set of system roles accepted by the backend EmployeeFullController. */
export const SYSTEM_ROLE_OPTIONS = [
  { label: 'Executive', value: 'executive' },
  { label: 'HR Manager', value: 'hr_manager' },
  { label: 'Corporate HR', value: 'corporate_hr' },
  { label: 'Line Manager', value: 'line_manager' },
  { label: 'Finance', value: 'finance' },
  { label: 'IT Power User', value: 'it_power_user' },
  { label: 'Contract HR', value: 'contract_hr' },
  { label: 'Contract Staff', value: 'contract_staff' },
  { label: 'General Employee', value: 'general_employee' },
];

/** Kept as an alias so Add/Edit/Details all use the backend-accepted set. */
export const ROLE_OPTIONS = SYSTEM_ROLE_OPTIONS;

export const ROLE_PREFIX: Record<string, string> = {
  executive: 'EX',
  hr_manager: 'HR',
  corporate_hr: 'CH',
  line_manager: 'LM',
  finance: 'FIN',
  it_admin: 'ITA',
  it_power_user: 'ITP',
  consulting_hr: 'COH',
  contract_hr: 'CRH',
  // Legacy corporate_user accounts are treated as general employees.
  corporate_user: 'EMP',
  contract_staff: 'CS',
  contract_employee: 'CE',
  general_employee: 'EMP',
};