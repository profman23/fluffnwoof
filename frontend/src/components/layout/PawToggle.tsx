/**
 * Sidebar Toggle Button Component
 * A sleek, minimal toggle button for sidebar collapse/expand
 */

import React from 'react';
import { useSidebarStore } from '../../store/sidebarStore';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

interface SidebarToggleProps {
  className?: string;
}

export const PawToggle: React.FC<SidebarToggleProps> = ({ className = '' }) => {
  const { isCollapsed, toggleCollapse, isAnimating } = useSidebarStore();
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  // Determine which chevron to show based on RTL and collapsed state
  const showLeftChevron = isRtl ? isCollapsed : !isCollapsed;

  return (
    <button
      onClick={toggleCollapse}
      disabled={isAnimating}
      className={`
        group relative
        w-8 h-8
        flex items-center justify-center
        rounded-full
        bg-white
        border-2 border-primary-300
        shadow-md
        hover:shadow-lg hover:border-primary-400
        hover:bg-primary-50
        active:scale-95
        transition-all duration-200 ease-out
        ${isAnimating ? 'opacity-70' : ''}
        ${className}
      `}
      aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      title={isCollapsed ? 'توسيع القائمة' : 'طي القائمة'}
    >
      {/* Chevron Icon */}
      {showLeftChevron ? (
        <ChevronLeftIcon className="w-4 h-4 text-primary-600 group-hover:text-primary-700 transition-colors" />
      ) : (
        <ChevronRightIcon className="w-4 h-4 text-primary-600 group-hover:text-primary-700 transition-colors" />
      )}
    </button>
  );
};

export default PawToggle;
