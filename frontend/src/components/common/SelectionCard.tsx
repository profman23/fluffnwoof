/**
 * SelectionCard Component
 * A reusable card-based selection component for toggle/radio-style choices
 *
 * Used in:
 * - BoardingIcuPage (Type + Species selection)
 * - Any future toggle/selection needs
 *
 * Design System:
 * - Unselected: border-[var(--app-border-default)]
 * - Selected: border-primary-500 + bg-primary-50/dark:bg-primary-900/20
 * - Supports custom selected colors for semantic meaning (blue=boarding, red=ICU)
 */

import React from 'react';

export interface SelectionCardOption<T extends string> {
  value: T;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  emoji?: string;
  /** Custom color theme when selected - defaults to 'gold' (brand yellow) */
  selectedColor?: 'gold' | 'primary' | 'blue' | 'red' | 'green' | 'purple';
}

interface SelectionCardGroupProps<T extends string> {
  options: SelectionCardOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Number of columns (default: 2) */
  columns?: 2 | 3 | 4;
  /** Disable all options */
  disabled?: boolean;
  /** Card size */
  size?: 'sm' | 'md' | 'lg';
}

const colorStyles = {
  // Brand Gold/Yellow - Default for all selections
  gold: {
    border: 'border-secondary-300',
    bg: 'bg-secondary-200 dark:bg-secondary-300/20',
    text: 'text-secondary-600 dark:text-secondary-300',
  },
  primary: {
    border: 'border-primary-500',
    bg: 'bg-primary-50 dark:bg-primary-900/20',
    text: 'text-primary-600 dark:text-primary-400',
  },
  blue: {
    border: 'border-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
  },
  red: {
    border: 'border-red-500',
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
  },
  green: {
    border: 'border-green-500',
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-600 dark:text-green-400',
  },
  purple: {
    border: 'border-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-600 dark:text-purple-400',
  },
};

const sizeStyles = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

const iconSizeStyles = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
};

const emojiSizeStyles = {
  sm: 'text-2xl',
  md: 'text-4xl',
  lg: 'text-5xl',
};

export function SelectionCardGroup<T extends string>({
  options,
  value,
  onChange,
  columns = 2,
  disabled = false,
  size = 'md',
}: SelectionCardGroupProps<T>) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-3`}>
      {options.map((option) => {
        const isSelected = value === option.value;
        const colorTheme = option.selectedColor || 'gold';
        const colors = colorStyles[colorTheme];

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => !disabled && onChange(option.value)}
            disabled={disabled}
            className={`
              ${sizeStyles[size]} rounded-lg border-2 transition-all
              ${isSelected
                ? `${colors.border} ${colors.bg}`
                : 'border-[var(--app-border-default)] hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-[var(--app-bg-elevated)]'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {/* Icon or Emoji */}
            {option.icon && (
              <div className={`${iconSizeStyles[size]} mx-auto mb-2 ${isSelected ? colors.text : ''}`}>
                {option.icon}
              </div>
            )}
            {option.emoji && (
              <span className={`${emojiSizeStyles[size]} block mb-2`}>
                {option.emoji}
              </span>
            )}

            {/* Label */}
            <div className={`text-sm font-medium ${
              isSelected
                ? 'text-gray-900 dark:text-[var(--app-text-primary)]'
                : 'text-gray-700 dark:text-[var(--app-text-secondary)]'
            }`}>
              {option.label}
            </div>

            {/* Sublabel */}
            {option.sublabel && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {option.sublabel}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default SelectionCardGroup;
