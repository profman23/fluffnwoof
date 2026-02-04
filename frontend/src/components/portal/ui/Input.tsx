/**
 * Portal Input Component
 * Modern styled input with label, error states, and icons
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
// Animation import removed - unused

// ============================================
// TYPES
// ============================================

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: InputSize;
  fullWidth?: boolean;
}

// ============================================
// STYLES
// ============================================

const baseInputStyles = `
  w-full
  bg-white dark:bg-gray-900
  border border-gray-300 dark:border-gray-700
  text-gray-800 dark:text-gray-100
  placeholder-gray-400 dark:placeholder-gray-500
  rounded-xl
  transition-all duration-200
  focus:outline-none focus:ring-2 focus:ring-mint-300/50 focus:border-mint-300
  dark:focus:ring-mint-400/50 dark:focus:border-mint-400
  disabled:bg-gray-100 dark:disabled:bg-gray-800
  disabled:cursor-not-allowed disabled:opacity-60
`;

const errorStyles = `
  border-red-400 dark:border-red-500
  focus:ring-red-400/50 focus:border-red-400
  dark:focus:ring-red-500/50 dark:focus:border-red-500
`;

const sizeStyles: Record<InputSize, string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-3 text-base',
  lg: 'px-5 py-4 text-lg',
};

const iconPaddingStyles: Record<InputSize, { left: string; right: string }> = {
  sm: { left: 'ps-9', right: 'pe-9' },
  md: { left: 'ps-11', right: 'pe-11' },
  lg: { left: 'ps-12', right: 'pe-12' },
};

// ============================================
// COMPONENT
// ============================================

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      size = 'md',
      type = 'text',
      fullWidth = true,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          >
            {label}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none text-gray-400 dark:text-gray-500">
              <span className={size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'}>
                {leftIcon}
              </span>
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            className={`
              ${baseInputStyles}
              ${sizeStyles[size]}
              ${error ? errorStyles : ''}
              ${leftIcon ? iconPaddingStyles[size].left : ''}
              ${rightIcon || isPassword ? iconPaddingStyles[size].right : ''}
              ${className}
            `.replace(/\s+/g, ' ').trim()}
            dir="auto"
            {...props}
          />

          {/* Right Icon or Password Toggle */}
          {(rightIcon || isPassword) && (
            <div className={`absolute inset-y-0 flex items-center ${isPassword ? 'right-0 pr-3' : 'end-0 pe-3'}`}>
              {isPassword ? (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors p-1"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeSlashIcon className={size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'} />
                  ) : (
                    <EyeIcon className={size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'} />
                  )}
                </button>
              ) : rightIcon ? (
                <span className={`text-gray-400 dark:text-gray-500 ${size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'}`}>
                  {rightIcon}
                </span>
              ) : null}
            </div>
          )}
        </div>

        {/* Error or Hint */}
        <AnimatePresence mode="wait">
          {error ? (
            <motion.p
              key="error"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="mt-1.5 text-sm text-red-500 dark:text-red-400"
            >
              {error}
            </motion.p>
          ) : hint ? (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-1.5 text-sm text-gray-500 dark:text-gray-400"
            >
              {hint}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }
);

Input.displayName = 'Input';

// ============================================
// TEXTAREA
// ============================================

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  size?: InputSize;
  fullWidth?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      hint,
      size = 'md',
      fullWidth = true,
      className = '',
      id,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const inputId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          >
            {label}
          </label>
        )}

        {/* Textarea */}
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          className={`
            ${baseInputStyles}
            ${sizeStyles[size]}
            ${error ? errorStyles : ''}
            resize-none
            ${className}
          `.replace(/\s+/g, ' ').trim()}
          dir="auto"
          {...props}
        />

        {/* Error or Hint */}
        <AnimatePresence mode="wait">
          {error ? (
            <motion.p
              key="error"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="mt-1.5 text-sm text-red-500 dark:text-red-400"
            >
              {error}
            </motion.p>
          ) : hint ? (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-1.5 text-sm text-gray-500 dark:text-gray-400"
            >
              {hint}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Input;
