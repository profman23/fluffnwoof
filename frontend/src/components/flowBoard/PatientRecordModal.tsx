import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, ArrowPathIcon, CalendarDaysIcon, CheckCircleIcon, PlusIcon, DocumentTextIcon, ShoppingBagIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { FlowBoardAppointment, MedicalRecord, MedicalRecordInput, VisitType, User } from '../../types';
import { medicalRecordsApi } from '../../api/medicalRecords';
import { flowBoardApi } from '../../api/flowBoard';
import { invoicesApi, Invoice } from '../../api/invoices';
import { AuditLogSection } from '../medical/AuditLogSection';
import { useScreenPermission, usePhonePermission, maskPhoneNumber } from '../../hooks/useScreenPermission';
import { VISIT_TYPE_DURATION, generateTimeSlots, isSlotBooked, getTomorrowDate } from '../../utils/appointmentUtils';
import { ServiceProductSelector, SelectedItem } from './ServiceProductSelector';
import { PaymentSection, PaymentEntry } from './PaymentSection';
import { ConfirmationModal } from '../common/ConfirmationModal';

interface PatientRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  appointment: FlowBoardAppointment | null;
  existingRecordId?: string;
}

const MUSCLE_CONDITIONS = ['Normal', 'Mild loss', 'Moderate loss', 'Severe loss'];
const HYDRATION_LEVELS = ['Normal', 'Mild', 'Moderate', 'Severe'];
const ATTITUDES = ['BAR', 'QAR', 'Depressed', 'Lethargic', 'Comatose'];
const MUCOUS_MEMBRANES = ['Pink', 'Pale', 'Cyanotic', 'Icteric', 'Injected'];

