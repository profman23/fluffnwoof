import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { useScreenPermission } from '../../hooks/useScreenPermission';
import { useAuthStore } from '../../store/authStore';

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
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const allMenuItems: MenuItem[] = [
    { path: '/dashboard', key: 'dashboard', icon: '📊', screen: 'dashboard' },
    { path: '/patients', key: 'patients', icon: '🐾', screen: 'patients' },
    { path: '/flow-board', key: 'flowBoard', icon: '📋', screen: 'flowBoard' },
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
    { path: '/sms', key: 'sms', icon: '📱', screen: 'sms' },
  ];

  const toggleSubmenu = (key: string) => {
    setExpandedMenus(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  // Menu item component for simple items
  const MenuItemComponent = ({ item }: { item: MenuItem }) => {
    const { canAccess } = useScreenPermission(item.screen);
    const isActive = item.path && location.pathname === item.path;

    if (!canAccess) return null;

    // If item has children, render as expandable
    if (item.children) {
      const isExpanded = expandedMenus.includes(item.key);
      const hasActiveChild = item.children.some(child => child.path === location.pathname);

      return (
        <div>
          <button
            onClick={() => toggleSubmenu(item.key)}
            className={`sidebar-menu-item w-full flex items-center justify-between px-4 py-1.5 text-brand-dark hover:text-primary-700 transition-colors ${
              hasActiveChild ? 'bg-primary-200 text-primary-700' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl w-6 text-center">{item.icon}</span>
              <span className="font-normal text-base">{t(`menu.${item.key}`)}</span>
            </div>
            {isExpanded ? (
              <ChevronUpIcon className="w-3.5 h-3.5" />
            ) : (
              <ChevronDownIcon className="w-3.5 h-3.5" />
            )}
          </button>

          {isExpanded && (
            <div className="bg-primary-50">
              {item.children.map(child => (
                <ChildMenuItemComponent key={child.path} item={child} onClose={onClose} />
              ))}
            </div>
          )}
        </div>
      );
    }

    // Simple link item
    return (
      <Link
        to={item.path!}
        onClick={onClose}
        className={`sidebar-menu-item flex items-center gap-2 px-4 py-1.5 text-brand-dark hover:text-primary-700 transition-colors ${
          isActive ? 'bg-secondary-300 text-brand-dark border-r-4 border-secondary-400' : ''
        }`}
      >
        <span className="text-xl w-6 text-center">{item.icon}</span>
        <span className="font-normal text-base">{t(`menu.${item.key}`)}</span>
      </Link>
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
        className={`sidebar-menu-item flex items-center gap-2 ps-10 pe-4 py-1 text-brand-dark hover:text-primary-700 transition-colors ${
          isActive ? 'bg-secondary-300 text-brand-dark border-r-4 border-secondary-400' : ''
        }`}
      >
        <span className="text-lg w-5 text-center">{item.icon}</span>
        <span className="font-normal text-sm">{t(`menu.${item.key}`)}</span>
      </Link>
    );
  };

  // Logout button component
  const LogoutButton = () => (
    <div className="p-3 border-t border-primary-300">
      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-2 px-4 py-1.5 text-brand-dark hover:bg-primary-200 rounded-lg transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span className="font-normal text-base">{t('menu.logout')}</span>
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex lg:flex-col w-56 flex-shrink-0 shadow-lg h-screen sticky top-0"
        style={{ backgroundColor: 'var(--sidebar-bg-color)' }}
      >
        {/* Logo */}
        <div className="p-4 pt-6 flex flex-col items-center">
          <img src="/logo.png" alt="Fluff N' Woof" className="h-20 w-auto" />
        </div>

        {/* Navigation - flex-1 to push footer down */}
        <nav className="mt-4 flex-1 overflow-y-auto">
          {allMenuItems.map((item) => (
            <MenuItemComponent key={item.key} item={item} />
          ))}
        </nav>

        {/* Footer with Logout button */}
        <LogoutButton />
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 left-0 lg:hidden z-30 w-52 sm:w-56 shadow-lg h-full flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ backgroundColor: 'var(--sidebar-bg-color)' }}
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
        <nav className="mt-4 flex-1 overflow-y-auto pb-4">
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
