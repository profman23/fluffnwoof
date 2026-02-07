/**
 * Pet Forms Section
 * Displays forms assigned to a pet with actions (send, sign, view)
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formsApi, PetForm, FormCategory } from '../../api/forms';
import { AssignFormModal } from './AssignFormModal';
import { SignaturePad } from './SignaturePad';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import {
  DocumentTextIcon,
  PlusIcon,
  PaperAirplaneIcon,
  PencilSquareIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  DeviceTabletIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline';
import { printProfessionalForm } from './FormPrintTemplate';
import { getFormSettings } from '../../api/clinicSettings';

interface PetFormsSectionProps {
  petId: string;
  appointmentId?: string;
  vetId?: string;
  isReadOnly?: boolean;
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

const STATUS_CONFIG = {
  DRAFT: { color: 'gray', icon: ClockIcon },
  PENDING_CLIENT: { color: 'yellow', icon: ClockIcon },
  PENDING_VET: { color: 'blue', icon: ClockIcon },
  COMPLETED: { color: 'green', icon: CheckCircleIcon },
  EXPIRED: { color: 'red', icon: ExclamationCircleIcon },
  CANCELLED: { color: 'gray', icon: ExclamationCircleIcon },
};

export const PetFormsSection: React.FC<PetFormsSectionProps> = ({
  petId,
  appointmentId,
  vetId,
  isReadOnly = false,
}) => {
  const { t, i18n } = useTranslation(['flowBoard', 'forms']);
  const isRTL = i18n.language === 'ar';
  const queryClient = useQueryClient();

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [showClientSignModal, setShowClientSignModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedForm, setSelectedForm] = useState<PetForm | null>(null);

  // Fetch form settings for printing
  const { data: formSettings } = useQuery({
    queryKey: ['formSettings'],
    queryFn: getFormSettings,
  });

  // Fetch pet forms (filtered by appointmentId when available)
  const { data: forms = [], isLoading } = useQuery({
    queryKey: ['pet-forms', petId, appointmentId],
    queryFn: () => formsApi.getPetForms(petId, appointmentId),
    enabled: !!petId,
  });

  // Assign form mutation
  const assignMutation = useMutation({
    mutationFn: (templateId: string) =>
      formsApi.attachFormToPet(petId, {
        templateId,
        appointmentId,
        vetId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet-forms', petId] });
      setShowAssignModal(false);
    },
  });

  // Send notification mutation
  const sendMutation = useMutation({
    mutationFn: (formId: string) => formsApi.sendFormNotification(formId, 'BOTH'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet-forms', petId] });
    },
  });

  // Sign form mutation (Vet)
  const signMutation = useMutation({
    mutationFn: ({ formId, signatureData }: { formId: string; signatureData: string }) =>
      formsApi.signFormAsStaff(formId, signatureData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet-forms', petId] });
      setShowSignModal(false);
      setSelectedForm(null);
    },
  });

  // Sign form mutation (Client from tablet)
  const signClientMutation = useMutation({
    mutationFn: ({ formId, signatureData }: { formId: string; signatureData: string }) =>
      formsApi.signFormAsClient(formId, signatureData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet-forms', petId] });
      setShowClientSignModal(false);
      setSelectedForm(null);
    },
  });

  const handleAssign = (templateId: string) => {
    assignMutation.mutate(templateId);
  };

  const handleSend = (formId: string) => {
    sendMutation.mutate(formId);
  };

  const handleSignClick = (form: PetForm) => {
    setSelectedForm(form);
    setShowSignModal(true);
  };

  const handleSign = (signatureData: string) => {
    if (selectedForm) {
      signMutation.mutate({ formId: selectedForm.id, signatureData });
    }
  };

  const handleClientSignClick = (form: PetForm) => {
    setSelectedForm(form);
    setShowClientSignModal(true);
  };

  const handleClientSign = (signatureData: string) => {
    if (selectedForm) {
      signClientMutation.mutate({ formId: selectedForm.id, signatureData });
    }
  };

  const handleViewClick = (form: PetForm) => {
    setSelectedForm(form);
    setShowViewModal(true);
  };

  const handlePrint = async (form: PetForm) => {
    await printProfessionalForm(formSettings, {
      content: form.filledContentEn || '',
      contentAr: form.filledContentAr || '',
      formName: form.template?.nameEn,
      formNameAr: form.template?.nameAr,
      showClientSignature: form.template?.requiresClientSignature,
      showVetSignature: form.template?.requiresVetSignature,
      clientSignatureUrl: form.signatures?.find(s => s.signerType === 'CLIENT')?.signatureData,
      vetSignatureUrl: form.signatures?.find(s => s.signerType === 'VET')?.signatureData,
      clientSignedAt: form.signatures?.find(s => s.signerType === 'CLIENT')?.signedAt,
      vetSignedAt: form.signatures?.find(s => s.signerType === 'VET')?.signedAt,
    });
  };

  const getStatusBadge = (status: PetForm['status']) => {
    const config = STATUS_CONFIG[status];
    const colorClasses: Record<string, string> = {
      gray: 'bg-gray-100 text-gray-700',
      yellow: 'bg-yellow-100 text-yellow-700',
      blue: 'bg-blue-100 text-blue-700',
      green: 'bg-green-100 text-green-700',
      red: 'bg-red-100 text-red-700',
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colorClasses[config.color] || colorClasses.gray}`}>
        <config.icon className="w-3.5 h-3.5" />
        {t(`flowBoard:forms.${status === 'PENDING_CLIENT' ? 'pendingClient' : status === 'PENDING_VET' ? 'pendingVet' : status.toLowerCase()}`)}
      </span>
    );
  };

  const hasClientSignature = (form: PetForm) => {
    return form.signatures?.some(s => s.signerType === 'CLIENT');
  };

  const hasVetSignature = (form: PetForm) => {
    return form.signatures?.some(s => s.signerType === 'VET');
  };

  const canSign = (form: PetForm) => {
    // Vet can sign if form requires vet signature and hasn't been signed by vet yet
    return form.template?.requiresVetSignature && !hasVetSignature(form) && form.status !== 'EXPIRED' && form.status !== 'CANCELLED';
  };

  const canClientSign = (form: PetForm) => {
    // Client can sign on tablet if form requires client signature and hasn't been signed by client yet
    return form.template?.requiresClientSignature && !hasClientSignature(form) && form.status !== 'EXPIRED' && form.status !== 'CANCELLED';
  };

  const canSend = (form: PetForm) => {
    // Can send if form requires client signature, hasn't been sent yet, and client hasn't signed yet
    return form.template?.requiresClientSignature && !form.notificationSentAt && !hasClientSignature(form) && form.status !== 'EXPIRED' && form.status !== 'CANCELLED';
  };

  const canPrint = (form: PetForm) => {
    // Can print if form has content
    return form.filledContentEn || form.filledContentAr;
  };

  return (
    <div className="bg-white rounded-xl border border-secondary-200 overflow-hidden">
      {/* Header */}
      <div className="bg-secondary-100 px-5 py-3 border-b border-secondary-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DocumentTextIcon className="w-5 h-5 text-secondary-600" />
          <h3 className="text-lg font-semibold text-brand-dark">{t('flowBoard:forms.title')}</h3>
          {forms.length > 0 && (
            <span className="bg-secondary-300 text-brand-dark px-2 py-0.5 rounded-full text-xs font-medium">
              {forms.length}
            </span>
          )}
        </div>
        {!isReadOnly && (
          <Button
            onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-1 text-sm py-1.5 px-3"
          >
            <PlusIcon className="w-4 h-4" />
            {t('flowBoard:forms.assignForm')}
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-3 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : forms.length === 0 ? (
          <div className="text-center py-8">
            <DocumentTextIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">{t('flowBoard:forms.noForms')}</p>
            <p className="text-gray-400 text-sm mt-1">{t('flowBoard:forms.noFormsHint')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {forms.map((form) => (
              <div
                key={form.id}
                className="border rounded-lg p-4 hover:border-primary-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Form Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">
                        {CATEGORY_ICONS[form.template?.category as FormCategory] || '📄'}
                      </span>
                      <h4 className="font-medium text-gray-900 truncate">
                        {isRTL ? form.template?.nameAr : form.template?.nameEn}
                      </h4>
                      {getStatusBadge(form.status)}
                    </div>
                    <p className="text-sm text-gray-500">
                      {isRTL ? form.template?.nameEn : form.template?.nameAr}
                    </p>

                    {/* Signatures Status */}
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      {form.template?.requiresClientSignature && (
                        <span className={`flex items-center gap-1 ${hasClientSignature(form) ? 'text-green-600' : 'text-gray-400'}`}>
                          {hasClientSignature(form) ? (
                            <CheckCircleIcon className="w-4 h-4" />
                          ) : (
                            <ClockIcon className="w-4 h-4" />
                          )}
                          {t('flowBoard:forms.clientSignature')}
                        </span>
                      )}
                      {form.template?.requiresVetSignature && (
                        <span className={`flex items-center gap-1 ${hasVetSignature(form) ? 'text-green-600' : 'text-gray-400'}`}>
                          {hasVetSignature(form) ? (
                            <CheckCircleIcon className="w-4 h-4" />
                          ) : (
                            <ClockIcon className="w-4 h-4" />
                          )}
                          {t('flowBoard:forms.vetSignature')}
                        </span>
                      )}
                      {form.notificationSentAt && (
                        <span className="text-blue-600 flex items-center gap-1">
                          <PaperAirplaneIcon className="w-4 h-4" />
                          {t('flowBoard:forms.sent')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewClick(form)}
                      className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title={t('flowBoard:forms.viewForm')}
                    >
                      <EyeIcon className="w-5 h-5" />
                    </button>

                    {canPrint(form) && (
                      <button
                        onClick={() => handlePrint(form)}
                        className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title={isRTL ? 'طباعة' : 'Print'}
                      >
                        <PrinterIcon className="w-5 h-5" />
                      </button>
                    )}

                    {!isReadOnly && canSend(form) && (
                      <button
                        onClick={() => handleSend(form.id)}
                        disabled={sendMutation.isPending}
                        className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                        title={t('flowBoard:forms.sendToOwner')}
                      >
                        <PaperAirplaneIcon className="w-5 h-5" />
                      </button>
                    )}

                    {/* Client Sign Button (from tablet) */}
                    {!isReadOnly && canClientSign(form) && (
                      <button
                        onClick={() => handleClientSignClick(form)}
                        className="p-2 text-purple-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title={isRTL ? 'توقيع العميل (من التابلت)' : 'Client Sign (Tablet)'}
                      >
                        <DeviceTabletIcon className="w-5 h-5" />
                      </button>
                    )}

                    {/* Vet Sign Button */}
                    {!isReadOnly && canSign(form) && (
                      <button
                        onClick={() => handleSignClick(form)}
                        className="p-2 text-green-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title={t('flowBoard:forms.signForm')}
                      >
                        <PencilSquareIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assign Form Modal */}
      <AssignFormModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onAssign={handleAssign}
        isAssigning={assignMutation.isPending}
      />

      {/* Sign Form Modal */}
      <Modal
        isOpen={showSignModal}
        onClose={() => {
          setShowSignModal(false);
          setSelectedForm(null);
        }}
        title={`✍️ ${t('flowBoard:forms.signForm')}`}
        size="md"
      >
        <div className="space-y-4">
          {selectedForm && (
            <>
              <p className="text-gray-600">
                {isRTL ? selectedForm.template?.nameAr : selectedForm.template?.nameEn}
              </p>
              <SignaturePad
                onSave={handleSign}
                onCancel={() => {
                  setShowSignModal(false);
                  setSelectedForm(null);
                }}
                isLoading={signMutation.isPending}
              />
            </>
          )}
        </div>
      </Modal>

      {/* Client Sign Modal (Full Screen for Tablet) */}
      <Modal
        isOpen={showClientSignModal}
        onClose={() => {
          setShowClientSignModal(false);
          setSelectedForm(null);
        }}
        title=""
        size="xl"
      >
        {selectedForm && (
          <div className="flex flex-col min-h-[70vh]">
            {/* Header with form name */}
            <div className="text-center mb-6 pb-4 border-b border-gray-200">
              <div className="text-4xl mb-3">
                {CATEGORY_ICONS[selectedForm.template?.category as FormCategory] || '📄'}
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">
                {isRTL ? selectedForm.template?.nameAr : selectedForm.template?.nameEn}
              </h2>
              <p className="text-gray-500">
                {isRTL ? selectedForm.template?.nameEn : selectedForm.template?.nameAr}
              </p>
            </div>

            {/* Instructions */}
            <div className="text-center mb-6">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 inline-block">
                <DeviceTabletIcon className="w-10 h-10 mx-auto text-purple-500 mb-2" />
                <p className="text-lg font-medium text-purple-800">
                  {isRTL ? 'يرجى تسليم التابلت للعميل للتوقيع' : 'Please hand tablet to client for signature'}
                </p>
                <p className="text-sm text-purple-600 mt-1">
                  {isRTL ? 'سيقوم العميل بالتوقيع أدناه' : 'Client will sign below'}
                </p>
              </div>
            </div>

            {/* Form Content Preview (Scrollable) */}
            <div className="flex-1 overflow-y-auto mb-4 bg-gray-50 rounded-xl p-4 max-h-48">
              <div
                className="prose prose-sm max-w-none"
                dir={isRTL ? 'rtl' : 'ltr'}
                dangerouslySetInnerHTML={{
                  __html: isRTL ? selectedForm.filledContentAr : selectedForm.filledContentEn,
                }}
              />
            </div>

            {/* Client Signature Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-center mb-4 text-gray-700">
                {isRTL ? '✍️ توقيع العميل' : '✍️ Client Signature'}
              </h3>
              <SignaturePad
                onSave={handleClientSign}
                onCancel={() => {
                  setShowClientSignModal(false);
                  setSelectedForm(null);
                }}
                isLoading={signClientMutation.isPending}
                height={200}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* View Form Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedForm(null);
        }}
        title={`📄 ${selectedForm ? (isRTL ? selectedForm.template?.nameAr : selectedForm.template?.nameEn) : ''}`}
        size="xl"
      >
        {selectedForm && (
          <div className="space-y-6">
            {/* Form Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="text-sm font-medium text-gray-500 mb-2">العربية</h5>
                <div
                  className="prose prose-sm max-w-none text-gray-800"
                  dir="rtl"
                  style={{ whiteSpace: 'pre-wrap' }}
                >
                  {selectedForm.filledContentAr}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="text-sm font-medium text-gray-500 mb-2">English</h5>
                <div
                  className="prose prose-sm max-w-none text-gray-800"
                  style={{ whiteSpace: 'pre-wrap' }}
                >
                  {selectedForm.filledContentEn}
                </div>
              </div>
            </div>

            {/* Signatures */}
            {selectedForm.signatures && selectedForm.signatures.length > 0 && (
              <div className="border-t pt-4">
                <h5 className="font-medium text-gray-700 mb-3">{t('flowBoard:forms.signatures')}</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedForm.signatures.map((sig) => (
                    <div key={sig.id} className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        {sig.signerType === 'CLIENT' ? t('flowBoard:forms.clientSignature') : t('flowBoard:forms.vetSignature')}
                      </p>
                      <p className="text-sm text-gray-500 mb-2">{sig.signerName}</p>
                      {sig.signatureData && (
                        <img
                          src={sig.signatureData}
                          alt="Signature"
                          className="max-h-24 border rounded bg-white"
                        />
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        {t('flowBoard:forms.signedAt')}: {new Date(sig.signedAt).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end pt-4 border-t">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedForm(null);
                }}
              >
                {t('forms:close')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PetFormsSection;
