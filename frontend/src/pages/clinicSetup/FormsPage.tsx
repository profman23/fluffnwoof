/**
 * Forms & Certificates Page
 * Manage form templates for pet forms and certificates
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  formsApi,
  FormTemplate,
  FormCategory,
  CreateTemplateInput,
  UpdateTemplateInput,
} from '../../api/forms';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { LogoLoader } from '../../components/common/LogoLoader';
import { ScreenPermissionGuard } from '../../components/common/ScreenPermissionGuard';
import { useScreenPermission } from '../../hooks/useScreenPermission';
import { ReadOnlyBadge } from '../../components/common/ReadOnlyBadge';
import { FormTemplateModal } from '../../components/forms/FormTemplateModal';
import FormSettingsPanel from '../../components/forms/FormSettingsPanel';

// Category icons and colors
const CATEGORY_CONFIG: Record<FormCategory, { icon: string; color: string; bgColor: string }> = {
  BOARDING: { icon: '🏠', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  SURGERY: { icon: '🏥', color: 'text-red-600', bgColor: 'bg-red-100' },
  VACCINATION: { icon: '💉', color: 'text-green-600', bgColor: 'bg-green-100' },
  GROOMING: { icon: '✂️', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  CONSENT: { icon: '✅', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  DISCHARGE: { icon: '📋', color: 'text-teal-600', bgColor: 'bg-teal-100' },
  OTHER: { icon: '📄', color: 'text-gray-600', bgColor: 'bg-gray-100' },
};

export const FormsPage: React.FC = () => {
  const { t, i18n } = useTranslation('forms');
  const queryClient = useQueryClient();
  const isRTL = i18n.language === 'ar';
  const { canModify, isReadOnly } = useScreenPermission('formsAndCertificates');

  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<FormTemplate | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<FormCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<FormTemplate | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 5000);
  };

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['form-templates', showInactive, selectedCategory, searchQuery],
    queryFn: () =>
      formsApi.getTemplates({
        category: selectedCategory === 'ALL' ? undefined : selectedCategory,
        isActive: showInactive ? undefined : true,
        search: searchQuery || undefined,
      }),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: formsApi.createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-templates'] });
      showSuccess(t('templateCreated'));
      closeModal();
    },
    onError: () => {
      showError(t('errors.createFailed'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTemplateInput }) =>
      formsApi.updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-templates'] });
      showSuccess(t('templateUpdated'));
      closeModal();
    },
    onError: () => {
      showError(t('errors.updateFailed'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: formsApi.deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-templates'] });
      showSuccess(t('templateDeleted'));
      setDeleteConfirm(null);
    },
    onError: () => {
      showError(t('errors.deleteFailed'));
      setDeleteConfirm(null);
    },
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingTemplate(null);
  };

  const openEditModal = (template: FormTemplate) => {
    setEditingTemplate(template);
    setShowModal(true);
  };

  const handleSaveTemplate = (data: CreateTemplateInput | UpdateTemplateInput) => {
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: data as UpdateTemplateInput });
    } else {
      createMutation.mutate(data as CreateTemplateInput);
    }
  };

  const handleDelete = (template: FormTemplate) => {
    setDeleteConfirm(template);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteMutation.mutate(deleteConfirm.id);
    }
  };

  const categories: (FormCategory | 'ALL')[] = ['ALL', 'BOARDING', 'SURGERY', 'VACCINATION', 'GROOMING', 'CONSENT', 'DISCHARGE', 'OTHER'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LogoLoader size="lg" />
      </div>
    );
  }

  return (
    <ScreenPermissionGuard screenName="formsAndCertificates">
      <div className="p-6">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-400 rounded-lg">
            ✅ {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg">
            ❌ {errorMessage}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-[var(--app-text-primary)] flex items-center gap-2">
              📝 {t('title')}
            </h1>
            <p className="text-gray-600 dark:text-[var(--app-text-secondary)] mt-1">{t('subtitle')}</p>
            {isReadOnly && (
              <div className="mt-2">
                <ReadOnlyBadge />
              </div>
            )}
          </div>

          {canModify && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-[var(--app-bg-elevated)] rounded-lg transition-colors"
                title={t('settings.title')}
              >
                <Cog6ToothIcon className="w-6 h-6" />
              </button>
              <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
                <PlusIcon className="w-5 h-5" />
                {t('addTemplate')}
              </Button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-[var(--app-bg-elevated)] text-gray-700 dark:text-[var(--app-text-secondary)] hover:bg-gray-200 dark:hover:bg-[var(--app-bg-tertiary)]'
                }`}
              >
                {category === 'ALL' ? (
                  t('categories.all')
                ) : (
                  <>
                    {CATEGORY_CONFIG[category].icon} {t(`categories.${category.toLowerCase()}`)}
                  </>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex-1 max-w-xs">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-[var(--app-border-default)] bg-white dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Show Inactive Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-[var(--app-text-secondary)]">{t('showInactive')}</span>
          </label>
        </div>

        {/* Templates Grid */}
        {templates.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-[var(--app-bg-tertiary)] rounded-xl">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-[var(--app-text-primary)] mb-2">{t('noTemplates')}</h3>
            <p className="text-gray-500 dark:text-gray-400">{t('noTemplatesHint')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isRTL={isRTL}
                canModify={canModify}
                onEdit={() => openEditModal(template)}
                onDelete={() => handleDelete(template)}
                t={t}
              />
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <FormTemplateModal
            isOpen={showModal}
            template={editingTemplate}
            onClose={closeModal}
            onSave={handleSaveTemplate}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        )}

        {/* Delete Confirmation */}
        <ConfirmationModal
          isOpen={!!deleteConfirm}
          title={t('deleteConfirmTitle')}
          message={t('deleteConfirmMessage', { name: isRTL ? deleteConfirm?.nameAr : deleteConfirm?.nameEn })}
          confirmLabel={t('delete')}
          cancelLabel={t('cancel')}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm(null)}
          variant="danger"
        />

        {/* Form Settings Panel */}
        <FormSettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
      </div>
    </ScreenPermissionGuard>
  );
};

