import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { usersApi, CreateUserInput } from '../../api/users';
import { rolesApi } from '../../api/roles';
import { Role } from '../../types';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  roleId: string;
  phone: string;
  isBookable: boolean;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  roleId?: string;
}

const initialFormData: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  roleId: '',
  phone: '',
  isBookable: false,
};

export const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t, i18n } = useTranslation('users');
  const isRtl = i18n.language === 'ar';

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [apiError, setApiError] = useState('');

  // Load roles when modal opens
  useEffect(() => {
    if (isOpen) {
      loadRoles();
    }
  }, [isOpen]);

  const loadRoles = async () => {
    try {
      const data = await rolesApi.getAllRoles();
      setRoles(data);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

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

    if (!formData.firstName.trim()) {
      newErrors.firstName = t('errors.firstNameRequired');
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = t('errors.lastNameRequired');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('errors.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('errors.emailInvalid');
    }

    if (!formData.password) {
      newErrors.password = t('errors.passwordRequired');
    } else if (formData.password.length < 8) {
      newErrors.password = t('errors.passwordMin');
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('errors.passwordMismatch');
    }

    if (!formData.roleId) {
      newErrors.roleId = t('errors.roleRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    // Clear error when user starts typing
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
      const userData: CreateUserInput = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        roleId: formData.roleId,
        phone: formData.phone.trim() || undefined,
        isBookable: formData.isBookable,
      };

      await usersApi.create(userData);

      setSuccessMessage(t('messages.userCreated'));
      onSuccess();

      if (andAddAnother) {
        // Reset form but keep modal open
        setFormData(initialFormData);
        setErrors({});
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        // Close modal after short delay
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

  const getRoleDisplayName = (role: Role): string => {
    return isRtl ? (role.displayNameAr || role.name) : (role.displayNameEn || role.name);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('addUser')} size="lg">
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
          {/* Name Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('firstName')}
              value={formData.firstName}
              onChange={handleInputChange('firstName')}
              error={errors.firstName}
              required
            />
            <Input
              label={t('lastName')}
              value={formData.lastName}
              onChange={handleInputChange('lastName')}
              error={errors.lastName}
              required
            />
          </div>

          {/* Email */}
          <Input
            type="email"
            label={t('email')}
            value={formData.email}
            onChange={handleInputChange('email')}
            error={errors.email}
            required
            dir="ltr"
          />

          {/* Password Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="password"
              label={t('password')}
              value={formData.password}
              onChange={handleInputChange('password')}
              error={errors.password}
              required
              dir="ltr"
            />
            <Input
              type="password"
              label={t('confirmPassword')}
              value={formData.confirmPassword}
              onChange={handleInputChange('confirmPassword')}
              error={errors.confirmPassword}
              required
              dir="ltr"
            />
          </div>

          {/* Role Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[var(--app-text-secondary)] mb-1">
              {t('role')} <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.roleId}
              onChange={handleInputChange('roleId')}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] ${
                errors.roleId ? 'border-red-500' : 'border-gray-300 dark:border-[var(--app-border-default)]'
              }`}
            >
              <option value="">{t('selectRole')}</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {getRoleDisplayName(role)}
                </option>
              ))}
            </select>
            {errors.roleId && (
              <p className="mt-1 text-sm text-red-500">{errors.roleId}</p>
            )}
          </div>

          {/* Phone (Optional) */}
          <Input
            type="tel"
            label={t('phoneOptional')}
            value={formData.phone}
            onChange={handleInputChange('phone')}
            dir="ltr"
          />

          {/* Is Bookable Checkbox */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="isBookable"
              checked={formData.isBookable}
              onChange={(e) => setFormData((prev) => ({ ...prev, isBookable: e.target.checked }))}
              className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-[var(--app-border-default)] rounded dark:bg-[var(--app-bg-elevated)]"
            />
            <div>
              <label htmlFor="isBookable" className="text-sm font-medium text-gray-700 dark:text-[var(--app-text-secondary)] cursor-pointer">
                {t('isBookable')}
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('isBookableHint')}</p>
            </div>
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
            {loading ? t('loading') : t('save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
