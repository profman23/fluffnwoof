/**
 * Checkout Modal Component
 * Confirmation dialog for checking out a pet from boarding/ICU
 * Uses shared ConfirmationModal component
 */

import { useTranslation } from 'react-i18next';
import { BoardingSessionWithDetails, Species } from '../../api/boarding';
import { ConfirmationModal } from '../common/ConfirmationModal';

interface CheckoutModalProps {
  session: BoardingSessionWithDetails;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
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

export const CheckoutModal = ({
  session,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: CheckoutModalProps) => {
  const { t } = useTranslation('boardingManagement');

  // Calculate stay duration and total
  const calculateDays = () => {
    const checkIn = new Date(session.checkInDate);
    const today = new Date();
    const diffTime = today.getTime() - checkIn.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, days);
  };

  const days = calculateDays();
  const dailyRate = session.dailyRate ? parseFloat(session.dailyRate.toString()) : 0;
  const totalAmount = days * dailyRate;

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`🏥 ${t('modal.checkoutConfirm', 'Confirm Checkout')}`}
      variant="warning"
      loading={isLoading}
      confirmText={t('card.checkout')}
      cancelText={t('common.cancel', 'Cancel')}
      message={
        <div className="text-start space-y-4">
          {/* Pet Info */}
          <div className="flex items-center gap-3">
            {session.pet.photoUrl ? (
              <img
                src={session.pet.photoUrl}
                alt={session.pet.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-primary-200 dark:border-primary-700"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-2xl">
                {speciesIcons[session.pet.species] || '🐾'}
              </div>
            )}
            <div>
              <h3 className="font-medium text-brand-dark dark:text-[var(--app-text-primary)]">
                {session.pet.name}
              </h3>
              <p className="text-sm text-brand-dark/60 dark:text-[var(--app-text-tertiary)]">
                {session.pet.owner.firstName} {session.pet.owner.lastName}
              </p>
            </div>
          </div>

          {/* Summary - using info-box CSS class */}
          <div className="info-box space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-brand-dark/70 dark:text-[var(--app-text-secondary)]">
                {t('modal.stayDuration', 'Stay Duration')}
              </span>
              <span className="font-medium text-brand-dark dark:text-[var(--app-text-primary)]">
                {days} {t('modal.days', 'days')}
              </span>
            </div>

            {dailyRate > 0 && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-brand-dark/70 dark:text-[var(--app-text-secondary)]">
                    {t('modal.dailyRate', 'Daily Rate')}
                  </span>
                  <span className="font-medium text-brand-dark dark:text-[var(--app-text-primary)]">
                    {dailyRate.toFixed(2)} SAR
                  </span>
                </div>

                <div className="border-t border-primary-200 dark:border-gray-700 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-brand-dark dark:text-[var(--app-text-primary)]">
                      {t('modal.total', 'Total')}
                    </span>
                    <span className="font-bold text-lg text-green-600 dark:text-green-400">
                      {totalAmount.toFixed(2)} SAR
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Warning text */}
          <p className="text-sm text-amber-700 dark:text-amber-400">
            {t('modal.checkoutWarning', 'This action cannot be undone. The pet will be marked as checked out.')}
          </p>
        </div>
      }
    />
  );
};

export default CheckoutModal;
