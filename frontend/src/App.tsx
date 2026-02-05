import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Capacitor } from '@capacitor/core';
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
import { ReminderManagement } from './pages/crm/ReminderManagement';
import { ShiftsManagement } from './pages/clinicSetup/ShiftsManagement';
import { VisitTypesPage } from './pages/clinicSetup/VisitTypesPage';
import { FormsPage } from './pages/clinicSetup/FormsPage';
import BoardingIcuPage from './pages/clinicSetup/BoardingIcuPage';
import { ThemeProvider } from './components/ThemeProvider';
import { DarkModeProvider } from './context/DarkModeContext';
import { LogoLoader } from './components/common/LogoLoader';

// Customer Portal imports - New Modern Design
import { PortalLayout } from './components/portal/layout/PortalLayout';
import { CustomerLogin } from './pages/portal/CustomerLogin';
import { CustomerRegister } from './pages/portal/CustomerRegister';
import { ForgotPassword } from './pages/portal/ForgotPassword';
import { CustomerDashboard } from './pages/portal/CustomerDashboard';
import { MyPets } from './pages/portal/MyPets';
import { BookAppointment } from './pages/portal/BookAppointment';
import { MyAppointments } from './pages/portal/MyAppointments';
import { CustomerProfile } from './pages/portal/CustomerProfile';
import { CustomerForms } from './pages/portal/CustomerForms';
import { FormSignPage } from './pages/portal/FormSignPage';
import { PetDetailPage } from './pages/portal/PetDetailPage';
import { AppointmentDetailPage } from './pages/portal/AppointmentDetailPage';
import { PublicFormSign } from './pages/PublicFormSign';

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
      <DarkModeProvider>
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
          {/* CRM Routes */}
          <Route
            path="/crm/sms"
            element={
              <ProtectedRoute>
                <SmsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/crm/reminders"
            element={
              <ProtectedRoute>
                <ReminderManagement />
              </ProtectedRoute>
            }
          />
          {/* Clinic Setup Routes */}
          <Route
            key="clinic-setup-shifts"
            path="/clinic-setup/shifts"
            element={
              <ProtectedRoute>
                <ShiftsManagement />
              </ProtectedRoute>
            }
          />
          <Route
            key="clinic-setup-visit-types"
            path="/clinic-setup/visit-types"
            element={
              <ProtectedRoute>
                <VisitTypesPage />
              </ProtectedRoute>
            }
          />
          <Route
            key="clinic-setup-forms"
            path="/clinic-setup/forms"
            element={
              <ProtectedRoute>
                <FormsPage />
              </ProtectedRoute>
            }
          />
          <Route
            key="clinic-setup-boarding"
            path="/clinic-setup/boarding"
            element={
              <ProtectedRoute>
                <BoardingIcuPage />
              </ProtectedRoute>
            }
          />
          {/* Legacy route redirect */}
          <Route path="/sms" element={<Navigate to="/crm/sms" replace />} />
          {/* Root route: Mobile app goes to portal, Web goes to dashboard */}
          <Route path="/" element={
            Capacitor.isNativePlatform()
              ? <Navigate to="/portal/login" replace />
              : <Navigate to="/dashboard" replace />
          } />

          {/* Customer Portal - Public Routes (Login, Register, Forgot Password) */}
          <Route path="/portal/login" element={<CustomerLogin />} />
          <Route path="/portal/register" element={<CustomerRegister />} />
          <Route path="/portal/forgot" element={<ForgotPassword />} />

          {/* Customer Portal - Protected Routes (with PortalLayout) */}
          <Route path="/portal" element={<PortalLayout />}>
            <Route path="dashboard" element={<CustomerDashboard />} />
            <Route path="pets" element={<MyPets />} />
            <Route path="pets/:id" element={<PetDetailPage />} />
            <Route path="book" element={<BookAppointment />} />
            <Route path="appointments" element={<MyAppointments />} />
            <Route path="appointments/:id" element={<AppointmentDetailPage />} />
            <Route path="profile" element={<CustomerProfile />} />
            <Route path="forms" element={<CustomerForms />} />
            <Route path="forms/:id" element={<FormSignPage />} />
          </Route>

          {/* Portal root redirects to login */}
          <Route path="/portal" element={<Navigate to="/portal/login" replace />} />

          {/* Public Form Sign Page (no login required) */}
          <Route path="/sign/:formId" element={<PublicFormSign />} />
          </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </DarkModeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
