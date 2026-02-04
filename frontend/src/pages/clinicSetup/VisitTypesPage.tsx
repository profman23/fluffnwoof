import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { visitTypesApi, VisitType, VisitTypeInput } from '../../api/visitTypes';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { LogoLoader } from '../../components/common/LogoLoader';
import { DataTable, Column } from '../../components/common/DataTable';
import { ScreenPermissionGuard } from '../../components/common/ScreenPermissionGuard';
import { useScreenPermission } from '../../hooks/useScreenPermission';
import { ReadOnlyBadge } from '../../components/common/ReadOnlyBadge';

const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
];

export const VisitTypesPage: React.FC = () => {
  const { t, i18n } = useTranslation('clinicSetup');
  const queryClient = useQueryClient();
  const isRTL = i18n.language === 'ar';
  const { canModify, isReadOnly } = useScreenPermission('visitTypes');

  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<VisitType | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<VisitType | null>(null);
  const [formData, setFormData] = useState<VisitTypeInput>({
    code: '',
    nameEn: '',
    nameAr: '',
    duration: 30,
    color: '#3B82F6',
    isActive: true,
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

  // Fetch visit types
  const { data: visitTypes = [], isLoading } = useQuery({
    queryKey: ['visit-types', showInactive],
    queryFn: () => visitTypesApi.getAll(showInactive),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: visitTypesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-types'] });
      showSuccess(t('visitTypes.created'));
      closeModal();
    },
    onError: () => {
      showError('Failed to create visit type');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VisitTypeInput> }) =>
      visitTypesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-types'] });
      showSuccess(t('visitTypes.updated'));
      closeModal();
    },
    onError: () => {
      showError('Failed to update visit type');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: visitTypesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-types'] });
      showSuccess(t('visitTypes.deleted'));
      setDeleteConfirm(null);
    },
    onError: () => {
      showError(t('visitTypes.cannotDeleteSystem'));
      setDeleteConfirm(null);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      visitTypesApi.toggleActive(id, isActive),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['visit-types'] });
      showSuccess(variables.isActive ? t('visitTypes.activated') : t('visitTypes.deactivated'));
    },
    onError: () => {
      showError('Failed to toggle status');
    },
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingType(null);
    setFormData({
      code: '',
      nameEn: '',
      nameAr: '',
      duration: 30,
      color: '#3B82F6',
      isActive: true,
    });
  };

  const openEditModal = (type: VisitType) => {
    setEditingType(type);
    setFormData({
      code: type.code,
      nameEn: type.nameEn,
      nameAr: type.nameAr,
      duration: type.duration,
      color: type.color,
      isActive: type.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingType) {
      updateMutation.mutate({ id: editingType.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (type: VisitType) => {
    if (type.isSystem) {
      showError(t('visitTypes.cannotDeleteSystem'));
      return;
    }
    setDeleteConfirm(type);
  };

  // DataTable columns definition
  const columns: Column<VisitType>[] = [
    {
      id: 'color',
      header: t('visitTypes.color'),
      render: (row) => (
        <div
          className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
          style={{ backgroundColor: row.color }}
        />
      ),
    },
    {
      id: 'nameEn',
      header: t('visitTypes.nameEn'),
      render: (row) => <span className="font-medium">{row.nameEn}</span>,
    },
    {
      id: 'nameAr',
      header: t('visitTypes.nameAr'),
      render: (row) => <span className="font-medium">{row.nameAr}</span>,
    },
    {
      id: 'code',
      header: t('visitTypes.code'),
      render: (row) => (
        <code className="text-xs bg-gray-100 dark:bg-[var(--app-bg-elevated)] dark:text-gray-300 px-2 py-1 rounded font-mono">{row.code}</code>
      ),
    },
    {
      id: 'duration',
      header: t('visitTypes.duration'),
      render: (row) => <span>{row.duration} {t('visitTypes.minutes')}</span>,
    },
    {
      id: 'status',
      header: isRTL ? 'الحالة' : 'Status',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            row.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-[var(--app-bg-elevated)] dark:text-gray-400'
          }`}>
            {row.isActive ? t('visitTypes.active') : t('visitTypes.inactive')}
          </span>
          {row.isSystem && (
            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              {t('visitTypes.system')}
            </span>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <ScreenPermissionGuard screenName="visitTypes">
        <LogoLoader />
      </ScreenPermissionGuard>
    );
  }

  return (
    <ScreenPermissionGuard screenName="visitTypes">
      <div className="page-container">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="fixed top-4 right-4 z-50 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-400 px-4 py-3 rounded shadow-lg animate-fade-in-up">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="fixed top-4 right-4 z-50 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded shadow-lg animate-fade-in-up">
            {errorMessage}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏥</span>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-[var(--app-text-primary)]">{t('visitTypes.title')}</h1>
              {isReadOnly && <ReadOnlyBadge />}
            </div>
            <p className="text-gray-600 dark:text-gray-400">{t('visitTypes.subtitle')}</p>
          </div>
          {canModify && (
            <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
              <PlusIcon className="w-5 h-5" />
              {t('visitTypes.addVisitType')}
            </Button>
          )}
        </div>

      {/* Show inactive toggle */}
      <div className="mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="form-checkbox h-4 w-4 text-primary-600 rounded dark:border-gray-600"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {isRTL ? 'عرض غير النشطة' : 'Show inactive'}
          </span>
        </label>
      </div>

      {/* Visit Types List */}
      <DataTable
        tableId="visit-types"
        columns={columns}
        data={visitTypes}
        rowKey="id"
        emptyMessage={t('visitTypes.noVisitTypes')}
        rowClassName={(row) => !row.isActive ? 'bg-gray-50 opacity-60' : ''}
        actionsHeader={canModify ? (isRTL ? 'الإجراءات' : 'Actions') : undefined}
        renderActions={canModify ? (type) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => openEditModal(type)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-[var(--app-bg-elevated)] rounded-lg transition-colors"
              title={t('visitTypes.editVisitType')}
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <Button
              variant={type.isActive ? 'secondary' : 'primary'}
              onClick={() => toggleActiveMutation.mutate({ id: type.id, isActive: !type.isActive })}
              className="text-xs px-2 py-1"
            >
              {type.isActive ? (isRTL ? 'إلغاء' : 'Deactivate') : (isRTL ? 'تفعيل' : 'Activate')}
            </Button>
            {!type.isSystem && (
              <button
                onClick={() => handleDelete(type)}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                title={t('visitTypes.delete')}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : undefined}
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingType ? t('visitTypes.editVisitType') : t('visitTypes.addVisitType')}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">
                {t('visitTypes.nameEn')} *
              </label>
              <input
                type="text"
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                className="input"
                required
                dir="ltr"
                placeholder="e.g., General Checkup"
              />
            </div>
            <div>
              <label className="label">
                {t('visitTypes.nameAr')} *
              </label>
              <input
                type="text"
                value={formData.nameAr}
                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                className="input"
                required
                dir="rtl"
                placeholder="مثال: فحص عام"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">
                {t('visitTypes.code')}
              </label>
              <input
                type="text"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                className="input font-mono"
                placeholder="AUTO_GENERATED"
                disabled={editingType?.isSystem}
                dir="ltr"
              />
            </div>
            <div>
              <label className="label">
                {t('visitTypes.duration')} *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                  className="input flex-1"
                  min="1"
                  max="480"
                  required
                />
                <span className="text-gray-500 text-sm whitespace-nowrap">{t('visitTypes.minutes')}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="label">
              {t('visitTypes.color')}
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 ${
                    formData.color === color ? 'border-gray-800 scale-110 shadow-md' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-12 h-10 rounded-lg cursor-pointer border border-gray-200"
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="input flex-1 font-mono"
                pattern="^#[0-9A-Fa-f]{6}$"
                dir="ltr"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={closeModal}>
              {t('visitTypes.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {isRTL ? 'جاري الحفظ...' : 'Saving...'}
                </span>
              ) : (
                t('visitTypes.save')
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
        title={isRTL ? 'تأكيد الحذف' : 'Confirm Delete'}
        message={isRTL
          ? `هل أنت متأكد من حذف "${deleteConfirm?.nameAr}"؟ لا يمكن التراجع عن هذا الإجراء.`
          : `Are you sure you want to delete "${deleteConfirm?.nameEn}"? This action cannot be undone.`
        }
        confirmText={isRTL ? 'حذف' : 'Delete'}
        cancelText={isRTL ? 'إلغاء' : 'Cancel'}
        variant="danger"
        loading={deleteMutation.isPending}
      />
      </div>
    </ScreenPermissionGuard>
  );
};
