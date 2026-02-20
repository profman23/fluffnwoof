import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useScreenPermission } from '../../hooks/useScreenPermission';
import { useAuthStore } from '../../store/authStore';
import { useSidebarStore } from '../../store/sidebarStore';
import { useDarkMode } from '../../context/DarkModeContext';
import { PawToggle } from './PawToggle';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  path?: string;
  key: string;
  icon: string;
  screen: string;
  children?: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation('sidebar');
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { isCollapsed } = useSidebarStore();
  const { isDark } = useDarkMode();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const allMenuItems: MenuItem[] = [
    { path: '/dashboard', key: 'dashboard', icon: '📊', screen: 'dashboard' },
    { path: '/patients', key: 'patients', icon: '🐾', screen: 'patients' },
    { path: '/flow-board', key: 'flowBoard', icon: '📋', screen: 'flowBoard' },
    { path: '/boarding', key: 'boardingManagement', icon: '🏠', screen: 'boardingManagement' },
    { path: '/medical', key: 'medical', icon: '🏥', screen: 'medical' },
    { path: '/users', key: 'userManagement', icon: '👤', screen: 'userManagement' },
    { path: '/roles', key: 'rolesPermissions', icon: '🔐', screen: 'rolesPermissions' },
    { path: '/service-products', key: 'serviceProducts', icon: '💼', screen: 'serviceProducts' },
    {
      key: 'reports',
      icon: '📈',
      screen: 'reports',
      children: [
        { path: '/reports/appointments', key: 'upcoming', icon: '📅', screen: 'reports' },
      ],
    },
    {
      key: 'crm',
      icon: '📱',
      screen: 'crm',
      children: [
        { path: '/crm/sms', key: 'sms', icon: '💬', screen: 'sms' },
        { path: '/crm/reminders', key: 'reminders', icon: '⏰', screen: 'reminders' },
      ],
    },
    {
      key: 'clinicSetup',
      icon: '⚙️',
      screen: 'clinicSetup',
      children: [
        { path: '/clinic-setup/shifts', key: 'shiftsManagement', icon: '🕐', screen: 'shiftsManagement' },
        { path: '/clinic-setup/visit-types', key: 'visitTypes', icon: '📋', screen: 'visitTypes' },
        { path: '/clinic-setup/forms', key: 'formsAndCertificates', icon: '📝', screen: 'formsAndCertificates' },
        { path: '/clinic-setup/boarding', key: 'boardingAndIcu', icon: '🏥', screen: 'boardingAndIcu' },
      ],
    },
    {
      key: 'importData',
      icon: '📥',
      screen: 'importData',
      children: [
        { path: '/import/clients-pets', key: 'importClients', icon: '👥', screen: 'importClients' },
      ],
    },
  ];

  const toggleSubmenu = (key: string) => {
    setExpandedMenus(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  // Tooltip component for collapsed mode
  const Tooltip = ({ children, label, show }: { children: React.ReactNode; label: string; show: boolean }) => (
    <div className="relative group">
      {children}
      {show && isCollapsed && (
        <div className="absolute start-full top-1/2 -translate-y-1/2 ms-2 z-50 pointer-events-none">
          <div className="bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {label}
            <div className="absolute end-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-e-[6px] border-e-gray-900" />
          </div>
        </div>
      )}
    </div>
  );

  // Menu item component for simple items
  const MenuItemComponent = ({ item }: { item: MenuItem }) => {
    const { canAccess } = useScreenPermission(item.screen);
    const isActive = item.path && location.pathname === item.path;
    const isHovered = hoveredItem === item.key;

    if (!canAccess) return null;

    // If item has children, render as expandable
    if (item.children) {
      const isExpanded = expandedMenus.includes(item.key);
      const hasActiveChild = item.children.some(child => child.path === location.pathname);

      return (
        <Tooltip label={t(`menu.${item.key}`)} show={isCollapsed}>
          <div
            onMouseEnter={() => setHoveredItem(item.key)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <button
              onClick={() => toggleSubmenu(item.key)}
              className={`
                sidebar-menu-item w-full flex items-center px-4 py-1.5 text-brand-dark dark:text-gray-100 hover:text-primary-700 dark:hover:text-primary-300 transition-all duration-200
                ${hasActiveChild ? 'bg-primary-200 text-primary-700' : ''}
                ${isCollapsed ? 'justify-center' : 'justify-between'}
              `}
            >
              <div className={`flex items-center ${isCollapsed ? '' : 'gap-2'}`}>
                <span className={`text-xl transition-transform duration-200 ${isHovered ? 'scale-110' : ''} ${isCollapsed ? '' : 'w-6 text-center'}`}>
                  {item.icon}
                </span>
                {!isCollapsed && (
                  <span className="font-normal text-base">
                    {t(`menu.${item.key}`)}
                  </span>
                )}
              </div>
              {!isCollapsed && (
                <ChevronDownIcon
                  className={`
                    w-4 h-4 text-primary-600
                    transition-transform duration-300 ease-out
                    ${isExpanded ? 'rotate-180' : 'rotate-0'}
                  `}
                />
              )}
            </button>

            {/* Submenu - animated expand/collapse */}
            {!isCollapsed && (
              <div
                className={`
                  overflow-hidden transition-all duration-300 ease-out
                  ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
                `}
              >
                <div className="bg-primary-50/50 py-1">
                  {item.children.map(child => (
                    <ChildMenuItemComponent key={child.path} item={child} onClose={onClose} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </Tooltip>
      );
    }

    // Simple link item
    return (
      <Tooltip label={t(`menu.${item.key}`)} show={isCollapsed}>
        <Link
          to={item.path!}
          onClick={onClose}
          onMouseEnter={() => setHoveredItem(item.key)}
          onMouseLeave={() => setHoveredItem(null)}
          className={`
            sidebar-menu-item flex items-center px-4 py-1.5 text-brand-dark dark:text-gray-100 hover:text-primary-700 dark:hover:text-primary-300 transition-all duration-200
            ${isActive ? 'bg-secondary-300 dark:bg-gray-700 text-brand-dark dark:text-gray-100 border-e-4 border-secondary-400 dark:border-gray-500' : ''}
            ${isCollapsed ? 'justify-center' : 'gap-2'}
          `}
        >
          <span className={`text-xl transition-transform duration-200 ${isHovered ? 'scale-110' : ''} ${isCollapsed ? '' : 'w-6 text-center'}`}>
            {item.icon}
          </span>
          {!isCollapsed && (
            <span className="font-normal text-base">
              {t(`menu.${item.key}`)}
            </span>
          )}
        </Link>
      </Tooltip>
    );
  };

  // Child menu item component
  const ChildMenuItemComponent = ({ item, onClose }: { item: MenuItem; onClose: () => void }) => {
    const { canAccess } = useScreenPermission(item.screen);
    const isActive = item.path && location.pathname === item.path;

    if (!canAccess) return null;

    return (
      <Link
        to={item.path!}
        onClick={onClose}
        className={`sidebar-menu-item flex items-center gap-2 ps-10 pe-4 py-1 text-brand-dark dark:text-gray-100 hover:text-primary-700 dark:hover:text-primary-300 transition-colors ${
          isActive ? 'bg-secondary-300 dark:bg-gray-700 text-brand-dark dark:text-gray-100 border-e-4 border-secondary-400 dark:border-gray-500' : ''
        }`}
      >
        <span className="text-lg w-5 text-center">{item.icon}</span>
        <span className="font-normal text-sm">{t(`menu.${item.key}`)}</span>
      </Link>
    );
  };

  // Logout button component
  const LogoutButton = () => (
    <Tooltip label={t('menu.logout')} show={isCollapsed}>
      <div className="p-3 border-t border-primary-300 dark:border-gray-700">
        <button
          onClick={handleLogout}
          className={`
            w-full flex items-center px-4 py-1.5 text-brand-dark dark:text-gray-100 hover:bg-primary-200 dark:hover:bg-gray-700 rounded-lg transition-colors
            ${isCollapsed ? 'justify-center' : 'gap-2'}
          `}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!isCollapsed && (
            <span className="font-normal text-base">
              {t('menu.logout')}
            </span>
          )}
        </button>
      </div>
    </Tooltip>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden lg:flex lg:flex-col flex-shrink-0 shadow-lg dark:shadow-2xl h-screen sticky top-0
          transition-all duration-300 ease-in-out overflow-hidden
          ${isCollapsed ? 'w-[72px]' : 'w-56'}
        `}
        style={{ backgroundColor: isDark ? 'var(--sidebar-bg-color-dark)' : 'var(--sidebar-bg-color)' }}
      >
        {/* Logo */}
        <div className={`p-4 pt-6 flex flex-col items-center ${isCollapsed ? 'px-2' : ''}`}>
          <img
            src="/logo.png"
            alt="Fluff N' Woof"
            className={`transition-all duration-300 ${isCollapsed ? 'h-12 w-auto' : 'h-20 w-auto'}`}
          />
        </div>

        {/* Navigation */}
        <nav className="mt-4 flex-1 overflow-y-auto overflow-x-hidden sidebar-scrollbar">
          {allMenuItems.map((item) => (
            <MenuItemComponent key={item.key} item={item} />
          ))}
        </nav>

        {/* Toggle Button */}
        <div className="py-3 flex justify-center border-t border-primary-200 dark:border-gray-700">
          <PawToggle />
        </div>

        {/* Footer with Logout button */}
        <LogoutButton />
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 start-0 lg:hidden z-30 w-52 sm:w-56 shadow-lg dark:shadow-2xl h-full flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0 rtl:-translate-x-0' : '-translate-x-full rtl:translate-x-full'
        }`}
        style={{ backgroundColor: isDark ? 'var(--sidebar-bg-color-dark)' : 'var(--sidebar-bg-color)' }}
      >
        {/* Logo & Close button */}
        <div className="p-3 pt-4 flex items-center justify-between">
          <div className="flex flex-col items-center flex-1">
            <img src="/logo.png" alt="Fluff N' Woof" className="h-16 w-auto" />
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-4 flex-1 overflow-y-auto pb-4 sidebar-scrollbar">
          {allMenuItems.map((item) => (
            <MenuItemComponent key={item.key} item={item} />
          ))}
        </nav>

        {/* Footer with Logout button */}
        <LogoutButton />
      </aside>
    </>
  );
};
