// Use environment variable for flexibility between local and deployed environments
const API = import.meta.env.VITE_API_URL;

const API_BASE_URL =
  (typeof window !== 'undefined' && window.location.hostname === 'localhost')
    ? 'http://localhost:8000/api' // Local backend
    : API || 'https://hris-backend-to3i.onrender.com/api'; // Fallback to Render if no env var found
    
export interface Employee {
  id?: number;
  user_id?: number;
  first_name: string;
  last_name: string;
  email: string;
  dob?: string;
  gender?: string;
  marital_status?: string;
  nationality?: string;
  phone_number?: string;
  address?: string;
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
  meal_allowance?: number;
  housing_allowance?: number;
  transport_allowance?: number;
  bank_account?: string;
  employee_code?: string;
  national_id?: string;
  bvn?: string;
  tin?: string;
  pension_pin?: string;
  nhf_number?: string;
  tax_id?: string;
  supporting_documents?: string;
  performance_history?: string;
  asset_allocation_history?: string;
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
  basic_salary: number;
  housing_allowance: number;
  transport_allowance: number;
  meal_allowance: number;
  other_allowance: number;
  overtime: number;
  bonus: number;
  commission: number;
  gross_pay: number;
  total_allowances: number;
  taxable_income: number;
  paye_tax: number;
  pension_employee: number;
  pension_employer: number;
  nhf: number;
  other_deductions: number;
  deduction_notes?: string;
  total_deductions: number;
  net_pay: number;
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

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
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
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
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
        throw new Error(`HTTP error! status: ${response.status}`);
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
    return this.request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
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
    return this.request<Employee[]>('/employees-full');
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
    return this.request<Attendance[]>('/attendance');
  }

  async createAttendance(attendanceData: Attendance): Promise<{ message: string }> {
    return this.request<{ message: string }>('/attendance/clock-in', {
      method: 'POST',
      body: JSON.stringify(attendanceData),
    });
  }

  async updateAttendance(id: number, attendanceData: Partial<Attendance>): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/attendance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(attendanceData),
    });
  }

  async clockOut(attendanceData: Attendance): Promise<{ message: string }> {
    return this.request<{ message: string }>('/attendance/clock-out', {
      method: 'POST',
      body: JSON.stringify(attendanceData),
    });
  }

  // Leave methods
  async getLeaveRequests(): Promise<LeaveRequest[]> {
    return this.request<LeaveRequest[]>('/leave/');
  }

  async getLeaveTypes(): Promise<LeaveType[]> {
    return this.request<LeaveType[]>('/leave/types');
  }

  async createLeaveRequest(leaveData: any): Promise<{ message: string }> {
    return this.request<{ message: string }>('/leave/', {
      method: 'POST',
      body: JSON.stringify(leaveData),
    });
  }

  async updateLeaveRequest(requestId: number, status: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/leave/${requestId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
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
  }): Promise<{ success: boolean; message: string; payroll?: PayrollRecord }> {
    return this.request<{ success: boolean; message: string; payroll?: PayrollRecord }>('/payroll/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async bulkGeneratePayroll(data: {
    pay_period: string;
    employee_ids?: number[];
  }): Promise<{ success: boolean; message: string; summary: any; details: any }> {
    return this.request<{ success: boolean; message: string; summary: any; details: any }>('/payroll/bulk-generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePayroll(id: number, data: {
    overtime?: number;
    bonus?: number;
    commission?: number;
    other_deductions?: number;
    deduction_notes?: string;
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
    return this.request<Announcement[]>('/announcements');
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
}

export const apiService = new ApiService();
export default apiService;
