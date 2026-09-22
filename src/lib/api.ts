// Use environment variable for flexibility between local and deployed environments
const API = import.meta.env.VITE_API_URL;

// Ensure the base URL always ends with /api (backend mounts all routes under /api).
const withApiSuffix = (url: string) => (url.replace(/\/+$/, '').endsWith('/api') ? url.replace(/\/+$/, '') : `${url.replace(/\/+$/, '')}/api`);

const API_BASE_URL =
  (typeof window !== 'undefined' && window.location.hostname === 'localhost')
    ? 'http://localhost:8000/api' // Local backend
    : withApiSuffix(API || 'https://hris-backend-to3i.onrender.com/api'); // Fallback to Render if no env var found

export { API_BASE_URL };
    
export interface Employee {
  id?: number;
  user_id?: number;
  user_role?: string | null;
  user_roles?: string[] | string | null;
  first_name: string;
  last_name: string;
  email: string;
  dob?: string;
  gender?: string;
  marital_status?: string;
  nationality?: string;
  phone?: string; // Backend uses 'phone'
  phone_number?: string; // Keep for backwards compatibility
  address?: string;
  profile_picture?: string;
  profile_picture_url?: string;
  job_title: string;
  department?: string;
  employment_type?: string;
  grade_level?: string;
  supervisor_name?: string;
  work_location?: string;
  hire_date?: string;
  probation_period?: string;
  confirmation_date?: string;
  employment_status?: string;
  vacation_days?: number;
  gross_salary?: number;
  financial_details?: {
    gross_salary?: number | string;
    basic_salary?: number | string;
    housing_allowance?: number | string;
    transport_allowance?: number | string;
    meal_allowance?: number | string;
    other_allowance?: number | string;
    bank_name?: string;
    account_number?: string;
    nuban?: string;
    sort_code?: string;
    bank_account?: string;
  };
  meal_allowance?: number;
  housing_allowance?: number;
  transport_allowance?: number;
  basic_salary?: number;
  other_allowance?: number;
  bank_account?: string;
  bank_name?: string;
  account_number?: string;
  nuban?: string;
  sort_code?: string;
  employee_code?: string;
  employee_display?: string;
  national_id?: string;
  passport_number?: string;
  bvn?: string;
  tin?: string;
  pension_pin?: string;
  nhf_number?: string;
  tax_id?: string;
  supporting_documents?: string;
  performance_history?: string;
  asset_allocation_history?: string;
  // New compensation source fields (Requirement 7)
  baseSalary?: number;
  salaryType?: 'monthly' | 'annual' | 'hourly';
  created_at?: string;
  updated_at?: string;
}

export interface Attendance {
  id?: number;
  employee_id: number;
  date: string;
  clock_in?: string;
  clock_out?: string;
  break_start?: string;
  break_end?: string;
  total_hours?: number;
  break_duration?: number;
  status: string;
  notes?: string;
  location?: string;
  created_at?: string;
  updated_at?: string;
}

export type AttendanceStatus =
  | 'Present-Physical'
  | 'Present-WFH'
  | 'Late'
  | 'Unapproved-WFH'
  | 'Location-Mismatch'
  | 'Missing-Clockout'
  | 'Absent'
  | string;

export type WorkMode = 'Physical' | 'WFH' | 'Exception';

export interface AttendanceTodayRecord {
  id?: number;
  employee_id?: number;
  date?: string;
  clock_in?: string | null;
  clock_out?: string | null;
  break_start?: string | null;
  break_end?: string | null;
  work_mode?: WorkMode;
  attendance_status?: AttendanceStatus;
  location_status?: 'Verified' | 'Mismatch' | 'Exempt' | 'Not Required' | 'N/A' | string;
  expected_mode?: WorkMode;
  assigned_location?: string;
  missing_clockout_date?: string | null;
  [key: string]: any;
}

export interface EmployeeAttendanceProfile {
  employee_id?: number;
  assigned_location?: 'Lagos' | 'Calabar' | 'Abuja' | string;
  work_arrangement?: 'Hybrid' | 'Fully Onsite' | 'Fully Remote' | string;
  expected_workdays?: string[];
  expected_modes?: Record<string, WorkMode>;
  clock_in_time?: string;
  clock_out_time?: string;
  effective_date?: string;
  [key: string]: any;
}

