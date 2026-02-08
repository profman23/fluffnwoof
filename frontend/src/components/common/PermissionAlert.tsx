import React from 'react';
import { useTranslation } from 'react-i18next';
import { LockClosedIcon, EyeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

type AlertType = 'noAccess' | 'readOnly' | 'error';

interface PermissionAlertProps {
  type: AlertType;
  /** Custom message override (skips i18n lookup) */
  message?: string;
  /** Compact mode for tight layouts */
  compact?: boolean;
}

const alertConfig: Record<AlertType, {
  icon: React.ElementType;
  bgClass: string;
  textClass: string;
  borderClass: string;
  iconClass: string;
  translationKey: string;
}> = {
  noAccess: {
    icon: LockClosedIcon,
    bgClass: 'bg-red-50 dark:bg-red-900/20',
    textClass: 'text-red-700 dark:text-red-300',
    borderClass: 'border-red-200 dark:border-red-800',
    iconClass: 'text-red-500 dark:text-red-400',
    translationKey: 'permission.noAccess',
  },
  readOnly: {
    icon: EyeIcon,
    bgClass: 'bg-amber-50 dark:bg-amber-900/20',
    textClass: 'text-amber-700 dark:text-amber-300',
    borderClass: 'border-amber-200 dark:border-amber-800',
    iconClass: 'text-amber-500 dark:text-amber-400',
    translationKey: 'permission.readOnly',
  },
  error: {
    icon: ExclamationTriangleIcon,
    bgClass: 'bg-red-50 dark:bg-red-900/20',
    textClass: 'text-red-700 dark:text-red-300',
    borderClass: 'border-red-200 dark:border-red-800',
    iconClass: 'text-red-500 dark:text-red-400',
    translationKey: 'permission.error',
  },
};

/**
 * Unified permission/error alert component for modals and inline messages.
 * Supports noAccess, readOnly, and error states with i18n.
 */
export const PermissionAlert: React.FC<PermissionAlertProps> = ({
  type,
  message,
  compact = false,
}) => {
  const { t } = useTranslation('common');
  const config = alertConfig[type];
  const Icon = config.icon;
  const displayMessage = message || t(config.translationKey);

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 px-2 py-1 rounded ${config.bgClass} ${config.textClass}`}>
        <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${config.iconClass}`} />
        <span className="text-xs">{displayMessage}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${config.bgClass} ${config.borderClass}`}>
      <Icon className={`w-5 h-5 flex-shrink-0 ${config.iconClass}`} />
      <span className={`text-sm ${config.textClass}`}>{displayMessage}</span>
    </div>
  );
};
