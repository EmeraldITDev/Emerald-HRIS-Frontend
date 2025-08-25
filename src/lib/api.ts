const API_BASE_URL = (typeof window !== 'undefined' && window.location.port)
  ? 'http://localhost:8000/api'
  : 'http://localhost/hris-backend/public/api';

export interface Employee {
  id?: number;
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
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Test API connection
  async testConnection(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/test');
  }

  // Get all employees
  async getEmployees(): Promise<Employee[]> {
    return this.request<Employee[]>('/employees-full');
  }

  // Create a new employee
  async createEmployee(employeeData: Employee): Promise<{ message: string }> {
    return this.request<{ message: string }>('/employees-full', {
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
  async getLeaveTypes(): Promise<LeaveType[]> {
    return this.request<LeaveType[]>('/leave/types');
  }

  async getLeaveRequests(): Promise<LeaveRequest[]> {
    return this.request<LeaveRequest[]>('/leave');
  }

  async createLeaveRequest(leaveData: LeaveRequest): Promise<{ message: string }> {
    return this.request<{ message: string }>('/leave', {
      method: 'POST',
      body: JSON.stringify(leaveData),
    });
  }

  async updateLeaveRequest(id: number, leaveData: Partial<LeaveRequest>): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/leave/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(leaveData),
    });
  }
}

export const apiService = new ApiService();
export default apiService;
