/**
 * Boarding Session Modal Component
 * Shows detailed information about a boarding session
 */

import { useTranslation } from 'react-i18next';
import {
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { BoardingSessionWithDetails, Species } from '../../api/boarding';
import { usePhonePermission, maskPhoneNumber } from '../../hooks/useScreenPermission';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

interface BoardingSessionModalProps {
  session: BoardingSessionWithDetails;
  isOpen: boolean;
  onClose: () => void;
  onCheckout?: () => void;
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

export const BoardingSessionModal = ({
  session,
  isOpen,
  onClose,
  onCheckout,
  hasFullAccess = false,
}: BoardingSessionModalProps) => {
  const { t, i18n } = useTranslation('boardingManagement');
  const { canViewPhone } = usePhonePermission();
  const isRTL = i18n.language === 'ar';

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format phone
  const displayPhone = session.pet.owner.phone
    ? canViewPhone
      ? session.pet.owner.phone
      : maskPhoneNumber(session.pet.owner.phone)
    : null;

  // Calculate stay duration
  const calculateDays = () => {
    const checkIn = new Date(session.checkInDate);
    const today = new Date();
    const diffTime = today.getTime() - checkIn.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, days);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`🐾 ${t('modal.sessionDetails')}`}
      size="md"
    >
      <div className="space-y-6">
        {/* Pet Info */}
        <div className="flex items-center gap-4">
          {session.pet.photoUrl ? (
            <img
              src={session.pet.photoUrl}
              alt={session.pet.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-primary-200 dark:border-primary-700"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-3xl">
              {speciesIcons[session.pet.species] || '🐾'}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-lg text-brand-dark dark:text-[var(--app-text-primary)]">
              {session.pet.name}
            </h3>
            <p className="text-sm text-brand-dark/60 dark:text-[var(--app-text-tertiary)]">
              {session.pet.breed || session.pet.species}
              {session.pet.gender && ` • ${session.pet.gender === 'MALE' ? '♂️' : '♀️'}`}
            </p>
          </div>
        </div>

        {/* Owner Info - using info-box CSS class */}
        <div className="info-box">
          <h4 className="font-medium text-brand-dark dark:text-[var(--app-text-primary)] mb-3">
            👤 {t('modal.ownerInfo', 'Owner Information')}
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <UserIcon className="w-4 h-4 text-brand-dark/60 dark:text-gray-400" />
              <span className="text-brand-dark dark:text-[var(--app-text-primary)]">
                {session.pet.owner.firstName} {session.pet.owner.lastName}
              </span>
            </div>
            {displayPhone && (
              <div className="flex items-center gap-2 text-sm">
                <PhoneIcon className="w-4 h-4 text-brand-dark/60 dark:text-gray-400" />
                <span className="text-brand-dark dark:text-[var(--app-text-primary)]" dir="ltr">
                  {displayPhone}
                </span>
              </div>
            )}
            {session.pet.owner.email && (
              <div className="flex items-center gap-2 text-sm">
                <EnvelopeIcon className="w-4 h-4 text-brand-dark/60 dark:text-gray-400" />
                <span className="text-brand-dark dark:text-[var(--app-text-primary)]">
                  {session.pet.owner.email}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Session Info */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-brand-dark/60 dark:text-[var(--app-text-tertiary)]">
              <CalendarDaysIcon className="w-4 h-4" />
              <span>{t('modal.checkIn', 'Check-in')}</span>
            </div>
            <span className="text-sm font-medium text-brand-dark dark:text-[var(--app-text-primary)]">
              {formatDate(session.checkInDate)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-brand-dark/60 dark:text-[var(--app-text-tertiary)]">
              <CalendarDaysIcon className="w-4 h-4" />
              <span>{t('modal.expectedCheckout', 'Expected Checkout')}</span>
            </div>
            <span className="text-sm font-medium text-brand-dark dark:text-[var(--app-text-primary)]">
              {formatDate(session.expectedCheckOutDate)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-brand-dark/60 dark:text-[var(--app-text-tertiary)]">
              <ClockIcon className="w-4 h-4" />
              <span>{t('modal.stayDuration', 'Stay Duration')}</span>
            </div>
            <span className="text-sm font-medium text-brand-dark dark:text-[var(--app-text-primary)]">
              {calculateDays()} {t('modal.days', 'days')}
            </span>
          </div>

          {session.dailyRate && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-brand-dark/60 dark:text-[var(--app-text-tertiary)]">
                <CurrencyDollarIcon className="w-4 h-4" />
                <span>{t('modal.dailyRate', 'Daily Rate')}</span>
              </div>
              <span className="text-sm font-medium text-brand-dark dark:text-[var(--app-text-primary)]">
                {parseFloat(session.dailyRate.toString()).toFixed(2)} SAR
              </span>
            </div>
          )}

          {session.notes && (
            <div className="mt-4">
              <div className="flex items-center gap-2 text-sm text-brand-dark/60 dark:text-[var(--app-text-tertiary)] mb-2">
                <DocumentTextIcon className="w-4 h-4" />
                <span>{t('modal.notes', 'Notes')}</span>
              </div>
              <p className="text-sm text-brand-dark dark:text-[var(--app-text-primary)] bg-primary-50 dark:bg-primary-900/20 p-3 rounded-lg">
                {session.notes}
              </p>
            </div>
          )}

          {session.assignedVet && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-primary-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-sm text-brand-dark/60 dark:text-[var(--app-text-tertiary)]">
                <UserIcon className="w-4 h-4" />
                <span>{t('modal.assignedVet', 'Assigned Vet')}</span>
              </div>
              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                Dr. {session.assignedVet.firstName} {session.assignedVet.lastName}
              </span>
            </div>
          )}
        </div>

        {/* Days Remaining Badge */}
        <div className="flex justify-center">
          <span
            className={`px-4 py-2 text-sm font-medium rounded-full ${
              (session.daysRemaining || 0) <= 1
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                : (session.daysRemaining || 0) <= 3
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
            }`}
          >
            {session.daysRemaining === 1
              ? t('card.dayRemaining')
              : t('card.daysRemaining', { count: session.daysRemaining || 0 })}
          </span>
        </div>

        {/* Checkout Button - using shared Button component */}
        {hasFullAccess && onCheckout && (
          <div className="pt-4 border-t border-primary-200 dark:border-gray-700">
            <Button
              onClick={onCheckout}
              className="w-full !bg-green-500 hover:!bg-green-600"
            >
              ✅ {t('card.checkout')}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default BoardingSessionModal;
