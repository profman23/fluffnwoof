import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { usePhonePermission, maskPhoneNumber } from '../../hooks/useScreenPermission';
import { LostCustomer } from '../../api/reports';

interface CustomerContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: LostCustomer | null;
}

/**
 * Lightweight customer-contact modal for the Lost Customers report.
 * The phone number is hidden behind a "Show number" button. Revealing it
 * still respects the `patients.hidePhone` permission (masked even when shown),
 * exactly like EditOwnerModal / PatientDetails.
 */
export const CustomerContactModal: React.FC<CustomerContactModalProps> = ({
  isOpen,
  onClose,
  customer,
}) => {
  const { t } = useTranslation('reports');
  const { canViewPhone } = usePhonePermission();
  const [showPhone, setShowPhone] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reset reveal state whenever the modal closes
  const handleClose = () => {
    setShowPhone(false);
    setCopied(false);
    onClose();
  };

  if (!customer) return null;

  const displayedPhone = canViewPhone
    ? customer.phone
    : maskPhoneNumber(customer.phone || '');

  const handleCopy = async () => {
    if (!canViewPhone || !customer.phone) return;
    try {
      await navigator.clipboard.writeText(customer.phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard not available — silently ignore
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`👤 ${t('lostCustomers.modal.title')}`}
      size="sm"
    >
      <div className="space-y-3">
        <Row label={t('lostCustomers.modal.name')} value={customer.ownerName} />
        <Row label={t('lostCustomers.modal.customerCode')} value={customer.customerCode} ltr />
        <Row label={t('lostCustomers.modal.email')} value={customer.email || '-'} ltr />
        <Row label={t('lostCustomers.modal.pet')} value={customer.petName} />

        {/* Phone — hidden behind Show number */}
        <div className="pt-3 border-t border-gray-200 dark:border-[var(--app-border-default)]">
          <p className="text-sm font-medium text-gray-700 dark:text-[var(--app-text-secondary)] mb-2">
            {t('lostCustomers.modal.phone')}
          </p>
          {showPhone ? (
            <div className="flex items-center gap-3">
              <span
                className="text-lg font-semibold text-gray-900 dark:text-[var(--app-text-primary)]"
                dir="ltr"
              >
                {displayedPhone || '-'}
              </span>
              {canViewPhone && customer.phone && (
                <Button type="button" variant="outline" onClick={handleCopy}>
                  {copied ? `✅ ${t('lostCustomers.modal.copied')}` : `📋 ${t('lostCustomers.modal.copy')}`}
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-lg tracking-widest text-gray-400 dark:text-gray-500">
                ••••••••
              </span>
              <Button type="button" variant="secondary" onClick={() => setShowPhone(true)}>
                👁️ {t('lostCustomers.modal.showNumber')}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-[var(--app-border-default)]">
        <Button type="button" variant="secondary" onClick={handleClose}>
          {t('lostCustomers.modal.close')}
        </Button>
      </div>
    </Modal>
  );
};

const Row: React.FC<{ label: string; value: string; ltr?: boolean }> = ({
  label,
  value,
  ltr,
}) => (
  <div className="flex items-center justify-between gap-4">
    <span className="text-sm font-medium text-gray-500 dark:text-[var(--app-text-secondary)]">
      {label}
    </span>
    <span
      className="text-sm text-gray-900 dark:text-[var(--app-text-primary)] text-right"
      dir={ltr ? 'ltr' : undefined}
    >
      {value}
    </span>
  </div>
);