export interface LeaveType {
  id?: number;
  name: string;
  description?: string;
  default_days: number;
  requires_approval: boolean;
  is_active: boolean;
  color?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LeaveRequest {
  id?: number;
  employee_id: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason?: string;
  status: string;
  approved_by?: number;
  approved_at?: string;
  approval_notes?: string;
  rejection_reason?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PayrollRecord {
  id?: number;
  employee_id: number;
  pay_period: string;
  pay_date?: string;
  base_salary?: number;
  baseSalary?: number;
  basic_salary: number;
  housing_allowance: number;
  housingAllowance?: number;
  transport_allowance: number;
  transportAllowance?: number;
  meal_allowance: number;
  other_allowance: number;
  otherAllowance?: number;
  overtime: number;
  bonus: number;
  commission: number;
  gross_pay: number;
  grossPay?: number;
  total_allowances: number;
  taxable_income: number;
  paye_tax: number;
  income_tax?: number;
  pension_employee: number;
  pension?: number;
  pension_employer: number;
  nhf: number;
  other_deductions: number;
  deduction_notes?: string;
  total_deductions: number;
  net_pay: number;
  netPay?: number;
  status: 'pending' | 'processed' | 'paid' | 'cancelled';
  payment_method?: string;
  payment_reference?: string;
  processed_by?: number;
  processed_at?: string;
  approved_by?: number;
  approved_at?: string;
  notes?: string;
  employee?: any;
  created_at?: string;
  updated_at?: string;
}

export interface JobPosting {
  id?: number;
  title: string;
  department: string;
  description?: string;
  requirements?: string;
  salary_range?: string;
  location?: string;
  employment_type?: string;
  deadline?: string;
  status?: 'draft' | 'open' | 'closed';
  posted_by?: number;
  hiring_manager_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Candidate {
  id?: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  resume_path?: string;
  cover_letter?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  status?: 'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Application {
  id?: number;
  job_posting_id: number;
  candidate_id: number;
  status?: 'pending' | 'screening' | 'interview' | 'offered' | 'rejected' | 'hired';
  interview_date?: string;
  interview_notes?: string;
  reviewed_by?: number;
  reviewed_at?: string;
  notes?: string;
  jobPosting?: JobPosting;
  candidate?: Candidate;
  created_at?: string;
  updated_at?: string;
}

export interface Announcement {
  id?: number;
  title: string;
  content: string;
  priority?: 'low' | 'medium' | 'high';
  target_audience?: string;
  expires_at?: string;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Policy {
  id?: number;
  title: string;
  category?: string;
  content: string;
  version?: string;
  effective_date: string;
  status?: 'draft' | 'active' | 'archived';
  created_by?: number;
  approved_by?: number;
  approved_at?: string;
  createdBy?: {
    id: number;
    name: string;
  };
  approvedBy?: {
    id: number;
    name: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface PerformanceReview {
  id?: number;
  employee_id: number;
  manager_id: number;
  period: string;
  status: 'draft' | 'submitted' | 'under_review' | 'meeting_scheduled' | 'discussed' | 'employee_signed' | 'manager_signed' | 'hr_approved' | 'closed';
  self_assessment?: any;
  manager_review?: any;
  meeting_at?: string;
  meeting_notes?: string;
  employee_signed_at?: string;
  manager_signed_at?: string;
  hr_approved_at?: string;
  employee?: any;
  manager?: any;
  created_at?: string;
  updated_at?: string;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private normalizeEmployee(employee: Employee): Employee {
    const financial = (employee as any)?.financial_details || {};
    const raw = employee as any;
    return {
      ...employee,
      user_id: raw.user_id ?? raw.userId ?? null,
      user_role: raw.user_role ?? raw.userRole ?? null,
      user_roles: raw.user_roles ?? raw.userRoles ?? [],
      gross_salary: employee.gross_salary ?? financial.gross_salary,
      basic_salary: employee.basic_salary ?? financial.basic_salary,
      housing_allowance: employee.housing_allowance ?? financial.housing_allowance,
      transport_allowance: employee.transport_allowance ?? financial.transport_allowance,
      meal_allowance: employee.meal_allowance ?? financial.meal_allowance,
      other_allowance: employee.other_allowance ?? financial.other_allowance,
      bank_name: employee.bank_name ?? financial.bank_name,
      account_number: employee.account_number ?? financial.account_number,
      nuban: employee.nuban ?? financial.nuban,
      sort_code: employee.sort_code ?? financial.sort_code,
      bank_account: employee.bank_account ?? financial.bank_account,
    } as Employee;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Get auth token from localStorage
    const token = localStorage.getItem('auth_token');
    
    console.log('🌍 API Request URL:', url);
    console.log('🌍 Environment:', process.env.NODE_ENV);
    console.log('📤 Endpoint being called:', endpoint);
    
    // Don't set Content-Type for FormData - let browser set it with boundary
    const isFormData = options.body instanceof FormData;
    
    const config: RequestInit = {
      headers: {
        ...(!isFormData && { 'Content-Type': 'application/json' }),
        'Accept': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      console.log('🌍 Response Status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        // Try to parse the error body to get a meaningful message
        let errorMessage = `HTTP error! status: ${response.status}`;
        let errorData: any = null;
        try {
          const errorJson = JSON.parse(errorText);
          errorData = errorJson;
          if (errorJson.message) errorMessage = errorJson.message;
          else if (errorJson.error) errorMessage = errorJson.error;
          else if (errorJson.errors) {
            const fieldErrors = Object.entries(errorJson.errors)
              .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
              .join('; ');
            errorMessage = fieldErrors || errorMessage;
          }
        } catch {}
        const err: any = new Error(errorMessage);
        err.status = response.status;
        err.data = errorData;
        throw err;
      }
      
      const data = await response.json();
      console.log('✅ API Response Data:', data);
      return data;
    } catch (error) {
      console.error('❌ API request failed:', error);
      throw error;
    }
  }

  // Test API connection
  async testConnection(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/test');
  }

  // Authentication methods
  async login(email: string, password: string): Promise<{ user: any; token: string }> {
    return this.request<{ user: any; token: string; requires_2fa?: boolean; temp_token?: string; message?: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async verifyOtp(temp_token: string, code: string): Promise<{ user: any; token: string }> {
    return this.request<{ user: any; token: string }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ temp_token, code }),
    });
  }

  async logout(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser(): Promise<{ user: any }> {
    return this.request<{ user: any }>('/auth/me');
  }

  // Get all employees
  async getEmployees(): Promise<Employee[]> {
    const response = await this.request<any>('/employees-full');
    const employees = Array.isArray(response) ? response : (response?.data || []);
    return Array.isArray(employees) ? employees.map((employee) => this.normalizeEmployee(employee)) : [];
  }

  // Get employees with optional hire-date range filter (Requirement 2)
  async getEmployeesFiltered(params?: {
    startDateFrom?: string;
    startDateTo?: string;
    page?: number;
    department?: string;
    status?: string;
  }): Promise<any> {
    const qp = new URLSearchParams();
    if (params?.startDateFrom) qp.append('startDateFrom', params.startDateFrom);
    if (params?.startDateTo) qp.append('startDateTo', params.startDateTo);
    if (params?.page) qp.append('page', String(params.page));
    if (params?.department) qp.append('department', params.department);
    if (params?.status) qp.append('status', params.status);
    const q = qp.toString();
    const response = await this.request<any>(`/employees-full${q ? `?${q}` : ''}`);
    if (Array.isArray(response)) return response.map((employee) => this.normalizeEmployee(employee));
    if (Array.isArray(response?.data)) {
      return { ...response, data: response.data.map((employee: Employee) => this.normalizeEmployee(employee)) };
    }
    return response;
  }

  // Upcoming work anniversaries (Requirement 3)
  async getUpcomingAnniversaries(days: number = 7): Promise<Array<{
    employeeId: string;
    name: string;
    avatarUrl: string | null;
    startDate: string;
    yearsOfService: number;
    anniversaryDate: string;
    daysUntil: number;
  }>> {
    return this.request(`/employees/anniversaries?days=${days}`);
  }

  // Leave annual balance (Requirement 1)
  async getLeaveBalance(employeeId: number | string): Promise<{
    used: number;
    limit: number;
    remaining: number;
    year: number;
  }> {
    return this.request(`/leave/balance/${employeeId}`);
  }

  // Detailed payslip (Requirement 4)
  async getPayslipDetail(employeeId: number | string, payPeriod: string): Promise<any> {
    return this.request(`/payroll/payslip/${employeeId}/${payPeriod}`);
  }

  // Get current user's employee profile
  async getMyProfile(): Promise<Employee> {
    const employee = await this.request<Employee>('/employees-full/my-profile');
    return this.normalizeEmployee(employee);
  }

  // Create a new employee
  async createEmployee(employeeData: Employee): Promise<{ 
    message: string; 
    employee?: any;
    user_credentials?: {
      email: string;
      temporary_password: string;
      role: string;
      must_change_password: boolean;
    };
  }> {
    return this.request<{ 
      message: string; 
      employee?: any;
      user_credentials?: {
        email: string;
        temporary_password: string;
        role: string;
        must_change_password: boolean;
      };
    }>('/employees-full', {
      method: 'POST',
      body: JSON.stringify(employeeData),
    });
  }

  // Update an employee
  async updateEmployee(id: number, employeeData: Partial<Employee>): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/employees-full/${id}`, {
      method: 'PUT',
      body: JSON.stringify(employeeData),
    });
  }

  // Delete an employee
 // async deleteEmployee(id: number): Promise<{ message: string }> {
    //return this.request<{ message: string }>(`/employees-full/${id}`, {
    //  method: 'DELETE',
    //});
  //}

  // Resign an employee
  async resignEmployee(id: number, resignationData: any): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/employees-full/${id}/resign`, {
      method: 'POST',
      body: JSON.stringify(resignationData),
    });
  }

  // Get all former employees
  async getFormerEmployees(): Promise<Employee[]> {
    return this.request<Employee[]>('/former-employees');
  }

  // Attendance methods
  async getAttendance(): Promise<Attendance[]> {
    return this.request<Attendance[]>(`/attendance?_=${Date.now()}`, { cache: 'no-store' });
  }

  async createAttendance(
    attendanceData: Partial<Attendance> & Record<string, any>,
  ): Promise<{ message: string } & Record<string, any>> {
    return this.request<{ message: string }>('/attendance/clock-in', {
      method: 'POST',
      body: JSON.stringify(attendanceData),
    });
  }

  async clockOut(
    attendanceData: Partial<Attendance> & Record<string, any>,
  ): Promise<{ message: string } & Record<string, any>> {
    return this.request<{ message: string }>('/attendance/clock-out', {
      method: 'POST',
      body: JSON.stringify(attendanceData),
    });
  }

  // ===== Attendance system v2 =====

  async getAttendanceToday(employeeId?: number | string | null): Promise<any> {
    const qp = new URLSearchParams();
    if (employeeId != null) qp.append('employee_id', String(employeeId));
    qp.append('_', String(Date.now()));
    return this.request<any>(`/attendance/today?${qp.toString()}`, { cache: 'no-store' });
  }

  async getAttendanceRange(params: {
    start_date: string;
    end_date: string;
    employee_id?: number | string;
  }): Promise<any> {
    const qp = new URLSearchParams();
    qp.append('start_date', params.start_date);
    qp.append('end_date', params.end_date);
    if (params.employee_id != null) qp.append('employee_id', String(params.employee_id));
    qp.append('_', String(Date.now()));
    return this.request<any>(`/attendance?${qp.toString()}`, { cache: 'no-store' });
  }

  // Office locations with their GPS coordinates + allowed radius
  async getOfficeLocations(): Promise<any> {
    return this.request<any>('/attendance/office-locations', { cache: 'no-store' });
  }

  async getAttendanceScheduleConfig(location: string, day: string): Promise<any> {
    return this.request<any>(
      `/attendance/schedule-config/${encodeURIComponent(location)}/${encodeURIComponent(day)}`,
      { cache: 'no-store' },
    );
  }

  async getEmployeeAttendanceProfile(id: number | string): Promise<any> {
    return this.request<any>(`/employees/${id}/attendance-profile?_=${Date.now()}`, { cache: 'no-store' });
  }

  async updateEmployeeAttendanceProfile(id: number | string, data: any): Promise<any> {
    return this.request<any>(`/employees/${id}/attendance-profile`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async startBreak(data: { employee_id: number; date?: string; notes?: string }): Promise<any> {
    return this.request<any>('/attendance/break-start', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async endBreak(data: { employee_id: number; date?: string; notes?: string }): Promise<any> {
    return this.request<any>('/attendance/break-end', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitExceptionRequest(data: any): Promise<any> {
    const isForm = typeof FormData !== 'undefined' && data instanceof FormData;
    return this.request<any>('/exception-requests', {
      method: 'POST',
      body: isForm ? data : JSON.stringify(data),
    });
  }

  async getExceptionRequests(params?: {
    status?: string;
    employee_id?: number | string;
    scope?: 'pending-manager' | 'pending-hr';
  }): Promise<any> {
    const qp = new URLSearchParams();
    qp.append('_', String(Date.now()));
    if (params?.status) qp.append('status', params.status);
    if (params?.employee_id != null) qp.append('employee_id', String(params.employee_id));
    const path = params?.scope ? `/exception-requests/${params.scope}` : '/exception-requests';
    return this.request<any>(`${path}?${qp.toString()}`, { cache: 'no-store' });
  }

  async approveExceptionManager(id: number | string, notes?: string): Promise<any> {
    return this.request<any>(`/exception-requests/${id}/manager-approve`, {
      method: 'POST',
      body: JSON.stringify({ notes: notes ?? '' }),
    });
  }

  async rejectExceptionManager(id: number | string, notes: string): Promise<any> {
    return this.request<any>(`/exception-requests/${id}/manager-reject`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async approveExceptionHR(id: number | string, notes?: string): Promise<any> {
    return this.request<any>(`/exception-requests/${id}/hr-approve`, {
      method: 'POST',
      body: JSON.stringify({ notes: notes ?? '' }),
    });
  }

  async rejectExceptionHR(id: number | string, notes: string): Promise<any> {
    return this.request<any>(`/exception-requests/${id}/hr-reject`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async submitWFHRequest(data: { employee_id: number; date: string; reason: string }): Promise<any> {
    return this.request<any>('/wfh-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getWFHRequests(params?: { status?: string; employee_id?: number | string }): Promise<any> {
    const qp = new URLSearchParams();
    qp.append('_', String(Date.now()));
    if (params?.status) qp.append('status', params.status);
    if (params?.employee_id != null) qp.append('employee_id', String(params.employee_id));
    return this.request<any>(`/wfh-requests?${qp.toString()}`, { cache: 'no-store' });
  }

  async approveWFHRequest(id: number | string, notes?: string): Promise<any> {
    return this.request<any>(`/wfh-requests/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes: notes ?? '' }),
    });
  }

  async rejectWFHRequest(id: number | string, notes: string): Promise<any> {
    return this.request<any>(`/wfh-requests/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async getOrgAttendanceDashboard(params?: {
    date?: string;
    location?: string;
    department?: string;
    status?: string;
    mode?: string;
  }): Promise<any> {
    const qp = new URLSearchParams();
    qp.append('_', String(Date.now()));
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v && v !== 'All' && v !== 'all') qp.append(k, String(v));
    });
    return this.request<any>(`/attendance/org-dashboard?${qp.toString()}`, { cache: 'no-store' });
  }

  async submitMissingClockoutRequest(data: {
    employee_id: number;
    date: string;
    actual_clock_out: string;
    reason: string;
  }): Promise<any> {
    return this.request<any>('/attendance/missing-clockout-request', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Leave methods
  async getLeaveRequests(): Promise<LeaveRequest[]> {
    return this.request<LeaveRequest[]>('/leave');
  }

  async getLeaveTypes(): Promise<LeaveType[]> {
    const response = await this.request<{ success: boolean; data: LeaveType[] }>('/leave/types');
    // Handle both direct array and wrapped response
    if (Array.isArray(response)) {
      return response;
    }
    return response?.data || [];
  }

  async createLeaveRequest(leaveData: any): Promise<{ message: string }> {
    // Check if leaveData contains files (FormData)
    if (leaveData instanceof FormData) {
      return this.request<{ message: string }>('/leave', {
        method: 'POST',
        body: leaveData,
      });
    }
    // Otherwise send as JSON
    return this.request<{ message: string }>('/leave', {
      method: 'POST',
      body: JSON.stringify(leaveData),
    });
  }

  // Self-service leave submit — no employee_id needed; backend uses authed user.
  async submitLeaveSelf(data: {
    leave_type_id: number;
    start_date: string;
    end_date: string;
    reason?: string;
    contact_during_leave?: string;
  }): Promise<{ message: string }> {
    return this.request<{ message: string }>('/leave/submit-self', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Defaults for the leave submit form (employee_id, leave_types, balances).
  async getLeaveSubmitContext(): Promise<{
    employee_id?: number;
    employee_code?: string;
    employee_display?: string;
    leave_types?: any[];
    balances?: any[];
    [key: string]: any;
  }> {
    const res: any = await this.request('/leave/submit-context');
    return res?.data ?? res;
  }

  async updateLeaveRequest(requestId: number, status: string, approvedBy?: number, notes?: string): Promise<{ message: string }> {
    const payload: any = { status };
    if (approvedBy) {
      payload.approved_by = approvedBy;
    }
    if (notes) {
      if (status === 'approved') {
        payload.approval_notes = notes;
      } else if (status === 'rejected') {
        payload.rejection_reason = notes;
      }
    }
    return this.request<{ message: string }>(`/leave/${requestId}/status`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async changePassword(data: {
    current_password: string;
    new_password: string;
    new_password_confirmation: string;
  }): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resetUserPassword(userId: number, employeeId: number): Promise<{
    message: string;
    user_credentials: {
      email: string;
      temporary_password: string;
      role: string;
      must_change_password: boolean;
    };
  }> {
    return this.request<{
      message: string;
      user_credentials: {
        email: string;
        temporary_password: string;
        role: string;
        must_change_password: boolean;
      };
    }>(`/auth/reset-user-password/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ employee_id: employeeId }),
    });
  }

  // Payroll methods
  async getPayrollRecords(filters?: {
    employee_id?: number;
    pay_period?: string;
    status?: string;
    from_date?: string;
    to_date?: string;
  }): Promise<PayrollRecord[]> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
    }
    const query = queryParams.toString();
    return this.request<PayrollRecord[]>(`/payroll${query ? `?${query}` : ''}`);
  }

  async generatePayroll(data: {
    employee_id: number;
    pay_period: string;
    overtime?: number;
    bonus?: number;
    commission?: number;
    other_deductions?: number;
    deduction_notes?: string;
    auto_approve?: boolean;
    basic_salary?: number;
    housing_allowance?: number;
    transport_allowance?: number;
    meal_allowance?: number;
    other_allowance?: number;
    base_salary?: number;
    gross_salary?: number;
    gross_pay?: number;
    total_allowances?: number;
    taxable_income?: number;
    paye_tax?: number;
    income_tax?: number;
    pension_employee?: number;
    pension_employer?: number;
    nhf?: number;
    total_deductions?: number;
    net_pay?: number;
    include_nhf?: boolean;
    rent_relief_enabled?: boolean;
    annual_rent?: number;
  }): Promise<{ success: boolean; message: string; payroll?: PayrollRecord }> {
    return this.request<{ success: boolean; message: string; payroll?: PayrollRecord }>('/payroll/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async bulkGeneratePayroll(data: {
    pay_period: string;
    employee_ids?: number[];
    auto_approve?: boolean;
  }): Promise<{ success: boolean; message: string; summary: any; details: any }> {
    return this.request<{ success: boolean; message: string; summary: any; details: any }>('/payroll/bulk-generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ---------------------------------------------------------------
  // Bulk payroll: drafts / review / approval workflow
  // See docs/bulk-payroll.md for the full spec.
  // ---------------------------------------------------------------

  async getBulkGenerateStatus(batchId: string): Promise<{
    status: 'queued' | 'running' | 'done' | 'failed';
    processed?: number;
    total?: number;
    drafts?: any[];
    error?: string;
  }> {
    return this.request(`/payroll/bulk-generate/status/${batchId}`);
  }

  async listPayrollDrafts(payPeriod: string): Promise<any[]> {
    const resp = await this.request<any>(`/payroll/drafts?pay_period=${payPeriod}`);
    if (Array.isArray(resp)) return resp;
    if (Array.isArray(resp?.data)) return resp.data;
    if (Array.isArray(resp?.drafts)) return resp.drafts;
    return [];
  }

  async listDraftPeriods(): Promise<string[]> {
    try {
      const resp = await this.request<any>('/payroll/draft-periods');
      if (Array.isArray(resp)) return resp;
      if (Array.isArray(resp?.periods)) return resp.periods;
      if (Array.isArray(resp?.data)) return resp.data;
      return [];
    } catch (_e) {
      return [];
    }
  }

  async saveDraftPayroll(id: number, payload: Record<string, any>): Promise<any> {
    return this.request(`/payroll/${id}/save-draft`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async markPayrollReady(id: number): Promise<any> {
    return this.request(`/payroll/${id}/mark-ready`, { method: 'POST' });
  }

  async revertPayrollToDraft(id: number): Promise<any> {
    return this.request(`/payroll/${id}/revert-to-draft`, { method: 'POST' });
  }

  async batchApprovePayroll(payload: {
    ids: number[];
    acknowledge_warnings?: boolean;
  }): Promise<{
    success?: boolean;
    batch_id?: string;
    status?: 'queued' | 'running' | 'done' | 'failed';
    approved_count?: number;
    error?: string;
    message?: string;
  }> {
    return this.request('/payroll/batch-approve', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getBatchApproveStatus(batchId: string): Promise<{
    status: 'queued' | 'running' | 'done' | 'failed';
    processed?: number;
    total?: number;
    error?: string;
  }> {
    return this.request(`/payroll/batch-approve/status/${batchId}`);
  }

  async getPayrollAudit(id: number): Promise<Array<{
    field: string;
    old_value: any;
    new_value: any;
    changed_by: string | number;
    changed_at: string;
    note?: string;
  }>> {
    try {
      const resp = await this.request<any>(`/payroll/${id}/audit`);
      if (Array.isArray(resp)) return resp;
      if (Array.isArray(resp?.data)) return resp.data;
      return [];
    } catch (_e) {
      return [];
    }
  }

  async updatePayroll(id: number, data: {
    basic_salary?: number;
    base_salary?: number;
    housing_allowance?: number;
    transport_allowance?: number;
    meal_allowance?: number;
    other_allowance?: number;
    overtime?: number;
    bonus?: number;
    commission?: number;
    other_deductions?: number;
    deduction_notes?: string;
    gross_pay?: number;
    total_allowances?: number;
    taxable_income?: number;
    paye_tax?: number;
    income_tax?: number;
    pension_employee?: number;
    pension_employer?: number;
    nhf?: number;
    total_deductions?: number;
    net_pay?: number;
  }): Promise<{ success: boolean; message: string; payroll?: PayrollRecord }> {
    return this.request<{ success: boolean; message: string; payroll?: PayrollRecord }>(`/payroll/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async approvePayroll(id: number): Promise<{ success: boolean; message: string; payroll?: PayrollRecord }> {
    return this.request<{ success: boolean; message: string; payroll?: PayrollRecord }>(`/payroll/${id}/approve`, {
      method: 'POST',
    });
  }

  async markPayrollAsPaid(id: number, data: {
    payment_method: string;
    payment_reference?: string;
  }): Promise<{ success: boolean; message: string; payroll?: PayrollRecord }> {
    return this.request<{ success: boolean; message: string; payroll?: PayrollRecord }>(`/payroll/${id}/mark-paid`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPayrollStatistics(pay_period?: string): Promise<any> {
    const query = pay_period ? `?pay_period=${pay_period}` : '';
    return this.request<any>(`/payroll/statistics${query}`);
  }

  async deletePayroll(id: number): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/payroll/${id}`, {
      method: 'DELETE',
    });
  }

  // Soft-delete with optional reason
  async deletePayrollWithReason(id: number, deletion_reason?: string): Promise<{ success: boolean; message: string; data?: any }> {
    return this.request(`/payroll/${id}`, {
      method: 'DELETE',
      body: JSON.stringify(deletion_reason ? { deletion_reason } : {}),
    });
  }

  // HR-only force delete — bypasses draft/pending_review restriction.
  // Backend: DELETE /payroll/{id}?force=true (audited as forced).
  async forceDeletePayroll(id: number, deletion_reason: string): Promise<{ success: boolean; message: string; data?: any }> {
    return this.request(`/payroll/${id}?force=true`, {
      method: 'DELETE',
      body: JSON.stringify({ deletion_reason }),
    });
  }

  async restorePayroll(id: number): Promise<{ success: boolean; message: string; data?: any }> {
    return this.request(`/payroll/${id}/restore`, { method: 'POST' });
  }

  // Pay-period helpers
  async getAllowedPayPeriods(): Promise<{
    current_month: string;
    periods: Array<{ value: string; label: string; is_current: boolean }>;
  }> {
    return this.request('/payroll/allowed-periods');
  }

  // Employee payslips
  async getMyPayslips(page: number = 1): Promise<any> {
    return this.request(`/payroll/employee/payslips?page=${page}`);
  }

  // Bulk download helpers — return blob for triggered download
  private async downloadBlob(endpoint: string): Promise<Blob> {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        Accept: '*/*',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    if (!res.ok) {
      // Try to surface the actual backend error (PHP/JSON message) instead of just "500"
      let detail = '';
      try {
        const text = await res.text();
        try {
          const j = JSON.parse(text);
          detail = j?.message || j?.error || j?.detail || text;
        } catch {
          detail = text;
        }
      } catch {}
      const trimmed = (detail || '').toString().slice(0, 300).trim();
      throw new Error(
        `Download failed: ${res.status}${res.statusText ? ` ${res.statusText}` : ''}${trimmed ? ` — ${trimmed}` : ''}`
      );
    }
    return await res.blob();
  }

  async exportPayrollBulkCsv(pay_period: string): Promise<Blob> {
    return this.downloadBlob(`/payroll/export/bulk-csv?pay_period=${pay_period}`);
  }
  async exportPayrollBulkPdf(pay_period: string): Promise<Blob> {
    return this.downloadBlob(`/payroll/export/bulk-pdf?pay_period=${pay_period}`);
  }
  async exportPayrollBulkPdfWithStatus(pay_period: string, status: string = 'approved'): Promise<Blob> {
    return this.downloadBlob(`/payroll/export/bulk-pdf?pay_period=${pay_period}&status=${status}`);
  }
  async exportPayrollBulkCsvWithStatus(pay_period: string, status: string = 'approved'): Promise<Blob> {
    return this.downloadBlob(`/payroll/export/bulk-csv?pay_period=${pay_period}&status=${status}`);
  }
  async exportPayrollRecordPdf(id: number): Promise<Blob> {
    return this.downloadBlob(`/payroll/${id}/export/pdf`);
  }
  async exportPayrollRecordCsv(id: number): Promise<Blob> {
    return this.downloadBlob(`/payroll/${id}/export/csv`);
  }
  async exportMyPayslipPdf(pay_period: string): Promise<Blob> {
    return this.downloadBlob(`/payroll/employee/payslips/${pay_period}/export/pdf`);
  }
  async exportMyPayslipCsv(pay_period: string): Promise<Blob> {
    return this.downloadBlob(`/payroll/employee/payslips/${pay_period}/export/csv`);
  }

  // ========== Leave Approval Workflow ==========
  async getPendingLeaveForLineManager(): Promise<any> {
    return this.request('/leave-approvals/pending-manager');
  }
  async approveLeaveByLineManager(id: number, notes?: string): Promise<any> {
    return this.request(`/leave-approvals/${id}/approve-manager`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }
  async rejectLeaveByLineManager(id: number, rejection_reason: string): Promise<any> {
    return this.request(`/leave-approvals/${id}/reject-manager`, {
      method: 'POST',
      body: JSON.stringify({ rejection_reason }),
    });
  }
  async getPendingLeaveForHR(): Promise<any> {
    return this.request('/leave-approvals/pending-hr');
  }
  async approveLeaveByHR(id: number, notes?: string): Promise<any> {
    return this.request(`/leave-approvals/${id}/approve-hr`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }
  async rejectLeaveByHR(id: number, rejection_reason: string): Promise<any> {
    return this.request(`/leave-approvals/${id}/reject-hr`, {
      method: 'POST',
      body: JSON.stringify({ rejection_reason }),
    });
  }
  async getLeaveApprovalStatus(id: number): Promise<any> {
    return this.request(`/leave-approvals/${id}/status`);
  }

  // ========== Notifications ==========
  async getNotifications(per_page: number = 15, page: number = 1): Promise<any> {
    return this.request(`/notifications?per_page=${per_page}&page=${page}`);
  }
  async getUnreadNotificationCount(): Promise<{ unread_count: number }> {
    return this.request('/notifications/unread-count');
  }
  async markNotificationRead(id: number): Promise<any> {
    return this.request(`/notifications/${id}/mark-as-read`, { method: 'POST' });
  }
  async markAllNotificationsRead(): Promise<any> {
    return this.request('/notifications/mark-all-as-read', { method: 'POST' });
  }
  async deleteNotification(id: number): Promise<any> {
    return this.request(`/notifications/${id}`, { method: 'DELETE' });
  }

  // Recruitment - Job Postings
  async getJobPostings(): Promise<JobPosting[]> {
    return this.request<JobPosting[]>('/recruitment/job-postings');
  }

  async createJobPosting(data: Partial<JobPosting>): Promise<JobPosting> {
    return this.request<JobPosting>('/recruitment/job-postings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateJobPosting(id: number, data: Partial<JobPosting>): Promise<JobPosting> {
    return this.request<JobPosting>(`/recruitment/job-postings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteJobPosting(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/recruitment/job-postings/${id}`, {
      method: 'DELETE',
    });
  }

  // Recruitment - Candidates
  async getCandidates(): Promise<Candidate[]> {
    return this.request<Candidate[]>('/recruitment/candidates');
  }

  async createCandidate(data: Partial<Candidate>): Promise<Candidate> {
    return this.request<Candidate>('/recruitment/candidates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCandidate(id: number, data: Partial<Candidate>): Promise<Candidate> {
    return this.request<Candidate>(`/recruitment/candidates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCandidate(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/recruitment/candidates/${id}`, {
      method: 'DELETE',
    });
  }

  // Recruitment - Applications
  async getApplications(): Promise<Application[]> {
    return this.request<Application[]>('/recruitment/applications');
  }

  async createApplication(data: Partial<Application>): Promise<Application> {
    return this.request<Application>('/recruitment/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateApplication(id: number, data: Partial<Application>): Promise<Application> {
    return this.request<Application>(`/recruitment/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteApplication(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/recruitment/applications/${id}`, {
      method: 'DELETE',
    });
  }

  // Announcements
  async getAnnouncements(): Promise<Announcement[]> {
    const resp = await this.request<any>('/announcements');
    if (Array.isArray(resp)) return resp;
    if (Array.isArray(resp?.data)) return resp.data;
    return [];
  }

  async createAnnouncement(data: Partial<Announcement>): Promise<Announcement> {
    return this.request<Announcement>('/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAnnouncement(id: number, data: Partial<Announcement>): Promise<Announcement> {
    return this.request<Announcement>(`/announcements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAnnouncement(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/announcements/${id}`, {
      method: 'DELETE',
    });
  }

  // Announcement detail (includes comments thread) + comments + read receipt
  async getAnnouncement(id: number | string): Promise<any> {
    const resp = await this.request<any>(`/announcements/${id}`);
    return resp?.data ?? resp;
  }

  async addAnnouncementComment(
    id: number | string,
    content: string,
    parent_comment_id?: number | string | null
  ): Promise<any> {
    return this.request<any>(`/announcements/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parent_comment_id: parent_comment_id ?? null }),
    });
  }

  async markAnnouncementRead(id: number | string): Promise<any> {
    return this.request<any>(`/announcements/${id}/read`, { method: 'POST' });
  }

  // Early clock-out approval workflow
  async submitEarlyClockoutRequest(payload: {
    employee_id: number;
    reason: string;
    requested_at: string;
  }): Promise<any> {
    return this.request<any>('/attendance/early-clockout-request', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getEarlyClockoutRequests(params?: { status?: string; employee_id?: number }): Promise<any> {
    const qp = new URLSearchParams();
    qp.append('_', String(Date.now()));
    if (params?.status) qp.append('status', params.status);
    if (params?.employee_id != null) qp.append('employee_id', String(params.employee_id));
    const q = qp.toString();
    return this.request<any>(`/attendance/early-clockout-requests?${q}`, { cache: 'no-store' });
  }

  async approveEarlyClockoutRequest(id: number | string, approver_notes?: string): Promise<any> {
    return this.request<any>(`/attendance/early-clockout-requests/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approver_notes: approver_notes ?? '' }),
    });
  }

  async rejectEarlyClockoutRequest(id: number | string, approver_notes: string): Promise<any> {
    return this.request<any>(`/attendance/early-clockout-requests/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ approver_notes }),
    });
  }

  // Analytics
  async getHeadcountTrends(): Promise<any> {
    return this.request<any>('/analytics/headcount-trends');
  }

  async getHiringTrends(): Promise<any> {
    return this.request<any>('/analytics/hiring-trends');
  }

  async getAttendanceMetrics(): Promise<any> {
    return this.request<any>('/analytics/attendance-metrics');
  }

  async getEmploymentTypeDistribution(): Promise<any> {
    return this.request<any>('/analytics/employment-types');
  }

  async getSalaryTrends(): Promise<any> {
    return this.request<any>('/analytics/salary-trends');
  }

  async getDepartmentStats(): Promise<any> {
    return this.request<any>('/analytics/department-stats');
  }

  async getDashboardStats(): Promise<any> {
    return this.request<any>('/analytics/dashboard-stats');
  }

  async getVacationDetails(): Promise<any> {
    return this.request<any>('/analytics/vacation-details');
  }

  // Executive-only consolidated dashboard (no leave data by design)
  async getChairmanDashboard(): Promise<any> {
    return this.request<any>(`/analytics/chairman-dashboard?_=${Date.now()}`, { cache: 'no-store' });
  }

  // Settings — audit trail
  async getAuditLogs(params?: {
    page?: number;
    per_page?: number;
    user_id?: number | string;
    action?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<any> {
    const qp = new URLSearchParams();
    Object.entries(params ?? {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qp.append(k, String(v));
    });
    qp.append('_', String(Date.now()));
    return this.request<any>(`/settings/audit-logs?${qp.toString()}`, { cache: 'no-store' });
  }

  async getAuditLog(id: number | string): Promise<any> {
    return this.request<any>(`/settings/audit-logs/${id}`);
  }

  // Policies
  async getPolicies(params?: { status?: string; category?: string }): Promise<Policy[]> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.category) queryParams.append('category', params.category);
    
    const url = `/policies${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const res: any = await this.request<any>(url);
    if (Array.isArray(res)) return res as Policy[];
    const list = res?.data ?? res?.policies ?? [];
    return (Array.isArray(list) ? list : []) as Policy[];
  }

  async getPolicy(id: number): Promise<Policy> {
    return this.request<Policy>(`/policies/${id}`);
  }

  async createPolicy(data: Partial<Policy>): Promise<{ success: boolean; message: string; data: Policy }> {
    return this.request<{ success: boolean; message: string; data: Policy }>('/policies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePolicy(id: number, data: Partial<Policy>): Promise<{ success: boolean; message: string; data: Policy }> {
    return this.request<{ success: boolean; message: string; data: Policy }>(`/policies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async approvePolicy(id: number): Promise<{ success: boolean; message: string; data: Policy }> {
    return this.request<{ success: boolean; message: string; data: Policy }>(`/policies/${id}/approve`, {
      method: 'POST',
    });
  }

  async archivePolicy(id: number): Promise<{ success: boolean; message: string; data: Policy }> {
    return this.request<{ success: boolean; message: string; data: Policy }>(`/policies/${id}/archive`, {
      method: 'POST',
    });
  }

  async deletePolicy(id: number): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/policies/${id}`, {
      method: 'DELETE',
    });
  }

  async getPolicyCategories(): Promise<string[]> {
    return this.request<string[]>('/policies/categories');
  }

  // Reports
  async getEmployeeReport(employeeId: number): Promise<any> {
    return this.request<any>(`/reports/employee/${employeeId}`);
  }

  async getDepartmentReport(department?: string): Promise<any> {
    const params = department ? `?department=${department}` : '';
    return this.request<any>(`/reports/department${params}`);
  }

  async getPayrollReport(month?: string): Promise<any> {
    const params = month ? `?month=${month}` : '';
    return this.request<any>(`/reports/payroll${params}`);
  }

  async getAttendanceReport(startDate?: string, endDate?: string): Promise<any> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request<any>(`/reports/attendance${queryString}`);
  }

  async getLeaveReport(year?: number): Promise<any> {
    const params = year ? `?year=${year}` : '';
    return this.request<any>(`/reports/leave${params}`);
  }

  // Performance Reviews
  async getPerformanceReviews(filters?: { department?: string; period?: string }): Promise<PerformanceReview[]> {
    const params = new URLSearchParams();
    if (filters?.department) params.append('department', filters.department);
    if (filters?.period) params.append('period', filters.period);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<PerformanceReview[]>(`/performance${qs}`);
  }

  async createSelfAssessment(data: { period: string; self_assessment: any }): Promise<PerformanceReview> {
    return this.request<PerformanceReview>('/performance/self', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitSelfAssessment(id: number): Promise<PerformanceReview> {
    return this.request<PerformanceReview>(`/performance/${id}/submit-self`, { method: 'PUT' });
  }

  async addEmployeePerformanceComment(id: number, comment: string): Promise<PerformanceReview> {
    return this.request<PerformanceReview>(`/performance/${id}/employee-comment`, {
      method: 'PUT',
      body: JSON.stringify({ comment }),
    });
  }

  async managerReview(id: number, manager_review: any): Promise<PerformanceReview> {
    return this.request<PerformanceReview>(`/performance/${id}/manager-review`, {
      method: 'PUT',
      body: JSON.stringify({ manager_review }),
    });
  }

  async schedulePerformanceMeeting(id: number, meeting_at: string): Promise<PerformanceReview> {
    return this.request<PerformanceReview>(`/performance/${id}/schedule-meeting`, {
      method: 'PUT',
      body: JSON.stringify({ meeting_at }),
    });
  }

  async markPerformanceDiscussed(id: number, meeting_notes?: string): Promise<PerformanceReview> {
    return this.request<PerformanceReview>(`/performance/${id}/discussed`, {
      method: 'PUT',
      body: JSON.stringify({ meeting_notes }),
    });
  }

  async signPerformance(id: number, actor: 'employee' | 'manager'): Promise<PerformanceReview> {
    return this.request<PerformanceReview>(`/performance/${id}/sign`, {
      method: 'PUT',
      body: JSON.stringify({ actor }),
    });
  }

  async approvePerformance(id: number): Promise<PerformanceReview> {
    return this.request<PerformanceReview>(`/performance/${id}/approve`, { method: 'PUT' });
  }

  async closePerformance(id: number): Promise<PerformanceReview> {
    return this.request<PerformanceReview>(`/performance/${id}/close`, { method: 'PUT' });
  }

  // HR creates a review cycle for an employee (optionally requesting a self-assessment)
  async createPerformanceReview(data: {
    employee_id: number;
    period: string;
    request_self_assessment?: boolean;
    kpis?: any[];
    notes?: string;
  }): Promise<PerformanceReview> {
    return this.request<PerformanceReview>('/performance', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // HR final screen — closes out the review
  async completePerformanceReview(id: number, data?: any): Promise<PerformanceReview> {
    return this.request<PerformanceReview>(`/performance/${id}/complete`, {
      method: 'PUT',
      body: JSON.stringify(data ?? {}),
    });
  }

  // Training Assignments
  async getTrainingAssignments(): Promise<any[]> {
    return this.request<any[]>('/training/assignments');
  }

  async assignTraining(data: {
    training_id?: number;
    title?: string;
    category?: string;
    description?: string;
    instructor?: string;
    location?: string;
    delivery_method?: 'online' | 'in_person' | 'hybrid';
    employee_ids: number[];
    scheduled_at: string;
    duration_hours: number;
    completion_deadline: string;
  }): Promise<{ success: boolean; training_id?: number; assignments: any[] }> {
    const url = `${this.baseUrl}/training/assign`;
    const token = localStorage.getItem('auth_token');
    
    // Attachments are uploaded separately via the S3 presigned-URL flow
    // (uploadTrainingAttachment). This endpoint only accepts JSON data.
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('assignTraining failed:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  async markTrainingCompleted(id: number, notes?: string): Promise<{ success: boolean; assignment: any }> {
    return this.request<{ success: boolean; assignment: any }>(`/training/assignments/${id}/complete`, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    });
  }

  async markTrainingNotificationRead(id: number): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/training/assignments/${id}/read`, { method: 'PUT' });
  }

  async cancelTrainingAssignment(id: number): Promise<{ success: boolean; assignment: any }> {
    return this.request<{ success: boolean; assignment: any }>(`/training/assignments/${id}/cancel`, { method: 'PUT' });
  }

  async deleteTrainingAssignment(id: number): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/training/assignments/${id}`, { method: 'DELETE' });
  }

  async updateTrainingAssignment(id: number, data: {
    scheduled_at?: string;
    completion_deadline?: string;
    duration_hours?: number;
    status?: string;
    notes?: string;
  }): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/training/assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // S3 presigned URL flow for training attachments (mirrors employee documents)
  async getTrainingUploadUrl(filename: string, contentType?: string): Promise<{ url: string; headers: Record<string, string>; key: string; expires_at?: string }> {
    return this.request(`/training/upload-url`, {
      method: 'POST',
      body: JSON.stringify({ filename, content_type: contentType }),
    });
  }

  async attachTrainingAttachment(trainingId: number, key: string, filename: string): Promise<{ message: string; key: string; training?: any }> {
    return this.request(`/training/${trainingId}/attach`, {
      method: 'POST',
      body: JSON.stringify({ key, filename }),
    });
  }

  async getTrainingDownloadUrl(trainingId: number, download: boolean = true): Promise<{ url: string; expires_at?: string; key: string; filename: string }> {
    return this.request(`/training/${trainingId}/download?download=${download ? 'true' : 'false'}`);
  }

  // Full upload flow: get presigned URL → PUT to S3 → attach to training record
  async uploadTrainingAttachment(trainingId: number, file: File): Promise<{ message: string; key: string }> {
    const { url, headers, key } = await this.getTrainingUploadUrl(file.name, file.type);
    await this.uploadFileToS3(url, file, headers);
    const result = await this.attachTrainingAttachment(trainingId, key, file.name);
    return { message: result.message, key };
  }

  // Convenience: fetch a presigned download URL and return the file as a Blob
  async downloadTrainingAttachment(trainingId: number): Promise<Blob> {
    const { url } = await this.getTrainingDownloadUrl(trainingId, true);
    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) {
      throw new Error(`S3 download failed: ${response.status}`);
    }
    return await response.blob();
  }

  // Employee Benefits
  async getEmployeeBenefits(): Promise<any[]> {
    return this.request<any[]>('/benefits');
  }

  async getEmployeeBenefitsByEmployee(employeeId: number): Promise<any[]> {
    return this.request<any[]>(`/benefits/employee/${employeeId}`);
  }

  async assignBenefit(data: {
    employee_ids: number[];
    benefit_name: string;
    benefit_type: string;
    description?: string;
    value?: number;
    start_date: string;
    end_date?: string;
    notes?: string;
  }): Promise<{ success: boolean; benefits: any[] }> {
    return this.request<{ success: boolean; benefits: any[] }>('/benefits/assign', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBenefit(id: number, data: any): Promise<{ success: boolean; benefit: any }> {
    return this.request<{ success: boolean; benefit: any }>(`/benefits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async revokeBenefit(id: number): Promise<{ success: boolean; benefit: any }> {
    return this.request<{ success: boolean; benefit: any }>(`/benefits/${id}/revoke`, { method: 'PUT' });
  }

  async deleteBenefit(id: number): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/benefits/${id}`, { method: 'DELETE' });
  }

  // Celebration Messages
  async sendCelebrationMessage(data: {
    employee_id: number;
    celebration_type: 'birthday' | 'anniversary';
    message: string;
    celebration_date: string;
    years_of_service?: number;
  }): Promise<any> {
    return this.request('/celebration-messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCelebrationMessages(): Promise<any[]> {
    return this.request('/celebration-messages');
  }

  async markCelebrationMessageRead(messageId: number): Promise<any> {
    return this.request(`/celebration-messages/${messageId}/read`, {
      method: 'PUT',
    });
  }
  // ========== Document Management (S3 Presigned URLs) ==========

  // Document types supported by the backend
  static DOCUMENT_TYPES = [
    'national_id',
    'passport',
    'bvn_doc',
    'tin_doc',
    'pension_doc',
    'nhf_doc',
    'contract',
    'certificate',
    'onboarding',
    'profile_picture',
    'supporting_docs',
  ] as const;

  // Get presigned URL for viewing or downloading a document
  async getDocumentUrl(employeeId: number, documentType: string, download: boolean = false): Promise<{ url: string; expires_in: number }> {
    const query = download ? '?download=true' : '?download=false';
    return this.request<{ url: string; expires_in: number }>(`/employees-full/${employeeId}/documents/${documentType}/url${query}`);
  }

  // Get presigned upload URL for direct-to-S3 upload
  async getDocumentUploadUrl(employeeId: number, documentType: string, filename: string, contentType: string): Promise<{ url: string; headers: Record<string, string>; key: string }> {
    return this.request<{ url: string; headers: Record<string, string>; key: string }>(`/employees-full/${employeeId}/documents/${documentType}/upload-url`, {
      method: 'POST',
      body: JSON.stringify({ filename, content_type: contentType }),
    });
  }

  // Upload file directly to S3 using presigned URL
  async uploadFileToS3(url: string, file: File, headers: Record<string, string>): Promise<void> {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': file.type,
      },
      body: file,
    });
    if (!response.ok) {
      throw new Error(`S3 upload failed: ${response.status}`);
    }
  }

  // Attach uploaded S3 key to employee record
  async attachDocument(employeeId: number, documentType: string, key: string, filename?: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/employees-full/${employeeId}/documents/${documentType}/attach`, {
      method: 'POST',
      body: JSON.stringify({ key, filename }),
    });
  }

  // Delete a document
  async deleteDocument(employeeId: number, documentType: string, filename?: string): Promise<{ message: string }> {
    const query = filename ? `?filename=${encodeURIComponent(filename)}` : '';
    return this.request<{ message: string }>(`/employees-full/${employeeId}/documents/${documentType}${query}`, {
      method: 'DELETE',
    });
  }

  // List all documents for an employee
  async getEmployeeDocuments(employeeId: number): Promise<{
    documents: Array<{
      type: string;
      filename: string;
      size?: number;
      uploaded_by?: string;
      uploaded_at?: string;
      key: string;
    }>;
  }> {
    return this.request<{
      documents: Array<{
        type: string;
        filename: string;
        size?: number;
        uploaded_by?: string;
        uploaded_at?: string;
        key: string;
      }>;
    }>(`/employees-full/${employeeId}/documents`);
  }

  // Full upload flow: get presigned URL → upload to S3 → attach to employee
  async uploadDocument(
    employeeId: number,
    documentType: string,
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<{ message: string; key: string }> {
    // Step 1: Get presigned upload URL
    onProgress?.(10);
    let url: string, headers: Record<string, string>, key: string;
    try {
      const uploadData = await this.getDocumentUploadUrl(
        employeeId,
        documentType,
        file.name,
        file.type
      );
      url = uploadData.url;
      headers = uploadData.headers;
      key = uploadData.key;
    } catch (err) {
      const msg = `[S3 Upload Step 1] Could not get upload URL from server. The document API may not be configured. (${err instanceof Error ? err.message : err})`;
      console.error(msg, { employeeId, documentType, fileName: file.name, error: err });
      throw new Error(msg);
    }

    // Step 2: Upload file directly to S3
    onProgress?.(30);
    try {
      await this.uploadFileToS3(url, file, headers);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError') || errMsg.includes('CORS')) {
        const msg = `[S3 Upload Step 2] File upload to storage failed due to a network/CORS error. Check S3 CORS configuration.`;
        console.error(msg, { url, fileName: file.name, error: err });
        throw new Error(msg);
      }
      const msg = `[S3 Upload Step 2] File upload to storage failed. Check file size and format. (${errMsg})`;
      console.error(msg, { url, fileName: file.name, error: err });
      throw new Error(msg);
    }

    // Step 3: Attach the S3 key to employee record
    onProgress?.(80);
    try {
      const result = await this.attachDocument(employeeId, documentType, key, file.name);
      onProgress?.(100);
      return { message: result.message, key };
    } catch (err) {
      const msg = `[S3 Upload Step 3] File uploaded to S3 but could not link to employee record. (${err instanceof Error ? err.message : err})`;
      console.error(msg, { employeeId, documentType, key, fileName: file.name, error: err });
      throw new Error(msg);
    }
  }
}

export const apiService = new ApiService();
export default apiService;
