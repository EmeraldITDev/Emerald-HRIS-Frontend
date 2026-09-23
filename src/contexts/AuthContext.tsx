import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { apiService } from '../lib/api';

// Inactivity timeout in milliseconds (30 minutes)
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

export type UserRole =
  | 'executive' 
  | 'hr_manager' 
  | 'corporate_hr' 
  | 'line_manager' 
  | 'finance'
  | 'it_admin' 
  | 'it_power_user' 
  | 'consulting_hr' 
  | 'contract_hr' 
  | 'corporate_user' 
  | 'contract_staff' 
  | 'contract_employee'
  | 'general_employee';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  roleLabel?: string;
  department: string;
  employee_id?: number;
  mustChangePassword?: boolean;
  grossSalaryImportEnabled?: boolean;
  canViewChairmanDashboard?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; requires2FA?: boolean; tempToken?: string }>;
  verifyOtp: (tempToken: string, code: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Role permissions mapping
const rolePermissions: Record<UserRole, string[]> = {
  executive: ['*'], // All permissions
  hr_manager: ['*'], // All permissions
  corporate_hr: [
    'employees.create',
    'employees.read',
    'employees.update',
    'csv.import',
    'csv.export',
    'approvals.manage',
    'payroll.view_own',
    'benefits.view',
    'training.view',
    'reports.view'
  ],
  line_manager: [
    'dashboard.view',
    'reports.view',
    'approvals.manage',
    'reviews.submit',
    'comments.create',
    'payroll.view_own',
    'benefits.view',
    'training.view'
  ],
  finance: [
    'payroll.view_own',
    'benefits.view',
    'leave.request',
    'comments.create'
  ],
  it_admin: [
    'payroll.view_own',
    'benefits.view',
    'training.view'
  ],
  it_power_user: [
    'admin.troubleshoot',
    'system.override',
    'system.controls',
    'payroll.view_own',
    'benefits.view',
    'training.view'
  ],
  consulting_hr: [
    'payroll.view_own',
    'benefits.view',
    'leave.request'
  ],
  contract_hr: [
    'payroll.view_own',
    'benefits.view',
    'leave.request'
  ],
  corporate_user: [
    'payroll.view_own',
    'benefits.view',
    'leave.request'
  ],
  contract_staff: [
    'payroll.view_own',
    'benefits.view',
    'leave.request'
  ],
  contract_employee: [
    'payroll.view_own',
    'benefits.view',
    'leave.request',
    'dashboard.view',
    'profile.view'
  ],
  general_employee: [
    'payroll.view_own',
    'benefits.view',
    'leave.request',
    'comments.create'
  ]
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('hris_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetInactivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    localStorage.setItem('last_activity', Date.now().toString());
  }, []);

  const performLogout = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        await apiService.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    setUser(null);
    localStorage.removeItem('hris_user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('last_activity');
  }, []);

  // Check for inactivity
  useEffect(() => {
    if (!user) return;

    const checkInactivity = () => {
      const lastActivity = parseInt(localStorage.getItem('last_activity') || Date.now().toString(), 10);
      const now = Date.now();
      
      if (now - lastActivity >= INACTIVITY_TIMEOUT) {
        console.log('User inactive for 30 minutes, logging out...');
        performLogout();
      }
    };

    // Set up activity listeners
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      resetInactivityTimer();
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Initialize last activity
    resetInactivityTimer();

    // Check inactivity every minute
    timeoutRef.current = setInterval(checkInactivity, 60 * 1000);

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
      }
    };
  }, [user, performLogout, resetInactivityTimer]);

  const login = async (email: string, password: string): Promise<{ success: boolean; requires2FA?: boolean; tempToken?: string }> => {
    try {
      const response = await apiService.login(email, password);

      if ((response as any).requires_2fa) {
        return { success: false, requires2FA: true, tempToken: (response as any).temp_token };
      }

      if ((response as any).user && (response as any).token) {
        const user: User = {
          id: (response as any).user.id.toString(),
          firstName: (response as any).user.name.split(' ')[0],
          lastName: (response as any).user.name.split(' ').slice(1).join(' '),
          email: (response as any).user.email,
          role: (response as any).user.role as UserRole,
          roleLabel: (response as any).user.role_label,
          department: (response as any).user.department || 'General',
          employee_id: (response as any).user.employee_id,
          mustChangePassword: (response as any).user.must_change_password,
          grossSalaryImportEnabled: !!(response as any).user.gross_salary_import_enabled,
          canViewChairmanDashboard: !!(response as any).user.can_view_chairman_dashboard,
        };
        
        setUser(user);
        localStorage.setItem('hris_user', JSON.stringify(user));
        localStorage.setItem('auth_token', (response as any).token);
        return { success: true };
      }
    } catch (error) {
      console.error('Login failed:', error);
    }

    return { success: false };
  };

  const verifyOtp = async (tempToken: string, code: string): Promise<boolean> => {
    try {
      const resp = await apiService.verifyOtp(tempToken, code);
      if ((resp as any).user && (resp as any).token) {
        const user: User = {
          id: (resp as any).user.id.toString(),
          firstName: (resp as any).user.name.split(' ')[0],
          lastName: (resp as any).user.name.split(' ').slice(1).join(' '),
          email: (resp as any).user.email,
          role: (resp as any).user.role as UserRole,
          roleLabel: (resp as any).user.role_label,
          department: (resp as any).user.department || 'General',
          employee_id: (resp as any).user.employee_id,
          mustChangePassword: (resp as any).user.must_change_password,
          grossSalaryImportEnabled: !!(resp as any).user.gross_salary_import_enabled,
          canViewChairmanDashboard: !!(resp as any).user.can_view_chairman_dashboard,
        };
        setUser(user);
        localStorage.setItem('hris_user', JSON.stringify(user));
        localStorage.setItem('auth_token', (resp as any).token);
        return true;
      }
    } catch (e) {
      console.error('verifyOtp failed', e);
    }
    return false;
  };

  const logout = async () => {
    await performLogout();
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  };

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await apiService.getCurrentUser();
      if (response.user) {
        const updatedUser: User = {
          id: response.user.id.toString(),
          firstName: response.user.name.split(' ')[0],
          lastName: response.user.name.split(' ').slice(1).join(' '),
          email: response.user.email,
          role: response.user.role as UserRole,
          roleLabel: (response.user as any).role_label,
          department: response.user.department || 'General',
          employee_id: response.user.employee_id,
          mustChangePassword: response.user.must_change_password,
          grossSalaryImportEnabled: !!(response.user as any).gross_salary_import_enabled,
          canViewChairmanDashboard: !!(response.user as any).can_view_chairman_dashboard,
        };
        
        setUser(updatedUser);
        localStorage.setItem('hris_user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    verifyOtp,
    logout,
    hasPermission,
    isAuthenticated: !!user,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};