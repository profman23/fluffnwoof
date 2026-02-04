/**
 * Portal Vet Card Component
 * Displays veterinarian information for selection
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../ui/Avatar';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { tapScale } from '../../../styles/portal/animations';

// ============================================
// ICONS
// ============================================

const CheckIcon: React.FC = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const ClockIcon: React.FC = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// ============================================
// TYPES
// ============================================

type DayOfWeek = 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';

export interface VetSchedule {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isWorkingDay: boolean;
}

export interface Vet {
  id: string;
  firstName: string;
  lastName: string;
  specialty?: string | null;
  avatar?: string | null;
  schedule?: VetSchedule[];
}

export interface VetCardProps {
  vet: Vet;
  selected?: boolean;
  onClick?: () => void;
  showSchedule?: boolean;
  compact?: boolean;
  className?: string;
}

// ============================================
// HELPERS
// ============================================

// getDayLabel now uses translation keys from portal.json
const getDayLabel = (
  day: DayOfWeek,
  t: (key: string) => string,
  short = false
): string => {
  return short ? t(`days.short.${day}`) : t(`days.${day}`);
};

// ============================================
// COMPONENT
// ============================================

export const VetCard: React.FC<VetCardProps> = ({
  vet,
  selected = false,
  onClick,
  showSchedule = true,
  compact = false,
  className = '',
}) => {
  const { t, i18n } = useTranslation('portal');
  const isArabic = i18n.language === 'ar';

  const fullName = `${vet.firstName} ${vet.lastName}`;
  const workingDays = vet.schedule?.filter((s) => s.isWorkingDay) || [];

  if (compact) {
    return (
      <motion.button
        type="button"
        whileTap={tapScale}
        onClick={onClick}
        className={`
          w-full p-3
          flex items-center gap-3
          bg-white dark:bg-gray-800
          rounded-xl
          border-2 transition-all duration-200
          ${selected
            ? 'border-mint-500 ring-4 ring-mint-500/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }
          ${className}
        `}
      >
        <Avatar
          src={vet.avatar}
          name={fullName}
          size="md"
        />
        <div className="flex-1 text-start">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            {t('common.doctor')} {fullName}
          </h4>
          {vet.specialty && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {vet.specialty}
            </p>
          )}
        </div>
        {selected && (
          <div className="w-6 h-6 rounded-full bg-mint-500 flex items-center justify-center">
            <CheckIcon />
          </div>
        )}
      </motion.button>
    );
  }

  return (
    <motion.div whileTap={onClick ? tapScale : undefined}>
      <Card
        variant={selected ? 'elevated' : 'interactive'}
        onClick={onClick}
        className={`
          ${selected ? 'ring-2 ring-mint-500 bg-mint-50/50 dark:bg-mint-900/10' : ''}
          ${className}
        `}
      >
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar
            src={vet.avatar}
            name={fullName}
            size="xl"
          />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {t('common.doctor')} {fullName}
              </h3>
              {selected && (
                <div className="w-5 h-5 rounded-full bg-mint-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>

            {vet.specialty && (
              <Badge variant="secondary" size="sm" className="mb-2">
                {vet.specialty}
              </Badge>
            )}

            {/* Working Days */}
            {showSchedule && workingDays.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
                  <ClockIcon />
                  <span>{t('booking.workingDays')}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {workingDays.map((schedule) => (
                    <span
                      key={schedule.dayOfWeek}
                      className="px-2 py-1 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    >
                      {getDayLabel(schedule.dayOfWeek, t, true)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

// ============================================
// VET LIST COMPONENT
// ============================================

export interface VetListProps {
  vets: Vet[];
  selectedId?: string;
  onSelect: (vet: Vet) => void;
  showSchedule?: boolean;
  compact?: boolean;
  className?: string;
}

export const VetList: React.FC<VetListProps> = ({
  vets,
  selectedId,
  onSelect,
  showSchedule = true,
  compact = false,
  className = '',
}) => (
  <div className={`space-y-3 ${className}`}>
    {vets.map((vet) => (
      <VetCard
        key={vet.id}
        vet={vet}
        selected={vet.id === selectedId}
        onClick={() => onSelect(vet)}
        showSchedule={showSchedule}
        compact={compact}
      />
    ))}
  </div>
);

// ============================================
// VET CARD SKELETON
// ============================================

export const VetCardSkeleton: React.FC = () => (
  <Card variant="default">
    <div className="flex items-start gap-4">
      <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
      <div className="flex-1">
        <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3" />
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-6 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  </Card>
);

export default VetCard;
