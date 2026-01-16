import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { usersApi } from '../../api/users';
import { User } from '../../types';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User | null;
}

interface FormData {
  newPassword: string;
  confirmPassword: string;
}

interface FormErrors {
  newPassword?: string;
  confirmPassword?: string;
}

const initialFormData: FormData = {
  newPassword: '',
  confirmPassword: '',
};

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  user,
}) => {
  const { t } = useTranslation('users');

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleClose = () => {
    setFormData(initialFormData);
    setErrors({});
    setApiError('');
    onClose();
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.newPassword) {
      newErrors.newPassword = t('errors.passwordRequired');
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = t('errors.passwordMin');
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = t('errors.passwordMismatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    setApiError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !user) return;

    setLoading(true);
    setApiError('');

    try {
      await usersApi.changePassword(user.id, formData.newPassword);
      onSuccess();
      handleClose();
    } catch (error: any) {
      setApiError(error.response?.data?.message || t('messages.error'));
    } finally {
      setLoading(false);
    }
  };

  const userName = user ? `${user.firstName} ${user.lastName}` : '';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('changePassword')} size="md">
      <form onSubmit={handleSubmit}>
        {/* User Info */}
        <div className="mb-4 p-3 bg-gray-100 rounded-lg">
          <span className="text-sm text-gray-600">{t('changingPasswordFor')}: </span>
          <span className="font-medium">{userName}</span>
        </div>

        {/* API Error */}
        {apiError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {apiError}
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-4">
          <Input
            type="password"
            label={t('newPassword')}
            value={formData.newPassword}
            onChange={handleInputChange('newPassword')}
            error={errors.newPassword}
            required
            dir="ltr"
          />
          <Input
            type="password"
            label={t('confirmNewPassword')}
            value={formData.confirmPassword}
            onChange={handleInputChange('confirmPassword')}
            error={errors.confirmPassword}
            required
            dir="ltr"
          />
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
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? t('loading') : t('save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
