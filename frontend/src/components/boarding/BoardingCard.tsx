/**
 * Boarding Card Component
 * Compact pet card for grid layout in Kanban board
 */

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  EllipsisVerticalIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { BoardingSessionWithDetails, Species } from '../../api/boarding';
// Phone permission kept for future card-click modal
// import { usePhonePermission, maskPhoneNumber } from '../../hooks/useScreenPermission';

type ColumnType = 'green' | 'yellow' | 'red';

interface BoardingCardProps {
  session: BoardingSessionWithDetails;
  columnType?: ColumnType;
  onCardClick?: (session: BoardingSessionWithDetails) => void;
  onCheckout?: (session: BoardingSessionWithDetails) => void;
  hasFullAccess?: boolean;
}

const speciesIcons: Record<Species, string> = {
  DOG: '🐕',
  CAT: '🐈',
  BIRD: '🦜',
  RABBIT: '🐇',
  HAMSTER: '🐹',
  GUINEA_PIG: '🐹',
  TURTLE: '🐢',
  FISH: '🐟',
  HORSE: '🐴',
  GOAT: '🐐',
  OTHER: '🐾',
};

const genderIcons: Record<string, string> = {
  MALE: '♂️',
  FEMALE: '♀️',
};

const columnBorderColors: Record<ColumnType, string> = {
  green: 'border-[#86C5A5] dark:border-green-700',
  yellow: 'border-[#E5C739] dark:border-yellow-700',
  red: 'border-[#EF5350] dark:border-red-700',
};

const columnCageBg: Record<ColumnType, string> = {
  green: 'bg-[#CEE8DC] text-green-800 dark:bg-green-900/40 dark:text-green-300',
  yellow: 'bg-[#F5DF59]/60 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  red: 'bg-[#FFCDD2] text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

export const BoardingCard = ({
  session,
  columnType,
  onCardClick,
  onCheckout,
  hasFullAccess = false,
}: BoardingCardProps) => {
  const { t, i18n } = useTranslation('boardingManagement');
  const isRTL = i18n.language === 'ar';
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleClick = (e: React.MouseEvent) => {
    if (onCardClick) { e.stopPropagation(); onCardClick(session); }
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleCheckout = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onCheckout?.(session);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' });
  };

  const cageBg = columnType ? columnCageBg[columnType] : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';

  return (
    <div
      onClick={handleClick}
      className={`rounded-xl shadow-sm dark:shadow-black/30 border-2
        bg-brand-white dark:bg-[var(--app-bg-card)]
        hover:shadow-md transition-all overflow-hidden
        ${columnType ? columnBorderColors[columnType] : 'border-primary-200 dark:border-[var(--app-border-default)]'}
        ${columnType === 'red' ? 'animate-boarding-red-pulse' : ''}
        ${onCardClick ? 'cursor-pointer hover:ring-2 hover:ring-secondary-300' : ''}`}
    >
      {/* Row 1: Cage number header - full width, column color bg */}
      <div className={`flex items-center justify-between px-3 py-2 ${cageBg}`}>
        <span className="text-sm font-bold">
          {t('card.cage')} {session.slotNumber}
        </span>
        {hasFullAccess && (
          <div className="relative" ref={menuRef}>
            <button onClick={handleMenuToggle} className="p-0.5 rounded hover:opacity-70">
              <EllipsisVerticalIcon className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-full mt-1 bg-brand-white dark:bg-[var(--app-bg-card)] border border-primary-200 dark:border-[var(--app-border-default)] rounded-lg shadow-lg dark:shadow-black/50 z-50 min-w-[110px] py-1`}>
                <button onClick={handleCheckout} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-primary-50 dark:hover:bg-[var(--app-bg-elevated)] text-left dark:text-[var(--app-text-primary)]">
                  <ArrowRightOnRectangleIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span>{t('card.checkout')}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card content */}
      <div className="px-3 py-2.5 space-y-1.5">
        {/* Row 2: Pet name */}
        <div className="font-bold text-brand-dark dark:text-[var(--app-text-primary)] text-sm truncate">
          {speciesIcons[session.pet.species] || '🐾'} {session.pet.name}
        </div>

        {/* Row 3: Species / Breed */}
        <div className="text-xs text-brand-dark/60 dark:text-[var(--app-text-tertiary)] truncate">
          {session.pet.breed
            ? `${t(`species.${session.pet.species}`, session.pet.species)} • ${session.pet.breed}`
            : t(`species.${session.pet.species}`, session.pet.species)}
        </div>

        {/* Row 4: Gender + Dates */}
        <div className="flex items-center gap-1.5 text-xs text-brand-dark/50 dark:text-[var(--app-text-tertiary)]">
          {session.pet.gender && (
            <span className="flex-shrink-0">{genderIcons[session.pet.gender]}</span>
          )}
          <span className="truncate">
            {formatDate(session.checkInDate)} → {formatDate(session.expectedCheckOutDate)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BoardingCard;
