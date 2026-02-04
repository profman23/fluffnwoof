import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';

export const Login: React.FC = () => {
  const { t, i18n } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  // Set document direction on mount and language change
  useEffect(() => {
    const currentLang = i18n.language;
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
  }, [i18n.language]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user, token } = await authApi.login(email, password);
      setAuth(user, token);

      // Fetch user permissions after login
      try {
        const permissions = await authApi.getMyPermissions();
        useAuthStore.getState().setPermissions(permissions);
      } catch (permError) {
        console.error('Failed to fetch permissions:', permError);
      }

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || t('loginError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Video Section (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-brand-dark">
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover bg-brand-dark"
        >
          <source src="/videos/login_page.mp4" type="video/mp4" />
        </video>

        {/* Overlay with gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/40 via-transparent to-brand-dark/60" />

        {/* Content over video */}
        <div className="relative z-10 flex flex-col justify-end p-12 text-white">
          <div className="max-w-lg">
            <h1 className="text-4xl xl:text-5xl font-bold mb-4 drop-shadow-lg">
              Fluff N' Woof
            </h1>
            <p className="text-lg xl:text-xl text-white/90 drop-shadow-md">
              {t('appSubtitle')}
            </p>
            <div className="mt-8 flex items-center gap-4">
              <div className="w-16 h-1 bg-secondary-300 rounded-full" />
              <span className="text-secondary-300 text-sm font-medium">Veterinary Management System</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-12 bg-primary-200 dark:bg-[var(--app-bg-secondary)] transition-colors">
        <div className="w-full max-w-md">
          {/* Logo - Always visible */}
          <div className="text-center mb-8">
            <img
              src="/logo.png"
              alt="Fluff N' Woof"
              className="h-24 sm:h-28 w-auto mx-auto mb-4 drop-shadow-lg"
            />
            {/* Show subtitle only on mobile since desktop has it in video section */}
            <p className="lg:hidden text-sm sm:text-base text-primary-500 dark:text-primary-400">
              {t('appSubtitle')}
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white dark:bg-[var(--app-bg-card)] rounded-2xl shadow-2xl dark:shadow-black/50 p-6 sm:p-8 lg:p-10">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-brand-dark dark:text-[var(--app-text-primary)]">
                {t('welcomeBack') || 'Welcome Back'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t('loginToContinue') || 'Login to continue to your account'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                type="email"
                label={t('email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@fluffnwoof.com"
                required
              />

              <Input
                type="password"
                label={t('password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />

              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm flex items-center gap-2">
                  <span>⚠️</span>
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t('loggingIn')}
                  </span>
                ) : (
                  t('login')
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              <p>{t('noAccount')}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
            <p>© 2024 Fluff N' Woof. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
