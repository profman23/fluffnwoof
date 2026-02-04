import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getFormSettings,
  updateFormSettings,
  uploadFormLogo,
  removeFormLogo,
  UpdateFormSettingsData,
} from '../../api/clinicSettings';
import { Modal } from '../common/Modal';

interface FormSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FormSettingsPanel({ isOpen, onClose }: FormSettingsPanelProps) {
  const { t, i18n } = useTranslation(['forms']);
  const isRTL = i18n.language === 'ar';
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Messages state
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 5000);
  };

  // Local state for form values
  const [formData, setFormData] = useState<UpdateFormSettingsData>({
    logoPosition: 'center',
    clinicNameEn: '',
    clinicNameAr: '',
    addressEn: '',
    addressAr: '',
    phoneNumber: '',
    fontSize: 14,
    showClientSignature: true,
    clientSignatureLabelEn: '',
    clientSignatureLabelAr: '',
    showVetSignature: true,
    vetSignatureLabelEn: '',
    vetSignatureLabelAr: '',
  });

  // Fetch current settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['formSettings'],
    queryFn: getFormSettings,
    enabled: isOpen,
  });

  // Update local state when settings are loaded
  useEffect(() => {
    if (settings) {
      setFormData({
        logoPosition: settings.logoPosition,
        clinicNameEn: settings.clinicNameEn,
        clinicNameAr: settings.clinicNameAr,
        addressEn: settings.addressEn,
        addressAr: settings.addressAr,
        phoneNumber: settings.phoneNumber || '',
        fontSize: settings.fontSize,
        showClientSignature: settings.showClientSignature,
        clientSignatureLabelEn: settings.clientSignatureLabelEn,
        clientSignatureLabelAr: settings.clientSignatureLabelAr,
        showVetSignature: settings.showVetSignature,
        vetSignatureLabelEn: settings.vetSignatureLabelEn,
        vetSignatureLabelAr: settings.vetSignatureLabelAr,
      });
    }
  }, [settings]);

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: updateFormSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formSettings'] });
      showSuccess(t('settings.saved'));
    },
    onError: () => {
      showError(t('settings.saveFailed'));
    },
  });

  // Upload logo mutation
  const uploadLogoMutation = useMutation({
    mutationFn: uploadFormLogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formSettings'] });
      showSuccess(t('settings.logoUploaded'));
    },
    onError: () => {
      showError(t('settings.logoUploadFailed'));
    },
  });

  // Remove logo mutation
  const removeLogoMutation = useMutation({
    mutationFn: removeFormLogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formSettings'] });
      showSuccess(t('settings.logoRemoved'));
    },
    onError: () => {
      showError(t('settings.logoRemoveFailed'));
    },
  });

  const handleInputChange = (field: keyof UpdateFormSettingsData, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadLogoMutation.mutate(file);
    }
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={t('settings.title')}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`⚙️ ${t('settings.title')}`} size="lg">
      <div className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`}>
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="p-3 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-400 rounded-lg text-sm">
            ✅ {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg text-sm">
            ❌ {errorMessage}
          </div>
        )}

        {/* Logo Section */}
        <div className="border-b border-gray-200 dark:border-[var(--app-border-default)] pb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-[var(--app-text-primary)] mb-4">
            📷 {t('settings.logo')}
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 bg-gray-100 dark:bg-[var(--app-bg-elevated)] rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 dark:border-[var(--app-border-default)]">
              {settings?.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt="Clinic Logo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-gray-400 dark:text-gray-500 text-xs text-center px-2">{t('settings.noLogo')}</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleLogoUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadLogoMutation.isPending}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors"
              >
                {uploadLogoMutation.isPending ? t('settings.uploading') : t('settings.uploadLogo')}
              </button>
              {settings?.logoUrl && (
                <button
                  type="button"
                  onClick={() => removeLogoMutation.mutate()}
                  disabled={removeLogoMutation.isPending}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                >
                  {removeLogoMutation.isPending ? t('settings.removing') : t('settings.removeLogo')}
                </button>
              )}
            </div>
          </div>

          {/* Logo Position */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-[var(--app-text-secondary)] mb-2">
              {t('settings.logoPosition')}
            </label>
            <div className="flex gap-4">
              {(['left', 'center', 'right'] as const).map((position) => (
                <label key={position} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="logoPosition"
                    value={position}
                    checked={formData.logoPosition === position}
                    onChange={(e) => handleInputChange('logoPosition', e.target.value)}
                    className="w-4 h-4 text-primary-500"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {t(`settings.positions.${position}`)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Clinic Info Section */}
        <div className="border-b border-gray-200 dark:border-[var(--app-border-default)] pb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-[var(--app-text-primary)] mb-4">
            🏥 {t('settings.clinicInfo')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[var(--app-text-secondary)] mb-1">
                {t('settings.clinicNameEn')}
              </label>
              <input
                type="text"
                value={formData.clinicNameEn}
                onChange={(e) => handleInputChange('clinicNameEn', e.target.value)}
                className="input"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[var(--app-text-secondary)] mb-1">
                {t('settings.clinicNameAr')}
              </label>
              <input
                type="text"
                value={formData.clinicNameAr}
                onChange={(e) => handleInputChange('clinicNameAr', e.target.value)}
                className="input"
                dir="rtl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[var(--app-text-secondary)] mb-1">
                {t('settings.addressEn')}
              </label>
              <input
                type="text"
                value={formData.addressEn}
                onChange={(e) => handleInputChange('addressEn', e.target.value)}
                className="input"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[var(--app-text-secondary)] mb-1">
                {t('settings.addressAr')}
              </label>
              <input
                type="text"
                value={formData.addressAr}
                onChange={(e) => handleInputChange('addressAr', e.target.value)}
                className="input"
                dir="rtl"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-[var(--app-text-secondary)] mb-1">
                {t('settings.phoneNumber')}
              </label>
              <input
                type="text"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                className="input"
                dir="ltr"
                placeholder="+966..."
              />
            </div>
          </div>
        </div>

        {/* Font Size Section */}
        <div className="border-b border-gray-200 dark:border-[var(--app-border-default)] pb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-[var(--app-text-primary)] mb-4">
            🔤 {t('settings.font')}
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[var(--app-text-secondary)] mb-2">
              {t('settings.fontSize')}: <span className="text-primary-600 dark:text-primary-400 font-bold">{formData.fontSize}px</span>
            </label>
            <input
              type="range"
              min="10"
              max="24"
              value={formData.fontSize}
              onChange={(e) => handleInputChange('fontSize', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-[var(--app-bg-elevated)] rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>10px</span>
              <span>24px</span>
            </div>
          </div>
        </div>

        {/* Signature Settings Section */}
        <div className="pb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-[var(--app-text-primary)] mb-4">
            ✍️ {t('settings.signatures')}
          </h3>

          {/* Client Signature */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-[var(--app-bg-elevated)] rounded-lg">
            <label className="flex items-center gap-2 mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.showClientSignature}
                onChange={(e) => handleInputChange('showClientSignature', e.target.checked)}
                className="w-4 h-4 text-primary-500 rounded"
              />
              <span className="font-medium text-gray-900 dark:text-[var(--app-text-primary)]">
                {t('settings.clientSignature')}
              </span>
            </label>
            {formData.showClientSignature && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-[var(--app-text-secondary)] mb-1">
                    {t('settings.labelEn')}
                  </label>
                  <input
                    type="text"
                    value={formData.clientSignatureLabelEn}
                    onChange={(e) => handleInputChange('clientSignatureLabelEn', e.target.value)}
                    className="input"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-[var(--app-text-secondary)] mb-1">
                    {t('settings.labelAr')}
                  </label>
                  <input
                    type="text"
                    value={formData.clientSignatureLabelAr}
                    onChange={(e) => handleInputChange('clientSignatureLabelAr', e.target.value)}
                    className="input"
                    dir="rtl"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Vet Signature */}
          <div className="p-4 bg-gray-50 dark:bg-[var(--app-bg-elevated)] rounded-lg">
            <label className="flex items-center gap-2 mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.showVetSignature}
                onChange={(e) => handleInputChange('showVetSignature', e.target.checked)}
                className="w-4 h-4 text-primary-500 rounded"
              />
              <span className="font-medium text-gray-900 dark:text-[var(--app-text-primary)]">
                {t('settings.vetSignature')}
              </span>
            </label>
            {formData.showVetSignature && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-[var(--app-text-secondary)] mb-1">
                    {t('settings.labelEn')}
                  </label>
                  <input
                    type="text"
                    value={formData.vetSignatureLabelEn}
                    onChange={(e) => handleInputChange('vetSignatureLabelEn', e.target.value)}
                    className="input"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-[var(--app-text-secondary)] mb-1">
                    {t('settings.labelAr')}
                  </label>
                  <input
                    type="text"
                    value={formData.vetSignatureLabelAr}
                    onChange={(e) => handleInputChange('vetSignatureLabelAr', e.target.value)}
                    className="input"
                    dir="rtl"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-[var(--app-border-default)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[var(--app-bg-elevated)] rounded-lg transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors"
          >
            {updateMutation.isPending ? t('saving') : t('save')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
