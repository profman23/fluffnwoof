/**
 * Portal Select Component
 * Custom styled select with native mobile behavior
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// ============================================
// ICONS
// ============================================

const ChevronDownIcon: React.FC = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const CheckIcon: React.FC = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

// ============================================
// TYPES
// ============================================

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

// ============================================
// COMPONENT
// ============================================

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  label,
  error,
  hint,
  disabled = false,
  required = false,
  className = '',
  size = 'md',
}) => {
  const { t } = useTranslation('portal');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use translation if no placeholder provided
  const finalPlaceholder = placeholder || t('common.search');

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const sizeStyles = {
    sm: 'h-10 text-sm',
    md: 'h-12 text-base',
    lg: 'h-14 text-lg',
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-500 ms-1">*</span>}
        </label>
      )}

      {/* Select Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full
          ${sizeStyles[size]}
          px-4
          flex items-center justify-between gap-2
          bg-white dark:bg-gray-800
          border-2 rounded-xl
          text-start
          transition-all duration-200
          ${error
            ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500/20'
            : isOpen
              ? 'border-mint-500 ring-4 ring-mint-500/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900' : 'cursor-pointer'}
        `}
      >
        <span className={`flex items-center gap-2 truncate ${!selectedOption ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>
          {selectedOption?.icon}
          {selectedOption?.label || finalPlaceholder}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-gray-400 flex-shrink-0"
        >
          <ChevronDownIcon />
        </motion.span>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="
              absolute z-50 w-full mt-2
              bg-white dark:bg-gray-800
              border border-gray-200 dark:border-gray-700
              rounded-xl
              shadow-lg
              overflow-hidden
              max-h-60 overflow-y-auto
            "
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={option.disabled}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`
                  w-full px-4 py-3
                  flex items-center justify-between gap-2
                  text-start
                  transition-colors
                  ${option.value === value
                    ? 'bg-mint-50 dark:bg-mint-900/20 text-mint-600 dark:text-mint-400'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-900 dark:text-white'
                  }
                  ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="flex items-center gap-2 truncate">
                  {option.icon}
                  <div>
                    <div className="font-medium">{option.label}</div>
                    {option.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {option.description}
                      </div>
                    )}
                  </div>
                </div>
                {option.value === value && (
                  <span className="text-mint-500 flex-shrink-0">
                    <CheckIcon />
                  </span>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error / Hint */}
      {(error || hint) && (
        <p className={`mt-2 text-sm ${error ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
          {error || hint}
        </p>
      )}
    </div>
  );
};

// ============================================
// OPTION GROUP SELECT (Grid of cards)
// ============================================

export interface OptionCardProps {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  columns?: 2 | 3 | 4;
  label?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

export const OptionCards: React.FC<OptionCardProps> = ({
  options,
  value,
  onChange,
  columns = 2,
  label,
  error,
  required,
  className = '',
}) => {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

  return (
    <div className={className}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {label}
          {required && <span className="text-red-500 ms-1">*</span>}
        </label>
      )}

      {/* Options Grid */}
      <div className={`grid ${gridCols[columns]} gap-3`}>
        {options.map((option) => (
          <motion.button
            key={option.value}
            type="button"
            whileTap={{ scale: 0.98 }}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={`
              p-4
              flex flex-col items-center justify-center gap-2
              text-center
              rounded-xl
              border-2
              transition-all duration-200
              ${option.value === value
                ? 'border-mint-500 bg-mint-50 dark:bg-mint-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
              }
              ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {option.icon && (
              <span className={`text-2xl ${option.value === value ? 'text-mint-500' : ''}`}>
                {option.icon}
              </span>
            )}
            <span className={`text-sm font-medium ${option.value === value ? 'text-mint-600 dark:text-mint-400' : 'text-gray-700 dark:text-gray-300'}`}>
              {option.label}
            </span>
            {option.description && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {option.description}
              </span>
            )}
          </motion.button>
        ))}
      </div>

      {/* Error */}
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default Select;
