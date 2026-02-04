/**
 * Customer Register Page - Redesigned
 * Multi-step registration with smart email handling
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCustomerAuthStore } from '../../store/customerAuthStore';
import { customerPortalApi, CheckEmailResponse } from '../../api/customerPortal';
import { PortalThemeProvider } from '../../context/PortalThemeContext';
import { ToastProvider, useToast } from '../../components/portal/ui/Toast';
import { AuthLayout } from '../../components/portal/layout/AuthLayout';
import { Input } from '../../components/portal/ui/Input';
import { Button } from '../../components/portal/ui/Button';
import { Card } from '../../components/portal/ui/Card';
import { OtpInput } from '../../components/portal/OtpInput';
import { fadeInUpSimple } from '../../styles/portal/animations';

// ============================================
// TYPES
// ============================================

type Step = 'info' | 'otp' | 'password';
type EmailStatus = 'NOT_FOUND' | 'REGISTERED' | 'CLAIMABLE' | null;

// ============================================
// ICONS
// ============================================

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const MailIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);

const LockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

// ============================================
// STEP INDICATOR COMPONENT
// ============================================

interface StepIndicatorProps {
  currentStep: Step;
  steps: Step[];
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, steps }) => {
  const stepIcons = {
    info: UserIcon,
    otp: MailIcon,
    password: LockIcon,
  };

  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, idx) => {
        const Icon = stepIcons[step];
        const isActive = step === currentStep;
        const isCompleted = steps.indexOf(currentStep) > idx;

        return (
          <React.Fragment key={step}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={`
                w-10 h-10 rounded-full flex items-center justify-center
                transition-all duration-300
                ${isActive
                  ? 'bg-mint-500 text-white ring-4 ring-mint-500/20'
                  : isCompleted
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }
              `}
            >
              {isCompleted ? (
                <CheckIcon className="w-5 h-5" />
              ) : (
                <Icon className="w-5 h-5" />
              )}
            </motion.div>
            {idx < steps.length - 1 && (
              <div
                className={`w-12 h-1 mx-1 rounded-full transition-colors duration-300 ${
                  steps.indexOf(currentStep) > idx
                    ? 'bg-green-500'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ============================================
// REGISTER FORM COMPONENT
// ============================================

const RegisterForm: React.FC = () => {
  const { t, i18n } = useTranslation('portal');
  const navigate = useNavigate();
  const { setAuth } = useCustomerAuthStore();
  const toast = useToast();

  const [step, setStep] = useState<Step>('info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Email status for smart handling
  const [emailStatus, setEmailStatus] = useState<EmailStatus>(null);
  const [emailLoading, setEmailLoading] = useState(false);

  // Step 2: OTP
  const [ownerId, setOwnerId] = useState('');
  const [otp, setOtp] = useState('');

  // Step 3: Password
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const steps: Step[] = ['info', 'otp', 'password'];

  // Set document direction
  useEffect(() => {
    const currentLang = i18n.language;
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
  }, [i18n.language]);

  // Debounced email check
  const checkEmailStatus = useCallback(async (emailToCheck: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToCheck)) {
      setEmailStatus(null);
      return;
    }

    setEmailLoading(true);
    try {
      const result: CheckEmailResponse = await customerPortalApi.checkEmail(emailToCheck);
      setEmailStatus(result.status);
    } catch {
      setEmailStatus(null);
    } finally {
      setEmailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!email.trim()) {
      setEmailStatus(null);
      return;
    }

    const timer = setTimeout(() => {
      checkEmailStatus(email);
    }, 500);

    return () => clearTimeout(timer);
  }, [email, checkEmailStatus]);

  const handleClaimAccount = async () => {
    setError('');
    setLoading(true);

    try {
      const result = await customerPortalApi.claimAccount(email);
      setOwnerId(result.ownerId);
      toast.success(t('register.otpSent'));
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.message || t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await customerPortalApi.register({
        firstName,
        lastName,
        email,
        phone,
        address,
        preferredLang: i18n.language,
      });
      setOwnerId(response.ownerId);
      toast.success(t('register.otpSent'));
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.message || t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await customerPortalApi.verifyOtp({
        email,
        code: otp,
        type: 'registration',
      });
      toast.success(t('register.otpVerified'));
      setStep('password');
    } catch (err: any) {
      setError(err.response?.data?.message || t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setLoading(true);

    try {
      await customerPortalApi.resendOtp(email, 'registration');
      toast.success(t('register.otpResent'));
    } catch (err: any) {
      setError(err.response?.data?.message || t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('register.passwordMismatch'));
      return;
    }

    if (password.length < 8) {
      setError(t('register.passwordRequirements'));
      return;
    }

    setLoading(true);

    try {
      const response = await customerPortalApi.completeRegistration({
        ownerId,
        password,
      });
      setAuth(response.owner, response.token);
      toast.success(t('register.success'));
      navigate('/portal/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  const renderEmailStatusMessage = () => {
    if (emailLoading) {
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-xl bg-gray-100 dark:bg-gray-800"
        >
          <div className="w-4 h-4 border-2 border-gray-300 border-t-mint-500 rounded-full animate-spin" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {t('register.checkingEmail')}
          </span>
        </motion.div>
      );
    }

    if (emailStatus === 'REGISTERED') {
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card variant="outlined" className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  {t('register.emailAlreadyRegistered')}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link to="/portal/login">
                    <Button variant="primary" size="sm">
                      {t('register.loginHere')}
                    </Button>
                  </Link>
                  <Link to="/portal/forgot">
                    <Button variant="outline" size="sm">
                      {t('login.forgotPassword')}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      );
    }

    if (emailStatus === 'CLAIMABLE') {
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card variant="outlined" className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  {t('register.accountExistsCanClaim')}
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  {t('register.claimAccountDescription')}
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-3 bg-green-600 hover:bg-green-700"
                  onClick={handleClaimAccount}
                  loading={loading}
                >
                  {t('register.claimAccount')}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      );
    }

    return null;
  };

  const canSubmitForm = emailStatus === 'NOT_FOUND' || emailStatus === null;

  const getStepTitle = () => {
    switch (step) {
      case 'info':
        return t('register.step1');
      case 'otp':
        return t('register.step2');
      case 'password':
        return t('register.step3');
    }
  };

  return (
    <AuthLayout
      title={t('register.title')}
      subtitle={getStepTitle()}
      showBackToLogin={step !== 'info'}
    >
      <StepIndicator currentStep={step} steps={steps} />

      {/* Error Message */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
          >
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* Step 1: Personal Info */}
        {step === 'info' && (
          <motion.form
            key="info"
            initial={fadeInUpSimple.initial}
            animate={fadeInUpSimple.animate}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleInfoSubmit}
            className="space-y-4"
          >
            <Input
              type="email"
              label={t('register.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
              dir="ltr"
              size="lg"
            />

            {email.trim() && renderEmailStatusMessage()}

            {(emailStatus === 'NOT_FOUND' || !emailStatus) && !emailLoading && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label={t('register.firstName')}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                  <Input
                    label={t('register.lastName')}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>

                <Input
                  type="tel"
                  label={t('register.phone')}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  dir="ltr"
                />

                <Input
                  label={t('register.address')}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  hint={t('register.addressOptional')}
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="xl"
                  fullWidth
                  loading={loading}
                  disabled={!canSubmitForm}
                >
                  {t('register.sendOtp')}
                </Button>
              </>
            )}
          </motion.form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 'otp' && (
          <motion.form
            key="otp"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleOtpSubmit}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-mint-100 dark:bg-mint-900/30 flex items-center justify-center">
                <MailIcon className="w-8 h-8 text-mint-600" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {t('register.enterOtp')}
              </p>
              <p className="text-sm text-mint-600 dark:text-mint-400 font-medium" dir="ltr">
                {email}
              </p>
            </div>

            <OtpInput
              value={otp}
              onChange={setOtp}
              length={6}
              error={!!error}
            />

            <Button
              type="submit"
              variant="primary"
              size="xl"
              fullWidth
              loading={loading}
              disabled={otp.length !== 6}
            >
              {t('register.verify')}
            </Button>

            <button
              type="button"
              onClick={handleResendOtp}
              disabled={loading}
              className="w-full text-sm text-mint-600 dark:text-mint-400 hover:underline disabled:opacity-50"
            >
              {t('register.resendOtp')}
            </button>
          </motion.form>
        )}

        {/* Step 3: Password */}
        {step === 'password' && (
          <motion.form
            key="password"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handlePasswordSubmit}
            className="space-y-4"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckIcon className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {t('register.almostDone')}
              </p>
            </div>

            <Input
              type="password"
              label={t('register.createPassword')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              size="lg"
              hint={t('register.passwordRequirements')}
            />

            <Input
              type="password"
              label={t('register.confirmPassword')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              size="lg"
            />

            <Button
              type="submit"
              variant="primary"
              size="xl"
              fullWidth
              loading={loading}
            >
              {t('register.complete')}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Login Link */}
      {step === 'info' && (
        <motion.div
          initial={fadeInUpSimple.initial}
          animate={fadeInUpSimple.animate}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center"
        >
          <p className="text-gray-600 dark:text-gray-400">
            {t('register.haveAccount')}{' '}
            <Link
              to="/portal/login"
              className="font-semibold text-mint-600 dark:text-mint-400 hover:underline"
            >
              {t('register.loginHere')}
            </Link>
          </p>
        </motion.div>
      )}
    </AuthLayout>
  );
};

// ============================================
// MAIN EXPORT
// ============================================

export const CustomerRegister: React.FC = () => {
  return (
    <PortalThemeProvider>
      <ToastProvider>
        <RegisterForm />
      </ToastProvider>
    </PortalThemeProvider>
  );
};

export default CustomerRegister;
