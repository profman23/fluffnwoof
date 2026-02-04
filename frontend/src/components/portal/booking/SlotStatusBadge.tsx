/**
 * Slot Status Badge
 * Shows real-time status of a time slot (available, reserved, booked)
 */

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ClockIcon, LockClosedIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import type { SlotStatus } from '../../../context/BookingSocketContext';

interface SlotStatusBadgeProps {
  status: SlotStatus;
  size?: 'sm' | 'md';
}

export const SlotStatusBadge: React.FC<SlotStatusBadgeProps> = ({ status, size = 'sm' }) => {
  const { t } = useTranslation('portal');
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Countdown timer for reserved slots
  useEffect(() => {
    if (status.status === 'reserved' && status.expiresAt) {
      const updateTimer = () => {
        const now = Date.now();
        const expiresAt = new Date(status.expiresAt!).getTime();
        const diff = Math.max(0, Math.floor((expiresAt - now) / 1000));
        setTimeLeft(diff);
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [status.status, status.expiresAt]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (status.status === 'available') {
    return null; // Don't show anything for available slots
  }

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  if (status.status === 'reserved') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`
          inline-flex items-center gap-1 rounded-full
          ${status.isOwn
            ? 'bg-mint-100 dark:bg-mint-900/30 text-mint-700 dark:text-mint-400'
            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
          }
          ${sizeClasses}
        `}
      >
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <ClockIcon className={iconSize} />
        </motion.div>
        {status.isOwn ? (
          <span>{t('booking.yourReservation', 'Your hold')}</span>
        ) : (
          <span>{formatTime(timeLeft)}</span>
        )}
      </motion.div>
    );
  }

  if (status.status === 'booked') {
    return (
      <div
        className={`
          inline-flex items-center gap-1 rounded-full
          bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400
          ${sizeClasses}
        `}
      >
        <LockClosedIcon className={iconSize} />
        <span>{t('booking.booked', 'Booked')}</span>
      </div>
    );
  }

  return null;
};

export default SlotStatusBadge;