// Template Card Component
interface TemplateCardProps {
  template: FormTemplate;
  isRTL: boolean;
  canModify: boolean;
  onEdit: () => void;
  onDelete: () => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isRTL,
  canModify,
  onEdit,
  onDelete,
  t,
}) => {
  const categoryConfig = CATEGORY_CONFIG[template.category];

  return (
    <div
      className={`bg-white dark:bg-[var(--app-bg-card)] rounded-xl shadow-sm dark:shadow-black/30 border border-gray-100 dark:border-[var(--app-border-default)] overflow-hidden hover:shadow-md transition-shadow ${
        !template.isActive ? 'opacity-60' : ''
      }`}
    >
      {/* Header */}
      <div className={`px-4 py-3 ${categoryConfig.bgColor} dark:bg-opacity-20 border-b dark:border-[var(--app-border-default)]`}>
        <div className="flex items-center justify-between">
          <span className={`text-2xl`}>{categoryConfig.icon}</span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${categoryConfig.bgColor} ${categoryConfig.color}`}
          >
            {t(`categories.${template.category.toLowerCase()}`)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 dark:text-[var(--app-text-primary)] mb-1">
          {isRTL ? template.nameAr : template.nameEn}
        </h3>
        <p className="text-sm text-gray-500 dark:text-[var(--app-text-secondary)] mb-3">
          {isRTL ? template.nameEn : template.nameAr}
        </p>

        {/* Signature Requirements */}
        <div className="flex flex-wrap gap-2 mb-3">
          {template.requiresClientSignature && (
            <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full">
              ✍️ {t('requiresClientSignature')}
            </span>
          )}
          {template.requiresVetSignature && (
            <span className="px-2 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
              🩺 {t('requiresVetSignature')}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
          <span>
            {t('usedCount', { count: template._count?.petForms || 0 })}
          </span>
          {!template.isActive && (
            <span className="px-2 py-1 bg-gray-100 dark:bg-[var(--app-bg-elevated)] text-gray-600 dark:text-gray-400 text-xs rounded-full">
              {t('inactive')}
            </span>
          )}
        </div>

        {/* Actions */}
        {canModify && (
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
            >
              <PencilIcon className="w-4 h-4" />
              {t('edit')}
            </button>
            <button
              onClick={onDelete}
              className="flex items-center justify-center px-3 py-2 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormsPage;
