/**
 * Slot Conflict Modal
 * Shows when a booking conflict occurs with smart alternative suggestions
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ClockIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';

export interface SlotAlternative {
  date: string;
  time: string;
  labelEn: string;
  labelAr: string;
  vetId: string;
  vetName?: string;
}

interface SlotConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAlternative: (alternative: SlotAlternative) => void;
  alternatives: SlotAlternative[];
  errorMessage?: string;
}

export const SlotConflictModal: React.FC<SlotConflictModalProps> = ({
  isOpen,
  onClose,
  onSelectAlternative,
  alternatives,
  errorMessage,
}) => {
  const { t, i18n } = useTranslation('portal');
  const isRtl = i18n.language === 'ar';

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 mx-auto max-w-md"
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header with sad emoji */}
              <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                  className="text-6xl mb-2"
                >
                  😢
                </motion.div>
                <h3 className="text-xl font-bold text-white">
                  {t('booking.slotTaken', 'Slot Not Available')}
                </h3>
                <p className="text-white/80 text-sm mt-1">
                  {errorMessage || t('booking.slotTakenMessage', 'This slot was just booked by another customer')}
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 end-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-white" />
              </button>

              {/* Alternatives */}
              <div className="p-6">
                {alternatives.length > 0 ? (
                  <>
                    <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                      {t('booking.tryAlternatives', 'Try one of these available times:')}
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      {alternatives.map((alt, index) => (
                        <motion.button
                          key={`${alt.date}-${alt.time}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => onSelectAlternative(alt)}
                          className="p-4 border-2 border-mint-200 dark:border-mint-700 rounded-xl hover:bg-mint-50 dark:hover:bg-mint-900/20 hover:border-mint-400 dark:hover:border-mint-500 transition-all text-start"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <ClockIcon className="w-4 h-4 text-mint-600" />
                            <span className="font-bold text-mint-600 dark:text-mint-400">
                              {alt.time}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <CalendarDaysIcon className="w-3 h-3" />
                            <span>{formatDate(alt.date)}</span>
                          </div>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {isRtl ? alt.labelAr : alt.labelEn}
                          </p>
                        </motion.button>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center">
                    {t('booking.noAlternatives', 'No alternative slots available. Please try a different date.')}
                  </p>
                )}

                {/* Close button */}
                <div className="mt-6">
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={onClose}
                  >
                    {t('common.close', 'Close')}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SlotConflictModal;
