import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shiftsApi, VetSchedulePeriod, DayOfWeek, SchedulePeriodInput, VetWithSchedulePeriods } from '../../api/shifts';
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { LogoLoader } from '../../components/common/LogoLoader';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { DataTable, Column } from '../../components/common/DataTable';
import { ScreenPermissionGuard } from '../../components/common/ScreenPermissionGuard';
import { useScreenPermission } from '../../hooks/useScreenPermission';
import { ReadOnlyBadge } from '../../components/common/ReadOnlyBadge';

const DAYS_OF_WEEK: DayOfWeek[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

// Helper functions
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (dateStr: string, locale: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const ShiftsManagement: React.FC = () => {
  const { t, i18n } = useTranslation('clinicSetup');
  const queryClient = useQueryClient();
  const isRTL = i18n.language === 'ar';
  const { canModify, isReadOnly } = useScreenPermission('shiftsManagement');

  // State
  const [selectedVet, setSelectedVet] = useState<VetWithSchedulePeriods | null>(null);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<VetSchedulePeriod | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<VetSchedulePeriod | null>(null);
  const [expandedVetId, setExpandedVetId] = useState<string | null>(null);

  // Form state for period modal
  const [periodForm, setPeriodForm] = useState<SchedulePeriodInput>({
    startDate: formatDate(new Date()),
    endDate: formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // +30 days
    workingDays: ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'],
    workStartTime: '09:00',
    workEndTime: '18:00',
    breakStartTime: '12:00',
    breakEndTime: '13:00',
  });

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

  // Fetch all vets with their schedule periods
  const { data: vets = [], isLoading } = useQuery({
    queryKey: ['vets-with-schedule-periods'],
    queryFn: shiftsApi.getAllVetsWithSchedulePeriods,
  });

  // Mutations
  const createPeriodMutation = useMutation({
    mutationFn: (data: { vetId: string; period: SchedulePeriodInput }) =>
      shiftsApi.createSchedulePeriod(data.vetId, data.period),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vets-with-schedule-periods'] });
      showSuccess(isRTL ? 'تم إنشاء فترة الجدولة بنجاح' : 'Schedule period created successfully');
      closePeriodModal();
    },
    onError: () => showError(isRTL ? 'فشل في إنشاء فترة الجدولة' : 'Failed to create schedule period'),
  });

  const updatePeriodMutation = useMutation({
    mutationFn: (data: { id: string; period: Partial<SchedulePeriodInput> }) =>
      shiftsApi.updateSchedulePeriod(data.id, data.period),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vets-with-schedule-periods'] });
      showSuccess(isRTL ? 'تم تحديث فترة الجدولة بنجاح' : 'Schedule period updated successfully');
      closePeriodModal();
    },
    onError: () => showError(isRTL ? 'فشل في تحديث فترة الجدولة' : 'Failed to update schedule period'),
  });

  const deletePeriodMutation = useMutation({
    mutationFn: shiftsApi.deleteSchedulePeriod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vets-with-schedule-periods'] });
      showSuccess(isRTL ? 'تم حذف فترة الجدولة بنجاح' : 'Schedule period deleted successfully');
      setDeleteConfirm(null);
    },
    onError: () => showError(isRTL ? 'فشل في حذف فترة الجدولة' : 'Failed to delete schedule period'),
  });

  // Open modal for creating new period
  const openCreateModal = (vet: VetWithSchedulePeriods) => {
    setSelectedVet(vet);
    setEditingPeriod(null);
    setPeriodForm({
      startDate: formatDate(new Date()),
      endDate: formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
      workingDays: ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'],
      workStartTime: '09:00',
      workEndTime: '18:00',
      breakStartTime: '12:00',
      breakEndTime: '13:00',
    });
    setShowPeriodModal(true);
  };

  // Open modal for editing period
  const openEditModal = (vet: VetWithSchedulePeriods, period: VetSchedulePeriod) => {
    setSelectedVet(vet);
    setEditingPeriod(period);
    setPeriodForm({
      startDate: period.startDate.split('T')[0],
      endDate: period.endDate.split('T')[0],
      workingDays: period.workingDays,
      workStartTime: period.workStartTime,
      workEndTime: period.workEndTime,
      breakStartTime: period.breakStartTime || '',
      breakEndTime: period.breakEndTime || '',
    });
    setShowPeriodModal(true);
  };

  // Close modal
  const closePeriodModal = () => {
    setShowPeriodModal(false);
    setSelectedVet(null);
    setEditingPeriod(null);
  };

  // Handle form submit
  const handleSubmit = () => {
    if (!selectedVet) return;

    const periodData: SchedulePeriodInput = {
      ...periodForm,
      breakStartTime: periodForm.breakStartTime || undefined,
      breakEndTime: periodForm.breakEndTime || undefined,
    };

    if (editingPeriod) {
      updatePeriodMutation.mutate({ id: editingPeriod.id, period: periodData });
    } else {
      createPeriodMutation.mutate({ vetId: selectedVet.id, period: periodData });
    }
  };

  // Toggle day selection
  const toggleDay = (day: DayOfWeek) => {
    setPeriodForm(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day],
    }));
  };

  const getDayLabel = (day: DayOfWeek) => {
    const labels: Record<DayOfWeek, { en: string; ar: string }> = {
      SUNDAY: { en: 'Sun', ar: 'أحد' },
      MONDAY: { en: 'Mon', ar: 'إثنين' },
      TUESDAY: { en: 'Tue', ar: 'ثلاثاء' },
      WEDNESDAY: { en: 'Wed', ar: 'أربعاء' },
      THURSDAY: { en: 'Thu', ar: 'خميس' },
      FRIDAY: { en: 'Fri', ar: 'جمعة' },
      SATURDAY: { en: 'Sat', ar: 'سبت' },
    };
    return isRTL ? labels[day].ar : labels[day].en;
  };

  // Get current period summary for display
  const getCurrentPeriodSummary = (vet: VetWithSchedulePeriods) => {
    if (vet.schedulePeriods.length === 0) {
      return isRTL ? 'لا توجد فترات جدولة' : 'No schedule periods';
    }

    const activePeriod = vet.schedulePeriods[0]; // Already sorted by startDate desc
    const today = new Date();
    const startDate = new Date(activePeriod.startDate);
    const endDate = new Date(activePeriod.endDate);

    if (today >= startDate && today <= endDate) {
      return `${activePeriod.workStartTime} - ${activePeriod.workEndTime}`;
    }

    return isRTL ? `${vet.schedulePeriods.length} فترات` : `${vet.schedulePeriods.length} periods`;
  };

  // DataTable columns
  const columns: Column<VetWithSchedulePeriods>[] = [
    {
      id: 'employee',
      header: isRTL ? '👤 الموظف' : '👤 Employee',
      render: (vet) => (
        <div className="flex items-center gap-3">
          {vet.avatarUrl ? (
            <img
              src={vet.avatarUrl}
              alt={`${vet.firstName} ${vet.lastName}`}
              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center border-2 border-primary-200 flex-shrink-0">
              <UserIcon className="w-5 h-5 text-primary-600" />
            </div>
          )}
          <span className="text-sm font-medium text-gray-900 dark:text-[var(--app-text-primary)]">
            {vet.firstName} {vet.lastName}
          </span>
        </div>
      ),
    },
    {
      id: 'role',
      header: isRTL ? '🏷️ الوظيفة' : '🏷️ Role',
      render: (vet) => (
        <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-[var(--app-bg-elevated)] text-gray-700 dark:text-gray-300 rounded-full">
          {vet.role}
        </span>
      ),
    },
    {
      id: 'currentSchedule',
      header: isRTL ? '🕐 الدوام الحالي' : '🕐 Current Schedule',
      render: (vet) => (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <ClockIcon className="w-4 h-4 flex-shrink-0" />
          <span>{getCurrentPeriodSummary(vet)}</span>
        </div>
      ),
    },
    {
      id: 'periods',
      header: isRTL ? '📋 عدد الفترات' : '📋 Periods',
      render: (vet) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          vet.schedulePeriods.length > 0
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-gray-100 text-gray-500 dark:bg-[var(--app-bg-elevated)] dark:text-gray-400'
        }`}>
          {vet.schedulePeriods.length}
        </span>
      ),
    },
  ];

  // Render actions for each row
  const renderActions = (vet: VetWithSchedulePeriods) => {
    if (!canModify) return null;
    return (
      <button
        onClick={() => openCreateModal(vet)}
        className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
        title={isRTL ? 'إضافة فترة' : 'Add Period'}
      >
        <PlusIcon className="w-5 h-5" />
      </button>
    );
  };

  // Render expanded row with schedule periods
  const renderExpandedRow = (vet: VetWithSchedulePeriods) => {
    if (vet.schedulePeriods.length === 0) {
      return (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          <CalendarDaysIcon className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p>{isRTL ? 'لا توجد فترات جدولة' : 'No schedule periods'}</p>
          {canModify && (
            <Button
              onClick={() => openCreateModal(vet)}
              variant="secondary"
              className="mt-3"
            >
              <PlusIcon className="w-4 h-4 me-1" />
              {isRTL ? 'إضافة فترة' : 'Add Period'}
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {vet.schedulePeriods.map((period) => (
          <div
            key={period.id}
            className="bg-white dark:bg-[var(--app-bg-card)] border dark:border-[var(--app-border-default)] rounded-lg p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                {/* Date Range */}
                <div className="flex items-center gap-2 text-base font-medium text-gray-900 dark:text-[var(--app-text-primary)] mb-2">
                  <CalendarDaysIcon className="w-5 h-5 text-primary-600 flex-shrink-0" />
                  <span className="truncate">
                    {formatDisplayDate(period.startDate, i18n.language)}
                    {' → '}
                    {formatDisplayDate(period.endDate, i18n.language)}
                  </span>
                </div>

                {/* Working Days */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <span
                      key={day}
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        period.workingDays.includes(day)
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-400 dark:bg-[var(--app-bg-elevated)] dark:text-gray-500'
                      }`}
                    >
                      {getDayLabel(day)}
                    </span>
                  ))}
                </div>

                {/* Work Hours & Break */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <ClockIcon className="w-4 h-4" />
                    <span>
                      {isRTL ? 'الدوام:' : 'Work:'} {period.workStartTime} - {period.workEndTime}
                    </span>
                  </div>
                  {period.breakStartTime && period.breakEndTime && (
                    <div className="flex items-center gap-1 text-orange-600">
                      <span>
                        {isRTL ? 'الاستراحة:' : 'Break:'} {period.breakStartTime} - {period.breakEndTime}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Period Actions */}
              {canModify && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEditModal(vet, period)}
                    className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                    title={isRTL ? 'تعديل' : 'Edit'}
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(period)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title={isRTL ? 'حذف' : 'Delete'}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <ScreenPermissionGuard screenName="shiftsManagement">
        <LogoLoader />
      </ScreenPermissionGuard>
    );
  }

  return (
    <ScreenPermissionGuard screenName="shiftsManagement">
      <div className="page-container">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="fixed top-4 right-4 z-50 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-400 px-4 py-3 rounded shadow-lg">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="fixed top-4 right-4 z-50 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded shadow-lg">
            {errorMessage}
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📅</span>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-[var(--app-text-primary)]">{t('shifts.title')}</h1>
            {isReadOnly && <ReadOnlyBadge />}
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isRTL
              ? 'إدارة فترات جدولة الأطباء - حدد فترة زمنية مع أيام العمل وساعات الدوام'
              : 'Manage doctor schedule periods - Define time periods with working days and hours'}
          </p>
        </div>

        {/* Employees DataTable */}
        <DataTable<VetWithSchedulePeriods>
          tableId="shifts"
          columns={columns}
          data={vets}
          loading={isLoading}
          emptyIcon="📅"
          emptyMessage={isRTL ? 'لا يوجد موظفين' : 'No employees found'}
          rowKey="id"
          showExpandColumn={true}
          expandedRowId={expandedVetId}
          onExpandToggle={setExpandedVetId}
          renderExpandedRow={renderExpandedRow}
          renderActions={canModify ? renderActions : undefined}
          actionsHeader={isRTL ? 'الإجراءات' : 'Actions'}
        />

        {/* Add/Edit Period Modal */}
        <Modal
          isOpen={showPeriodModal}
          onClose={closePeriodModal}
          title={
            editingPeriod
              ? (isRTL ? '✏️ تعديل فترة الجدولة' : '✏️ Edit Schedule Period')
              : (isRTL ? '➕ إضافة فترة جدولة جديدة' : '➕ Add New Schedule Period')
          }
          size="lg"
        >
          <div className="space-y-5">
            {/* Vet Name */}
            {selectedVet && (
              <div className="p-3 bg-gray-50 dark:bg-[var(--app-bg-tertiary)] rounded-lg flex items-center gap-3">
                {selectedVet.avatarUrl ? (
                  <img
                    src={selectedVet.avatarUrl}
                    alt={`${selectedVet.firstName} ${selectedVet.lastName}`}
                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center border-2 border-primary-200">
                    <UserIcon className="w-5 h-5 text-primary-600" />
                  </div>
                )}
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">🩺 {isRTL ? 'الطبيب:' : 'Doctor:'}</span>
                  <span className="font-medium ms-2 dark:text-[var(--app-text-primary)]">
                    {selectedVet.firstName} {selectedVet.lastName}
                  </span>
                </div>
              </div>
            )}

            {/* Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">📅 {isRTL ? 'من تاريخ' : 'From Date'}</label>
                <input
                  type="date"
                  value={periodForm.startDate}
                  onChange={(e) => setPeriodForm({ ...periodForm, startDate: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">📅 {isRTL ? 'إلى تاريخ' : 'To Date'}</label>
                <input
                  type="date"
                  value={periodForm.endDate}
                  onChange={(e) => setPeriodForm({ ...periodForm, endDate: e.target.value })}
                  className="input"
                  min={periodForm.startDate}
                />
              </div>
            </div>

            {/* Working Days */}
            <div>
              <label className="label">📆 {isRTL ? 'أيام العمل' : 'Working Days'}</label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      periodForm.workingDays.includes(day)
                        ? 'bg-primary-100 dark:bg-primary-900/30 border-primary-500 text-primary-700 dark:text-primary-400'
                        : 'bg-white dark:bg-[var(--app-bg-elevated)] border-gray-200 dark:border-[var(--app-border-default)] text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    {getDayLabel(day)}
                  </button>
                ))}
              </div>
            </div>

            {/* Work Hours */}
            <div>
              <label className="label">🕐 {isRTL ? 'ساعات العمل' : 'Work Hours'}</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{isRTL ? 'من' : 'From'}</label>
                  <input
                    type="time"
                    value={periodForm.workStartTime}
                    onChange={(e) => setPeriodForm({ ...periodForm, workStartTime: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{isRTL ? 'إلى' : 'To'}</label>
                  <input
                    type="time"
                    value={periodForm.workEndTime}
                    onChange={(e) => setPeriodForm({ ...periodForm, workEndTime: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
            </div>

            {/* Break Time */}
            <div>
              <label className="label">
                ☕ {isRTL ? 'فترة الاستراحة (اختياري)' : 'Break Time (Optional)'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{isRTL ? 'من' : 'From'}</label>
                  <input
                    type="time"
                    value={periodForm.breakStartTime}
                    onChange={(e) => setPeriodForm({ ...periodForm, breakStartTime: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{isRTL ? 'إلى' : 'To'}</label>
                  <input
                    type="time"
                    value={periodForm.breakEndTime}
                    onChange={(e) => setPeriodForm({ ...periodForm, breakEndTime: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {isRTL
                  ? 'اترك الحقول فارغة إذا لم يكن هناك استراحة'
                  : 'Leave empty if there is no break'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t dark:border-[var(--app-border-default)]">
            <Button variant="secondary" onClick={closePeriodModal}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !periodForm.startDate ||
                !periodForm.endDate ||
                periodForm.workingDays.length === 0 ||
                !periodForm.workStartTime ||
                !periodForm.workEndTime ||
                createPeriodMutation.isPending ||
                updatePeriodMutation.isPending
              }
            >
              {createPeriodMutation.isPending || updatePeriodMutation.isPending
                ? (isRTL ? 'جاري الحفظ...' : 'Saving...')
                : editingPeriod
                ? (isRTL ? 'تحديث' : 'Update')
                : (isRTL ? 'إنشاء' : 'Create')}
            </Button>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => deleteConfirm && deletePeriodMutation.mutate(deleteConfirm.id)}
          title={isRTL ? '🗑️ حذف فترة الجدولة' : '🗑️ Delete Schedule Period'}
          message={
            isRTL
              ? 'هل أنت متأكد من حذف فترة الجدولة هذه؟ لا يمكن التراجع عن هذا الإجراء.'
              : 'Are you sure you want to delete this schedule period? This action cannot be undone.'
          }
          confirmText={isRTL ? 'حذف' : 'Delete'}
          cancelText={isRTL ? 'إلغاء' : 'Cancel'}
          variant="danger"
          loading={deletePeriodMutation.isPending}
        />
      </div>
    </ScreenPermissionGuard>
  );
};
