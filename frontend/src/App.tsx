import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useAuthStore } from './store/authStore';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { RolesPermissions } from './pages/RolesPermissions';
import { UserManagement } from './pages/UserManagement';
import { PatientsPage } from './pages/PatientsPage';
import { FlowBoardPage } from './pages/FlowBoardPage';
import { MedicalRecordsPage } from './pages/MedicalRecordsPage';
import { NextAppointmentsReport } from './pages/reports/NextAppointmentsReport';
import { ServiceProductsPage } from './pages/ServiceProductsPage';
import { MyProfile } from './pages/MyProfile';
import { SmsPage } from './pages/SmsPage';
import { ThemeProvider } from './components/ThemeProvider';
import { LogoLoader } from './components/common/LogoLoader';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

const PlaceholderPage: React.FC<{ pageKey: string }> = ({ pageKey }) => {
  const { t } = useTranslation('common');
  return (
    <div className="page-container">
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-5xl md:text-6xl mb-4">🚧</div>
          <h2 className="text-xl md:text-2xl font-semibold text-gray-700 mb-2">
            {t('underDevelopment', { page: t(`pages.${pageKey}`) })}
          </h2>
          <p className="text-sm md:text-base text-gray-500">قريباً...</p>
        </div>
      </div>
    </div>
  );
};

function App() {
  const { initializeAuth } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializeAuth();
    setIsInitialized(true);
  }, [initializeAuth]);

  // انتظار تهيئة المصادقة قبل عرض التطبيق
  if (!isInitialized) {
    return <LogoLoader fullScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients"
            element={
              <ProtectedRoute>
                <PatientsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/flow-board"
            element={
              <ProtectedRoute>
                <FlowBoardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointments"
            element={
              <ProtectedRoute>
                <PlaceholderPage pageKey="appointments" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/medical"
            element={
              <ProtectedRoute>
                <MedicalRecordsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoices"
            element={
              <ProtectedRoute>
                <PlaceholderPage pageKey="invoices" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/roles"
            element={
              <ProtectedRoute>
                <RolesPermissions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit"
            element={
              <ProtectedRoute>
                <PlaceholderPage pageKey="audit" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/appointments"
            element={
              <ProtectedRoute>
                <NextAppointmentsReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/service-products"
            element={
              <ProtectedRoute>
                <ServiceProductsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <MyProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sms"
            element={
              <ProtectedRoute>
                <SmsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
