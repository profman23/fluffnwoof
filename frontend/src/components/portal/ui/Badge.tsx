/**
 * Portal Badge Component
 * Status badges with color variants
 */

import React from 'react';
import { motion } from 'framer-motion';
import { scaleInBounce } from '../../../styles/portal/animations';

// ============================================
// TYPES
// ============================================

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  // Appointment statuses
  | 'scheduled'
  | 'confirmed'
  | 'checkIn'
  | 'inProgress'
  | 'hospitalized'
  | 'completed'
  | 'cancelled';

export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  animated?: boolean;
  children: React.ReactNode;
  className?: string;
}

// ============================================
// STYLES
// ============================================

const baseStyles = `
  inline-flex items-center justify-center
  font-medium rounded-full
  whitespace-nowrap
`;

const variantStyles: Record<BadgeVariant, string> = {
  default: `
    bg-gray-100 text-gray-700
    dark:bg-gray-800 dark:text-gray-300
  `,
  primary: `
    bg-mint-100 text-mint-700
    dark:bg-mint-900/30 dark:text-mint-400
  `,
  secondary: `
    bg-pink-100 text-pink-700
    dark:bg-pink-900/30 dark:text-pink-400
  `,
  success: `
    bg-green-100 text-green-700
    dark:bg-green-900/30 dark:text-green-400
  `,
  warning: `
    bg-gold-100 text-gold-700
    dark:bg-gold-900/30 dark:text-gold-400
  `,
  error: `
    bg-red-100 text-red-700
    dark:bg-red-900/30 dark:text-red-400
  `,
  info: `
    bg-blue-100 text-blue-700
    dark:bg-blue-900/30 dark:text-blue-400
  `,
  // Appointment status badges
  scheduled: `
    bg-mint-100 text-mint-700
    dark:bg-mint-900/30 dark:text-mint-400
  `,
  confirmed: `
    bg-emerald-100 text-emerald-700
    dark:bg-emerald-900/30 dark:text-emerald-400
  `,
  checkIn: `
    bg-blue-100 text-blue-700
    dark:bg-blue-900/30 dark:text-blue-400
  `,
  inProgress: `
    bg-gold-100 text-gold-700
    dark:bg-gold-900/30 dark:text-gold-400
  `,
  hospitalized: `
    bg-purple-100 text-purple-700
    dark:bg-purple-900/30 dark:text-purple-400
  `,
  completed: `
    bg-green-100 text-green-700
    dark:bg-green-900/30 dark:text-green-400
  `,
  cancelled: `
    bg-red-100 text-red-700
    dark:bg-red-900/30 dark:text-red-400
  `,
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

const dotSizeStyles: Record<BadgeSize, string> = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
};

// ============================================
// COMPONENT
// ============================================

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  dot = false,
  animated = false,
  children,
  className = '',
}) => {
  const Component = animated ? motion.span : 'span';
  const motionProps = animated
    ? {
        initial: scaleInBounce.initial,
        animate: scaleInBounce.animate,
      }
    : {};

  return (
    <Component
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `.replace(/\s+/g, ' ').trim()}
      {...motionProps}
    >
      {dot && (
        <span
          className={`
            ${dotSizeStyles[size]}
            rounded-full bg-current opacity-60
            me-1.5
          `}
        />
      )}
      {children}
    </Component>
  );
};

// ============================================
// STATUS BADGE (Preset for appointment statuses)
// ============================================

const statusVariantMap: Record<string, BadgeVariant> = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  CHECK_IN: 'checkIn',
  IN_PROGRESS: 'inProgress',
  HOSPITALIZED: 'hospitalized',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export interface StatusBadgeProps {
  status: string;
  size?: BadgeSize;
  className?: string;
  children: React.ReactNode;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className = '',
  children,
}) => {
  const variant = statusVariantMap[status] || 'default';

  return (
    <Badge variant={variant} size={size} dot className={className}>
      {children}
    </Badge>
  );
};

// ============================================
// NOTIFICATION BADGE (For counts)
// ============================================

export interface NotificationBadgeProps {
  count: number;
  max?: number;
  show?: boolean;
  className?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  max = 99,
  show = true,
  className = '',
}) => {
  if (!show || count <= 0) return null;

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`
        absolute -top-1 -end-1
        min-w-[18px] h-[18px]
        flex items-center justify-center
        px-1 text-xs font-bold
        bg-red-500 text-white
        rounded-full
        ${className}
      `}
    >
      {displayCount}
    </motion.span>
  );
};

export default Badge;
