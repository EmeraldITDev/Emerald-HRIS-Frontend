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
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Dummy users for testing
const dummyUsers: Record<string, { user: User; password: string }> = {
  'james@company.com': {
    user: {
      id: '1',
      firstName: 'James',
      lastName: 'Executive',
      email: 'james@company.com',
      role: 'executive'
    },
    password: 'password123'
  },
  'frank@company.com': {
    user: {
      id: '2',
      firstName: 'Frank',
      lastName: 'Manager',
      email: 'frank@company.com',
      role: 'hr_manager'
    },
    password: 'password123'
  },
  'sarah@company.com': {
    user: {
      id: '3',
      firstName: 'Sarah',
      lastName: 'HR',
      email: 'sarah@company.com',
      role: 'corporate_hr'
    },
    password: 'password123'
  },
  'mike@company.com': {
    user: {
      id: '4',
      firstName: 'Mike',
      lastName: 'Smith',
      email: 'mike@company.com',
      role: 'line_manager'
    },
    password: 'password123'
  },
  'tech@company.com': {
    user: {
      id: '5',
      firstName: 'Tech',
      lastName: 'Support',
      email: 'tech@company.com',
      role: 'it_admin'
    },
    password: 'password123'
  },
  'poweruser@company.com': {
    user: {
      id: '6',
      firstName: 'Power',
      lastName: 'User',
      email: 'poweruser@company.com',
      role: 'it_power_user'
    },
    password: 'password123'
  },
  'john@company.com': {
    user: {
      id: '7',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@company.com',
      role: 'general_employee'
    },
    password: 'password123'
  },
  'finance@company.com': {
    user: {
      id: '8',
      firstName: 'Finance',
      lastName: 'Manager',
      email: 'finance@company.com',
      role: 'finance'
    },
    password: 'password123'
  },
  'contractor@company.com': {
    user: {
      id: '9',
      firstName: 'Contract',
      lastName: 'Employee',
      email: 'contractor@company.com',
      role: 'contract_employee'
    },
    password: 'password123'
  }
};

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
    'payroll.view_all',
    'payroll.calculate',
    'payroll.export',
    'reports.view',
    'dashboard.view',
    'financials.view_all'
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
      // Try backend authentication first
      const response = await apiService.login(email, password);
      
      if (response.user && response.token) {
        // Transform backend user to frontend format
        const user: User = {
          id: response.user.id.toString(),
          firstName: response.user.name.split(' ')[0],
          lastName: response.user.name.split(' ').slice(1).join(' '),
          email: response.user.email,
          role: response.user.role as UserRole,
        };
        
        setUser(user);
        localStorage.setItem('hris_user', JSON.stringify(user));
        localStorage.setItem('auth_token', response.token);
        return true;
      }
    } catch (error) {
      console.log('Backend login failed, trying dummy users:', error);
    }
    
    // Fallback to dummy users if backend fails
    const userRecord = dummyUsers[email.toLowerCase()];
    
    if (userRecord && userRecord.password === password) {
      setUser(userRecord.user);
      localStorage.setItem('hris_user', JSON.stringify(userRecord.user));
      return true;
    }
    
    return false;
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

  const value: AuthContextType = {
    user,
    login,
    logout,
    hasPermission,
    isAuthenticated: !!user
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