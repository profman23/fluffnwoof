/**
 * Assign Form Modal
 * Modal to select and assign a form template to a pet
 */

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { formsApi, FormTemplate, FormCategory } from '../../api/forms';
import { MagnifyingGlassIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface AssignFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (templateId: string) => void;
  isAssigning?: boolean;
}

const CATEGORY_ICONS: Record<FormCategory, string> = {
  BOARDING: '🏠',
  SURGERY: '🏥',
  VACCINATION: '💉',
  GROOMING: '✂️',
  CONSENT: '✅',
  DISCHARGE: '📋',
  OTHER: '📄',
};

export const AssignFormModal: React.FC<AssignFormModalProps> = ({
  isOpen,
  onClose,
  onAssign,
  isAssigning = false,
}) => {
  const { t, i18n } = useTranslation(['flowBoard', 'forms']);
  const isRTL = i18n.language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FormCategory | 'ALL'>('ALL');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Fetch active templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['form-templates', { isActive: true }],
    queryFn: () => formsApi.getTemplates({ isActive: true }),
    enabled: isOpen,
  });

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      // Category filter
      if (selectedCategory !== 'ALL' && template.category !== selectedCategory) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          template.nameEn.toLowerCase().includes(query) ||
          template.nameAr.includes(query)
        );
      }
      return true;
    });
  }, [templates, selectedCategory, searchQuery]);

  // Group templates by category
  const groupedTemplates = useMemo(() => {
    const groups: Record<string, FormTemplate[]> = {};
    filteredTemplates.forEach((template) => {
      if (!groups[template.category]) {
        groups[template.category] = [];
      }
      groups[template.category].push(template);
    });
    return groups;
  }, [filteredTemplates]);

  const handleAssign = () => {
    if (selectedTemplateId) {
      onAssign(selectedTemplateId);
    }
  };

  const categories: (FormCategory | 'ALL')[] = ['ALL', 'BOARDING', 'SURGERY', 'VACCINATION', 'GROOMING', 'CONSENT', 'DISCHARGE', 'OTHER'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`📝 ${t('flowBoard:forms.selectTemplate')}`}
      size="lg"
    >
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('flowBoard:forms.searchTemplates')}
            className="w-full ps-10 pe-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat === 'ALL' ? (
                t('forms:all')
              ) : (
                <>
                  {CATEGORY_ICONS[cat]} {t(`forms:categories.${cat.toLowerCase()}`)}
                </>
              )}
            </button>
          ))}
        </div>

        {/* Templates List */}
        <div className="max-h-[400px] overflow-y-auto border rounded-lg">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12 px-4">
              <DocumentTextIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">{t('flowBoard:forms.noTemplatesFound')}</p>
              <p className="text-gray-400 text-sm mt-1">{t('flowBoard:forms.noTemplatesHint')}</p>
            </div>
          ) : (
            <div className="divide-y">
              {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                <div key={category}>
                  <div className="bg-gray-50 px-4 py-2 text-sm font-medium text-gray-600 flex items-center gap-2 sticky top-0">
                    <span>{CATEGORY_ICONS[category as FormCategory]}</span>
                    <span>{t(`forms:categories.${category.toLowerCase()}`)}</span>
                    <span className="text-gray-400">({categoryTemplates.length})</span>
                  </div>
                  {categoryTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplateId(template.id)}
                      className={`w-full text-start px-4 py-3 hover:bg-primary-50 transition-colors flex items-center gap-3 ${
                        selectedTemplateId === template.id
                          ? 'bg-primary-100 border-s-4 border-primary-500'
                          : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {isRTL ? template.nameAr : template.nameEn}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {isRTL ? template.nameEn : template.nameAr}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        {template.requiresClientSignature && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                            {t('flowBoard:forms.clientSignature')}
                          </span>
                        )}
                        {template.requiresVetSignature && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">
                            {t('flowBoard:forms.vetSignature')}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose} disabled={isAssigning}>
          {t('forms:cancel')}
        </Button>
        <Button
          type="button"
          onClick={handleAssign}
          disabled={!selectedTemplateId || isAssigning}
        >
          {isAssigning ? t('flowBoard:forms.assigning') : t('flowBoard:forms.assignForm')}
        </Button>
      </div>
    </Modal>
  );
};

export default AssignFormModal;
