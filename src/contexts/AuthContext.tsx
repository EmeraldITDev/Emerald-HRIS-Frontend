import React, { createContext, useContext, useState, ReactNode } from 'react';
import { apiService } from '../lib/api';

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
  department: string;
  mustChangePassword?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
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

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiService.login(email, password);
      
      if (response.user && response.token) {
        const user: User = {
          id: response.user.id.toString(),
          firstName: response.user.name.split(' ')[0],
          lastName: response.user.name.split(' ').slice(1).join(' '),
          email: response.user.email,
          role: response.user.role as UserRole,
          department: response.user.department || 'General',
          mustChangePassword: response.user.must_change_password,
        };
        
        setUser(user);
        localStorage.setItem('hris_user', JSON.stringify(user));
        localStorage.setItem('auth_token', response.token);
        return true;
      }
    } catch (error) {
      console.log('Backend login failed:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      // Try backend logout if we have a token
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
          department: response.user.department || 'General',
          mustChangePassword: response.user.must_change_password,
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