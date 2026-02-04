/**
 * Portal Appointment Card Component
 * Displays appointment information with status
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { format, isToday, isTomorrow, isPast, differenceInHours } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { PetAvatar } from '../ui/Avatar';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { cardHover } from '../../../styles/portal/animations';

// ============================================
// ICONS
// ============================================

const CalendarIcon: React.FC = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);

const ClockIcon: React.FC = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UserIcon: React.FC = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

// ============================================
// TYPES
// ============================================

export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface Appointment {
  id: string;
  dateTime: string;
  status: AppointmentStatus;
  visitType: {
    code: string;
    nameEn: string;
    nameAr: string;
    color?: string;
    duration: number;
  };
  pet: {
    id: string;
    name: string;
    species: string;
    photo?: string | null;
  };
  vet: {
    id: string;
    firstName: string;
    lastName: string;
    specialty?: string;
  };
  notes?: string | null;
}

export interface AppointmentCardProps {
  appointment: Appointment;
  onClick?: () => void;
  onCancel?: () => void;
  showCancelButton?: boolean;
  className?: string;
}

// ============================================
// HELPERS
// ============================================

const canCancel = (appointment: Appointment): boolean => {
  if (appointment.status === 'CANCELLED' || appointment.status === 'COMPLETED') {
    return false;
  }

  const appointmentDate = new Date(appointment.dateTime);

  // Can always cancel if scheduled (not confirmed yet)
  if (appointment.status === 'SCHEDULED') {
    return true;
  }

  // For confirmed appointments, must be at least 24 hours away
  const hoursUntil = differenceInHours(appointmentDate, new Date());
  return hoursUntil >= 24;
};

// ============================================
// COMPONENT
// ============================================

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onClick,
  onCancel,
  showCancelButton = true,
  className = '',
}) => {
  const { t, i18n } = useTranslation('portal');
  const isArabic = i18n.language === 'ar';
  const locale = isArabic ? ar : enUS;

  const getRelativeDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    if (isToday(date)) return t('common.today');
    if (isTomorrow(date)) return t('common.tomorrow');
    return format(date, 'EEEE, d MMMM', { locale });
  };

  const dateTime = new Date(appointment.dateTime);
  const relativeDate = getRelativeDate(appointment.dateTime);
  const time = format(dateTime, 'HH:mm');
  const visitTypeName = isArabic ? appointment.visitType.nameAr : appointment.visitType.nameEn;
  const vetName = `${appointment.vet.firstName} ${appointment.vet.lastName}`;
  const showCancel = showCancelButton && canCancel(appointment);
  const isUpcoming = !isPast(dateTime) && appointment.status !== 'CANCELLED';

  return (
    <motion.div whileHover={cardHover}>
      <Card
        variant="interactive"
        onClick={onClick}
        className={`
          overflow-hidden
          ${appointment.status === 'CANCELLED' ? 'opacity-60' : ''}
          ${className}
        `}
      >
        {/* Color Bar */}
        <div
          className="absolute top-0 start-0 w-1 h-full rounded-s-2xl"
          style={{ backgroundColor: appointment.visitType.color || '#4ECDC4' }}
        />

        <div className="flex items-start gap-3">
          {/* Pet Avatar */}
          <PetAvatar
            src={appointment.pet.photo}
            name={appointment.pet.name}
            species={appointment.pet.species}
            size="lg"
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {appointment.pet.name}
              </h3>
              <StatusBadge status={appointment.status} size="sm" />
            </div>

            {/* Visit Type */}
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              {visitTypeName}
            </p>

            {/* Details */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <CalendarIcon />
                {relativeDate}
              </span>
              <span className="flex items-center gap-1">
                <ClockIcon />
                {time}
              </span>
              <span className="flex items-center gap-1">
                <UserIcon />
                {t('common.doctor')} {vetName}
              </span>
            </div>
          </div>
        </div>

        {/* Cancel Button */}
        {showCancel && isUpcoming && (
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onCancel?.();
              }}
              className="text-red-500 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20"
            >
              {t('appointments.cancel')}
            </Button>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

// ============================================
// COMPACT APPOINTMENT CARD
// ============================================

export interface CompactAppointmentCardProps {
  appointment: Appointment;
  onClick?: () => void;
  className?: string;
}

export const CompactAppointmentCard: React.FC<CompactAppointmentCardProps> = ({
  appointment,
  onClick,
  className = '',
}) => {
  const { t, i18n } = useTranslation('portal');
  const isArabic = i18n.language === 'ar';
  const locale = isArabic ? ar : enUS;

  const getRelativeDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    if (isToday(date)) return t('common.today');
    if (isTomorrow(date)) return t('common.tomorrow');
    return format(date, 'EEEE, d MMMM', { locale });
  };

  const dateTime = new Date(appointment.dateTime);
  const relativeDate = getRelativeDate(appointment.dateTime);
  const time = format(dateTime, 'HH:mm');

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        w-full p-3
        flex items-center gap-3
        bg-white dark:bg-gray-800
        rounded-xl
        border border-gray-200 dark:border-gray-700
        hover:border-mint-300 dark:hover:border-mint-700
        transition-colors
        text-start
        ${className}
      `}
    >
      <PetAvatar
        src={appointment.pet.photo}
        name={appointment.pet.name}
        species={appointment.pet.species}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 dark:text-white truncate">
          {appointment.pet.name}
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {relativeDate} • {time}
        </p>
      </div>
      <StatusBadge status={appointment.status} size="sm" />
    </motion.button>
  );
};

// ============================================
// APPOINTMENT CARD SKELETON
// ============================================

export const AppointmentCardSkeleton: React.FC = () => (
  <Card variant="default">
    <div className="flex items-start gap-3">
      <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        </div>
        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
        <div className="flex gap-4">
          <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
    </div>
  </Card>
);

export default AppointmentCard;
