/**
 * Portal Card Component
 * Versatile card with multiple variants and interactive states
 */

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cardHover, fadeInUpSimple } from '../../../styles/portal/animations';

// ============================================
// TYPES
// ============================================

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'interactive' | 'glass';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';
export type CardRadius = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  variant?: CardVariant;
  padding?: CardPadding;
  radius?: CardRadius;
  animated?: boolean;
  children: React.ReactNode;
}

// ============================================
// STYLES
// ============================================

const baseStyles = 'overflow-hidden transition-all duration-200';

const variantStyles: Record<CardVariant, string> = {
  default: `
    bg-white dark:bg-gray-900
    border border-gray-200 dark:border-gray-800
    shadow-sm
  `,
  elevated: `
    bg-white dark:bg-gray-900
    shadow-lg dark:shadow-none
    border border-gray-100 dark:border-gray-800
  `,
  outlined: `
    bg-transparent
    border-2 border-gray-200 dark:border-gray-700
  `,
  interactive: `
    bg-white dark:bg-gray-900
    border border-gray-200 dark:border-gray-800
    shadow-sm hover:shadow-lg
    cursor-pointer
    active:scale-[0.98]
  `,
  glass: `
    bg-white/80 dark:bg-gray-900/80
    backdrop-blur-lg
    border border-white/20 dark:border-gray-700/50
    shadow-lg
  `,
};

const paddingStyles: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

const radiusStyles: Record<CardRadius, string> = {
  sm: 'rounded-lg',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  xl: 'rounded-3xl',
  '2xl': 'rounded-[2rem]',
};

// ============================================
// COMPONENT
// ============================================

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      radius = 'xl',
      animated = false,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const isInteractive = variant === 'interactive';

    return (
      <motion.div
        ref={ref}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${paddingStyles[padding]}
          ${radiusStyles[radius]}
          ${className}
        `.replace(/\s+/g, ' ').trim()}
        initial={animated ? fadeInUpSimple.initial : undefined}
        animate={animated ? fadeInUpSimple.animate : undefined}
        whileHover={isInteractive ? cardHover : undefined}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

// ============================================
// CARD HEADER
// ============================================

export interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  action,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

// ============================================
// CARD CONTENT
// ============================================

export interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({
  children,
  className = '',
}) => {
  return <div className={`${className}`}>{children}</div>;
};

// ============================================
// CARD FOOTER
// ============================================

export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
  divider?: boolean;
}

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = '',
  divider = false,
}) => {
  return (
    <div
      className={`
        ${divider ? 'border-t border-gray-200 dark:border-gray-800 pt-4 mt-4' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// ============================================
// CARD WITH SECTIONS
// ============================================

export interface CardSectionProps {
  children: React.ReactNode;
  className?: string;
}

export const CardSection: React.FC<CardSectionProps> = ({
  children,
  className = '',
}) => {
  return (
    <div
      className={`
        border-t border-gray-100 dark:border-gray-800
        first:border-t-0
        py-4 first:pt-0 last:pb-0
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;
