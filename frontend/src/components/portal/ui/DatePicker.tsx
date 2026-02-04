/**
 * Portal Date Picker Component
 * Mobile-friendly calendar with date selection
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
} from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

// ============================================
// ICONS
// ============================================

const ChevronLeftIcon: React.FC = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const ChevronRightIcon: React.FC = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

const CalendarIcon: React.FC = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);

// ============================================
// TYPES
// ============================================

export interface DatePickerProps {
  value?: Date | null;
  onChange: (date: Date) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  disabledDaysOfWeek?: number[];
  className?: string;
}

// ============================================
// COMPONENT
// ============================================

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder,
  error,
  hint,
  required,
  minDate,
  maxDate,
  disabledDates = [],
  disabledDaysOfWeek = [],
  className = '',
}) => {
  const { t, i18n } = useTranslation('portal');
  const isRtl = i18n.language === 'ar';
  const locale = isRtl ? ar : enUS;

  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value || new Date());

  // Week days from translation
  const weekDays = useMemo(() => {
    return t('calendar.weekDaysShort', { returnObjects: true }) as string[];
  }, [t]);

  // Calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(viewDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [viewDate]);

  // Check if date is disabled
  const isDateDisabled = (date: Date): boolean => {
    const today = startOfDay(new Date());

    // Before today
    if (isBefore(date, today)) return true;

    // Before minDate
    if (minDate && isBefore(date, startOfDay(minDate))) return true;

    // After maxDate
    if (maxDate && isBefore(startOfDay(maxDate), date)) return true;

    // In disabled dates array
    if (disabledDates.some((d) => isSameDay(d, date))) return true;

    // Day of week disabled
    if (disabledDaysOfWeek.includes(date.getDay())) return true;

    return false;
  };

  // Navigate months
  const goToPreviousMonth = () => setViewDate(subMonths(viewDate, 1));
  const goToNextMonth = () => setViewDate(addMonths(viewDate, 1));

  // Select date
  const handleSelectDate = (date: Date) => {
    if (!isDateDisabled(date)) {
      onChange(date);
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-500 ms-1">*</span>}
        </label>
      )}

      {/* Input Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full h-12 px-4
          flex items-center justify-between gap-2
          bg-white dark:bg-gray-800
          border-2 rounded-xl
          text-start
          transition-all duration-200
          ${error
            ? 'border-red-300 dark:border-red-700'
            : isOpen
              ? 'border-mint-500 ring-4 ring-mint-500/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }
        `}
      >
        <span className={value ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>
          {value ? format(value, 'PPP', { locale }) : (placeholder || t('calendar.selectDate'))}
        </span>
        <span className="text-gray-400">
          <CalendarIcon />
        </span>
      </button>

      {/* Calendar Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Calendar */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="
                absolute z-50 mt-2
                w-full max-w-xs
                bg-white dark:bg-gray-800
                border border-gray-200 dark:border-gray-700
                rounded-2xl
                shadow-xl
                p-4
              "
            >
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={isRtl ? goToNextMonth : goToPreviousMonth}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                >
                  <ChevronLeftIcon />
                </button>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {format(viewDate, 'MMMM yyyy', { locale })}
                </h3>
                <button
                  type="button"
                  onClick={isRtl ? goToPreviousMonth : goToNextMonth}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                >
                  <ChevronRightIcon />
                </button>
              </div>

              {/* Week Days */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map((day, i) => (
                  <div
                    key={i}
                    className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, i) => {
                  const disabled = isDateDisabled(date);
                  const selected = value && isSameDay(date, value);
                  const today = isToday(date);
                  const inMonth = isSameMonth(date, viewDate);

                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={disabled}
                      onClick={() => handleSelectDate(date)}
                      className={`
                        aspect-square
                        flex items-center justify-center
                        text-sm font-medium
                        rounded-lg
                        transition-colors
                        ${!inMonth ? 'text-gray-300 dark:text-gray-600' : ''}
                        ${disabled ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'cursor-pointer'}
                        ${selected
                          ? 'bg-mint-500 text-white'
                          : today && !disabled
                            ? 'bg-mint-100 dark:bg-mint-900/30 text-mint-600 dark:text-mint-400'
                            : !disabled && inMonth
                              ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                              : ''
                        }
                      `}
                    >
                      {format(date, 'd')}
                    </button>
                  );
                })}
              </div>

              {/* Today Button */}
              <button
                type="button"
                onClick={() => {
                  setViewDate(new Date());
                  handleSelectDate(new Date());
                }}
                className="w-full mt-4 py-2 text-sm font-medium text-mint-600 dark:text-mint-400 hover:bg-mint-50 dark:hover:bg-mint-900/20 rounded-lg transition-colors"
              >
                {t('common.today')}
              </button>
            </motion.div>
          </>
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

export default DatePicker;
