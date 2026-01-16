import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { useScreenPermission } from '../../hooks/useScreenPermission';

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
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['reports']);

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
            className={`w-full flex items-center justify-between px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors ${
              hasActiveChild ? 'bg-primary-50 text-primary-600' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium text-sm">{t(`menu.${item.key}`)}</span>
            </div>
            {isExpanded ? (
              <ChevronUpIcon className="w-3.5 h-3.5" />
            ) : (
              <ChevronDownIcon className="w-3.5 h-3.5" />
            )}
          </button>

          {isExpanded && (
            <div className="bg-gray-50">
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
        className={`flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors ${
          isActive ? 'bg-primary-100 text-primary-600 border-r-4 border-primary-600' : ''
        }`}
      >
        <span className="text-lg">{item.icon}</span>
        <span className="font-medium text-sm">{t(`menu.${item.key}`)}</span>
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
        className={`flex items-center gap-2 ps-10 pe-4 py-1.5 text-gray-600 hover:bg-primary-50 hover:text-primary-600 transition-colors ${
          isActive ? 'bg-primary-100 text-primary-600 border-r-4 border-primary-600' : ''
        }`}
      >
        <span className="text-base">{item.icon}</span>
        <span className="font-medium text-xs">{t(`menu.${item.key}`)}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-56 flex-shrink-0 bg-white shadow-lg h-screen sticky top-0">
        <div className="p-2 pt-1 flex flex-col items-center">
          <img src="/logo.png" alt="Fluff N' Woof" className="h-12 w-auto" />
        </div>

        <nav className="mt-1 flex-1 overflow-y-auto">
          {allMenuItems.map((item) => (
            <MenuItemComponent key={item.key} item={item} />
          ))}
        </nav>
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 left-0 lg:hidden z-30 w-52 sm:w-56 bg-white shadow-lg h-full transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-2 flex items-center justify-between">
          <div className="flex flex-col items-center flex-1">
            <img src="/logo.png" alt="Fluff N' Woof" className="h-10 w-auto" />
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        <nav className="mt-1 flex-1 overflow-y-auto pb-4">
          {allMenuItems.map((item) => (
            <MenuItemComponent key={item.key} item={item} />
          ))}
        </nav>
      </aside>
    </>
  );
};
