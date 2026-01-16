import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { LanguageSwitcher } from '../common/LanguageSwitcher';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { t } = useTranslation('header');
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm px-4 md:px-6 py-3 md:py-4 flex justify-between items-center sticky top-0 z-10 border-b border-gray-100">
      {/* Mobile menu button and quick links */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Open menu"
        >
          <svg
            className="w-6 h-6 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Quick Links */}
        <div className="hidden sm:flex items-center gap-2">
          <Link
            to="/patients"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <span>🐾</span>
            <span>{t('patients')}</span>
          </Link>
          <Link
            to="/flow-board"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <span>📋</span>
            <span>{t('flowBoard')}</span>
          </Link>
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
        <LanguageSwitcher />

        {/* User info - hidden on mobile */}
        <div className="hidden md:block text-right">
          <p className="font-medium text-sm lg:text-base text-gray-800">{user?.firstName} {user?.lastName}</p>
          <p className="text-xs lg:text-sm text-gray-500">{user?.email}</p>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="btn btn-secondary text-sm md:text-base px-3 py-2 md:px-4 md:py-2"
        >
          <span className="hidden sm:inline">{t('logout')}</span>
          <span className="sm:hidden">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </span>
        </button>
      </div>
    </header>
  );
};
