/**
 * Portal Time Slot Picker Component
 * Grid of available time slots for appointment booking
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { staggerContainer, fadeInUp } from '../../../styles/portal/animations';

// ============================================
// ICONS
// ============================================

const ClockIcon: React.FC = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// ============================================
// TYPES
// ============================================

export interface TimeSlotPickerProps {
  slots: string[];
  value?: string;
  onChange: (slot: string) => void;
  label?: string;
  error?: string;
  required?: boolean;
  loading?: boolean;
  unavailableReason?: 'dayOff' | 'weekendOff' | 'noSchedule' | 'fullyBooked';
  className?: string;
}

// ============================================
// COMPONENT
// ============================================

export const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  slots,
  value,
  onChange,
  label,
  error,
  required,
  loading = false,
  unavailableReason,
  className = '',
}) => {
  const { t } = useTranslation('portal');

  // Group slots by period (morning, afternoon, evening)
  const groupedSlots = React.useMemo(() => {
    const morning: string[] = [];
    const afternoon: string[] = [];
    const evening: string[] = [];

    slots.forEach((slot) => {
      const hour = parseInt(slot.split(':')[0], 10);
      if (hour < 12) {
        morning.push(slot);
      } else if (hour < 17) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
    });

    return { morning, afternoon, evening };
  }, [slots]);

  // Unavailable messages
  const unavailableMessages: Record<string, { title: string; description: string }> = {
    dayOff: {
      title: t('booking.vetOnLeave', 'الطبيب في إجازة'),
      description: t('booking.chooseAnotherDate', 'يرجى اختيار تاريخ آخر'),
    },
    weekendOff: {
      title: t('booking.weekendClosed', 'عطلة نهاية الأسبوع'),
      description: t('booking.clinicClosed', 'العيادة مغلقة في هذا اليوم'),
    },
    noSchedule: {
      title: t('booking.noSchedule', 'لا يوجد جدول'),
      description: t('booking.noWorkingHours', 'الطبيب لا يعمل في هذا اليوم'),
    },
    fullyBooked: {
      title: t('booking.fullyBooked', 'محجوز بالكامل'),
      description: t('booking.noAvailableSlots', 'لا توجد أوقات متاحة'),
    },
  };

  if (loading) {
    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {label}
            {required && <span className="text-red-500 ms-1">*</span>}
          </label>
        )}
        <div className="grid grid-cols-4 gap-2">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="h-10 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (unavailableReason || slots.length === 0) {
    const message = unavailableReason
      ? unavailableMessages[unavailableReason]
      : { title: t('booking.noSlots', 'لا توجد أوقات'), description: '' };

    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {label}
            {required && <span className="text-red-500 ms-1">*</span>}
          </label>
        )}
        <div className="text-center py-8 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <ClockIcon />
          </div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
            {message.title}
          </h4>
          {message.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {message.description}
            </p>
          )}
        </div>
      </div>
    );
  }

  const renderSlotGroup = (groupSlots: string[], title: string, icon: string) => {
    if (groupSlots.length === 0) return null;

    return (
      <div className="mb-4 last:mb-0">
        <div className="flex items-center gap-2 mb-2 text-sm text-gray-500 dark:text-gray-400">
          <span>{icon}</span>
          <span>{title}</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {groupSlots.map((slot) => (
            <motion.button
              key={slot}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange(slot)}
              className={`
                px-3 py-2.5
                text-sm font-medium
                rounded-xl
                border-2
                transition-all duration-200
                ${slot === value
                  ? 'border-mint-500 bg-mint-500 text-white'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-mint-300 dark:hover:border-mint-700'
                }
              `}
            >
              {slot}
            </motion.button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className={className}
    >
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {label}
          {required && <span className="text-red-500 ms-1">*</span>}
        </label>
      )}

      <motion.div variants={fadeInUp}>
        {renderSlotGroup(groupedSlots.morning, t('booking.morning', 'صباحاً'), '🌅')}
        {renderSlotGroup(groupedSlots.afternoon, t('booking.afternoon', 'ظهراً'), '☀️')}
        {renderSlotGroup(groupedSlots.evening, t('booking.evening', 'مساءً'), '🌙')}
      </motion.div>

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </motion.div>
  );
};

// ============================================
// COMPACT TIME SLOT (for display)
// ============================================

export interface TimeSlotDisplayProps {
  time: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const TimeSlotDisplay: React.FC<TimeSlotDisplayProps> = ({
  time,
  size = 'md',
  className = '',
}) => {
  const sizeStyles = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        ${sizeStyles[size]}
        rounded-lg
        bg-mint-100 dark:bg-mint-900/30
        text-mint-700 dark:text-mint-300
        font-medium
        ${className}
      `}
    >
      <ClockIcon />
      {time}
    </span>
  );
};

export default TimeSlotPicker;
