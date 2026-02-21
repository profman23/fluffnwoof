/**
 * Portal Forgot Password Page
 * Multi-step: Phone → OTP (SMS) → New Password
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { customerPortalApi } from '../../api/customerPortal';
import { useCustomerAuthStore } from '../../store/customerAuthStore';
import { PortalThemeProvider } from '../../context/PortalThemeContext';
import { AuthLayout } from '../../components/portal/layout/AuthLayout';
import { Input } from '../../components/portal/ui/Input';
import { Button } from '../../components/portal/ui/Button';
import { OtpInput } from '../../components/portal/OtpInput';
import { fadeInUpSimple } from '../../styles/portal/animations';

type Step = 'phone' | 'otp' | 'password';

// ============================================
// STEP ICONS
// ============================================

const PhoneIcon: React.FC = () => (
  <div className="flex items-center justify-center">
    <div className="w-20 h-20 rounded-full bg-mint-100 dark:bg-mint-900/30 flex items-center justify-center">
      <svg className="w-10 h-10 text-mint-600 dark:text-mint-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 15h3" />
      </svg>
    </div>
  </div>
);

const OtpIcon: React.FC = () => (
  <div className="flex items-center justify-center">
    <div className="w-20 h-20 rounded-full bg-mint-100 dark:bg-mint-900/30 flex items-center justify-center">
      <svg className="w-10 h-10 text-mint-600 dark:text-mint-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
      </svg>
    </div>
  </div>
);

const PasswordIcon: React.FC = () => (
  <div className="flex items-center justify-center">
    <div className="w-20 h-20 rounded-full bg-mint-100 dark:bg-mint-900/30 flex items-center justify-center">
      <svg className="w-10 h-10 text-mint-600 dark:text-mint-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    </div>
  </div>
);

// ============================================
// FORM COMPONENT
// ============================================

const ForgotPasswordForm: React.FC = () => {
  const { t } = useTranslation('portal');
  const navigate = useNavigate();
  const { setAuth } = useCustomerAuthStore();

  const [step, setStep] = useState<Step>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await customerPortalApi.forgotPassword(phone.trim());
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
        type: 'password_reset',
      });
      setStep('password');
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
      const response = await customerPortalApi.resetPassword(phone.trim(), password);

      // Auto-login with returned token
      if (response.token && response.owner) {
        setAuth(response.owner, response.token);
        navigate('/portal/dashboard', { replace: true });
      } else {
        setSuccess(t('resetPassword.success'));
        setTimeout(() => navigate('/portal/login'), 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  const stepIcon = step === 'phone' ? <PhoneIcon /> : step === 'otp' ? <OtpIcon /> : <PasswordIcon />;
  const stepSubtitle = step === 'phone'
    ? t('forgotPassword.description')
    : step === 'otp'
    ? t('register.enterOtp')
    : t('resetPassword.title');

  return (
    <AuthLayout
      titleIcon={stepIcon}
      subtitle={stepSubtitle}
      showBackToLogin={true}
    >
      <div className="space-y-5">
        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
          >
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </motion.div>
        )}

        {/* Success Message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
          >
            <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
          </motion.div>
        )}

        {/* Step 1: Phone */}
        {step === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="space-y-5">
            <motion.div
              initial={fadeInUpSimple.initial}
              animate={fadeInUpSimple.animate}
              transition={{ ...fadeInUpSimple.transition, delay: 0.2 }}
            >
              <Input
                type="tel"
                label={t('login.phone')}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="05xxxxxxxx"
                required
                autoComplete="tel"
                dir="ltr"
                size="lg"
              />
            </motion.div>
            <motion.div
              initial={fadeInUpSimple.initial}
              animate={fadeInUpSimple.animate}
              transition={{ ...fadeInUpSimple.transition, delay: 0.3 }}
            >
              <Button
                type="submit"
                variant="primary"
                size="xl"
                fullWidth
                loading={loading}
              >
                {t('forgotPassword.submit')}
              </Button>
            </motion.div>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-5">
            <div className="text-center mb-2">
              <p className="text-sm text-mint-600 dark:text-mint-400 font-medium" dir="ltr">
                {phone}
              </p>
            </div>
            <motion.div
              initial={fadeInUpSimple.initial}
              animate={fadeInUpSimple.animate}
              transition={{ ...fadeInUpSimple.transition, delay: 0.2 }}
            >
              <OtpInput value={otp} onChange={setOtp} length={6} />
            </motion.div>
            <motion.div
              initial={fadeInUpSimple.initial}
              animate={fadeInUpSimple.animate}
              transition={{ ...fadeInUpSimple.transition, delay: 0.3 }}
            >
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
            </motion.div>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <motion.div
              initial={fadeInUpSimple.initial}
              animate={fadeInUpSimple.animate}
              transition={{ ...fadeInUpSimple.transition, delay: 0.2 }}
            >
              <Input
                type="password"
                label={t('resetPassword.newPassword')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                size="lg"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('register.passwordRequirements')}</p>
            </motion.div>
            <motion.div
              initial={fadeInUpSimple.initial}
              animate={fadeInUpSimple.animate}
              transition={{ ...fadeInUpSimple.transition, delay: 0.3 }}
            >
              <Input
                type="password"
                label={t('resetPassword.confirmPassword')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                size="lg"
              />
            </motion.div>
            <motion.div
              initial={fadeInUpSimple.initial}
              animate={fadeInUpSimple.animate}
              transition={{ ...fadeInUpSimple.transition, delay: 0.4 }}
            >
              <Button
                type="submit"
                variant="primary"
                size="xl"
                fullWidth
                loading={loading}
              >
                {t('resetPassword.submit')}
              </Button>
            </motion.div>
          </form>
        )}
      </div>
    </AuthLayout>
  );
};

// ============================================
// MAIN EXPORT
// ============================================

export const ForgotPassword: React.FC = () => {
  return (
    <PortalThemeProvider>
      <ForgotPasswordForm />
    </PortalThemeProvider>
  );
};

export default ForgotPassword;
