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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Dummy users for testing
const dummyUsers: Record<string, { user: User; password: string }> = {
  // ============ EXECUTIVE TEAM ============
  'bunmi.babajide@emeraldcfze.com': {
    user: {
      id: '1',
      firstName: 'Bunmi',
      lastName: 'Babajide',
      email: 'bunmi.babajide@emeraldcfze.com',
      role: 'executive',
      department: 'Technical Operations'
    },
    password: 'password123'
  },
  'laa@emeraldcfze.com': {
    user: {
      id: '2',
      firstName: 'LAA',
      lastName: 'Executive',
      email: 'laa@emeraldcfze.com',
      role: 'executive',
      department: 'Business Development'
    },
    password: 'password123'
  },
  
  // ============ HR DEPARTMENT ============
  'austin.nwachwukwu@emeraldcfze.com': {
    user: {
      id: '3',
      firstName: 'Austin',
      lastName: 'Nwachwukwu',
      email: 'austin.nwachwukwu@emeraldcfze.com',
      role: 'hr_manager',
      department: 'Human Resources'
    },
    password: 'password123'
  },
  'oluwapelumi.adeyefa@emeraldcfze.com': {
    user: {
      id: '4',
      firstName: 'Oluwapelumi',
      lastName: 'Adeyefa',
      email: 'oluwapelumi.adeyefa@emeraldcfze.com',
      role: 'corporate_hr',
      department: 'Human Resources'
    },
    password: 'password123'
  },
  
  // ============ TECHNICAL OPERATIONS DEPARTMENT ============
  'henry.marcus@emeraldcfze.com': {
    user: {
      id: '5',
      firstName: 'Henry',
      lastName: 'Marcus',
      email: 'henry.marcus@emeraldcfze.com',
      role: 'line_manager',
      department: 'Technical Operations'
    },
    password: 'password123'
  },
  'chidi.okonkwo@emeraldcfze.com': {
    user: {
      id: '6',
      firstName: 'Chidi',
      lastName: 'Okonkwo',
      email: 'chidi.okonkwo@emeraldcfze.com',
      role: 'general_employee',
      department: 'Technical Operations'
    },
    password: 'password123'
  },
  
  // ============ BUSINESS DEVELOPMENT DEPARTMENT ============
  'aisha.bello@emeraldcfze.com': {
    user: {
      id: '7',
      firstName: 'Aisha',
      lastName: 'Bello',
      email: 'aisha.bello@emeraldcfze.com',
      role: 'line_manager',
      department: 'Business Development'
    },
    password: 'password123'
  },
  'kunle.adeyemi@emeraldcfze.com': {
    user: {
      id: '8',
      firstName: 'Kunle',
      lastName: 'Adeyemi',
      email: 'kunle.adeyemi@emeraldcfze.com',
      role: 'general_employee',
      department: 'Business Development'
    },
    password: 'password123'
  },
  
  // ============ FINANCE DEPARTMENT ============
  'temitope.lawal@emeraldcfze.com': {
    user: {
      id: '9',
      firstName: 'Temitope',
      lastName: 'Lawal',
      email: 'temitope.lawal@emeraldcfze.com',
      role: 'line_manager',
      department: 'Finance'
    },
    password: 'password123'
  },
  'rachael.daniel@emeraldcfze.com': {
    user: {
      id: '10',
      firstName: 'Rachael',
      lastName: 'Daniel',
      email: 'rachael.daniel@emeraldcfze.com',
      role: 'finance',
      department: 'Finance'
    },
    password: 'password123'
  },
  'adeniyi.bamigbade@emeraldcfze.com': {
    user: {
      id: '11',
      firstName: 'Adeniyi',
      lastName: 'Bamigbade',
      email: 'adeniyi.bamigbade@emeraldcfze.com',
      role: 'finance',
      department: 'Finance'
    },
    password: 'password123'
  },
  
  // ============ IT DEPARTMENT ============
  'it@emeraldcfze.com': {
    user: {
      id: '12',
      firstName: 'Ibrahim',
      lastName: 'Suleiman',
      email: 'it@emeraldcfze.com',
      role: 'line_manager',
      department: 'IT'
    },
    password: 'password123'
  },
  'chioma.nwosu@emeraldcfze.com': {
    user: {
      id: '13',
      firstName: 'Chioma',
      lastName: 'Nwosu',
      email: 'chioma.nwosu@emeraldcfze.com',
      role: 'it_power_user',
      department: 'IT'
    },
    password: 'password123'
  },
  
  // ============ OPERATIONS DEPARTMENT ============
  'folake.williams@emeraldcfze.com': {
    user: {
      id: '14',
      firstName: 'Folake',
      lastName: 'Williams',
      email: 'folake.williams@emeraldcfze.com',
      role: 'line_manager',
      department: 'Operations'
    },
    password: 'password123'
  },
  'yusuf.mohammed@emeraldcfze.com': {
    user: {
      id: '15',
      firstName: 'Yusuf',
      lastName: 'Mohammed',
      email: 'yusuf.mohammed@emeraldcfze.com',
      role: 'general_employee',
      department: 'Operations'
    },
    password: 'password123'
  },
  
  // ============ MARKETING DEPARTMENT ============
  'ngozi.eze@emeraldcfze.com': {
    user: {
      id: '16',
      firstName: 'Ngozi',
      lastName: 'Eze',
      email: 'ngozi.eze@emeraldcfze.com',
      role: 'line_manager',
      department: 'Marketing'
    },
    password: 'password123'
  },
  'segun.oladipo@emeraldcfze.com': {
    user: {
      id: '17',
      firstName: 'Segun',
      lastName: 'Oladipo',
      email: 'segun.oladipo@emeraldcfze.com',
      role: 'general_employee',
      department: 'Marketing'
    },
    password: 'password123'
  },
  
  // ============ SALES DEPARTMENT ============
  'amina.yusuf@emeraldcfze.com': {
    user: {
      id: '18',
      firstName: 'Amina',
      lastName: 'Yusuf',
      email: 'amina.yusuf@emeraldcfze.com',
      role: 'line_manager',
      department: 'Sales'
    },
    password: 'password123'
  },
  'tunde.akinola@emeraldcfze.com': {
    user: {
      id: '19',
      firstName: 'Tunde',
      lastName: 'Akinola',
      email: 'tunde.akinola@emeraldcfze.com',
      role: 'general_employee',
      department: 'Sales'
    },
    password: 'password123'
  },
  
  // ============ CUSTOMER SERVICE DEPARTMENT ============
  'blessing.okoro@emeraldcfze.com': {
    user: {
      id: '20',
      firstName: 'Blessing',
      lastName: 'Okoro',
      email: 'blessing.okoro@emeraldcfze.com',
      role: 'line_manager',
      department: 'Customer Service'
    },
    password: 'password123'
  },
  'daniel.agu@emeraldcfze.com': {
    user: {
      id: '21',
      firstName: 'Daniel',
      lastName: 'Agu',
      email: 'daniel.agu@emeraldcfze.com',
      role: 'general_employee',
      department: 'Customer Service'
    },
    password: 'password123'
  },
  
  // ============ PROCUREMENT DEPARTMENT ============
  'fatima.abdullahi@emeraldcfze.com': {
    user: {
      id: '22',
      firstName: 'Fatima',
      lastName: 'Abdullahi',
      email: 'fatima.abdullahi@emeraldcfze.com',
      role: 'line_manager',
      department: 'Procurement'
    },
    password: 'password123'
  },
  'emeka.okeke@emeraldcfze.com': {
    user: {
      id: '23',
      firstName: 'Emeka',
      lastName: 'Okeke',
      email: 'emeka.okeke@emeraldcfze.com',
      role: 'general_employee',
      department: 'Procurement'
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