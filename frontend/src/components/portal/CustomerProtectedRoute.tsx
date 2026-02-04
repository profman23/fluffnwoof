import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useCustomerAuthStore } from '../../store/customerAuthStore';
import { LogoLoader } from '../common/LogoLoader';

export const CustomerProtectedRoute: React.FC = () => {
  const { isAuthenticated, initializeAuth } = useCustomerAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    initializeAuth();
    setIsLoading(false);
  }, [initializeAuth]);

  if (isLoading) {
    return <LogoLoader fullScreen />;
  }

  if (!isAuthenticated) {
    // Save the attempted URL for redirecting after login
    return <Navigate to="/portal/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default CustomerProtectedRoute;
