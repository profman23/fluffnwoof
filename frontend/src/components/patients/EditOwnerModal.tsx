import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { ownersApi, UpdateOwnerInput } from '../../api/owners';
import { Owner } from '../../types';

interface EditOwnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  owner: Owner;
}

interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export const EditOwnerModal: React.FC<EditOwnerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  owner,
}) => {
  const { t } = useTranslation('patients');

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  // Load owner data when modal opens
  useEffect(() => {
    if (isOpen && owner) {
      setFormData({
        firstName: owner.firstName,
        lastName: owner.lastName,
        phone: owner.phone,
        email: owner.email || '',
        address: owner.address || '',
        notes: owner.notes || '',
      });
      setErrors({});
      setApiError('');
    }
  }, [isOpen, owner]);

  const handleClose = () => {
    setErrors({});
    setApiError('');
    onClose();
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = t('errors.firstNameRequired');
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = t('errors.lastNameRequired');
    }
    if (!formData.phone.trim()) {
      newErrors.phone = t('errors.phoneRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setApiError('');

    try {
      const updateData: UpdateOwnerInput = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      };

      await ownersApi.update(owner.id, updateData);
      onSuccess();
      handleClose();
    } catch (error: any) {
      setApiError(error.response?.data?.message || t('messages.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    setApiError('');
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('editOwner')} size="md">
      <form onSubmit={handleSubmit}>
        {/* API Error */}
        {apiError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {apiError}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('owner.firstName')}
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              error={errors.firstName}
              required
            />
            <Input
              label={t('owner.lastName')}
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              error={errors.lastName}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('owner.phone')}
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              error={errors.phone}
              required
              dir="ltr"
            />
            <Input
              label={t('owner.email')}
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              dir="ltr"
            />
          </div>

          <Input
            label={t('owner.address')}
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('owner.notes')}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            {t('cancel')}
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? t('loading') : t('save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
