/**
 * Customer Register Page - Phone-First
 * Multi-step: phone → OTP (SMS) → name + password
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCustomerAuthStore } from '../../store/customerAuthStore';
import { customerPortalApi } from '../../api/customerPortal';
import { PortalThemeProvider } from '../../context/PortalThemeContext';
import { ToastProvider, useToast } from '../../components/portal/ui/Toast';
import { AuthLayout } from '../../components/portal/layout/AuthLayout';
import { Input } from '../../components/portal/ui/Input';
import { Button } from '../../components/portal/ui/Button';
import { OtpInput } from '../../components/portal/OtpInput';
import { fadeInUpSimple } from '../../styles/portal/animations';

// ============================================
// TYPES
// ============================================

type Step = 'phone' | 'otp' | 'details';

// ============================================
// ICONS
// ============================================

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const PhoneIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 15h3" />
  </svg>
);

const MessageIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
  </svg>
);

const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
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
    phone: PhoneIcon,
    otp: MessageIcon,
    details: UserIcon,
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

  const [step, setStep] = useState<Step>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Phone
  const [phone, setPhone] = useState('');

  // Step 2: OTP
  const [ownerId, setOwnerId] = useState('');
  const [otp, setOtp] = useState('');
  // Step 3: Details
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const steps: Step[] = ['phone', 'otp', 'details'];

  // Set document direction
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      setError(t('errors.required'));
      return;
    }

    setLoading(true);

    try {
      // Check phone status first
      const result = await customerPortalApi.checkPhone(cleanPhone);

      if (result.status === 'REGISTERED') {
        setError(t('register.phoneAlreadyRegistered'));
        return;
      }

      // NOT_FOUND or CLAIMABLE → register (sends OTP via SMS)
      const response = await customerPortalApi.register({
        phone: cleanPhone,
        preferredLang: i18n.language,
      });
      setOwnerId(response.ownerId);

      // Pre-fill existing owner data for CLAIMABLE accounts
      if (response.existingData) {
        if (response.existingData.firstName) setFirstName(response.existingData.firstName);
        if (response.existingData.lastName) setLastName(response.existingData.lastName);
        if (response.existingData.email) setEmail(response.existingData.email);
      }

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
        phone: phone.trim(),
        code: otp,
        type: 'registration',
      });
      toast.success(t('register.otpVerified'));
      setStep('details');
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
      await customerPortalApi.resendOtp(phone.trim(), 'registration');
      toast.success(t('register.otpResent'));
    } catch (err: any) {
      setError(err.response?.data?.message || t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim() || !lastName.trim()) {
      setError(t('errors.required'));
      return;
    }

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
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
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

  const getStepTitle = () => {
    switch (step) {
      case 'phone': return t('register.step1');
      case 'otp': return t('register.step2');
      case 'details': return t('register.step3');
    }
  };

  return (
    <AuthLayout
      title={t('register.title')}
      subtitle={getStepTitle()}
      showBackToLogin={step !== 'phone'}
    >
      <StepIndicator currentStep={step} steps={steps} />

      {/* Error Message */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            key={error}
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
        {/* Step 1: Phone */}
        {step === 'phone' && (
          <motion.form
            key="phone"
            initial={fadeInUpSimple.initial}
            animate={fadeInUpSimple.animate}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handlePhoneSubmit}
            className="space-y-4"
          >
            <Input
              type="tel"
              label={t('register.phone')}
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setError('');
              }}
              placeholder="05xxxxxxxx"
              required
              dir="ltr"
              size="lg"
              autoComplete="tel"
            />

            <Button
              type="submit"
              variant="primary"
              size="xl"
              fullWidth
              loading={loading}
            >
              {t('register.sendOtp')}
            </Button>
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
                <MessageIcon className="w-8 h-8 text-mint-600" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {t('register.enterOtp')}
              </p>
              <p className="text-sm text-mint-600 dark:text-mint-400 font-medium" dir="ltr">
                {phone}
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

        {/* Step 3: Details + Password */}
        {step === 'details' && (
          <motion.form
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleDetailsSubmit}
            className="space-y-4"
          >
            <div className="text-center mb-4">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckIcon className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {t('register.almostDone')}
              </p>
            </div>

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
              type="email"
              label={t('register.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              hint={t('register.emailOptional')}
              dir="ltr"
            />

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
      {step === 'phone' && (
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
