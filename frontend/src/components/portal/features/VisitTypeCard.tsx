/**
 * Portal Visit Type Card Component
 * Displays visit type options for booking
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { tapScale } from '../../../styles/portal/animations';

// ============================================
// ICONS
// ============================================

const ClockIcon: React.FC = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// ============================================
// TYPES
// ============================================

export interface VisitType {
  code: string;
  nameEn: string;
  nameAr: string;
  duration: number;
  color: string;
  description?: string;
  descriptionAr?: string;
  icon?: string;
}

export interface VisitTypeCardProps {
  visitType: VisitType;
  selected?: boolean;
  onClick?: () => void;
  compact?: boolean;
  className?: string;
}

// ============================================
// VISIT TYPE ICONS
// ============================================

const visitTypeIcons: Record<string, string> = {
  CHECKUP: '🩺',
  VACCINATION: '💉',
  SURGERY: '🏥',
  DENTAL: '🦷',
  GROOMING: '✂️',
  EMERGENCY: '🚨',
  CONSULTATION: '💬',
  LAB: '🧪',
  XRAY: '📷',
  FOLLOWUP: '🔄',
  DEFAULT: '🐾',
};

// ============================================
// COMPONENT
// ============================================

export const VisitTypeCard: React.FC<VisitTypeCardProps> = ({
  visitType,
  selected = false,
  onClick,
  compact = false,
  className = '',
}) => {
  const { t, i18n } = useTranslation('portal');
  const isArabic = i18n.language === 'ar';

  const name = isArabic ? visitType.nameAr : visitType.nameEn;
  const description = isArabic ? visitType.descriptionAr : visitType.description;
  const icon = visitType.icon || visitTypeIcons[visitType.code] || visitTypeIcons.DEFAULT;

  if (compact) {
    return (
      <motion.button
        type="button"
        whileTap={tapScale}
        onClick={onClick}
        className={`
          p-3
          flex flex-col items-center gap-2
          bg-white dark:bg-gray-800
          rounded-xl
          border-2 transition-all duration-200
          text-center
          ${selected
            ? 'border-mint-500 ring-4 ring-mint-500/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }
          ${className}
        `}
      >
        {/* Color Dot + Icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
          style={{ backgroundColor: `${visitType.color}20` }}
        >
          {icon}
        </div>

        {/* Name */}
        <span className={`text-sm font-medium ${selected ? 'text-mint-600 dark:text-mint-400' : 'text-gray-700 dark:text-gray-300'}`}>
          {name}
        </span>

        {/* Duration */}
        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <ClockIcon />
          {visitType.duration} {t('booking.minutes', 'دقيقة')}
        </span>
      </motion.button>
    );
  }

  return (
    <motion.div whileTap={onClick ? tapScale : undefined}>
      <Card
        variant={selected ? 'elevated' : 'interactive'}
        onClick={onClick}
        className={`
          ${selected ? 'ring-2 ring-mint-500' : ''}
          ${className}
        `}
      >
        <div className="flex items-center gap-4">
          {/* Icon with color */}
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ backgroundColor: `${visitType.color}20` }}
          >
            {icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {name}
              </h3>
              {selected && (
                <div className="w-5 h-5 rounded-full bg-mint-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>

            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
                {description}
              </p>
            )}

            {/* Duration badge */}
            <span
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg"
              style={{
                backgroundColor: `${visitType.color}20`,
                color: visitType.color,
              }}
            >
              <ClockIcon />
              {visitType.duration} {t('booking.minutes', 'دقيقة')}
            </span>
          </div>

          {/* Color indicator */}
          <div
            className="w-1 h-12 rounded-full flex-shrink-0"
            style={{ backgroundColor: visitType.color }}
          />
        </div>
      </Card>
    </motion.div>
  );
};

// ============================================
// VISIT TYPE GRID (for compact display)
// ============================================

export interface VisitTypeGridProps {
  visitTypes: VisitType[];
  selectedCode?: string;
  onSelect: (visitType: VisitType) => void;
  columns?: 2 | 3;
  className?: string;
}

export const VisitTypeGrid: React.FC<VisitTypeGridProps> = ({
  visitTypes,
  selectedCode,
  onSelect,
  columns = 2,
  className = '',
}) => (
  <div className={`grid grid-cols-${columns} gap-3 ${className}`}>
    {visitTypes.map((vt) => (
      <VisitTypeCard
        key={vt.code}
        visitType={vt}
        selected={vt.code === selectedCode}
        onClick={() => onSelect(vt)}
        compact
      />
    ))}
  </div>
);

// ============================================
// VISIT TYPE LIST (for full display)
// ============================================

export interface VisitTypeListProps {
  visitTypes: VisitType[];
  selectedCode?: string;
  onSelect: (visitType: VisitType) => void;
  className?: string;
}

export const VisitTypeList: React.FC<VisitTypeListProps> = ({
  visitTypes,
  selectedCode,
  onSelect,
  className = '',
}) => (
  <div className={`space-y-3 ${className}`}>
    {visitTypes.map((vt) => (
      <VisitTypeCard
        key={vt.code}
        visitType={vt}
        selected={vt.code === selectedCode}
        onClick={() => onSelect(vt)}
      />
    ))}
  </div>
);

// ============================================
// VISIT TYPE SKELETON
// ============================================

export const VisitTypeCardSkeleton: React.FC<{ compact?: boolean }> = ({ compact }) => {
  if (compact) {
    return (
      <div className="p-3 flex flex-col items-center gap-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <Card variant="default">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="flex-1">
          <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
          <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
          <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
    </Card>
  );
};

export default VisitTypeCard;
