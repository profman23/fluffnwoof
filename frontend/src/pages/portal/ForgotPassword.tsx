import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { GlobeAltIcon, ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { customerPortalApi } from '../../api/customerPortal';
import { useCustomerAuthStore } from '../../store/customerAuthStore';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { OtpInput } from '../../components/portal/OtpInput';

type Step = 'email' | 'otp' | 'password';

export const ForgotPassword: React.FC = () => {
  const { t, i18n } = useTranslation('portal');
  const navigate = useNavigate();
  const { setAuth } = useCustomerAuthStore();
  const isRtl = i18n.language === 'ar';

  const [step, setStep] = useState<Step>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Set document direction on mount and language change
  useEffect(() => {
    const currentLang = i18n.language;
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
  }, [i18n.language]);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await customerPortalApi.forgotPassword(email);
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
      const response = await customerPortalApi.resetPassword(email, password);

      // Auto-login with returned token
      if (response.token && response.owner) {
        setAuth(response.owner, response.token);
        navigate('/portal/dashboard', { replace: true });
      } else {
        // Fallback to old behavior if no token (shouldn't happen)
        setSuccess(t('resetPassword.success'));
        setTimeout(() => navigate('/portal/login'), 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  const BackIcon = isRtl ? ArrowRightIcon : ArrowLeftIcon;

  return (
    <div className={`min-h-screen bg-primary-200 flex items-center justify-center p-4 ${isRtl ? 'rtl' : 'ltr'}`}>
      {/* Language Toggle */}
      <button
        onClick={toggleLanguage}
        className="absolute top-4 end-4 p-2 bg-white rounded-full shadow hover:shadow-md transition-shadow"
        title={i18n.language === 'ar' ? 'English' : 'العربية'}
      >
        <GlobeAltIcon className="w-5 h-5 text-brand-dark" />
      </button>

      <div className="bg-white rounded-lg shadow-2xl p-6 sm:p-8 md:p-10 w-full max-w-md">
        <div className="text-center mb-6">
          <img src="/logo.png" alt="Fluff N' Woof" className="h-20 w-auto mx-auto mb-3" />
          <h1 className="text-xl font-bold text-brand-dark">
            {step === 'password' ? t('resetPassword.title') : t('forgotPassword.title')}
          </h1>
          {step === 'email' && (
            <p className="text-sm text-gray-500 mt-2">{t('forgotPassword.description')}</p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm mb-4">
            {success}
          </div>
        )}

        {/* Step 1: Email */}
        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <Input
              type="email"
              label={t('login.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '...' : t('forgotPassword.submit')}
            </Button>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <p className="text-center text-sm text-gray-600 mb-4">
              {t('register.enterOtp')}
            </p>
            <OtpInput value={otp} onChange={setOtp} length={6} />
            <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
              {loading ? '...' : t('register.verify')}
            </Button>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <Input
                type="password"
                label={t('resetPassword.newPassword')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500 mt-1">{t('register.passwordRequirements')}</p>
            </div>
            <Input
              type="password"
              label={t('resetPassword.confirmPassword')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '...' : t('resetPassword.submit')}
            </Button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link
            to="/portal/login"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-brand-dark"
          >
            <BackIcon className="w-4 h-4" />
            {t('forgotPassword.backToLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
