import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { rolesApi } from '../../api/roles';

interface AddRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  displayNameAr: string;
  displayNameEn: string;
  description: string;
}

interface FormErrors {
  name?: string;
  displayNameAr?: string;
  displayNameEn?: string;
}

const initialFormData: FormData = {
  name: '',
  displayNameAr: '',
  displayNameEn: '',
  description: '',
};

export const AddRoleModal: React.FC<AddRoleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation('roles');

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [apiError, setApiError] = useState('');

  const resetForm = () => {
    setFormData(initialFormData);
    setErrors({});
    setSuccessMessage('');
    setApiError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t('errors.nameRequired');
    } else if (!/^[A-Z][A-Z0-9_]*$/.test(formData.name.trim())) {
      newErrors.name = t('errors.nameInvalid');
    }

    if (!formData.displayNameAr.trim()) {
      newErrors.displayNameAr = t('errors.displayNameArRequired');
    }

    if (!formData.displayNameEn.trim()) {
      newErrors.displayNameEn = t('errors.displayNameEnRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    let value = e.target.value;

    // Auto-uppercase the name field
    if (field === 'name') {
      value = value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
    }

    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    setApiError('');
  };

  const handleSubmit = async (andAddAnother: boolean = false) => {
    if (!validateForm()) return;

    setLoading(true);
    setApiError('');

    try {
      await rolesApi.createRole({
        name: formData.name.trim(),
        displayNameAr: formData.displayNameAr.trim(),
        displayNameEn: formData.displayNameEn.trim(),
        description: formData.description.trim() || undefined,
      });

      setSuccessMessage(t('messages.roleCreated'));
      onSuccess();

      if (andAddAnother) {
        setFormData(initialFormData);
        setErrors({});
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setTimeout(() => {
          handleClose();
        }, 500);
      }
    } catch (error: any) {
      setApiError(error.response?.data?.message || t('messages.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('addRole')} size="lg">
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(false); }}>
        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-400 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* API Error */}
        {apiError && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg">
            {apiError}
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-4">
          {/* System Name */}
          <div>
            <Input
              label={t('roleName')}
              value={formData.name}
              onChange={handleInputChange('name')}
              error={errors.name}
              required
              dir="ltr"
              placeholder="CUSTOM_ROLE"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t('roleNameHint')}
            </p>
          </div>

          {/* Display Names Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('displayNameAr')}
              value={formData.displayNameAr}
              onChange={handleInputChange('displayNameAr')}
              error={errors.displayNameAr}
              required
              dir="rtl"
            />
            <Input
              label={t('displayNameEn')}
              value={formData.displayNameEn}
              onChange={handleInputChange('displayNameEn')}
              error={errors.displayNameEn}
              required
              dir="ltr"
            />
          </div>

          {/* Description (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[var(--app-text-secondary)] mb-1">
              {t('description')}
            </label>
            <textarea
              value={formData.description}
              onChange={handleInputChange('description')}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-[var(--app-border-default)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] resize-none"
              placeholder={t('descriptionPlaceholder')}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-[var(--app-border-default)]">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            {t('cancel')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleSubmit(true)}
            disabled={loading}
          >
            {t('saveAndAddAnother')}
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? t('messages.saving') : t('saveChanges')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
