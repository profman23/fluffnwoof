import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HomeIcon,
  CalendarDaysIcon,
  HeartIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { useCustomerAuthStore } from '../../store/customerAuthStore';

export const CustomerLayout: React.FC = () => {
  const { t, i18n } = useTranslation('portal');
  const location = useLocation();
  const navigate = useNavigate();
  const { customer, logout } = useCustomerAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const isRtl = i18n.language === 'ar';

  const navItems = [
    { path: '/portal/dashboard', label: t('nav.dashboard'), icon: HomeIcon },
    { path: '/portal/pets', label: t('nav.pets'), icon: HeartIcon },
    { path: '/portal/book', label: t('nav.book'), icon: CalendarDaysIcon },
    { path: '/portal/appointments', label: t('nav.appointments'), icon: CalendarDaysIcon },
  ];

  const handleLogout = () => {
    logout();
    navigate('/portal/login');
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${isRtl ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <header className="bg-brand-dark text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/portal/dashboard" className="flex items-center gap-3">
              <img src="/logo.png" alt="Fluff N' Woof" className="h-10 w-auto" />
              <span className="font-semibold text-lg hidden sm:block">Fluff N' Woof</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-secondary-400 text-brand-dark font-medium'
                        : 'hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center gap-3">
              {/* Language toggle */}
              <button
                onClick={toggleLanguage}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title={i18n.language === 'ar' ? 'English' : 'العربية'}
              >
                <GlobeAltIcon className="w-5 h-5" />
              </button>

              {/* Profile dropdown - Desktop */}
              <div className="hidden md:flex items-center gap-3">
                <span className="text-sm">
                  {t('dashboard.welcome')}, {customer?.firstName}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors text-sm"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  <span>{t('header.logout')}</span>
                </button>
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 hover:bg-white/10 rounded-lg"
              >
                {isMobileMenuOpen ? (
                  <XMarkIcon className="w-6 h-6" />
                ) : (
                  <Bars3Icon className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/10">
            <div className="px-4 py-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-secondary-400 text-brand-dark font-medium'
                        : 'hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <div className="border-t border-white/10 pt-3 mt-3">
                <div className="flex items-center gap-3 px-4 py-2">
                  <UserCircleIcon className="w-5 h-5" />
                  <span>{customer?.firstName} {customer?.lastName}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 w-full text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  <span>{t('header.logout')}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Fluff N' Woof. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default CustomerLayout;
