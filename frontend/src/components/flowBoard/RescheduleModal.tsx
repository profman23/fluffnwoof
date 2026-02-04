import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, CalendarIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline';
import { FlowBoardAppointment, User } from '../../types';
import { flowBoardApi } from '../../api/flowBoard';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: FlowBoardAppointment | null;
  onSuccess: () => void;
}

export const RescheduleModal = ({
  isOpen,
  onClose,
  appointment,
  onSuccess,
}: RescheduleModalProps) => {
  const { t } = useTranslation('flowBoard');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [vetId, setVetId] = useState('');
  const [staffList, setStaffList] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load staff list
  useEffect(() => {
    const loadStaff = async () => {
      try {
        const staff = await flowBoardApi.getStaff();
        setStaffList(staff);
      } catch (err) {
        console.error('Failed to load staff:', err);
      }
    };
    loadStaff();
  }, []);

  // Helper to format date to yyyy-MM-dd
  const formatDateForInput = (dateStr: string | undefined): string => {
    if (!dateStr) return '';
    // If already in yyyy-MM-dd format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    // If ISO format, extract date part
    if (dateStr.includes('T')) return dateStr.split('T')[0];
    // Try to parse and format
    try {
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // Initialize form with current appointment data
  useEffect(() => {
    if (appointment) {
      setDate(formatDateForInput(appointment.appointmentDate));
      setTime(appointment.appointmentTime || '');
      setVetId(appointment.vet?.id || '');
      setError('');
    }
  }, [appointment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointment) return;

    setLoading(true);
    setError('');

    try {
      await flowBoardApi.reschedule(appointment.id, {
        appointmentDate: date,
        appointmentTime: time,
        vetId: vetId,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to reschedule:', err);
      if (err.response?.data?.error === 'TIME_CONFLICT') {
        setError(t('errors.timeConflict'));
      } else {
        setError(t('form.error'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !appointment) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Modal */}
      <div className="relative bg-white dark:bg-[var(--app-bg-card)] rounded-xl shadow-2xl dark:shadow-black/50 w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              {t('menu.reschedule')}
            </h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Client & Pet Info (Readonly) */}
          <div className="bg-gray-50 dark:bg-[var(--app-bg-tertiary)] rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                  {t('form.owner')}
                </label>
                <p className="font-medium text-gray-900 dark:text-[var(--app-text-primary)]">
                  {appointment.pet?.owner
                    ? `${appointment.pet.owner.firstName} ${appointment.pet.owner.lastName}`
                    : '-'}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                  {t('form.pet')}
                </label>
                <p className="font-medium text-gray-900 dark:text-[var(--app-text-primary)]">
                  {appointment.pet?.name || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="space-y-4">
            {/* Date */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-[var(--app-text-secondary)] mb-1 flex items-center gap-1">
                <CalendarIcon className="w-4 h-4" />
                {t('form.date')}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[var(--app-border-default)] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)]"
                required
              />
            </div>

            {/* Time */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-[var(--app-text-secondary)] mb-1 flex items-center gap-1">
                <ClockIcon className="w-4 h-4" />
                {t('form.time')}
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[var(--app-border-default)] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)]"
                required
              />
            </div>

            {/* Doctor/Vet */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-[var(--app-text-secondary)] mb-1 flex items-center gap-1">
                <UserIcon className="w-4 h-4" />
                {t('form.staff')}
              </label>
              <select
                value={vetId}
                onChange={(e) => setVetId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[var(--app-border-default)] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)]"
                required
              >
                <option value="">{t('form.loading')}</option>
                {staffList.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.firstName} {staff.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-[var(--app-border-default)] text-gray-700 dark:text-[var(--app-text-secondary)] rounded-lg hover:bg-gray-50 dark:hover:bg-[var(--app-bg-elevated)] transition-colors"
            >
              {t('form.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {loading ? t('form.saving') : t('form.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
