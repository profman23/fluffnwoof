/**
 * Portal Pet Card Component
 * Displays pet information in a card format
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { PetAvatar } from '../ui/Avatar';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { cardHover, tapScale } from '../../../styles/portal/animations';

// ============================================
// ICONS
// ============================================

const ChevronRightIcon: React.FC = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

const EditIcon: React.FC = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);

// ============================================
// TYPES
// ============================================

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string | null;
  gender?: 'MALE' | 'FEMALE';
  birthDate?: string | null;
  photo?: string | null;
  microchipId?: string | null;
  weight?: number | null;
}

export interface PetCardProps {
  pet: Pet;
  onClick?: () => void;
  onEdit?: () => void;
  selected?: boolean;
  compact?: boolean;
  showArrow?: boolean;
  className?: string;
}

// ============================================
// HELPER
// ============================================

const calculateAge = (
  birthDate: string | null | undefined,
  t: (key: string, options?: Record<string, unknown>) => string
): string | null => {
  if (!birthDate) return null;

  const birth = new Date(birthDate);
  const now = new Date();

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();

  // Adjust for negative months
  if (months < 0) {
    years--;
    months += 12;
  }

  if (years > 0) {
    return t('pets.age.years', { count: years });
  }
  if (months > 0) {
    return t('pets.age.months', { count: months });
  }
  return t('pets.age.newborn');
};

const getGenderLabel = (
  gender: 'MALE' | 'FEMALE' | undefined,
  t: (key: string) => string
): string => {
  if (!gender) return '';
  return t(`pets.genderOptions.${gender}`);
};

// ============================================
// COMPONENT
// ============================================

export const PetCard: React.FC<PetCardProps> = ({
  pet,
  onClick,
  onEdit,
  selected = false,
  compact = false,
  showArrow = true,
  className = '',
}) => {
  const { t, i18n } = useTranslation('portal');
  const isArabic = i18n.language === 'ar';

  const age = calculateAge(pet.birthDate, t);
  const gender = getGenderLabel(pet.gender, t);

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
        <PetAvatar
          src={pet.photo}
          name={pet.name}
          species={pet.species}
          size="md"
        />
        <div className="flex-1 text-start">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            {pet.name}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {pet.breed || pet.species}
          </p>
        </div>
        {selected && (
          <div className="w-6 h-6 rounded-full bg-mint-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </motion.button>
    );
  }

  return (
    <motion.div
      whileHover={cardHover}
      whileTap={onClick ? tapScale : undefined}
    >
      <Card
        variant="interactive"
        onClick={onClick}
        className={`
          ${selected ? 'ring-2 ring-mint-500' : ''}
          ${className}
        `}
      >
        <div className="flex items-center gap-4">
          {/* Pet Avatar */}
          <PetAvatar
            src={pet.photo}
            name={pet.name}
            species={pet.species}
            size="xl"
          />

          {/* Pet Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {pet.name}
              </h3>
              {gender && (
                <Badge
                  variant={pet.gender === 'MALE' ? 'info' : 'pink'}
                  size="sm"
                >
                  {gender}
                </Badge>
              )}
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              {pet.breed || pet.species}
            </p>

            {age && (
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {age}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <EditIcon />
              </button>
            )}
            {showArrow && onClick && (
              <span className={`text-gray-400 ${isArabic ? 'rotate-180' : ''}`}>
                <ChevronRightIcon />
              </span>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

// ============================================
// PET CARD SKELETON
// ============================================

export const PetCardSkeleton: React.FC = () => (
  <Card variant="default">
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
      <div className="flex-1">
        <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    </div>
  </Card>
);

export default PetCard;
