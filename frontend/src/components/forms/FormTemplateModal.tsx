/**
 * Form Template Modal
 * Create/Edit form templates with rich text editor and variable insertion
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import {
  formsApi,
  FormTemplate,
  FormCategory,
  CreateTemplateInput,
  UpdateTemplateInput,
  FormVariable,
} from '../../api/forms';
import { getFormSettings } from '../../api/clinicSettings';
import { EyeIcon, DocumentTextIcon, PrinterIcon, SparklesIcon } from '@heroicons/react/24/outline';
import RichTextEditor, { RichTextEditorRef } from './RichTextEditor';
import { printProfessionalForm } from './FormPrintTemplate';

interface FormTemplateModalProps {
  isOpen: boolean;
  template: FormTemplate | null;
  onClose: () => void;
  onSave: (data: CreateTemplateInput | UpdateTemplateInput) => void;
  isLoading?: boolean;
}

const CATEGORIES: FormCategory[] = ['BOARDING', 'SURGERY', 'VACCINATION', 'GROOMING', 'CONSENT', 'DISCHARGE', 'OTHER'];

const CATEGORY_ICONS: Record<FormCategory, string> = {
  BOARDING: '🏠',
  SURGERY: '🏥',
  VACCINATION: '💉',
  GROOMING: '✂️',
  CONSENT: '✅',
  DISCHARGE: '📋',
  OTHER: '📄',
};

export const FormTemplateModal: React.FC<FormTemplateModalProps> = ({
  isOpen,
  template,
  onClose,
  onSave,
  isLoading = false,
}) => {
  const { t, i18n } = useTranslation('forms');
  const isRTL = i18n.language === 'ar';

  const [activeTab, setActiveTab] = useState<'arabic' | 'english'>('arabic');
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState<{ contentEn: string; contentAr: string } | null>(null);
  const [showVariables, setShowVariables] = useState(true);

  const [formData, setFormData] = useState<CreateTemplateInput>({
    nameEn: '',
    nameAr: '',
    contentEn: '',
    contentAr: '',
    category: 'OTHER',
    requiresClientSignature: true,
    requiresVetSignature: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Editor refs for inserting variables
  const editorArRef = useRef<RichTextEditorRef>(null);
  const editorEnRef = useRef<RichTextEditorRef>(null);

  // Fetch available variables
  const { data: variables = [] } = useQuery({
    queryKey: ['form-variables'],
    queryFn: formsApi.getAvailableVariables,
  });

  // Fetch global form settings for preview
  const { data: formSettings } = useQuery({
    queryKey: ['formSettings'],
    queryFn: getFormSettings,
  });

  // Initialize form data when editing
  useEffect(() => {
    if (template) {
      setFormData({
        nameEn: template.nameEn,
        nameAr: template.nameAr,
        contentEn: template.contentEn,
        contentAr: template.contentAr,
        category: template.category,
        requiresClientSignature: template.requiresClientSignature,
        requiresVetSignature: template.requiresVetSignature,
        headerLogoUrl: template.headerLogoUrl || undefined,
        footerText: template.footerText || undefined,
      });
    } else {
      setFormData({
        nameEn: '',
        nameAr: '',
        contentEn: '',
        contentAr: '',
        category: 'OTHER',
        requiresClientSignature: true,
        requiresVetSignature: true,
      });
    }
    setErrors({});
    setShowPreview(false);
    setPreviewContent(null);
  }, [template, isOpen]);

  const handleInputChange = (field: keyof CreateTemplateInput, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handlePreview = async () => {
    try {
      const preview = await formsApi.previewTemplate(formData.contentEn, formData.contentAr);
      setPreviewContent(preview);
      setShowPreview(true);
    } catch (error) {
      console.error('Failed to generate preview:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nameAr.trim()) {
      newErrors.nameAr = t('errors.nameArRequired');
    }
    if (!formData.nameEn.trim()) {
      newErrors.nameEn = t('errors.nameEnRequired');
    }
    // Check if content has actual text (strip HTML tags for validation)
    const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();
    if (!stripHtml(formData.contentAr)) {
      newErrors.contentAr = t('errors.contentArRequired');
    }
    if (!stripHtml(formData.contentEn)) {
      newErrors.contentEn = t('errors.contentEnRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  // Group variables by category
  const groupedVariables = variables.reduce((acc, v) => {
    const category = v.key.split('.')[0].replace('{', '');
    if (!acc[category]) acc[category] = [];
    acc[category].push(v);
    return acc;
  }, {} as Record<string, FormVariable[]>);

  // Insert variable into the active editor
  const insertVariable = (variable: FormVariable) => {
    // Insert into the currently active tab's editor
    if (activeTab === 'arabic' && editorArRef.current) {
      editorArRef.current.insertText(variable.key);
    } else if (activeTab === 'english' && editorEnRef.current) {
      editorEnRef.current.insertText(variable.key);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`📝 ${template ? t('editTemplate') : t('createTemplate')}`}
      size="xl"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={`🇸🇦 ${t('templateNameAr')}`}
              value={formData.nameAr}
              onChange={(e) => handleInputChange('nameAr', e.target.value)}
              error={errors.nameAr}
              dir="rtl"
              required
              placeholder="اتفاقية الإيواء"
            />
            <Input
              label={`🇬🇧 ${t('templateNameEn')}`}
              value={formData.nameEn}
              onChange={(e) => handleInputChange('nameEn', e.target.value)}
              error={errors.nameEn}
              required
              placeholder="Boarding Agreement"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[var(--app-text-secondary)] mb-2">
              🏷️ {t('category')}
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleInputChange('category', cat)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex flex-col items-center gap-1 ${
                    formData.category === cat
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-[var(--app-bg-elevated)] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[var(--app-bg-tertiary)]'
                  }`}
                >
                  <span className="text-xl">{CATEGORY_ICONS[cat]}</span>
                  <span className="text-xs">{t(`categories.${cat.toLowerCase()}`)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Signature Requirements */}
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requiresClientSignature}
                onChange={(e) => handleInputChange('requiresClientSignature', e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-[var(--app-text-secondary)]">✍️ {t('requiresClientSignature')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requiresVetSignature}
                onChange={(e) => handleInputChange('requiresVetSignature', e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-[var(--app-text-secondary)]">🩺 {t('requiresVetSignature')}</span>
            </label>
          </div>

          {/* Content Editor */}
          <div className="border dark:border-[var(--app-border-default)] rounded-xl overflow-hidden">
            {/* Language Tabs */}
            <div className="flex border-b border-gray-200 dark:border-[var(--app-border-default)] bg-gray-50 dark:bg-[var(--app-bg-tertiary)]">
              <button
                type="button"
                onClick={() => setActiveTab('arabic')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'arabic'
                    ? 'bg-white dark:bg-[var(--app-bg-card)] text-primary-700 dark:text-primary-400 border-b-2 border-primary-500'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                🇸🇦 العربية
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('english')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'english'
                    ? 'bg-white dark:bg-[var(--app-bg-card)] text-primary-700 dark:text-primary-400 border-b-2 border-primary-500'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                🇬🇧 English
              </button>
              <button
                type="button"
                onClick={() => setShowVariables(!showVariables)}
                className={`px-4 py-3 text-sm font-medium border-s dark:border-[var(--app-border-default)] transition-colors ${
                  showVariables ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
                title="Toggle Variables Panel"
              >
                <DocumentTextIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex">
              {/* Editor */}
              <div className="flex-1 p-4">
                {activeTab === 'arabic' ? (
                  <div>
                    <RichTextEditor
                      ref={editorArRef}
                      content={formData.contentAr}
                      onChange={(html) => handleInputChange('contentAr', html)}
                      placeholder="اكتب محتوى النموذج هنا... يمكنك استخدام المتغيرات من اللوحة الجانبية"
                      dir="rtl"
                      className={errors.contentAr ? 'border-red-500' : ''}
                    />
                    {errors.contentAr && (
                      <p className="mt-1 text-sm text-red-500">{errors.contentAr}</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <RichTextEditor
                      ref={editorEnRef}
                      content={formData.contentEn}
                      onChange={(html) => handleInputChange('contentEn', html)}
                      placeholder="Write the form content here... You can use variables from the side panel"
                      dir="ltr"
                      className={errors.contentEn ? 'border-red-500' : ''}
                    />
                    {errors.contentEn && (
                      <p className="mt-1 text-sm text-red-500">{errors.contentEn}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Variables Panel */}
              {showVariables && (
                <div className="w-64 border-s dark:border-[var(--app-border-default)] bg-gray-50 dark:bg-[var(--app-bg-tertiary)] p-3 overflow-y-auto max-h-[400px]">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-[var(--app-text-primary)] mb-3 flex items-center gap-1">
                    <DocumentTextIcon className="w-4 h-4" />
                    {t('variables')}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    {isRTL ? 'اضغط لإدراج المتغير' : 'Click to insert variable'}
                  </p>

                  {Object.entries(groupedVariables).map(([category, vars]) => (
                    <div key={category} className="mb-4">
                      <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">
                        {category}
                      </h5>
                      <div className="space-y-1">
                        {vars.map((v) => (
                          <button
                            key={v.key}
                            type="button"
                            onClick={() => insertVariable(v)}
                            className="w-full text-start px-2 py-1.5 text-xs bg-white dark:bg-[var(--app-bg-card)] border dark:border-[var(--app-border-default)] rounded hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
                            title={`${isRTL ? v.labelAr : v.labelEn} - ${v.example}`}
                          >
                            <code className="text-primary-600 dark:text-primary-400">{v.key}</code>
                            <span className="block text-gray-500 dark:text-gray-400 truncate">
                              {isRTL ? v.labelAr : v.labelEn}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Preview & Print Buttons */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handlePreview}
              className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              <EyeIcon className="w-4 h-4" />
              {t('preview')}
            </button>
          </div>

          {/* Preview Section */}
          {showPreview && previewContent && (
            <div className="border dark:border-[var(--app-border-default)] rounded-xl p-4 bg-gray-50 dark:bg-[var(--app-bg-tertiary)]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-700 dark:text-[var(--app-text-primary)]">{t('previewTitle')}</h4>
                <div className="flex items-center gap-2">
                  {/* Professional Print Button */}
                  <button
                    type="button"
                    onClick={async () => {
                      await printProfessionalForm(formSettings, {
                        content: previewContent.contentEn,
                        contentAr: previewContent.contentAr,
                        formName: formData.nameEn,
                        formNameAr: formData.nameAr,
                        showClientSignature: formData.requiresClientSignature,
                        showVetSignature: formData.requiresVetSignature,
                      });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 rounded-lg shadow-sm transition-all"
                    title={isRTL ? 'طباعة احترافية' : 'Professional Print'}
                  >
                    <SparklesIcon className="w-4 h-4" />
                    {isRTL ? 'طباعة احترافية' : 'Pro Print'}
                  </button>
                  {/* Simple Print Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        printWindow.document.write(`
                          <!DOCTYPE html>
                          <html>
                          <head>
                            <meta charset="UTF-8">
                            <title>Form Preview</title>
                            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                            <style>
                              * { box-sizing: border-box; }
                              body {
                                font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
                                padding: 30px;
                                font-size: ${formSettings?.fontSize || 14}px;
                                line-height: 1.8;
                                color: #333;
                              }
                              .page {
                                page-break-after: always;
                                padding: 20px;
                                max-width: 800px;
                                margin: 0 auto;
                              }
                              .page:last-child { page-break-after: avoid; }
                              .header {
                                text-align: center;
                                margin-bottom: 20px;
                                padding-bottom: 15px;
                                border-bottom: 2px solid #e5e7eb;
                              }
                              .header img { max-height: 80px; max-width: 200px; }
                              .header h2 { margin: 10px 0 5px; font-size: 1.5em; color: #1f2937; }
                              .header p { margin: 3px 0; color: #6b7280; font-size: 0.9em; }
                              .content { margin: 25px 0; text-align: justify; }
                              .content p { margin: 12px 0; }
                              .signatures { margin-top: 50px; padding-top: 20px; display: flex; justify-content: space-between; }
                              .signature-box { text-align: center; min-width: 180px; }
                              .signature-line { border-top: 1px solid #000; width: 150px; margin: 0 auto 8px; }
                              @media print { body { padding: 15px; } .page { padding: 10px; } }
                            </style>
                          </head>
                          <body>
                            <div class="page" dir="rtl">
                              <div class="header">
                                ${formSettings?.logoUrl ? `<img src="${formSettings.logoUrl}" alt="Logo">` : ''}
                                ${formSettings?.clinicNameAr ? `<h2>${formSettings.clinicNameAr}</h2>` : ''}
                                ${formSettings?.addressAr ? `<p>${formSettings.addressAr}</p>` : ''}
                              </div>
                              <div class="content">${previewContent.contentAr}</div>
                              <div class="signatures">
                                ${formSettings?.showClientSignature && formData.requiresClientSignature ? `<div class="signature-box"><div class="signature-line"></div><span>${formSettings.clientSignatureLabelAr || 'توقيع العميل'}</span></div>` : ''}
                                ${formSettings?.showVetSignature && formData.requiresVetSignature ? `<div class="signature-box"><div class="signature-line"></div><span>${formSettings.vetSignatureLabelAr || 'توقيع الطبيب'}</span></div>` : ''}
                              </div>
                            </div>
                            <div class="page" dir="ltr">
                              <div class="header">
                                ${formSettings?.logoUrl ? `<img src="${formSettings.logoUrl}" alt="Logo">` : ''}
                                ${formSettings?.clinicNameEn ? `<h2>${formSettings.clinicNameEn}</h2>` : ''}
                                ${formSettings?.addressEn ? `<p>${formSettings.addressEn}</p>` : ''}
                              </div>
                              <div class="content">${previewContent.contentEn}</div>
                              <div class="signatures">
                                ${formSettings?.showClientSignature && formData.requiresClientSignature ? `<div class="signature-box"><div class="signature-line"></div><span>${formSettings.clientSignatureLabelEn || 'Client Signature'}</span></div>` : ''}
                                ${formSettings?.showVetSignature && formData.requiresVetSignature ? `<div class="signature-box"><div class="signature-line"></div><span>${formSettings.vetSignatureLabelEn || 'Vet Signature'}</span></div>` : ''}
                              </div>
                            </div>
                          </body>
                          </html>
                        `);
                        printWindow.document.close();
                        printWindow.print();
                      }
                    }}
                    className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-[var(--app-bg-elevated)] rounded"
                    title={isRTL ? 'طباعة بسيطة' : 'Simple Print'}
                  >
                    <PrinterIcon className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPreview(false)}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {/* English Preview - Left */}
                <div className="bg-white dark:bg-[var(--app-bg-elevated)] p-4 rounded-lg border dark:border-[var(--app-border-default)]">
                  <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">English</h5>
                  {/* Header with Logo */}
                  {formSettings?.logoUrl && (
                    <div className={`mb-3 text-${formSettings.logoPosition}`}>
                      <img src={formSettings.logoUrl} alt="Logo" className="inline-block max-h-12" />
                    </div>
                  )}
                  {/* Clinic Info */}
                  {formSettings?.clinicNameEn && (
                    <div className="text-center mb-3 border-b dark:border-[var(--app-border-default)] pb-2">
                      <h3 className="font-bold text-lg dark:text-[var(--app-text-primary)]">{formSettings.clinicNameEn}</h3>
                      {formSettings.addressEn && <p className="text-xs text-gray-600 dark:text-gray-400">{formSettings.addressEn}</p>}
                      {formSettings.phoneNumber && <p className="text-xs text-gray-600 dark:text-gray-400">{formSettings.phoneNumber}</p>}
                    </div>
                  )}
                  {/* Content */}
                  <div
                    className="prose prose-sm max-w-none text-gray-800 dark:text-[var(--app-text-primary)]"
                    dir="ltr"
                    style={{ fontSize: `${formSettings?.fontSize || 14}px` }}
                    dangerouslySetInnerHTML={{ __html: previewContent.contentEn }}
                  />
                  {/* Signatures */}
                  <div className="mt-6 pt-4 border-t dark:border-[var(--app-border-default)] flex justify-between">
                    {formSettings?.showClientSignature && formData.requiresClientSignature && (
                      <div className="text-center">
                        <div className="border-t border-gray-400 dark:border-gray-500 w-24 mb-1"></div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">{formSettings.clientSignatureLabelEn || 'Client Signature'}</span>
                      </div>
                    )}
                    {formSettings?.showVetSignature && formData.requiresVetSignature && (
                      <div className="text-center">
                        <div className="border-t border-gray-400 dark:border-gray-500 w-24 mb-1"></div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">{formSettings.vetSignatureLabelEn || 'Vet Signature'}</span>
                      </div>
                    )}
                  </div>
                </div>
                {/* Arabic Preview - Right */}
                <div className="bg-white dark:bg-[var(--app-bg-elevated)] p-4 rounded-lg border dark:border-[var(--app-border-default)]">
                  <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">العربية</h5>
                  {/* Header with Logo */}
                  {formSettings?.logoUrl && (
                    <div className={`mb-3 text-${formSettings.logoPosition}`}>
                      <img src={formSettings.logoUrl} alt="Logo" className="inline-block max-h-12" />
                    </div>
                  )}
                  {/* Clinic Info */}
                  {formSettings?.clinicNameAr && (
                    <div className="text-center mb-3 border-b dark:border-[var(--app-border-default)] pb-2">
                      <h3 className="font-bold text-lg dark:text-[var(--app-text-primary)]">{formSettings.clinicNameAr}</h3>
                      {formSettings.addressAr && <p className="text-xs text-gray-600 dark:text-gray-400">{formSettings.addressAr}</p>}
                      {formSettings.phoneNumber && <p className="text-xs text-gray-600 dark:text-gray-400">{formSettings.phoneNumber}</p>}
                    </div>
                  )}
                  {/* Content */}
                  <div
                    className="prose prose-sm max-w-none text-gray-800 dark:text-[var(--app-text-primary)]"
                    dir="rtl"
                    style={{ fontSize: `${formSettings?.fontSize || 14}px` }}
                    dangerouslySetInnerHTML={{ __html: previewContent.contentAr }}
                  />
                  {/* Signatures */}
                  <div className="mt-6 pt-4 border-t dark:border-[var(--app-border-default)] flex justify-between">
                    {formSettings?.showClientSignature && formData.requiresClientSignature && (
                      <div className="text-center">
                        <div className="border-t border-gray-400 dark:border-gray-500 w-24 mb-1"></div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">{formSettings.clientSignatureLabelAr || 'توقيع العميل'}</span>
                      </div>
                    )}
                    {formSettings?.showVetSignature && formData.requiresVetSignature && (
                      <div className="text-center">
                        <div className="border-t border-gray-400 dark:border-gray-500 w-24 mb-1"></div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">{formSettings.vetSignatureLabelAr || 'توقيع الطبيب'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-[var(--app-border-default)]">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            {t('cancel')}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? t('saving') : t('save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default FormTemplateModal;
