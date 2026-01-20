import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, ArrowPathIcon, CalendarDaysIcon, CheckCircleIcon, PlusIcon, DocumentTextIcon, ShoppingBagIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { FlowBoardAppointment, MedicalRecord, MedicalRecordInput, VisitType, User, Appointment } from '../../types';
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

  // Use appointment from props or from loaded record (for Medical Records page)
  const effectiveAppointment = useMemo(() => {
    if (appointment) return appointment;
    if (record?.appointment) {
      // Convert Appointment to FlowBoardAppointment-like structure
      return {
        id: record.appointment.id,
        pet: record.pet,
        vet: record.vet,
        appointmentDate: record.appointment.appointmentDate,
        appointmentTime: record.appointment.appointmentTime,
        status: record.appointment.status,
        visitType: record.appointment.visitType,
        duration: record.appointment.duration || 30,
        isConfirmed: false, // Default value for appointments from medical records
      } as FlowBoardAppointment;
    }
    return null;
  }, [appointment, record]);

  // Next Appointment state - 3 independent dates and times
  const [showNextAppointment, setShowNextAppointment] = useState(false);
  const [checkupDate, setCheckupDate] = useState('');
  const [checkupTime, setCheckupTime] = useState('');
  const [vaccinationDate, setVaccinationDate] = useState('');
  const [vaccinationTime, setVaccinationTime] = useState('');
  const [dewormingDate, setDewormingDate] = useState('');
  const [dewormingTime, setDewormingTime] = useState('');
  const [appointmentVetId, setAppointmentVetId] = useState('');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [bookingAppointment, setBookingAppointment] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [staff, setStaff] = useState<User[]>([]);
  // Booked appointments for each date (to show available time slots)
  const [checkupBookedSlots, setCheckupBookedSlots] = useState<{ appointmentTime: string; duration: number }[]>([]);
  const [vaccinationBookedSlots, setVaccinationBookedSlots] = useState<{ appointmentTime: string; duration: number }[]>([]);
  const [dewormingBookedSlots, setDewormingBookedSlots] = useState<{ appointmentTime: string; duration: number }[]>([]);

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

  // Close/Reopen record state
  const [showCloseWarning, setShowCloseWarning] = useState(false);
  const [closingRecord, setClosingRecord] = useState(false);
  const [reopeningRecord, setReopeningRecord] = useState(false);

  // Upcoming appointments state (scheduled from this record)
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  // All upcoming appointments for this pet (for showing existing booked appointments)
  const [petUpcomingAppointments, setPetUpcomingAppointments] = useState<Appointment[]>([]);

  // Mandatory fields validation
  const mandatoryFieldsValid = useMemo(() => {
    return (
      formData.weight !== undefined && formData.weight !== null && formData.weight > 0 &&
      formData.temperature !== undefined && formData.temperature !== null && formData.temperature > 0 &&
      formData.heartRate !== undefined && formData.heartRate !== null && formData.heartRate > 0
    );
  }, [formData.weight, formData.temperature, formData.heartRate]);

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

  // Track modal open count to force reload on each open
  const [openCount, setOpenCount] = useState(0);

  // Increment open count when modal opens
  useEffect(() => {
    if (isOpen) {
      setOpenCount(prev => prev + 1);
    }
  }, [isOpen]);

  // Load or create medical record when modal opens
  useEffect(() => {
    if (!isOpen || (!appointment && !existingRecordId)) {
      setRecord(null);
      setFormData({});
      setLoading(false);
      setUpcomingAppointments([]); // Reset scheduled appointments when modal closes
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
  }, [isOpen, appointment?.id, existingRecordId, openCount, t]);

  // Load existing invoice for appointment
  useEffect(() => {
    const loadInvoice = async () => {
      if (!effectiveAppointment?.id) return;

      try {
        const existingInvoice = await invoicesApi.getByAppointmentId(effectiveAppointment.id);
        if (existingInvoice && isMountedRef.current) {
          setInvoice(existingInvoice);
          setSelectedItems(
            existingInvoice.items.map((item) => ({
              id: item.id,
              name: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount || 0,
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

    if (isOpen && effectiveAppointment?.id) {
      loadInvoice();
    }
  }, [isOpen, effectiveAppointment?.id]);

  // Load staff (vets) for next appointment
  useEffect(() => {
    const loadStaff = async () => {
      try {
        const data = await flowBoardApi.getStaff();
        if (isMountedRef.current) {
          setStaff(data);
          if (effectiveAppointment?.vet?.id && !appointmentVetId) {
            setAppointmentVetId(effectiveAppointment.vet.id);
          }
        }
      } catch (err) {
        console.error('Failed to load staff:', err);
      }
    };

    if (isOpen && showNextAppointment) {
      loadStaff();
    }
  }, [isOpen, showNextAppointment, effectiveAppointment?.vet?.id, appointmentVetId]);

  // Fetch booked slots when checkup date or vet changes
  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!appointmentVetId || !checkupDate) {
        setCheckupBookedSlots([]);
        setCheckupTime('');
        return;
      }
      try {
        const booked = await flowBoardApi.getVetAppointments(appointmentVetId, checkupDate);
        if (isMountedRef.current) {
          setCheckupBookedSlots(booked);
          setCheckupTime(''); // Reset time when date changes
        }
      } catch (err) {
        console.error('Failed to fetch checkup booked slots:', err);
      }
    };
    fetchBookedSlots();
  }, [appointmentVetId, checkupDate]);

  // Fetch booked slots when vaccination date or vet changes
  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!appointmentVetId || !vaccinationDate) {
        setVaccinationBookedSlots([]);
        setVaccinationTime('');
        return;
      }
      try {
        const booked = await flowBoardApi.getVetAppointments(appointmentVetId, vaccinationDate);
        if (isMountedRef.current) {
          setVaccinationBookedSlots(booked);
          setVaccinationTime(''); // Reset time when date changes
        }
      } catch (err) {
        console.error('Failed to fetch vaccination booked slots:', err);
      }
    };
    fetchBookedSlots();
  }, [appointmentVetId, vaccinationDate]);

  // Fetch booked slots when deworming date or vet changes
  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!appointmentVetId || !dewormingDate) {
        setDewormingBookedSlots([]);
        setDewormingTime('');
        return;
      }
      try {
        const booked = await flowBoardApi.getVetAppointments(appointmentVetId, dewormingDate);
        if (isMountedRef.current) {
          setDewormingBookedSlots(booked);
          setDewormingTime(''); // Reset time when date changes
        }
      } catch (err) {
        console.error('Failed to fetch deworming booked slots:', err);
      }
    };
    fetchBookedSlots();
  }, [appointmentVetId, dewormingDate]);

  // Fetch appointments scheduled from this medical record
  useEffect(() => {
    const fetchScheduledAppointments = async () => {
      const recordId = record?.id;
      if (!recordId || !isOpen || loading) return;

      try {
        const appointments = await flowBoardApi.getByScheduledFromRecordId(recordId);
        if (isMountedRef.current) {
          setUpcomingAppointments(appointments);
        }
      } catch (err) {
        console.error('Failed to fetch scheduled appointments:', err);
      }
    };

    fetchScheduledAppointments();
  }, [isOpen, record?.id, loading, bookingSuccess]);

  // Fetch all upcoming appointments for this pet
  useEffect(() => {
    const fetchPetAppointments = async () => {
      const petId = effectiveAppointment?.pet?.id || record?.pet?.id;
      if (!petId || !isOpen || loading) return;

      try {
        const appointments = await flowBoardApi.getUpcomingByPetId(petId);
        if (isMountedRef.current) {
          setPetUpcomingAppointments(appointments);
        }
      } catch (err) {
        console.error('Failed to fetch pet appointments:', err);
      }
    };

    fetchPetAppointments();
  }, [isOpen, effectiveAppointment?.pet?.id, record?.pet?.id, loading, bookingSuccess]);

  // Count how many appointments will be booked (requires both date AND time)
  const appointmentsToBookCount = useMemo(() => {
    let count = 0;
    if (checkupDate && checkupTime) count++;
    if (vaccinationDate && vaccinationTime) count++;
    if (dewormingDate && dewormingTime) count++;
    return count;
  }, [checkupDate, checkupTime, vaccinationDate, vaccinationTime, dewormingDate, dewormingTime]);

  // Get booked appointments by type for this pet
  const bookedAppointmentsByType = useMemo(() => {
    const result: {
      checkup: Appointment[];
      vaccination: Appointment[];
      deworming: Appointment[];
    } = {
      checkup: [],
      vaccination: [],
      deworming: [],
    };

    petUpcomingAppointments.forEach((appt) => {
      const notes = appt.notes?.toLowerCase() || '';
      if (notes.includes('routine') || notes.includes('check-up') || notes.includes('فحص دوري')) {
        result.checkup.push(appt);
      }
      if (notes.includes('vaccination') || notes.includes('تطعيم')) {
        result.vaccination.push(appt);
      }
      if (notes.includes('deworming') || notes.includes('ديدان') || notes.includes('flea') || notes.includes('براغيث')) {
        result.deworming.push(appt);
      }
    });

    return result;
  }, [petUpcomingAppointments]);


  // Handle booking next appointments (multiple)
  const handleBookNextAppointments = async () => {
    const petId = effectiveAppointment?.pet?.id || record?.pet?.id;
    const recordId = record?.id;
    if (!petId || !appointmentVetId || appointmentsToBookCount === 0) {
      return;
    }

    setBookingAppointment(true);
    setBookingError(null);

    try {
      const appointmentsToBook: { date: string; time: string; visitType: VisitType; notes: string }[] = [];

      if (checkupDate && checkupTime) {
        appointmentsToBook.push({
          date: checkupDate,
          time: checkupTime,
          visitType: VisitType.GENERAL_CHECKUP,
          notes: tFlow('nextAppointment.routineCheckup'),
        });
      }

      if (vaccinationDate && vaccinationTime) {
        appointmentsToBook.push({
          date: vaccinationDate,
          time: vaccinationTime,
          visitType: VisitType.VACCINATION,
          notes: tFlow('nextAppointment.nextVaccination'),
        });
      }

      if (dewormingDate && dewormingTime) {
        appointmentsToBook.push({
          date: dewormingDate,
          time: dewormingTime,
          visitType: VisitType.GENERAL_CHECKUP,
          notes: tFlow('nextAppointment.dewormingFlea'),
        });
      }

      // Book all appointments with scheduledFromRecordId
      for (const appt of appointmentsToBook) {
        await flowBoardApi.createAppointment({
          petId,
          vetId: appointmentVetId,
          appointmentDate: appt.date,
          appointmentTime: appt.time,
          visitType: appt.visitType,
          duration: VISIT_TYPE_DURATION[appt.visitType],
          notes: appt.notes + (appointmentNotes ? ` - ${appointmentNotes}` : ''),
          scheduledFromRecordId: recordId,
        });
      }

      if (isMountedRef.current) {
        setBookingSuccess(true);
        setTimeout(() => {
          if (isMountedRef.current) {
            setShowNextAppointment(false);
            setBookingSuccess(false);
            // Reset all appointment dates and times
            setCheckupDate('');
            setCheckupTime('');
            setVaccinationDate('');
            setVaccinationTime('');
            setDewormingDate('');
            setDewormingTime('');
            setAppointmentNotes('');
            setAppointmentVetId(effectiveAppointment?.vet?.id || '');
          }
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to book appointments:', err);
      if (isMountedRef.current) {
        setBookingError(t('nextAppointment.error') || 'Failed to book appointments');
      }
    } finally {
      if (isMountedRef.current) {
        setBookingAppointment(false);
      }
    }
  };

  // Create invoice with items
  const createInvoiceWithItems = async (items: SelectedItem[]) => {
    const ownerId = effectiveAppointment?.pet?.owner?.id || record?.pet?.owner?.id;
    const appointmentId = effectiveAppointment?.id;

    if (!ownerId || items.length === 0) return null;

    const newInvoice = await invoicesApi.create({
      ownerId,
      appointmentId,
      items: items.map((item) => ({
        description: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
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
    const ownerId = effectiveAppointment?.pet?.owner?.id || record?.pet?.owner?.id;
    if (!invoice && ownerId) {
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
              discount: item.discount || 0,
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

      // Check for quantity or discount changes in existing items
      const changedItems = newItems.filter(newItem => {
        const existingItem = selectedItems.find(item => item.id === newItem.id);
        return existingItem && (
          existingItem.quantity !== newItem.quantity ||
          existingItem.discount !== newItem.discount
        );
      });

      if (newlyAddedItems.length > 0 || changedItems.length > 0) {
        setSavingInvoice(true);
        try {
          // Add new items
          for (const item of newlyAddedItems) {
            await invoicesApi.addItem(invoice.id, {
              description: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
            });
          }

          // Update changed items (quantity or discount)
          for (const item of changedItems) {
            await invoicesApi.updateItem(item.id, {
              quantity: item.quantity,
              discount: item.discount,
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
                discount: item.discount || 0,
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
    const ownerId = effectiveAppointment?.pet?.owner?.id || record?.pet?.owner?.id;
    const appointmentId = effectiveAppointment?.id;

    if (!invoice && selectedItems.length > 0 && ownerId) {
      setCreatingInvoice(true);
      setInvoiceError(null);

      try {
        const newInvoice = await invoicesApi.create({
          ownerId,
          appointmentId,
          items: selectedItems.map((item) => ({
            description: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
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
              discount: item.discount || 0,
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

  // Get empty SOAP fields
  const getEmptyFields = useCallback((): string[] => {
    const emptyFields: string[] = [];
    const soapFields = [
      'chiefComplaint', 'history', 'weight', 'temperature', 'heartRate',
      'respirationRate', 'bodyConditionScore', 'muscleCondition', 'painScore',
      'hydration', 'attitude', 'behaviour', 'mucousMembranes', 'crt',
      'diagnosis', 'treatment'
    ];

    soapFields.forEach(field => {
      const value = formData[field as keyof MedicalRecordInput];
      if (value === undefined || value === null || value === '') {
        emptyFields.push(field);
      }
    });

    return emptyFields;
  }, [formData]);

  // Close record handler
  const handleCloseRecord = async () => {
    if (!record) return;

    setClosingRecord(true);
    try {
      // Cancel any pending auto-save
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      // Save medical record data first to ensure all fields are persisted
      await medicalRecordsApi.update(record.id, formData);
      // Then close the record
      await medicalRecordsApi.closeRecord(record.id);
      if (isMountedRef.current) {
        setShowCloseWarning(false);
        // Close modal and refresh Flow Board to show card in COMPLETED column
        onClose();
        onSuccess?.();
      }
    } catch (err) {
      console.error('Failed to close record:', err);
    } finally {
      if (isMountedRef.current) {
        setClosingRecord(false);
      }
    }
  };

  // Reopen record handler
  const handleReopenRecord = async () => {
    if (!record) return;

    setReopeningRecord(true);
    try {
      await medicalRecordsApi.reopenRecord(record.id);
      if (isMountedRef.current) {
        // Close modal and refresh Flow Board to show card in IN_PROGRESS column
        onClose();
        onSuccess?.();
      }
    } catch (err) {
      console.error('Failed to reopen record:', err);
    } finally {
      if (isMountedRef.current) {
        setReopeningRecord(false);
      }
    }
  };


  // Auto-save function - uses ref to get latest formData
  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  const saveRecord = useCallback(async (dataToSave?: MedicalRecordInput) => {
    if (!record || !isMountedRef.current) return;

    const data = dataToSave || formDataRef.current;
    setSaving(true);
    try {
      await medicalRecordsApi.update(record.id, data);
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
  }, [record, t]);

  // Handle form field changes with auto-save
  const handleFieldChange = useCallback((field: keyof MedicalRecordInput, value: string | number | undefined) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      autoSaveTimeoutRef.current = setTimeout(() => {
        saveRecord(newData);
      }, 2000);

      return newData;
    });
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
    }
    // Always save before closing to ensure data is not lost
    saveRecord();
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
            {record?.isClosed && (
              <span className="flex items-center gap-1 text-sm bg-red-500/80 px-3 py-1 rounded-full">
                {tFlow('record.closed')}
              </span>
            )}
            {saving && (
              <span className="flex items-center gap-1 text-sm bg-white/20 px-3 py-1 rounded-full">
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                {t('saving')}
              </span>
            )}
            {!saving && lastSaved && !record?.isClosed && (
              <span className="text-sm text-emerald-100">
                {t('lastSaved')}: {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Close/Reopen Record Button */}
            {record && !isReadOnly && (
              record.isClosed ? (
                <button
                  onClick={handleReopenRecord}
                  disabled={reopeningRecord}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  type="button"
                >
                  {reopeningRecord ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      {tFlow('record.reopening')}
                    </>
                  ) : (
                    tFlow('record.reopen')
                  )}
                </button>
              ) : (
                <div className="relative group">
                  <button
                    onClick={() => setShowCloseWarning(true)}
                    disabled={closingRecord || !mandatoryFieldsValid}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    type="button"
                  >
                    {tFlow('record.close')}
                  </button>
                  {!mandatoryFieldsValid && (
                    <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                      {t('mandatoryFields.mustFillBeforeClose')}
                      <div className="absolute top-full right-4 border-4 border-transparent border-t-gray-800"></div>
                    </div>
                  )}
                </div>
              )
            )}
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              type="button"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
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
                      {(effectiveAppointment?.pet?.owner || record?.pet?.owner)
                        ? `${(effectiveAppointment?.pet?.owner || record?.pet?.owner)?.firstName} ${(effectiveAppointment?.pet?.owner || record?.pet?.owner)?.lastName}`
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wide">{t('patientInfo.phone')}</label>
                    <p className="font-semibold text-gray-900 mt-1" dir="ltr">
                      {canViewPhone
                        ? (effectiveAppointment?.pet?.owner?.phone || record?.pet?.owner?.phone || '-')
                        : maskPhoneNumber(effectiveAppointment?.pet?.owner?.phone || record?.pet?.owner?.phone || '')}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wide">{t('patientInfo.pet')}</label>
                    <p className="font-semibold text-gray-900 mt-1">{effectiveAppointment?.pet?.name || record?.pet?.name || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wide">{t('patientInfo.species')}</label>
                    <p className="font-semibold text-gray-900 mt-1">{effectiveAppointment?.pet?.species || record?.pet?.species || '-'}</p>
                  </div>
                  {effectiveAppointment?.visitType && (
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wide">{tFlow('form.visitType')}</label>
                      <p className="font-semibold text-gray-900 mt-1">{tFlow(`visitTypes.${effectiveAppointment.visitType}`)}</p>
                    </div>
                  )}
                  {(effectiveAppointment?.vet || record?.vet) && (
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wide">{tFlow('card.vet')}</label>
                      <p className="font-semibold text-gray-900 mt-1">{(effectiveAppointment?.vet || record?.vet)?.firstName} {(effectiveAppointment?.vet || record?.vet)?.lastName}</p>
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
                          disabled={isReadOnly || record?.isClosed}
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
                          disabled={isReadOnly || record?.isClosed}
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
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {t('fields.weight')} (kg) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={formData.weight || ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            handleFieldChange('weight', e.target.value && val >= 0 ? val : undefined);
                          }}
                          disabled={isReadOnly || record?.isClosed}
                          className={`w-full px-2 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm ${
                            !formData.weight && !record?.isClosed ? 'border-orange-300 bg-orange-50' : 'border-gray-300'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {t('fields.temperature')} (C) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={formData.temperature || ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            handleFieldChange('temperature', e.target.value && val >= 0 ? val : undefined);
                          }}
                          disabled={isReadOnly || record?.isClosed}
                          className={`w-full px-2 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm ${
                            !formData.temperature && !record?.isClosed ? 'border-orange-300 bg-orange-50' : 'border-gray-300'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {t('fields.heartRate')} (bpm) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.heartRate || ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            handleFieldChange('heartRate', e.target.value && val >= 0 ? val : undefined);
                          }}
                          disabled={isReadOnly || record?.isClosed}
                          className={`w-full px-2 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm ${
                            !formData.heartRate && !record?.isClosed ? 'border-orange-300 bg-orange-50' : 'border-gray-300'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{t('fields.respirationRate')} (/min)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.respirationRate || ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            handleFieldChange('respirationRate', e.target.value && val >= 0 ? val : undefined);
                          }}
                          disabled={isReadOnly || record?.isClosed}
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
                          disabled={isReadOnly || record?.isClosed}
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
                          disabled={isReadOnly || record?.isClosed}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{t('fields.muscleCondition')}</label>
                        <select
                          value={formData.muscleCondition || ''}
                          onChange={(e) => handleFieldChange('muscleCondition', e.target.value)}
                          disabled={isReadOnly || record?.isClosed}
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
                          disabled={isReadOnly || record?.isClosed}
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
                          disabled={isReadOnly || record?.isClosed}
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
                          disabled={isReadOnly || record?.isClosed}
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
                          min="0"
                          step="0.1"
                          value={formData.crt || ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            handleFieldChange('crt', e.target.value && val >= 0 ? val : undefined);
                          }}
                          disabled={isReadOnly || record?.isClosed}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{t('fields.behaviour')}</label>
                        <input
                          type="text"
                          value={formData.behaviour || ''}
                          onChange={(e) => handleFieldChange('behaviour', e.target.value)}
                          disabled={isReadOnly || record?.isClosed}
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
                      disabled={isReadOnly || record?.isClosed}
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
                          disabled={isReadOnly || record?.isClosed}
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
                          disabled={isReadOnly || record?.isClosed}
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
              {canCreateAppointments && (effectiveAppointment || record?.pet) && (
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
                          {/* 3 Independent Appointment Date + Time Rows */}
                          <div className="space-y-3">
                            {/* Routine Check-up */}
                            <div className="p-3 rounded-lg border bg-sky-50 border-sky-100">
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-sky-700">
                                  {tFlow('nextAppointment.routineCheckup')}
                                </label>
                              </div>
                              {/* Show existing booked appointments */}
                              {bookedAppointmentsByType.checkup.length > 0 && (
                                <div className="mb-3 space-y-2">
                                  {bookedAppointmentsByType.checkup.map((appt) => (
                                    <div key={appt.id} className="flex items-center justify-between p-2 bg-orange-100 border border-orange-300 rounded-lg">
                                      <div className="flex items-center gap-2">
                                        <span className="text-orange-500">🟠</span>
                                        <span className="text-sm font-medium text-orange-800">
                                          {tFlow('nextAppointment.booked')}: {new Date(appt.appointmentDate).toLocaleDateString()} - {appt.appointmentTime}
                                        </span>
                                        {appt.vet && (
                                          <span className="text-xs text-orange-600">
                                            ({appt.vet.firstName} {appt.vet.lastName})
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {/* Add new appointment form */}
                              <div className="flex items-center gap-3">
                                <div className="flex-1">
                                  <input
                                    type="date"
                                    value={checkupDate}
                                    min={getTomorrowDate()}
                                    onChange={(e) => setCheckupDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-sky-200 bg-white rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                  />
                                </div>
                                <div className="flex-1">
                                  <select
                                    value={checkupTime}
                                    onChange={(e) => setCheckupTime(e.target.value)}
                                    disabled={!checkupDate || !appointmentVetId}
                                    className="w-full px-3 py-2 border border-sky-200 bg-white rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                  >
                                    <option value="">{t('nextAppointment.time')}</option>
                                    {checkupDate && appointmentVetId && generateTimeSlots(VISIT_TYPE_DURATION[VisitType.GENERAL_CHECKUP], checkupDate)
                                      .filter(slot => !isSlotBooked(slot, VISIT_TYPE_DURATION[VisitType.GENERAL_CHECKUP], checkupBookedSlots))
                                      .map(slot => (
                                        <option key={slot} value={slot}>{slot}</option>
                                      ))}
                                  </select>
                                </div>
                                {(checkupDate || checkupTime) && (
                                  <button
                                    type="button"
                                    onClick={() => { setCheckupDate(''); setCheckupTime(''); }}
                                    className="p-1 text-sky-400 hover:text-sky-600"
                                  >
                                    <XMarkIcon className="w-5 h-5" />
                                  </button>
                                )}
                              </div>
                              {bookedAppointmentsByType.checkup.length > 0 && (
                                <p className="mt-2 text-xs text-sky-600">
                                  {tFlow('nextAppointment.addAnother')} {tFlow('nextAppointment.routineCheckup')}
                                </p>
                              )}
                            </div>

                            {/* Vaccination */}
                            <div className="p-3 rounded-lg border bg-green-50 border-green-100">
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-green-700">
                                  {tFlow('nextAppointment.nextVaccination')}
                                </label>
                              </div>
                              {/* Show existing booked appointments */}
                              {bookedAppointmentsByType.vaccination.length > 0 && (
                                <div className="mb-3 space-y-2">
                                  {bookedAppointmentsByType.vaccination.map((appt) => (
                                    <div key={appt.id} className="flex items-center justify-between p-2 bg-orange-100 border border-orange-300 rounded-lg">
                                      <div className="flex items-center gap-2">
                                        <span className="text-orange-500">🟠</span>
                                        <span className="text-sm font-medium text-orange-800">
                                          {tFlow('nextAppointment.booked')}: {new Date(appt.appointmentDate).toLocaleDateString()} - {appt.appointmentTime}
                                        </span>
                                        {appt.vet && (
                                          <span className="text-xs text-orange-600">
                                            ({appt.vet.firstName} {appt.vet.lastName})
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {/* Add new appointment form */}
                              <div className="flex items-center gap-3">
                                <div className="flex-1">
                                  <input
                                    type="date"
                                    value={vaccinationDate}
                                    min={getTomorrowDate()}
                                    onChange={(e) => setVaccinationDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-green-200 bg-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                  />
                                </div>
                                <div className="flex-1">
                                  <select
                                    value={vaccinationTime}
                                    onChange={(e) => setVaccinationTime(e.target.value)}
                                    disabled={!vaccinationDate || !appointmentVetId}
                                    className="w-full px-3 py-2 border border-green-200 bg-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                  >
                                    <option value="">{t('nextAppointment.time')}</option>
                                    {vaccinationDate && appointmentVetId && generateTimeSlots(VISIT_TYPE_DURATION[VisitType.VACCINATION], vaccinationDate)
                                      .filter(slot => !isSlotBooked(slot, VISIT_TYPE_DURATION[VisitType.VACCINATION], vaccinationBookedSlots))
                                      .map(slot => (
                                        <option key={slot} value={slot}>{slot}</option>
                                      ))}
                                  </select>
                                </div>
                                {(vaccinationDate || vaccinationTime) && (
                                  <button
                                    type="button"
                                    onClick={() => { setVaccinationDate(''); setVaccinationTime(''); }}
                                    className="p-1 text-green-400 hover:text-green-600"
                                  >
                                    <XMarkIcon className="w-5 h-5" />
                                  </button>
                                )}
                              </div>
                              {bookedAppointmentsByType.vaccination.length > 0 && (
                                <p className="mt-2 text-xs text-green-600">
                                  {tFlow('nextAppointment.addAnother')} {tFlow('nextAppointment.nextVaccination')}
                                </p>
                              )}
                            </div>

                            {/* Deworming - Flea */}
                            <div className="p-3 rounded-lg border bg-purple-50 border-purple-100">
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-purple-700">
                                  {tFlow('nextAppointment.dewormingFlea')}
                                </label>
                              </div>
                              {/* Show existing booked appointments */}
                              {bookedAppointmentsByType.deworming.length > 0 && (
                                <div className="mb-3 space-y-2">
                                  {bookedAppointmentsByType.deworming.map((appt) => (
                                    <div key={appt.id} className="flex items-center justify-between p-2 bg-orange-100 border border-orange-300 rounded-lg">
                                      <div className="flex items-center gap-2">
                                        <span className="text-orange-500">🟠</span>
                                        <span className="text-sm font-medium text-orange-800">
                                          {tFlow('nextAppointment.booked')}: {new Date(appt.appointmentDate).toLocaleDateString()} - {appt.appointmentTime}
                                        </span>
                                        {appt.vet && (
                                          <span className="text-xs text-orange-600">
                                            ({appt.vet.firstName} {appt.vet.lastName})
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {/* Add new appointment form */}
                              <div className="flex items-center gap-3">
                                <div className="flex-1">
                                  <input
                                    type="date"
                                    value={dewormingDate}
                                    min={getTomorrowDate()}
                                    onChange={(e) => setDewormingDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-purple-200 bg-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                  />
                                </div>
                                <div className="flex-1">
                                  <select
                                    value={dewormingTime}
                                    onChange={(e) => setDewormingTime(e.target.value)}
                                    disabled={!dewormingDate || !appointmentVetId}
                                    className="w-full px-3 py-2 border border-purple-200 bg-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                  >
                                    <option value="">{t('nextAppointment.time')}</option>
                                    {dewormingDate && appointmentVetId && generateTimeSlots(VISIT_TYPE_DURATION[VisitType.GENERAL_CHECKUP], dewormingDate)
                                      .filter(slot => !isSlotBooked(slot, VISIT_TYPE_DURATION[VisitType.GENERAL_CHECKUP], dewormingBookedSlots))
                                      .map(slot => (
                                        <option key={slot} value={slot}>{slot}</option>
                                      ))}
                                  </select>
                                </div>
                                {(dewormingDate || dewormingTime) && (
                                  <button
                                    type="button"
                                    onClick={() => { setDewormingDate(''); setDewormingTime(''); }}
                                    className="p-1 text-purple-400 hover:text-purple-600"
                                  >
                                    <XMarkIcon className="w-5 h-5" />
                                  </button>
                                )}
                              </div>
                              {bookedAppointmentsByType.deworming.length > 0 && (
                                <p className="mt-2 text-xs text-purple-600">
                                  {tFlow('nextAppointment.addAnother')} {tFlow('nextAppointment.dewormingFlea')}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Vet Selection */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">{t('nextAppointment.vet')}</label>
                              <select
                                value={appointmentVetId}
                                onChange={(e) => setAppointmentVetId(e.target.value)}
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
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">{t('nextAppointment.notes')}</label>
                              <input
                                type="text"
                                value={appointmentNotes}
                                onChange={(e) => setAppointmentNotes(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                placeholder={t('nextAppointment.notesPlaceholder')}
                              />
                            </div>
                          </div>

                          {/* Summary */}
                          {appointmentsToBookCount > 0 && (
                            <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
                              {t('nextAppointment.willBook', { count: appointmentsToBookCount })}
                            </div>
                          )}

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
                                setCheckupDate('');
                                setCheckupTime('');
                                setVaccinationDate('');
                                setVaccinationTime('');
                                setDewormingDate('');
                                setDewormingTime('');
                                setAppointmentNotes('');
                              }}
                              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors"
                            >
                              {t('nextAppointment.cancel')}
                            </button>
                            <button
                              type="button"
                              onClick={handleBookNextAppointments}
                              disabled={bookingAppointment || !appointmentVetId || appointmentsToBookCount === 0}
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
                                  {t('nextAppointment.book')} {appointmentsToBookCount > 0 && `(${appointmentsToBookCount})`}
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

              {/* Upcoming Appointments Section */}
              {upcomingAppointments.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-indigo-50 px-5 py-3 border-b border-indigo-100 flex items-center gap-2">
                    <CalendarDaysIcon className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-semibold text-indigo-900">{t('upcomingAppointments.title')}</h3>
                    <span className="bg-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-medium">
                      {upcomingAppointments.length}
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="space-y-2">
                      {upcomingAppointments.map((appt) => (
                        <div
                          key={appt.id}
                          className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-100"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-sm font-medium text-indigo-700">
                              {new Date(appt.appointmentDate).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-indigo-600" dir="ltr">
                              {appt.appointmentTime}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                              {appt.notes || (appt.visitType && tFlow(`visitTypes.${appt.visitType}`))}
                            </span>
                            {appt.vet && (
                              <span className="text-sm text-gray-600">
                                {appt.vet.firstName} {appt.vet.lastName}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
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

      {/* Close Record Warning Modal */}
      <ConfirmationModal
        isOpen={showCloseWarning}
        onClose={() => setShowCloseWarning(false)}
        onConfirm={handleCloseRecord}
        title={tFlow('record.closeWarningTitle')}
        message={
          <>
            {tFlow('record.closeWarning')}
            {getEmptyFields().length > 0 && (
              <ul className="mt-3 list-disc list-inside text-sm text-gray-600">
                {getEmptyFields().map((field) => (
                  <li key={field}>{tFlow(`record.emptyFields.${field}`)}</li>
                ))}
              </ul>
            )}
          </>
        }
        confirmText={tFlow('record.closeConfirm')}
        cancelText={tFlow('record.closeCancel')}
        variant="warning"
        loading={closingRecord}
      />
    </div>
  );

  return createPortal(modalContent, modalRoot);
};