export const PatientRecordModal = ({
  isOpen,
  onClose,
  onSuccess,
  appointment,
  existingRecordId,
}: PatientRecordModalProps) => {
  const { t } = useTranslation('patientRecord');
  const { t: tFlow } = useTranslation('flowBoard');
  const { isReadOnly } = useScreenPermission('medical');
  const { isFullControl: canCreateAppointments } = useScreenPermission('flowBoard');
  const { canViewPhone } = usePhonePermission();
  const isMountedRef = useRef(true);
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [formData, setFormData] = useState<MedicalRecordInput>({});
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Next Appointment state
  const [showNextAppointment, setShowNextAppointment] = useState(false);
  const [nextAppointmentData, setNextAppointmentData] = useState({
    appointmentDate: getTomorrowDate(),
    appointmentTime: '09:00',
    visitType: VisitType.GENERAL_CHECKUP,
    vetId: '',
    notes: '',
  });
  const [bookingAppointment, setBookingAppointment] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [staff, setStaff] = useState<User[]>([]);
  const [bookedAppointments, setBookedAppointments] = useState<{ appointmentTime: string; duration: number }[]>([]);

  // Invoice/Payment state
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [_creatingInvoice, setCreatingInvoice] = useState(false);
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  // Finalize invoice state
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const [finalizingInvoice, setFinalizingInvoice] = useState(false);

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Load or create medical record when modal opens
  useEffect(() => {
    if (!isOpen || (!appointment && !existingRecordId)) {
      setRecord(null);
      setFormData({});
      setLoading(false);
      return;
    }

    const loadRecord = async () => {
      setLoading(true);
      setError(null);
      try {
        let data: MedicalRecord;

        if (existingRecordId) {
          data = await medicalRecordsApi.getById(existingRecordId);
        } else if (appointment) {
          data = await medicalRecordsApi.getOrCreateForAppointment(appointment.id);
        } else {
          throw new Error('No record or appointment provided');
        }

        if (!isMountedRef.current) return;
        setRecord(data);
        setFormData({
          chiefComplaint: data.chiefComplaint || '',
          history: data.history || '',
          weight: data.weight || undefined,
          temperature: data.temperature || undefined,
          heartRate: data.heartRate || undefined,
          respirationRate: data.respirationRate || undefined,
          bodyConditionScore: data.bodyConditionScore || undefined,
          muscleCondition: data.muscleCondition || '',
          painScore: data.painScore || undefined,
          hydration: data.hydration || '',
          attitude: data.attitude || '',
          behaviour: data.behaviour || '',
          mucousMembranes: data.mucousMembranes || '',
          crt: data.crt || undefined,
          diagnosis: data.diagnosis || '',
          treatment: data.treatment || '',
          notes: data.notes || '',
        });
      } catch (err) {
        console.error('Failed to load medical record:', err);
        if (!isMountedRef.current) return;
        setError(t('errors.loadFailed') || 'Failed to load record');
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    loadRecord();
  }, [isOpen, appointment, existingRecordId, t]);

  // Load existing invoice for appointment
  useEffect(() => {
    const loadInvoice = async () => {
      if (!appointment?.id) return;

      try {
        const existingInvoice = await invoicesApi.getByAppointmentId(appointment.id);
        if (existingInvoice && isMountedRef.current) {
          setInvoice(existingInvoice);
          setSelectedItems(
            existingInvoice.items.map((item) => ({
              id: item.id,
              name: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
            }))
          );
          setPayments(
            existingInvoice.payments.map((p) => ({
              id: p.id,
              amount: p.amount,
              paymentMethod: p.paymentMethod,
            }))
          );
        }
      } catch (err) {
        console.log('No existing invoice for this appointment');
      }
    };

    if (isOpen && appointment?.id) {
      loadInvoice();
    }
  }, [isOpen, appointment?.id]);

  // Load staff (vets) for next appointment
  useEffect(() => {
    const loadStaff = async () => {
      try {
        const data = await flowBoardApi.getStaff();
        if (isMountedRef.current) {
          setStaff(data);
          if (appointment?.vet?.id && !nextAppointmentData.vetId) {
            setNextAppointmentData(prev => ({ ...prev, vetId: appointment.vet.id }));
          }
        }
      } catch (err) {
        console.error('Failed to load staff:', err);
      }
    };

    if (isOpen && showNextAppointment) {
      loadStaff();
    }
  }, [isOpen, showNextAppointment, appointment?.vet?.id]);

  // Load booked appointments for the selected date and vet
  useEffect(() => {
    const loadBookedAppointments = async () => {
      if (!nextAppointmentData.appointmentDate || !nextAppointmentData.vetId) {
        setBookedAppointments([]);
        return;
      }

      try {
        const appointments = await flowBoardApi.getVetAppointments(
          nextAppointmentData.vetId,
          nextAppointmentData.appointmentDate
        );
        if (isMountedRef.current) {
          setBookedAppointments(appointments);
        }
      } catch (err) {
        console.error('Failed to load booked appointments:', err);
        setBookedAppointments([]);
      }
    };

    if (showNextAppointment) {
      loadBookedAppointments();
    }
  }, [showNextAppointment, nextAppointmentData.appointmentDate, nextAppointmentData.vetId]);

  // Generate available time slots
  const availableTimeSlots = useMemo(() => {
    const duration = VISIT_TYPE_DURATION[nextAppointmentData.visitType];
    const allSlots = generateTimeSlots(duration, nextAppointmentData.appointmentDate);
    return allSlots.filter(slot => !isSlotBooked(slot, duration, bookedAppointments));
  }, [nextAppointmentData.visitType, nextAppointmentData.appointmentDate, bookedAppointments]);

  // Handle booking next appointment
  const handleBookNextAppointment = async () => {
    if (!appointment?.pet?.id || !nextAppointmentData.vetId || !nextAppointmentData.appointmentDate) {
      return;
    }

    setBookingAppointment(true);
    setBookingError(null);

    try {
      await flowBoardApi.createAppointment({
        petId: appointment.pet.id,
        vetId: nextAppointmentData.vetId,
        appointmentDate: nextAppointmentData.appointmentDate,
        appointmentTime: nextAppointmentData.appointmentTime,
        visitType: nextAppointmentData.visitType,
        duration: VISIT_TYPE_DURATION[nextAppointmentData.visitType],
        notes: nextAppointmentData.notes,
      });

      if (isMountedRef.current) {
        setBookingSuccess(true);
        setTimeout(() => {
          if (isMountedRef.current) {
            setShowNextAppointment(false);
            setBookingSuccess(false);
            setNextAppointmentData({
              appointmentDate: getTomorrowDate(),
              appointmentTime: '09:00',
              visitType: VisitType.GENERAL_CHECKUP,
              vetId: appointment?.vet?.id || '',
              notes: '',
            });
          }
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to book appointment:', err);
      if (isMountedRef.current) {
        setBookingError(t('nextAppointment.error') || 'Failed to book appointment');
      }
    } finally {
      if (isMountedRef.current) {
        setBookingAppointment(false);
      }
    }
  };

  // Create invoice with items
  const createInvoiceWithItems = async (items: SelectedItem[]) => {
    if (!appointment?.pet?.owner?.id || items.length === 0) return null;

    const newInvoice = await invoicesApi.create({
      ownerId: appointment.pet.owner.id,
      appointmentId: appointment.id,
      items: items.map((item) => ({
        description: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    });

    return newInvoice;
  };

  // Handle items change - auto-create/update invoice
  const handleItemsChange = async (newItems: SelectedItem[]) => {
    // Update local state immediately for UI responsiveness
    setSelectedItems(newItems);

    // If no items, nothing to save
    if (newItems.length === 0) return;

    // If no invoice exists, create one
    if (!invoice && appointment?.pet?.owner?.id) {
      setCreatingInvoice(true);
      setInvoiceError(null);

      try {
        const newInvoice = await createInvoiceWithItems(newItems);
        if (newInvoice && isMountedRef.current) {
          setInvoice(newInvoice);
          setSelectedItems(
            newInvoice.items.map((item) => ({
              id: item.id,
              name: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
            }))
          );
        }
      } catch (err) {
        console.error('Failed to create invoice:', err);
        if (isMountedRef.current) {
          setInvoiceError(tFlow('invoice.createError'));
        }
      } finally {
        if (isMountedRef.current) {
          setCreatingInvoice(false);
        }
      }
    } else if (invoice) {
      // Invoice exists - check for new items or quantity changes
      const existingIds = selectedItems.map(item => item.id);
      const newlyAddedItems = newItems.filter(item => !existingIds.includes(item.id));

      // Check for quantity changes in existing items
      const quantityChangedItems = newItems.filter(newItem => {
        const existingItem = selectedItems.find(item => item.id === newItem.id);
        return existingItem && existingItem.quantity !== newItem.quantity;
      });

      if (newlyAddedItems.length > 0 || quantityChangedItems.length > 0) {
        setSavingInvoice(true);
        try {
          // Add new items
          for (const item of newlyAddedItems) {
            await invoicesApi.addItem(invoice.id, {
              description: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            });
          }

          // Update quantity for changed items
          for (const item of quantityChangedItems) {
            await invoicesApi.updateItem(item.id, {
              quantity: item.quantity,
            });
          }

          // Refresh invoice to get updated items
          const updatedInvoice = await invoicesApi.getById(invoice.id);
          if (isMountedRef.current) {
            setInvoice(updatedInvoice);
            setSelectedItems(
              updatedInvoice.items.map((item) => ({
                id: item.id,
                name: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
              }))
            );
          }
        } catch (err) {
          console.error('Failed to update invoice items:', err);
        } finally {
          if (isMountedRef.current) {
            setSavingInvoice(false);
          }
        }
      }
    }
  };

  // Handle payments change - auto-create invoice if needed
  const handlePaymentsChange = async (newPayments: PaymentEntry[]) => {
    // If no invoice exists and we have items, create invoice first
    if (!invoice && selectedItems.length > 0 && appointment?.pet?.owner?.id) {
      setCreatingInvoice(true);
      setInvoiceError(null);

      try {
        const newInvoice = await invoicesApi.create({
          ownerId: appointment.pet.owner.id,
          appointmentId: appointment.id,
          items: selectedItems.map((item) => ({
            description: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        });

        if (isMountedRef.current) {
          setInvoice(newInvoice);
          setSelectedItems(
            newInvoice.items.map((item) => ({
              id: item.id,
              name: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
            }))
          );

          // Now add the payments to the new invoice
          const addedPayments = newPayments.filter(
            (np) => !payments.some((p) => p.id === np.id)
          );

          for (const payment of addedPayments) {
            await invoicesApi.addPayment(newInvoice.id, {
              amount: payment.amount,
              paymentMethod: payment.paymentMethod,
            });
          }

          // Refresh invoice to get updated payments
          const updatedInvoice = await invoicesApi.getById(newInvoice.id);
          setInvoice(updatedInvoice);
          setPayments(
            updatedInvoice.payments.map((p) => ({
              id: p.id,
              amount: p.amount,
              paymentMethod: p.paymentMethod,
            }))
          );
        }
      } catch (err) {
        console.error('Failed to create invoice:', err);
        if (isMountedRef.current) {
          setInvoiceError(tFlow('invoice.createError'));
        }
      } finally {
        if (isMountedRef.current) {
          setCreatingInvoice(false);
        }
      }
    } else if (invoice) {
      // Invoice exists, add new payments
      // استخدام مقارنة الطول لاكتشاف الدفعات الجديدة
      // إذا كان عدد الدفعات الجديدة أكبر من الحالية، الدفعة الأخيرة هي الجديدة
      if (newPayments.length > payments.length) {
        const newPayment = newPayments[newPayments.length - 1];

        setSavingInvoice(true);
        try {
          await invoicesApi.addPayment(invoice.id, {
            amount: newPayment.amount,
            paymentMethod: newPayment.paymentMethod,
          });

          // Refresh invoice to get updated payments with real IDs
          const updatedInvoice = await invoicesApi.getById(invoice.id);
          if (isMountedRef.current) {
            setInvoice(updatedInvoice);
            setPayments(
              updatedInvoice.payments.map((p) => ({
                id: p.id,
                amount: p.amount,
                paymentMethod: p.paymentMethod,
              }))
            );
          }
        } catch (err) {
          console.error('Failed to add payment:', err);
        } finally {
          if (isMountedRef.current) {
            setSavingInvoice(false);
          }
        }
      }
    } else {
      // No invoice and no items - just store locally
      setPayments(newPayments);
    }
  };

  // Handle remove payment from API
  const handleRemovePayment = async (paymentId: string) => {
    if (!invoice) return;

    setSavingInvoice(true);
    try {
      await invoicesApi.removePayment(paymentId);

      // Refresh invoice to get updated payments
      const updatedInvoice = await invoicesApi.getById(invoice.id);
      if (isMountedRef.current) {
        setInvoice(updatedInvoice);
        setPayments(
          updatedInvoice.payments.map((p) => ({
            id: p.id,
            amount: p.amount,
            paymentMethod: p.paymentMethod,
          }))
        );
      }
    } catch (err) {
      console.error('Failed to remove payment:', err);
    } finally {
      if (isMountedRef.current) {
        setSavingInvoice(false);
      }
    }
  };

  // Handle finalize invoice
  const handleFinalizeInvoice = async () => {
    if (!invoice) return;

    setFinalizingInvoice(true);
    try {
      const finalizedInvoice = await invoicesApi.finalize(invoice.id);
      if (isMountedRef.current) {
        setInvoice(finalizedInvoice);
        setShowFinalizeConfirm(false);
        // Close modal and trigger refresh to move card to Completed
        onClose();
        onSuccess?.();
      }
    } catch (err) {
      console.error('Failed to finalize invoice:', err);
    } finally {
      if (isMountedRef.current) {
        setFinalizingInvoice(false);
      }
    }
  };


  // Auto-save function
  const saveRecord = useCallback(async () => {
    if (!record || !isMountedRef.current) return;

    setSaving(true);
    try {
      await medicalRecordsApi.update(record.id, formData);
      if (!isMountedRef.current) return;
      setLastSaved(new Date());
    } catch (err) {
      console.error('Failed to save medical record:', err);
      if (!isMountedRef.current) return;
      setError(t('errors.saveFailed') || 'Failed to save');
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
      }
    }
  }, [record, formData, t]);

  // Handle form field changes with auto-save
  const handleFieldChange = useCallback((field: keyof MedicalRecordInput, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      saveRecord();
    }, 2000);
  }, [saveRecord]);

  // Manual save
  const handleManualSave = useCallback(async () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    await saveRecord();
  }, [saveRecord]);

  const handleClose = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      saveRecord();
    }
    onClose();
  }, [onClose, saveRecord]);

  // Disabled backdrop click - modal closes only with X button
  // const handleBackdropClick = useCallback((e: React.MouseEvent) => {
  //   if (e.target === e.currentTarget) {
  //     handleClose();
  //   }
  // }, [handleClose]);

  if (!isOpen) return null;

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  const modalContent = (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2"
      style={{ zIndex: 9999 }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[98vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">{t('title')}</h2>
            {saving && (
              <span className="flex items-center gap-1 text-sm bg-white/20 px-3 py-1 rounded-full">
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                {t('saving')}
              </span>
            )}
            {!saving && lastSaved && (
              <span className="text-sm text-emerald-100">
                {t('lastSaved')}: {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            type="button"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <ArrowPathIcon className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="m-6 p-4 bg-red-50 text-red-600 rounded-lg">
              {error}
            </div>
          ) : (appointment || record) ? (
            <div className="p-6 space-y-8">
              {/* Patient Info Card */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wide">{t('patientInfo.owner')}</label>
                    <p className="font-semibold text-gray-900 mt-1">
                      {(appointment?.pet.owner || record?.pet?.owner)
                        ? `${(appointment?.pet.owner || record?.pet?.owner)?.firstName} ${(appointment?.pet.owner || record?.pet?.owner)?.lastName}`
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wide">{t('patientInfo.phone')}</label>
                    <p className="font-semibold text-gray-900 mt-1" dir="ltr">
                      {canViewPhone
                        ? (appointment?.pet.owner?.phone || record?.pet?.owner?.phone || '-')
                        : maskPhoneNumber(appointment?.pet.owner?.phone || record?.pet?.owner?.phone || '')}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wide">{t('patientInfo.pet')}</label>
                    <p className="font-semibold text-gray-900 mt-1">{appointment?.pet.name || record?.pet?.name || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wide">{t('patientInfo.species')}</label>
                    <p className="font-semibold text-gray-900 mt-1">{appointment?.pet.species || record?.pet?.species || '-'}</p>
                  </div>
                  {appointment?.visitType && (
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wide">{tFlow('form.visitType')}</label>
                      <p className="font-semibold text-gray-900 mt-1">{tFlow(`visitTypes.${appointment.visitType}`)}</p>
                    </div>
                  )}
                  {appointment?.vet && (
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wide">{tFlow('card.vet')}</label>
                      <p className="font-semibold text-gray-900 mt-1">{appointment.vet.firstName} {appointment.vet.lastName}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* SOAP Section */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-blue-50 px-5 py-3 border-b border-blue-100 flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-blue-900">{tFlow('tabs.soap')}</h3>
                </div>
                <div className="p-5 space-y-6">
                  {/* Subjective */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">S</span>
                      {t('sections.subjective')}
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">{t('fields.chiefComplaint')}</label>
                        <textarea
                          value={formData.chiefComplaint || ''}
                          onChange={(e) => handleFieldChange('chiefComplaint', e.target.value)}
                          rows={2}
                          disabled={isReadOnly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                          placeholder={t('placeholders.chiefComplaint')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">{t('fields.history')}</label>
                        <textarea
                          value={formData.history || ''}
                          onChange={(e) => handleFieldChange('history', e.target.value)}
                          rows={2}
                          disabled={isReadOnly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                          placeholder={t('placeholders.history')}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Objective */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">O</span>
                      {t('sections.objective')}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{t('fields.weight')} (kg)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.weight || ''}
                          onChange={(e) => handleFieldChange('weight', e.target.value ? parseFloat(e.target.value) : undefined)}
                          disabled={isReadOnly}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{t('fields.temperature')} (C)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.temperature || ''}
                          onChange={(e) => handleFieldChange('temperature', e.target.value ? parseFloat(e.target.value) : undefined)}
                          disabled={isReadOnly}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{t('fields.heartRate')} (bpm)</label>
                        <input
                          type="number"
                          value={formData.heartRate || ''}
                          onChange={(e) => handleFieldChange('heartRate', e.target.value ? parseInt(e.target.value) : undefined)}
                          disabled={isReadOnly}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{t('fields.respirationRate')} (/min)</label>
                        <input
                          type="number"
                          value={formData.respirationRate || ''}
                          onChange={(e) => handleFieldChange('respirationRate', e.target.value ? parseInt(e.target.value) : undefined)}
                          disabled={isReadOnly}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{t('fields.bodyConditionScore')} (1-9)</label>
                        <input
                          type="number"
                          min="1"
                          max="9"
                          value={formData.bodyConditionScore || ''}
                          onChange={(e) => handleFieldChange('bodyConditionScore', e.target.value ? parseInt(e.target.value) : undefined)}
                          disabled={isReadOnly}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{t('fields.painScore')} (0-10)</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={formData.painScore || ''}
                          onChange={(e) => handleFieldChange('painScore', e.target.value ? parseInt(e.target.value) : undefined)}
                          disabled={isReadOnly}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{t('fields.muscleCondition')}</label>
                        <select
                          value={formData.muscleCondition || ''}
                          onChange={(e) => handleFieldChange('muscleCondition', e.target.value)}
                          disabled={isReadOnly}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm"
                        >
                          <option value="">{t('select')}</option>
                          {MUSCLE_CONDITIONS.map((condition) => (
                            <option key={condition} value={condition}>{t(`muscleConditions.${condition}`) || condition}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{t('fields.hydration')}</label>
                        <select
                          value={formData.hydration || ''}
                          onChange={(e) => handleFieldChange('hydration', e.target.value)}
                          disabled={isReadOnly}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm"
                        >
                          <option value="">{t('select')}</option>
                          {HYDRATION_LEVELS.map((level) => (
                            <option key={level} value={level}>{t(`hydrationLevels.${level}`) || level}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{t('fields.attitude')}</label>
                        <select
                          value={formData.attitude || ''}
                          onChange={(e) => handleFieldChange('attitude', e.target.value)}
                          disabled={isReadOnly}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm"
                        >
                          <option value="">{t('select')}</option>
                          {ATTITUDES.map((att) => (
                            <option key={att} value={att}>{t(`attitudes.${att}`) || att}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{t('fields.mucousMembranes')}</label>
                        <select
                          value={formData.mucousMembranes || ''}
                          onChange={(e) => handleFieldChange('mucousMembranes', e.target.value)}
                          disabled={isReadOnly}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm"
                        >
                          <option value="">{t('select')}</option>
                          {MUCOUS_MEMBRANES.map((mm) => (
                            <option key={mm} value={mm}>{t(`mucousMembranes.${mm}`) || mm}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{t('fields.crt')} (sec)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.crt || ''}
                          onChange={(e) => handleFieldChange('crt', e.target.value ? parseFloat(e.target.value) : undefined)}
                          disabled={isReadOnly}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{t('fields.behaviour')}</label>
                        <input
                          type="text"
                          value={formData.behaviour || ''}
                          onChange={(e) => handleFieldChange('behaviour', e.target.value)}
                          disabled={isReadOnly}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Assessment */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-yellow-100 text-yellow-700 rounded-full flex items-center justify-center text-xs font-bold">A</span>
                      {t('sections.assessment')}
                    </h4>
                    <textarea
                      value={formData.diagnosis || ''}
                      onChange={(e) => handleFieldChange('diagnosis', e.target.value)}
                      rows={2}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                      placeholder={t('placeholders.diagnosis')}
                    />
                  </div>

                  {/* Plan */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-bold">P</span>
                      {t('sections.plan')}
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">{t('fields.treatment')}</label>
                        <textarea
                          value={formData.treatment || ''}
                          onChange={(e) => handleFieldChange('treatment', e.target.value)}
                          rows={2}
                          disabled={isReadOnly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                          placeholder={t('placeholders.treatment')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">{t('fields.notes')}</label>
                        <textarea
                          value={formData.notes || ''}
                          onChange={(e) => handleFieldChange('notes', e.target.value)}
                          rows={2}
                          disabled={isReadOnly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                          placeholder={t('placeholders.notes')}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Services & Products Section */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-emerald-50 px-5 py-3 border-b border-emerald-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBagIcon className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-lg font-semibold text-emerald-900">{tFlow('tabs.services')}</h3>
                    {selectedItems.length > 0 && (
                      <span className="bg-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        {selectedItems.length}
                      </span>
                    )}
                  </div>
                  {invoice?.isFinalized && (
                    <span className="text-sm text-emerald-700 font-medium">
                      {tFlow('invoice.number')}: {invoice.invoiceNumber}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <ServiceProductSelector
                    selectedItems={selectedItems}
                    onItemsChange={handleItemsChange}
                    disabled={isReadOnly || invoice?.isFinalized}
                  />

                  {invoiceError && (
                    <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                      {invoiceError}
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Section */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-violet-50 px-5 py-3 border-b border-violet-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCardIcon className="w-5 h-5 text-violet-600" />
                    <h3 className="text-lg font-semibold text-violet-900">{tFlow('tabs.payment')}</h3>
                  </div>
                  {invoice && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      invoice.status === 'PAID'
                        ? 'bg-green-100 text-green-700'
                        : invoice.status === 'PARTIALLY_PAID'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {tFlow(`invoiceStatus.${invoice.status}`)}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  {selectedItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <CreditCardIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">{tFlow('payment.noInvoice')}</p>
                      <p className="text-sm mt-1">{tFlow('payment.addServicesFirst')}</p>
                    </div>
                  ) : (
                    <PaymentSection
                      totalAmount={selectedItems.reduce((sum, item) => sum + item.totalPrice, 0)}
                      payments={payments}
                      onPaymentsChange={handlePaymentsChange}
                      onRemovePayment={invoice ? handleRemovePayment : undefined}
                      onGenerateInvoice={invoice && !invoice.isFinalized && canCreateAppointments ? () => setShowFinalizeConfirm(true) : undefined}
                      generatingInvoice={finalizingInvoice}
                      isFinalized={invoice?.isFinalized}
                      invoiceNumber={invoice?.invoiceNumber}
                      disabled={isReadOnly || savingInvoice}
                    />
                  )}
                </div>
              </div>

              {/* Next Appointment Section */}
              {canCreateAppointments && appointment && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-sky-50 px-5 py-3 border-b border-sky-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarDaysIcon className="w-5 h-5 text-sky-600" />
                      <h3 className="text-lg font-semibold text-sky-900">{t('nextAppointment.title')}</h3>
                    </div>
                    {!showNextAppointment && (
                      <button
                        type="button"
                        onClick={() => setShowNextAppointment(true)}
                        className="flex items-center gap-1 px-4 py-2 text-sm bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-medium transition-colors"
                      >
                        <PlusIcon className="w-4 h-4" />
                        {t('nextAppointment.schedule')}
                      </button>
                    )}
                  </div>

                  {showNextAppointment && (
                    <div className="p-5">
                      {bookingSuccess ? (
                        <div className="flex items-center justify-center gap-2 py-6 text-green-600">
                          <CheckCircleIcon className="w-8 h-8" />
                          <span className="font-semibold text-lg">{t('nextAppointment.success')}</span>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">{t('nextAppointment.date')}</label>
                              <input
                                type="date"
                                value={nextAppointmentData.appointmentDate}
                                min={getTomorrowDate()}
                                onChange={(e) => setNextAppointmentData(prev => ({
                                  ...prev,
                                  appointmentDate: e.target.value,
                                  appointmentTime: '09:00',
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">{t('nextAppointment.time')}</label>
                              <select
                                value={nextAppointmentData.appointmentTime}
                                onChange={(e) => setNextAppointmentData(prev => ({
                                  ...prev,
                                  appointmentTime: e.target.value,
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                disabled={availableTimeSlots.length === 0}
                              >
                                {availableTimeSlots.length === 0 ? (
                                  <option value="">{t('nextAppointment.noSlots')}</option>
                                ) : (
                                  availableTimeSlots.map(slot => (
                                    <option key={slot} value={slot}>{slot}</option>
                                  ))
                                )}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">{t('nextAppointment.visitType')}</label>
                              <select
                                value={nextAppointmentData.visitType}
                                onChange={(e) => setNextAppointmentData(prev => ({
                                  ...prev,
                                  visitType: e.target.value as VisitType,
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                              >
                                {Object.values(VisitType).map(type => (
                                  <option key={type} value={type}>
                                    {tFlow(`visitTypes.${type}`)} ({VISIT_TYPE_DURATION[type]} {t('nextAppointment.minutes')})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">{t('nextAppointment.vet')}</label>
                              <select
                                value={nextAppointmentData.vetId}
                                onChange={(e) => setNextAppointmentData(prev => ({
                                  ...prev,
                                  vetId: e.target.value,
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                              >
                                <option value="">{t('select')}</option>
                                {staff.map(vet => (
                                  <option key={vet.id} value={vet.id}>
                                    {vet.firstName} {vet.lastName}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('nextAppointment.notes')}</label>
                            <textarea
                              value={nextAppointmentData.notes}
                              onChange={(e) => setNextAppointmentData(prev => ({
                                ...prev,
                                notes: e.target.value,
                              }))}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                              placeholder={t('nextAppointment.notesPlaceholder')}
                            />
                          </div>

                          {bookingError && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                              {bookingError}
                            </div>
                          )}

                          <div className="flex justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setShowNextAppointment(false);
                                setBookingError(null);
                              }}
                              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors"
                            >
                              {t('nextAppointment.cancel')}
                            </button>
                            <button
                              type="button"
                              onClick={handleBookNextAppointment}
                              disabled={bookingAppointment || !nextAppointmentData.vetId || availableTimeSlots.length === 0}
                              className="flex items-center gap-2 px-5 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                            >
                              {bookingAppointment ? (
                                <>
                                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                  {t('nextAppointment.booking')}
                                </>
                              ) : (
                                <>
                                  <CalendarDaysIcon className="w-4 h-4" />
                                  {t('nextAppointment.book')}
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Audit Log Section */}
              {record && (
                <AuditLogSection recordId={record.id} />
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors"
          >
            {t('close')}
          </button>
          {!isReadOnly && (
            <button
              type="button"
              onClick={handleManualSave}
              disabled={saving || loading}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {saving ? t('saving') : t('save')}
            </button>
          )}
        </div>
      </div>

      {/* Finalize Invoice Confirmation Modal */}
      <ConfirmationModal
        isOpen={showFinalizeConfirm}
        onClose={() => setShowFinalizeConfirm(false)}
        onConfirm={handleFinalizeInvoice}
        title={tFlow('invoice.finalizeTitle')}
        message={tFlow('invoice.finalizeWarning')}
        confirmText={tFlow('invoice.confirm')}
        cancelText={tFlow('invoice.cancel')}
        variant="warning"
        loading={finalizingInvoice}
      />
    </div>
  );

  return createPortal(modalContent, modalRoot);
};
