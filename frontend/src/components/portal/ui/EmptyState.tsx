/**
 * Portal Empty State Component
 * Displays when lists or pages have no content
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { fadeInUpSimple } from '../../../styles/portal/animations';
import { Button } from './Button';

// ============================================
// ICONS
// ============================================

const icons = {
  pets: (
    <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="28" className="fill-mint-100 dark:fill-mint-900/30" />
      <path
        d="M20 28c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4zm24 0c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4zm-20 8c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3zm16 0c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3zm-8 12c-4.4 0-8-3.6-8-8h16c0 4.4-3.6 8-8 8z"
        className="fill-mint-500"
      />
    </svg>
  ),
  appointments: (
    <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="28" className="fill-pink-100 dark:fill-pink-900/30" />
      <rect x="18" y="20" width="28" height="28" rx="4" className="fill-pink-200 dark:fill-pink-800" />
      <rect x="22" y="16" width="4" height="8" rx="2" className="fill-pink-400" />
      <rect x="38" y="16" width="4" height="8" rx="2" className="fill-pink-400" />
      <path d="M18 30h28" className="stroke-pink-400" strokeWidth="2" />
      <circle cx="32" cy="38" r="4" className="fill-pink-500" />
    </svg>
  ),
  notifications: (
    <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="28" className="fill-amber-100 dark:fill-amber-900/30" />
      <path
        d="M32 16c-6.6 0-12 5.4-12 12v8l-4 4v2h32v-2l-4-4v-8c0-6.6-5.4-12-12-12z"
        className="fill-amber-400"
      />
      <circle cx="32" cy="48" r="4" className="fill-amber-500" />
    </svg>
  ),
  search: (
    <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="28" className="fill-gray-100 dark:fill-gray-800" />
      <circle cx="28" cy="28" r="12" className="stroke-gray-400" strokeWidth="4" fill="none" />
      <path d="M38 38l10 10" className="stroke-gray-400" strokeWidth="4" strokeLinecap="round" />
    </svg>
  ),
  error: (
    <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="28" className="fill-red-100 dark:fill-red-900/30" />
      <path
        d="M32 20v16m0 8v.01"
        className="stroke-red-500"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  ),
  success: (
    <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="28" className="fill-green-100 dark:fill-green-900/30" />
      <path
        d="M22 32l8 8 14-16"
        className="stroke-green-500"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

// ============================================
// TYPES
// ============================================

export interface EmptyStateProps {
  icon?: keyof typeof icons | React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  animated?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'search',
  title,
  description,
  action,
  secondaryAction,
  className = '',
  animated = true,
}) => {
  const iconElement = typeof icon === 'string' ? icons[icon as keyof typeof icons] : icon;

  const Wrapper = animated ? motion.div : 'div';
  const wrapperProps = animated
    ? {
        initial: fadeInUpSimple.initial,
        animate: fadeInUpSimple.animate,
        transition: fadeInUpSimple.transition,
      }
    : {};

  return (
    <Wrapper
      className={`
        flex flex-col items-center justify-center
        text-center
        py-12 px-6
        ${className}
      `.replace(/\s+/g, ' ').trim()}
      {...wrapperProps}
    >
      {/* Icon */}
      <div className="mb-4">{iconElement}</div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-6">
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {action && (
            <Button
              variant={action.variant || 'primary'}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </Wrapper>
  );
};

// ============================================
// PRESET EMPTY STATES (WITH TRANSLATIONS)
// ============================================

export const NoPetsEmptyState: React.FC<{ onAdd?: () => void }> = ({ onAdd }) => {
  const { t } = useTranslation('portal');
  return (
    <EmptyState
      icon="pets"
      title={t('emptyState.noPets.title', 'No Pets')}
      description={t('emptyState.noPets.description', 'Add your first pet to start booking')}
      action={onAdd ? { label: t('emptyState.noPets.action', 'Add Pet'), onClick: onAdd } : undefined}
    />
  );
};

export const NoAppointmentsEmptyState: React.FC<{ onBook?: () => void }> = ({ onBook }) => {
  const { t } = useTranslation('portal');
  return (
    <EmptyState
      icon="appointments"
      title={t('emptyState.noAppointments.title', 'No Appointments')}
      description={t('emptyState.noAppointments.description', 'No appointments have been booked yet')}
      action={onBook ? { label: t('emptyState.noAppointments.action', 'Book Appointment'), onClick: onBook } : undefined}
    />
  );
};

export const NoNotificationsEmptyState: React.FC = () => {
  const { t } = useTranslation('portal');
  return (
    <EmptyState
      icon="notifications"
      title={t('emptyState.noNotifications.title', 'No Notifications')}
      description={t('emptyState.noNotifications.description', 'New notifications will appear here')}
    />
  );
};

export const SearchEmptyState: React.FC<{ query?: string }> = ({ query }) => {
  const { t } = useTranslation('portal');
  return (
    <EmptyState
      icon="search"
      title={t('emptyState.noResults.title', 'No Results')}
      description={query
        ? t('emptyState.noResults.descriptionWithQuery', 'No results found for "{{query}}"', { query })
        : t('emptyState.noResults.description', 'Try searching with different keywords')
      }
    />
  );
};

export const ErrorEmptyState: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => {
  const { t } = useTranslation('portal');
  return (
    <EmptyState
      icon="error"
      title={t('emptyState.error.title', 'Error')}
      description={t('emptyState.error.description', 'Could not load data. Please try again.')}
      action={onRetry ? { label: t('emptyState.error.action', 'Try Again'), onClick: onRetry, variant: 'outline' } : undefined}
    />
  );
};

export default EmptyState;
