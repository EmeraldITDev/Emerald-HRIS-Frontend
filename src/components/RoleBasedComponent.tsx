import React from 'react';
import { useAuth, UserRole } from '@/contexts/AuthContext';

interface RoleBasedComponentProps {
  allowedRoles?: UserRole[];
  requiredPermission?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const RoleBasedComponent: React.FC<RoleBasedComponentProps> = ({
  allowedRoles,
  requiredPermission,
  fallback = null,
  children
}) => {
  const { user, hasPermission } = useAuth();

  if (!user) {
    return <>{fallback}</>;
  }

  // Check role-based access
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
  }

  // Check permission-based access
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default RoleBasedComponent;