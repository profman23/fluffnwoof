import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { remindersApi, ReminderSetting, ReminderEventType, UpdateReminderSettingInput } from '../../api/reminders';

interface ReminderSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  setting: ReminderSetting | null;
  eventType: ReminderEventType;
}

const timingOptions = [
  { value: null, label: 'immediately' },
  { value: 24, label: '1day' },
  { value: 48, label: '2days' },
  { value: 72, label: '3days' },
  { value: 168, label: '1week' },
];

const templateVariables = [
  'petName',
  'ownerName',
  'appointmentDate',
  'appointmentTime',
  'visitType',
  'vetName',
  'clinicName',
  'clinicPhone',
];

export const ReminderSettingModal: React.FC<ReminderSettingModalProps> = ({
  isOpen,
  onClose,
  setting,
  eventType,
}) => {
  const { t, i18n } = useTranslation('reminders');
  const queryClient = useQueryClient();
  const isRtl = i18n.language === 'ar';

  // Form state
  const [isEnabled, setIsEnabled] = useState(false);
  const [sendBeforeHours, setSendBeforeHours] = useState<number | null>(null);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [templateAr, setTemplateAr] = useState('');
  const [templateEn, setTemplateEn] = useState('');

  // Initialize form with setting data
  useEffect(() => {
    if (setting) {
      setIsEnabled(setting.isEnabled);
      setSendBeforeHours(setting.sendBeforeHours);
      setSmsEnabled(setting.smsEnabled);
      setWhatsappEnabled(setting.whatsappEnabled);
      setEmailEnabled(setting.emailEnabled);
      setPushEnabled(setting.pushEnabled);
      setTemplateAr(setting.templateAr || '');
      setTemplateEn(setting.templateEn || '');
    }
  }, [setting]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateReminderSettingInput) =>
      remindersApi.updateSetting(eventType, data, setting?.reminderOrder || 1),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminder-settings'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      isEnabled,
      sendBeforeHours,
      smsEnabled,
      whatsappEnabled,
      emailEnabled,
      pushEnabled,
      templateAr: templateAr || null,
      templateEn: templateEn || null,
    });
  };

  const insertVariable = (variable: string, field: 'ar' | 'en') => {
    const varText = `{{${variable}}}`;
    if (field === 'ar') {
      setTemplateAr(prev => prev + varText);
    } else {
      setTemplateEn(prev => prev + varText);
    }
  };

  const needsTiming = ['PRE_APPOINTMENT', 'FOLLOW_UP'].includes(eventType);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">
              {t(`events.${eventType}.title`)}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-6">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">
                {t('settings.enabled')}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isEnabled}
                  onChange={(e) => setIsEnabled(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            {/* Timing (for PRE_APPOINTMENT and FOLLOW_UP) */}
            {needsTiming && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('timing.title')}
                </label>
                <select
                  value={sendBeforeHours ?? ''}
                  onChange={(e) => setSendBeforeHours(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {timingOptions.map((option) => (
                    <option key={option.label} value={option.value ?? ''}>
                      {t(`timing.${option.label}`)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Channels */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('channels.title')}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={smsEnabled}
                    onChange={(e) => setSmsEnabled(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm">💬 {t('channels.sms.title')}</span>
                </label>
                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={whatsappEnabled}
                    onChange={(e) => setWhatsappEnabled(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm">📱 {t('channels.whatsapp.title')}</span>
                </label>
                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={emailEnabled}
                    onChange={(e) => setEmailEnabled(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm">📧 {t('channels.email.title')}</span>
                </label>
                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-not-allowed bg-gray-50 opacity-50">
                  <input
                    type="checkbox"
                    checked={pushEnabled}
                    disabled
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <span className="text-sm">🔔 {t('channels.push.title')}</span>
                </label>
              </div>
            </div>

            {/* Variables */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('templates.variables.title')}
              </label>
              <div className="flex flex-wrap gap-2">
                {templateVariables.map((variable) => (
                  <button
                    key={variable}
                    type="button"
                    onClick={() => insertVariable(variable, isRtl ? 'ar' : 'en')}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700"
                  >
                    {`{{${variable}}}`} - {t(`templates.variables.${variable}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Templates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Arabic Template */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('templates.arabic')}
                </label>
                <textarea
                  value={templateAr}
                  onChange={(e) => setTemplateAr(e.target.value)}
                  rows={4}
                  dir="rtl"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="مثال: مرحباً {{ownerName}}، موعد {{petName}} غداً..."
                />
              </div>

              {/* English Template */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('templates.english')}
                </label>
                <textarea
                  value={templateEn}
                  onChange={(e) => setTemplateEn(e.target.value)}
                  rows={4}
                  dir="ltr"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Example: Hello {{ownerName}}, {{petName}}'s appointment is tomorrow..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
              >
                {t('settings.enabled') === 'Enabled' ? 'Cancel' : 'إلغاء'}
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {updateMutation.isPending ? t('settings.saving') : t('settings.save')}
              </button>
            </div>

            {/* Success/Error messages */}
            {updateMutation.isSuccess && (
              <div className="text-green-600 text-sm text-center">
                {t('settings.saveSuccess')}
              </div>
            )}
            {updateMutation.isError && (
              <div className="text-red-600 text-sm text-center">
                {t('settings.saveError')}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
