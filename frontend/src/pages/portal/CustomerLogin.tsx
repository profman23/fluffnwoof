/**
 * Customer Login Page - Redesigned
 * Mobile-first login with modern UI
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCustomerAuthStore } from '../../store/customerAuthStore';
import { customerPortalApi } from '../../api/customerPortal';
import { PortalThemeProvider, usePortalTheme } from '../../context/PortalThemeContext';
import { ToastProvider, useToast } from '../../components/portal/ui/Toast';
import { AuthLayout } from '../../components/portal/layout/AuthLayout';
import { Input } from '../../components/portal/ui/Input';
import { Button } from '../../components/portal/ui/Button';
import { fadeInUpSimple } from '../../styles/portal/animations';
import { MobileVideoIntro } from '../../components/common/MobileVideoIntro';

// ============================================
// LORD ICON DECLARATION (for TypeScript)
// ============================================

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lord-icon': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src: string;
          trigger?: string;
          delay?: string;
          colors?: string;
          style?: React.CSSProperties;
        },
        HTMLElement
      >;
    }
  }
}

// ============================================
// WAVING HAND ICON (Lord Icon)
// ============================================

interface WavingHandProps {
  isDark?: boolean;
}

const WavingHand: React.FC<WavingHandProps> = ({ isDark = false }) => {
  // In dark mode, make the brackets (primary) yellow, keep hand outline (secondary) black
  const iconColors = isDark
    ? 'primary:#f5df59,secondary:#242424'
    : 'primary:#242424,secondary:#f5df59';

  return (
    <div className="flex items-center justify-center">
      <lord-icon
        src="https://cdn.lordicon.com/zoxiseye.json"
        trigger="loop"
        delay="1000"
        colors={iconColors}
        style={{ width: '80px', height: '80px' }}
      />
    </div>
  );
};

// ============================================
// LOGIN FORM COMPONENT
// ============================================

const LoginForm: React.FC = () => {
  const { t, i18n } = useTranslation('portal');
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useCustomerAuthStore();
  const toast = useToast();
  const { isDark } = usePortalTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showVideoIntro, setShowVideoIntro] = useState(true);

  const from = (location.state as any)?.from?.pathname || '/portal/dashboard';

  // Set document direction on mount and language change
  useEffect(() => {
    const currentLang = i18n.language;
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
  }, [i18n.language]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorCode(null);
    setLoading(true);

    try {
      const response = await customerPortalApi.login({ email, password });
      setAuth(response.owner, response.token);
      toast.success(t('login.success'));
      navigate(from, { replace: true });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || t('errors.generic');
      const code = err.response?.data?.code || err.response?.data?.errorCode;

      setErrorCode(code || null);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Mobile video intro is always shown since portal is mobile-first
  if (showVideoIntro) {
    return (
      <MobileVideoIntro
        onDismiss={() => setShowVideoIntro(false)}
        translationNamespace="portal"
      />
    );
  }

  return (
    <AuthLayout
      titleIcon={<WavingHand isDark={isDark} />}
      subtitle={t('welcome')}
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Email Input */}
        <motion.div
          initial={fadeInUpSimple.initial}
          animate={fadeInUpSimple.animate}
          transition={{ ...fadeInUpSimple.transition, delay: 0.2 }}
        >
          <Input
            type="email"
            label={t('login.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            required
            autoComplete="email"
            dir="ltr"
            size="lg"
          />
        </motion.div>

        {/* Password Input */}
        <motion.div
          initial={fadeInUpSimple.initial}
          animate={fadeInUpSimple.animate}
          transition={{ ...fadeInUpSimple.transition, delay: 0.3 }}
        >
          <Input
            type="password"
            label={t('login.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            size="lg"
          />
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl border ${
              errorCode === 'NO_PASSWORD' || errorCode === 'NOT_VERIFIED'
                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                : errorCode === 'ACCOUNT_DISABLED'
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Icon based on error code */}
              <div className="flex-shrink-0 mt-0.5">
                {errorCode === 'NO_PASSWORD' && (
                  <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                )}
                {errorCode === 'NOT_VERIFIED' && (
                  <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                )}
                {errorCode === 'ACCOUNT_DISABLED' && (
                  <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                )}
                {(!errorCode || errorCode === 'INVALID_CREDENTIALS') && (
                  <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className={`text-sm ${
                  errorCode === 'NO_PASSWORD' || errorCode === 'NOT_VERIFIED'
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {error}
                </p>
                {/* Contextual help links */}
                {errorCode === 'NO_PASSWORD' && (
                  <Link
                    to="/portal/forgot"
                    className="text-sm text-mint-600 dark:text-mint-400 hover:underline mt-2 inline-flex items-center gap-1"
                  >
                    {t('login.setPasswordHint')}
                    <svg className="w-4 h-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
                {errorCode === 'NOT_VERIFIED' && (
                  <Link
                    to="/portal/register"
                    className="text-sm text-mint-600 dark:text-mint-400 hover:underline mt-2 inline-flex items-center gap-1"
                  >
                    {t('login.completeRegistrationHint')}
                    <svg className="w-4 h-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Forgot Password Link */}
        <motion.div
          initial={fadeInUpSimple.initial}
          animate={fadeInUpSimple.animate}
          transition={{ ...fadeInUpSimple.transition, delay: 0.35 }}
          className="text-right"
        >
          <Link
            to="/portal/forgot"
            className="text-sm text-mint-600 dark:text-mint-400 hover:underline"
          >
            {t('login.forgotPassword')}
          </Link>
        </motion.div>

        {/* Submit Button */}
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
            {t('login.submit')}
          </Button>
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={fadeInUpSimple.initial}
          animate={fadeInUpSimple.animate}
          transition={{ ...fadeInUpSimple.transition, delay: 0.45 }}
          className="relative my-6"
        >
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-gray-50 dark:bg-gray-950 text-gray-500">
              {t('login.or')}
            </span>
          </div>
        </motion.div>

        {/* Register Link */}
        <motion.div
          initial={fadeInUpSimple.initial}
          animate={fadeInUpSimple.animate}
          transition={{ ...fadeInUpSimple.transition, delay: 0.5 }}
          className="text-center"
        >
          <p className="text-gray-600 dark:text-gray-400">
            {t('login.noAccount')}{' '}
            <Link
              to="/portal/register"
              className="font-semibold text-mint-600 dark:text-mint-400 hover:underline"
            >
              {t('login.register')}
            </Link>
          </p>
        </motion.div>
      </form>
    </AuthLayout>
  );
};

// ============================================
// MAIN EXPORT
// ============================================

export const CustomerLogin: React.FC = () => {
  return (
    <PortalThemeProvider>
      <ToastProvider>
        <LoginForm />
      </ToastProvider>
    </PortalThemeProvider>
  );
};

export default CustomerLogin;
