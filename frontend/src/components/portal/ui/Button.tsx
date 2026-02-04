/**
 * Portal Button Component
 * Modern, animated button with multiple variants
 */

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { buttonTap } from '../../../styles/portal/animations';

// ============================================
// TYPES
// ============================================

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

// ============================================
// STYLES
// ============================================

const baseStyles = `
  inline-flex items-center justify-center gap-2
  font-medium rounded-xl
  transition-colors duration-200
  focus:outline-none focus:ring-2 focus:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed
  select-none
`;

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-gold-300 text-gray-800
    hover:bg-gold-400
    focus:ring-gold-300
    dark:bg-gold-400 dark:text-gray-900 dark:hover:bg-gold-300
    shadow-sm shadow-gold-300/30
  `,
  secondary: `
    bg-pink-300 text-gray-800
    hover:bg-pink-400
    focus:ring-pink-300
    dark:bg-pink-400 dark:text-gray-900 dark:hover:bg-pink-300
  `,
  ghost: `
    bg-transparent text-mint-700
    hover:bg-mint-100
    focus:ring-mint-300
    dark:text-mint-300 dark:hover:bg-mint-900/30
  `,
  outline: `
    bg-transparent text-mint-700 border-2 border-mint-300
    hover:bg-mint-100
    focus:ring-mint-300
    dark:text-mint-300 dark:border-mint-400 dark:hover:bg-mint-900/30
  `,
  danger: `
    bg-red-500 text-white
    hover:bg-red-600
    focus:ring-red-400
    dark:bg-red-600 dark:hover:bg-red-500
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm min-h-[32px]',
  md: 'px-4 py-2.5 text-base min-h-[44px]',
  lg: 'px-6 py-3 text-lg min-h-[52px]',
  xl: 'px-8 py-4 text-xl min-h-[60px]',
};

// ============================================
// LOADING SPINNER
// ============================================

const LoadingSpinner: React.FC<{ size: ButtonSize }> = ({ size }) => {
  const spinnerSizes: Record<ButtonSize, string> = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7',
  };

  return (
    <svg
      className={`animate-spin ${spinnerSizes[size]}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

// ============================================
// COMPONENT
// ============================================

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <motion.button
        ref={ref}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `.replace(/\s+/g, ' ').trim()}
        disabled={isDisabled}
        whileTap={isDisabled ? undefined : buttonTap}
        {...props}
      >
        {loading ? (
          <LoadingSpinner size={size} />
        ) : leftIcon ? (
          <span className="flex-shrink-0">{leftIcon}</span>
        ) : null}

        <span className={loading ? 'opacity-0' : ''}>{children}</span>

        {!loading && rightIcon && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

// ============================================
// ICON BUTTON VARIANT
// ============================================

export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  icon: React.ReactNode;
  'aria-label': string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, size = 'md', className = '', ...props }, ref) => {
    const iconSizeStyles: Record<ButtonSize, string> = {
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12',
      xl: 'w-14 h-14',
    };

    return (
      <Button
        ref={ref}
        size={size}
        className={`!p-0 ${iconSizeStyles[size]} ${className}`}
        {...props}
      >
        {icon}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';

export default Button;
