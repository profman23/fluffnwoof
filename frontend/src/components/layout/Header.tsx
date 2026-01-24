import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { Link, useNavigate } from 'react-router-dom';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { ChevronDownIcon, UserCircleIcon, ArrowLeftStartOnRectangleIcon } from '@heroicons/react/24/outline';

// TypeScript declaration for Lord Icon custom element
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

interface HeaderProps {
  onMenuClick: () => void;
}

// Helper function to check if color is yellow/gold
const isYellowish = (color: string): boolean => {
  // Convert to lowercase for comparison
  const lowerColor = color.toLowerCase();

  // Check for common yellow/gold colors
  if (lowerColor.includes('f5df59') || lowerColor.includes('gold') || lowerColor.includes('yellow')) {
    return true;
  }

  // Parse hex color and check if it's yellowish
  const hex = lowerColor.replace('#', '');
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Yellow has high R, high G, low B
    if (r > 200 && g > 180 && b < 150) {
      return true;
    }
  }

  return false;
};

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { t } = useTranslation('header');
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const headerRef = useRef<HTMLElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [iconColors, setIconColors] = useState('primary:#242424,secondary:#f5df59');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Update icon colors based on header background
  useEffect(() => {
    const updateIconColors = () => {
      const headerBgColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--header-bg-color')
        .trim();

      if (isYellowish(headerBgColor)) {
        // If header is yellow/gold, use mint green for icon
        setIconColors('primary:#242424,secondary:#CEE8DC');
      } else {
        // Default: dark and gold
        setIconColors('primary:#242424,secondary:#f5df59');
      }
    };

    // Initial check
    updateIconColors();

    // Create observer to watch for CSS variable changes
    const observer = new MutationObserver(updateIconColors);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <header
      ref={headerRef}
      className="shadow-sm px-4 md:px-6 py-3 md:py-4 flex justify-between items-center sticky top-0 z-10 border-b border-primary-300"
      style={{ backgroundColor: 'var(--header-bg-color)' }}
    >
      {/* Mobile menu button and quick links */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md hover:bg-primary-100 transition-colors"
          aria-label="Open menu"
        >
          <svg
            className="w-6 h-6 text-brand-dark"
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
            className="flex items-center gap-2 px-4 py-1.5 text-base font-normal text-brand-dark hover:text-primary-700 hover:bg-primary-200 rounded-lg transition-colors"
          >
            <span className="text-xl w-6 text-center">🐾</span>
            <span>{t('patients')}</span>
          </Link>
          <Link
            to="/flow-board"
            className="flex items-center gap-2 px-4 py-1.5 text-base font-normal text-brand-dark hover:text-primary-700 hover:bg-primary-200 rounded-lg transition-colors"
          >
            <span className="text-xl w-6 text-center">📋</span>
            <span>{t('flowBoard')}</span>
          </Link>
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
        <LanguageSwitcher />

        {/* User info with avatar and Lord Icon - hidden on mobile */}
        <div className="hidden md:flex items-center gap-3">
          {/* Lord Icon - Paw with loop trigger */}
          <lord-icon
            src="https://cdn.lordicon.com/zoxiseye.json"
            trigger="loop"
            delay="1000"
            colors={iconColors}
            style={{ width: '40px', height: '40px' }}
          />

          {/* User name only (no email) */}
          <span className="font-medium text-sm lg:text-base text-brand-dark">
            {user?.firstName} {user?.lastName}
          </span>

          {/* User avatar with dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1 hover:opacity-80 transition-opacity focus:outline-none"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={`${user?.firstName} ${user?.lastName}`}
                  className="rounded-full object-cover border-2 border-primary-300"
                  style={{ width: '50px', height: '50px' }}
                />
              ) : (
                <div
                  className="rounded-full bg-primary-200 flex items-center justify-center border-2 border-primary-300"
                  style={{ width: '50px', height: '50px' }}
                >
                  <span className="text-base font-medium text-brand-dark">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </span>
                </div>
              )}
              <ChevronDownIcon
                className={`w-4 h-4 text-brand-dark transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute end-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <Link
                  to="/profile"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 transition-colors"
                >
                  <UserCircleIcon className="w-5 h-5" />
                  {t('myProfile')}
                </Link>
                <hr className="my-1 border-gray-200" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <ArrowLeftStartOnRectangleIcon className="w-5 h-5" />
                  {t('logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
