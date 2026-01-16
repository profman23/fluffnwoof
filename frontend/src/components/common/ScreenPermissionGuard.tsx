import React from 'react';
import { Navigate } from 'react-router-dom';
import { useScreenPermission } from '../../hooks/useScreenPermission';

interface ScreenPermissionGuardProps {
  screenName: string;
  requireModify?: boolean;
  children: React.ReactNode;
}

export const ScreenPermissionGuard: React.FC<ScreenPermissionGuardProps> = ({
  screenName,
  requireModify = false,
  children,
}) => {
  const { canAccess, canModify } = useScreenPermission(screenName);

  // No access at all - redirect to dashboard
  if (!canAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  // Requires modify but user only has read - redirect to dashboard
  if (requireModify && !canModify) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
