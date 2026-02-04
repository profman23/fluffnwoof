import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { Link, useNavigate } from 'react-router-dom';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import {
  ChevronDownIcon,
  UserCircleIcon,
  ArrowLeftStartOnRectangleIcon,
  BellIcon,
  CalendarDaysIcon,
  XCircleIcon,
  CheckIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';
import { notificationsApi, StaffNotification } from '../../api/notifications';
import { useNotificationSound } from '../../hooks/useNotificationSound';
import { useDarkMode } from '../../context/DarkModeContext';

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
  const { t, i18n } = useTranslation('header');
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { playNotificationSound } = useNotificationSound();
  const { isDark, toggleMode } = useDarkMode();
  const headerRef = useRef<HTMLElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const [iconColors, setIconColors] = useState('primary:#242424,secondary:#f5df59');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<StaffNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const isRtl = i18n.language === 'ar';

  // Track previous notification count for sound alerts
  const prevUnreadCountRef = useRef<number>(0);
  const isInitialLoadRef = useRef<boolean>(true);
  const [bellShake, setBellShake] = useState(false);

  // Fetch notifications count
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await notificationsApi.getAll();
      setNotifications(response.data);

      // Check for NEW notifications (count increased since last fetch)
      const newUnreadCount = response.unreadCount;
      const hadNewNotifications = newUnreadCount > prevUnreadCountRef.current;

      // Play sound and animate if:
      // 1. Not the initial page load (avoid sound on refresh)
      // 2. New unread notifications arrived (count increased)
      if (!isInitialLoadRef.current && hadNewNotifications) {
        // Get the pet species from the newest unread notification
        const newestNotification = response.data.find((n) => !n.isRead);
        const petSpecies = newestNotification?.appointment?.pet?.species;
        playNotificationSound(petSpecies);
        // Trigger bell shake animation
        setBellShake(true);
        setTimeout(() => setBellShake(false), 500);
      }

      // Update refs and state
      prevUnreadCountRef.current = newUnreadCount;
      isInitialLoadRef.current = false;
      setUnreadCount(newUnreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [playNotificationSound]);

  // Poll for notifications every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Handle mark as read
  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Handle approve booking
  const handleApprove = async (id: string) => {
    try {
      await notificationsApi.approveBooking(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: 'APPROVED', isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error approving booking:', error);
    }
  };

  // Handle reject booking
  const handleReject = async (id: string, reason?: string) => {
    try {
      await notificationsApi.rejectBooking(id, reason);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: 'REJECTED', isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error rejecting booking:', error);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
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
      className="shadow-sm px-4 md:px-6 py-3 md:py-4 flex justify-between items-center sticky top-0 z-10 border-b border-primary-300 dark:border-gray-700 transition-colors"
      style={{ backgroundColor: isDark ? 'var(--header-bg-color-dark)' : 'var(--header-bg-color)' }}
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
            className="w-6 h-6 text-brand-dark dark:text-[var(--app-text-primary)]"
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
            className="flex items-center gap-2 px-4 py-1.5 text-base font-normal text-brand-dark dark:text-[var(--app-text-primary)] hover:text-primary-700 dark:hover:text-primary-400 hover:bg-primary-200 dark:hover:bg-[var(--app-bg-elevated)] rounded-lg transition-colors"
          >
            <span className="text-xl w-6 text-center">🐾</span>
            <span>{t('patients')}</span>
          </Link>
          <Link
            to="/flow-board"
            className="flex items-center gap-2 px-4 py-1.5 text-base font-normal text-brand-dark dark:text-[var(--app-text-primary)] hover:text-primary-700 dark:hover:text-primary-400 hover:bg-primary-200 dark:hover:bg-[var(--app-bg-elevated)] rounded-lg transition-colors"
          >
            <span className="text-xl w-6 text-center">📋</span>
            <span>{t('flowBoard')}</span>
          </Link>
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
        <LanguageSwitcher />

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleMode}
          className="p-2 rounded-lg hover:bg-primary-100 dark:hover:bg-gray-700 transition-colors"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? (
            <SunIcon className="w-5 h-5 text-yellow-400" />
          ) : (
            <MoonIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          )}
        </button>

        {/* Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-lg hover:bg-primary-100 transition-colors"
          >
            <BellIcon
              className={`w-6 h-6 text-brand-dark dark:text-gray-200 transition-transform ${
                bellShake ? 'animate-shake' : ''
              }`}
            />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -end-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {isNotifOpen && (
            <div className="absolute end-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-[70vh] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('notifications')}</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-brand-dark dark:text-primary-400 hover:underline flex items-center gap-1"
                  >
                    <CheckIcon className="w-3 h-3" />
                    {t('markAllRead')}
                  </button>
                )}
              </div>
              <div className="max-h-[50vh] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                    <BellIcon className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                    <p>{t('noNotifications')}</p>
                  </div>
                ) : (
                  notifications.slice(0, 10).map((notif) => (
                    <div
                      key={notif.id}
                      className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        !notif.isRead ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${
                          notif.type === 'CUSTOMER_BOOKING'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {notif.type === 'CUSTOMER_BOOKING' ? (
                            <CalendarDaysIcon className="w-4 h-4" />
                          ) : (
                            <XCircleIcon className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {notif.type === 'CUSTOMER_BOOKING'
                                ? (isRtl ? 'حجز عميل جديد' : 'New Customer Booking')
                                : (isRtl ? 'إلغاء حجز عميل' : 'Customer Cancellation')}
                            </p>
                            {/* Status badge */}
                            {notif.status === 'APPROVED' && (
                              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                                {isRtl ? 'تم القبول' : 'Approved'}
                              </span>
                            )}
                            {notif.status === 'REJECTED' && (
                              <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                                {isRtl ? 'مرفوض' : 'Rejected'}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                            {notif.appointment.pet.name} - {notif.appointment.pet.owner?.firstName} {notif.appointment.pet.owner?.lastName}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notif.appointment.appointmentDate).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')} • {notif.appointment.appointmentTime}
                          </p>

                          {/* Approve/Reject buttons for PENDING notifications */}
                          {notif.type === 'CUSTOMER_BOOKING' && notif.status === 'PENDING' && (
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApprove(notif.id);
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors"
                              >
                                <CheckIcon className="w-3.5 h-3.5" />
                                {isRtl ? 'قبول' : 'Approve'}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReject(notif.id);
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
                              >
                                <XCircleIcon className="w-3.5 h-3.5" />
                                {isRtl ? 'رفض' : 'Reject'}
                              </button>
                            </div>
                          )}
                        </div>
                        {!notif.isRead && !notif.status && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notif.id);
                            }}
                            className="p-1 text-gray-400 hover:text-brand-dark dark:hover:text-gray-200"
                            title={isRtl ? 'تحديد كمقروء' : 'Mark as read'}
                          >
                            <CheckIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

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
          <span className="font-medium text-sm lg:text-base text-brand-dark dark:text-[var(--app-text-primary)]">
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
                  className="rounded-full bg-primary-200 dark:bg-primary-800 flex items-center justify-center border-2 border-primary-300 dark:border-primary-600"
                  style={{ width: '50px', height: '50px' }}
                >
                  <span className="text-base font-medium text-brand-dark dark:text-[var(--app-text-primary)]">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </span>
                </div>
              )}
              <ChevronDownIcon
                className={`w-4 h-4 text-brand-dark dark:text-[var(--app-text-primary)] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute end-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                <Link
                  to="/profile"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <UserCircleIcon className="w-5 h-5" />
                  {t('myProfile')}
                </Link>
                <hr className="my-1 border-gray-200 dark:border-gray-700" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
