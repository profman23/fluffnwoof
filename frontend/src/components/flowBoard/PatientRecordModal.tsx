import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { XMarkIcon, ArrowPathIcon, CalendarDaysIcon, CheckCircleIcon, PlusIcon, CreditCardIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { FlowBoardAppointment, MedicalRecord, MedicalRecordInput, VisitType, User, Appointment, MedicalAttachment } from '../../types';
import { medicalRecordsApi } from '../../api/medicalRecords';
import { flowBoardApi } from '../../api/flowBoard';
import { invoicesApi, Invoice } from '../../api/invoices';
import { visitTypesApi } from '../../api/visitTypes';
import { AuditLogSection } from '../medical/AuditLogSection';
import { FileAttachment } from '../common/FileAttachment';
import { PetFormsSection } from '../forms/PetFormsSection';
import { uploadApi } from '../../api/upload';
import { useScreenPermission, usePhonePermission, maskPhoneNumber } from '../../hooks/useScreenPermission';
import { isSlotBooked, getTomorrowDate } from '../../utils/appointmentUtils';
import { shiftsApi } from '../../api/shifts';
import { ServiceProductSelector, SelectedItem } from './ServiceProductSelector';
import { PaymentSection, PaymentEntry } from './PaymentSection';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { PermissionAlert } from '../common/PermissionAlert';

interface PatientRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  appointment: FlowBoardAppointment | null;
  existingRecordId?: string;
  /** If true, this is a standalone record (created from Medical Records, not FlowBoard) */
  isStandaloneRecord?: boolean;
}

const MUSCLE_CONDITIONS = ['Normal', 'Mild loss', 'Moderate loss', 'Severe loss'];
const HYDRATION_LEVELS = ['Normal', 'Mild', 'Moderate', 'Severe'];
const ATTITUDES = ['BAR', 'QAR', 'Depressed', 'Lethargic', 'Comatose'];
const MUCOUS_MEMBRANES = ['Pink', 'Pale', 'Cyanotic', 'Icteric', 'Injected'];

/**
 * Sanitize form data before sending to API
 * Filters out empty strings to prevent overwriting existing data
 */
const sanitizeFormDataForApi = (data: MedicalRecordInput): MedicalRecordInput => {
  const result: MedicalRecordInput = {};

  // String fields - only include if non-empty
  const stringFields = [
    'chiefComplaint', 'history', 'diagnosis', 'treatment', 'notes',
    'muscleCondition', 'hydration', 'attitude', 'behaviour', 'mucousMembranes'
  ] as const;

  for (const field of stringFields) {
    const value = data[field];
    if (typeof value === 'string' && value.trim() !== '') {
      (result as Record<string, unknown>)[field] = value;
    }
  }

  // Number fields - include if defined and valid
  const numberFields = [
    'weight', 'temperature', 'heartRate', 'respirationRate',
    'bodyConditionScore', 'painScore', 'crt'
  ] as const;

  for (const field of numberFields) {
    const value = data[field];
    if (typeof value === 'number' && !isNaN(value)) {
      (result as Record<string, unknown>)[field] = value;
    }
  }

  return result;
};

export const PatientRecordModal = ({
  isOpen,
  onClose,
  onSuccess,
  appointment,
  existingRecordId,
  isStandaloneRecord = false,
}: PatientRecordModalProps) => {
  const { t, i18n } = useTranslation('patientRecord');
  const { t: tFlow } = useTranslation('flowBoard');
  const isRTL = i18n.language === 'ar';
  const { isReadOnly, hasNoAccess: noMedicalAccess } = useScreenPermission('medical');

  // Fetch visit types to get the actual name
  const { data: visitTypes = [] } = useQuery({
    queryKey: ['visit-types-all'],
    queryFn: () => visitTypesApi.getAll(true),
    staleTime: 1000 * 60 * 5,
  });

  // Helper to get visit type name from code
  const getVisitTypeName = useCallback((code: string | undefined) => {
    if (!code) return null;
    const visitType = visitTypes.find(vt => vt.code === code);
    if (visitType) {
      return isRTL ? visitType.nameAr : visitType.nameEn;
    }
    // Fallback to translation for old enum values
    return tFlow(`visitTypes.${code}`);
  }, [visitTypes, isRTL, tFlow]);
  const { isFullControl: canCreateAppointments } = useScreenPermission('flowBoard');
  const { canViewPhone } = usePhonePermission();
  // Reopen requires medical write permission (it modifies the medical record)
  const canReopenRecord = !isReadOnly && !noMedicalAccess;
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

  // Next Appointment state - 4 independent rows with date, visit type, and time
  const [showNextAppointment, setShowNextAppointment] = useState(false);
  const [checkupDate, setCheckupDate] = useState('');
  const [checkupTime, setCheckupTime] = useState('');
  const [checkupVisitType, setCheckupVisitType] = useState('');
  const [vaccinationDate, setVaccinationDate] = useState('');
  const [vaccinationTime, setVaccinationTime] = useState('');
  const [vaccinationVisitType, setVaccinationVisitType] = useState('');
  const [dewormingDate, setDewormingDate] = useState('');
  const [dewormingTime, setDewormingTime] = useState('');
  const [dewormingVisitType, setDewormingVisitType] = useState('');
  const [surgeryDate, setSurgeryDate] = useState('');
  const [surgeryTime, setSurgeryTime] = useState('');
  const [surgeryVisitType, setSurgeryVisitType] = useState('');
  const [appointmentVetId, setAppointmentVetId] = useState('');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [bookingAppointment, setBookingAppointment] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingWarning, setBookingWarning] = useState<string | null>(null);
  const [staff, setStaff] = useState<User[]>([]);
  // Refresh key to force re-fetch of available slots after booking
  const [slotsRefreshKey, setSlotsRefreshKey] = useState(0);

  // Invoice/Payment state
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [hasUnsavedInvoiceChanges, setHasUnsavedInvoiceChanges] = useState(false);
  // Track original items/payments loaded from DB for comparison during batch save
  const [originalItems, setOriginalItems] = useState<SelectedItem[]>([]);
  const [originalPayments, setOriginalPayments] = useState<PaymentEntry[]>([]);

  // Finalize invoice state
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const [finalizingInvoice, setFinalizingInvoice] = useState(false);

  // Close/Reopen record state
  const [showCloseWarning, setShowCloseWarning] = useState(false);
  const [closingRecord, setClosingRecord] = useState(false);
  const [reopeningRecord, setReopeningRecord] = useState(false);

  // Empty record warning (for standalone records from Medical Records page)
  const [showEmptyRecordWarning, setShowEmptyRecordWarning] = useState(false);
  const [deletingEmptyRecord, setDeletingEmptyRecord] = useState(false);

  // Track unsaved changes and save-before-close state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSavingBeforeClose, setIsSavingBeforeClose] = useState(false);

  // Upcoming appointments state (scheduled from this record)
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  // All upcoming appointments for this pet (for showing existing booked appointments)
  const [petUpcomingAppointments, setPetUpcomingAppointments] = useState<Appointment[]>([]);

  // Medical Attachments state
  const [attachments, setAttachments] = useState<MedicalAttachment[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);

  // Get booked appointments by type for this pet
  const bookedAppointmentsByType = useMemo(() => {
    const result: {
      checkup: Appointment[];
      vaccination: Appointment[];
      deworming: Appointment[];
      surgery: Appointment[];
    } = {
      checkup: [],
      vaccination: [],
      deworming: [],
      surgery: [],
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
      if (notes.includes('surgery') || notes.includes('dental') || notes.includes('جراحة') || notes.includes('تنظيف الأسنان')) {
        result.surgery.push(appt);
      }
    });

    return result;
  }, [petUpcomingAppointments]);

  // Collect locally-selected slots from other rows (for cross-row filtering)
  const getLocallySelectedSlots = useCallback(
    (excludeType: 'checkup' | 'vaccination' | 'deworming' | 'surgery', forDate: string): { appointmentTime: string; duration: number }[] => {
      const slots: { appointmentTime: string; duration: number }[] = [];
      const SLOT_INTERVAL = 5; // Only block the exact same 5-min slot, not the full visit duration
      const rows = [
        { type: 'checkup' as const, date: checkupDate, time: checkupTime, duration: SLOT_INTERVAL },
        { type: 'vaccination' as const, date: vaccinationDate, time: vaccinationTime, duration: SLOT_INTERVAL },
        { type: 'deworming' as const, date: dewormingDate, time: dewormingTime, duration: SLOT_INTERVAL },
        { type: 'surgery' as const, date: surgeryDate, time: surgeryTime, duration: SLOT_INTERVAL },
      ];
      for (const row of rows) {
        if (row.type !== excludeType && row.date === forDate && row.time) {
          slots.push({ appointmentTime: row.time, duration: row.duration });
        }
      }
      return slots;
    },
    [checkupDate, checkupTime, vaccinationDate, vaccinationTime, dewormingDate, dewormingTime, surgeryDate, surgeryTime]
  );

  // Mandatory fields validation
  const mandatoryFieldsValid = useMemo(() => {
    // Check if each appointment type has a date + visit type set OR is already booked
    const hasCheckup = (checkupDate.length > 0 && checkupVisitType.length > 0) || bookedAppointmentsByType.checkup.length > 0;
    const hasVaccination = (vaccinationDate.length > 0 && vaccinationVisitType.length > 0) || bookedAppointmentsByType.vaccination.length > 0;
    const hasDeworming = (dewormingDate.length > 0 && dewormingVisitType.length > 0) || bookedAppointmentsByType.deworming.length > 0;
    const hasSurgery = (surgeryDate.length > 0 && surgeryVisitType.length > 0) || bookedAppointmentsByType.surgery.length > 0;

    return (
      formData.weight !== undefined && formData.weight !== null && formData.weight > 0 &&
      formData.temperature !== undefined && formData.temperature !== null && formData.temperature > 0 &&
      formData.heartRate !== undefined && formData.heartRate !== null && formData.heartRate > 0 &&
      hasCheckup && hasVaccination && hasDeworming && hasSurgery
    );
  }, [formData.weight, formData.temperature, formData.heartRate, checkupDate, checkupVisitType, vaccinationDate, vaccinationVisitType, dewormingDate, dewormingVisitType, surgeryDate, surgeryVisitType, bookedAppointmentsByType]);

  // Check if record is empty (no data added) - for standalone records
  const isRecordEmpty = useMemo(() => {
    // Check string fields
    const stringFields = ['chiefComplaint', 'history', 'diagnosis', 'treatment', 'notes',
      'muscleCondition', 'hydration', 'attitude', 'behaviour', 'mucousMembranes'] as const;
    const hasStringData = stringFields.some(field => {
      const value = formData[field];
      return typeof value === 'string' && value.trim() !== '';
    });

    // Check number fields
    const numberFields = ['weight', 'temperature', 'heartRate', 'respirationRate',
      'bodyConditionScore', 'painScore', 'crt'] as const;
    const hasNumberData = numberFields.some(field => {
      const value = formData[field];
      return typeof value === 'number' && !isNaN(value) && value > 0;
    });

    return !hasStringData && !hasNumberData;
  }, [formData]);

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
      setHasUnsavedChanges(false);
      setLastSaved(null);
      setUpcomingAppointments([]); // Reset scheduled appointments when modal closes
      return;
    }

    // No medical access - don't attempt to load
    if (noMedicalAccess) {
      setLoading(false);
      return;
    }

    const loadRecord = async () => {
      setLoading(true);
      setError(null);
      setHasUnsavedChanges(false); // Reset unsaved changes on load
      try {
        let data: MedicalRecord;

        if (existingRecordId) {
          data = await medicalRecordsApi.getById(existingRecordId);
        } else if (appointment) {
          if (isReadOnly) {
            // Read-only users: fetch existing record without creating
            const existing = await medicalRecordsApi.getByAppointmentId(appointment.id);
            if (!existing) {
              if (!isMountedRef.current) return;
              setError(t('errors.noRecordReadOnly'));
              setLoading(false);
              return;
            }
            data = existing;
          } else {
            data = await medicalRecordsApi.getOrCreateForAppointment(appointment.id);
          }
        } else {
          throw new Error('No record or appointment provided');
        }

        if (!isMountedRef.current) return;
        setRecord(data);

        // Pre-fill chiefComplaint from appointment.reason if not already set
        // This connects the visit reason from portal booking to the medical record
        const chiefComplaintValue = data.chiefComplaint || (appointment?.reason ?? '');

        setFormData({
          chiefComplaint: chiefComplaintValue,
          history: data.history ?? '',
          weight: data.weight ?? undefined,
          temperature: data.temperature ?? undefined,
          heartRate: data.heartRate ?? undefined,
          respirationRate: data.respirationRate ?? undefined,
          bodyConditionScore: data.bodyConditionScore ?? undefined,
          muscleCondition: data.muscleCondition ?? '',
          painScore: data.painScore ?? undefined,
          hydration: data.hydration ?? '',
          attitude: data.attitude ?? '',
          behaviour: data.behaviour ?? '',
          mucousMembranes: data.mucousMembranes ?? '',
          crt: data.crt ?? undefined,
          diagnosis: data.diagnosis ?? '',
          treatment: data.treatment ?? '',
          notes: data.notes ?? '',
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
  }, [isOpen, appointment?.id, existingRecordId, openCount, t, isReadOnly, noMedicalAccess]);

  // Load existing invoice for appointment
  useEffect(() => {
    const loadInvoice = async () => {
      if (!effectiveAppointment?.id) return;

      try {
        const existingInvoice = await invoicesApi.getByAppointmentId(effectiveAppointment.id);
        if (existingInvoice && isMountedRef.current) {
          setInvoice(existingInvoice);
          const loadedItems = existingInvoice.items.map((item) => ({
              id: item.id,
              name: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              priceBeforeTax: item.priceBeforeTax ?? (item.unitPrice / (1 + (item.taxRate ?? 15) / 100)),
              taxRate: item.taxRate ?? 15,
              discount: item.discount || 0,
              totalPrice: item.totalPrice,
            }));
          const loadedPayments = existingInvoice.payments.map((p) => ({
              id: p.id,
              amount: p.amount,
              paymentMethod: p.paymentMethod,
            }));
          setSelectedItems(loadedItems);
          setOriginalItems(loadedItems);
          setPayments(loadedPayments);
          setOriginalPayments(loadedPayments);
          setHasUnsavedInvoiceChanges(false);
        }
      } catch (err) {
        console.log('No existing invoice for this appointment');
      }
    };

    if (isOpen && effectiveAppointment?.id) {
      loadInvoice();
    }
  }, [isOpen, effectiveAppointment?.id]);

  // Load staff (vets) for next appointment - load when modal opens
  useEffect(() => {
    const loadStaff = async () => {
      try {
        const data = await flowBoardApi.getStaff();
        if (isMountedRef.current) {
          setStaff(data);
        }
      } catch (err) {
        console.error('Failed to load staff:', err);
      }
    };

    if (isOpen) {
      loadStaff();
    }
  }, [isOpen]);

  // Set default vet from appointment when showing next appointment section
  useEffect(() => {
    if (showNextAppointment && effectiveAppointment?.vet?.id && !appointmentVetId) {
      setAppointmentVetId(effectiveAppointment.vet.id);
    }
  }, [showNextAppointment, effectiveAppointment?.vet?.id, appointmentVetId]);

  // Helper to get duration from visit type code
  const getVisitTypeDuration = useCallback((code: string): number => {
    const vt = visitTypes.find(v => v.code === code);
    return vt?.duration || 30;
  }, [visitTypes]);

  // Fetch available slots from backend API (same as Add Appointment modal)
  const checkupDuration = checkupVisitType ? getVisitTypeDuration(checkupVisitType) : 30;
  const { data: checkupAvailability } = useQuery({
    queryKey: ['next-appt-avail', 'checkup', appointmentVetId, checkupDate, checkupDuration, slotsRefreshKey],
    queryFn: () => shiftsApi.getAvailabilityV2(appointmentVetId, checkupDate, checkupDuration),
    enabled: !!appointmentVetId && !!checkupDate && !!checkupVisitType && showNextAppointment,
    staleTime: 1000 * 10,
  });

  const vaccinationDuration = vaccinationVisitType ? getVisitTypeDuration(vaccinationVisitType) : 30;
  const { data: vaccinationAvailability } = useQuery({
    queryKey: ['next-appt-avail', 'vaccination', appointmentVetId, vaccinationDate, vaccinationDuration, slotsRefreshKey],
    queryFn: () => shiftsApi.getAvailabilityV2(appointmentVetId, vaccinationDate, vaccinationDuration),
    enabled: !!appointmentVetId && !!vaccinationDate && !!vaccinationVisitType && showNextAppointment,
    staleTime: 1000 * 10,
  });

  const dewormingDuration = dewormingVisitType ? getVisitTypeDuration(dewormingVisitType) : 30;
  const { data: dewormingAvailability } = useQuery({
    queryKey: ['next-appt-avail', 'deworming', appointmentVetId, dewormingDate, dewormingDuration, slotsRefreshKey],
    queryFn: () => shiftsApi.getAvailabilityV2(appointmentVetId, dewormingDate, dewormingDuration),
    enabled: !!appointmentVetId && !!dewormingDate && !!dewormingVisitType && showNextAppointment,
    staleTime: 1000 * 10,
  });

  const surgeryDuration = surgeryVisitType ? getVisitTypeDuration(surgeryVisitType) : 30;
  const { data: surgeryAvailability } = useQuery({
    queryKey: ['next-appt-avail', 'surgery', appointmentVetId, surgeryDate, surgeryDuration, slotsRefreshKey],
    queryFn: () => shiftsApi.getAvailabilityV2(appointmentVetId, surgeryDate, surgeryDuration),
    enabled: !!appointmentVetId && !!surgeryDate && !!surgeryVisitType && showNextAppointment,
    staleTime: 1000 * 10,
  });

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

  // Fetch medical attachments when record is loaded
  useEffect(() => {
    const fetchAttachments = async () => {
      if (!record?.id || !isOpen) return;

      setAttachmentsLoading(true);
      try {
        const data = await uploadApi.getMedicalAttachments(record.id);
        if (isMountedRef.current) {
          setAttachments(data);
        }
      } catch (err) {
        console.error('Failed to fetch attachments:', err);
      } finally {
        if (isMountedRef.current) {
          setAttachmentsLoading(false);
        }
      }
    };

    fetchAttachments();
  }, [isOpen, record?.id]);

  // Handle attachment upload
  const handleAttachmentUpload = async (file: File, description?: string) => {
    if (!record?.id) return;

    const attachment = await uploadApi.uploadMedicalAttachment(record.id, file, description);
    setAttachments(prev => [attachment, ...prev]);
  };

  // Handle attachment delete
  const handleAttachmentDelete = async (attachmentId: string) => {
    await uploadApi.deleteMedicalAttachment(attachmentId);
    setAttachments(prev => prev.filter(a => a.id !== attachmentId));
  };

  // Count how many appointments will be booked (requires both date AND time)
  const appointmentsToBookCount = useMemo(() => {
    let count = 0;
    if (checkupDate && checkupTime && checkupVisitType) count++;
    if (vaccinationDate && vaccinationTime && vaccinationVisitType) count++;
    if (dewormingDate && dewormingTime && dewormingVisitType) count++;
    if (surgeryDate && surgeryTime && surgeryVisitType) count++;
    return count;
  }, [checkupDate, checkupTime, checkupVisitType, vaccinationDate, vaccinationTime, vaccinationVisitType, dewormingDate, dewormingTime, dewormingVisitType, surgeryDate, surgeryTime, surgeryVisitType]);

  // Handle booking next appointments (multiple) - Uses batch API for reliability
  const handleBookNextAppointments = async () => {
    const petId = effectiveAppointment?.pet?.id || record?.pet?.id;
    const recordId = record?.id;
    if (!petId || !appointmentVetId || appointmentsToBookCount === 0) {
      return;
    }

    setBookingAppointment(true);
    setBookingError(null);

    try {
      const appointmentsToBook: { date: string; time: string; visitType: string; duration: number; label: string }[] = [];

      if (checkupDate && checkupTime && checkupVisitType) {
        const vtConfig = visitTypes.find(vt => vt.code === checkupVisitType);
        appointmentsToBook.push({
          date: checkupDate,
          time: checkupTime,
          visitType: checkupVisitType,
          duration: vtConfig?.duration || 30,
          label: tFlow('nextAppointment.routineCheckup'),
        });
      }

      if (vaccinationDate && vaccinationTime && vaccinationVisitType) {
        const vtConfig = visitTypes.find(vt => vt.code === vaccinationVisitType);
        appointmentsToBook.push({
          date: vaccinationDate,
          time: vaccinationTime,
          visitType: vaccinationVisitType,
          duration: vtConfig?.duration || 30,
          label: tFlow('nextAppointment.nextVaccination'),
        });
      }

      if (dewormingDate && dewormingTime && dewormingVisitType) {
        const vtConfig = visitTypes.find(vt => vt.code === dewormingVisitType);
        appointmentsToBook.push({
          date: dewormingDate,
          time: dewormingTime,
          visitType: dewormingVisitType,
          duration: vtConfig?.duration || 30,
          label: tFlow('nextAppointment.dewormingFlea'),
        });
      }

      if (surgeryDate && surgeryTime && surgeryVisitType) {
        const vtConfig = visitTypes.find(vt => vt.code === surgeryVisitType);
        appointmentsToBook.push({
          date: surgeryDate,
          time: surgeryTime,
          visitType: surgeryVisitType,
          duration: vtConfig?.duration || 30,
          label: tFlow('nextAppointment.surgeryDentalScaling'),
        });
      }

      // Convert to batch API format
      const batchAppointments = appointmentsToBook.map(appt => ({
        petId,
        vetId: appointmentVetId,
        appointmentDate: appt.date,
        appointmentTime: appt.time,
        visitType: appt.visitType as VisitType,
        duration: appt.duration,
        notes: appt.label + (appointmentNotes ? ` - ${appointmentNotes}` : ''),
        scheduledFromRecordId: recordId,
      }));

      // Use batch API - single transaction for all appointments
      const result = await flowBoardApi.createBatchAppointments(batchAppointments);

      if (isMountedRef.current) {
        // Check if any appointments were skipped
        if (result.skipped && result.skipped.length > 0) {
          if (result.created.length > 0) {
            // Some created, some skipped
            setBookingWarning(tFlow('nextAppointment.bookingPartial', { created: result.created.length, skipped: result.skipped.length }));
            // Refresh booked slots to reflect newly created appointments
            setSlotsRefreshKey(prev => prev + 1);
          } else {
            // All skipped
            setBookingError(tFlow('nextAppointment.bookingAllSkipped', { skipped: result.skipped.length }));
          }
        } else if (result.created.length > 0) {
          // All created successfully
          setBookingSuccess(true);
          // Refresh booked slots to reflect newly created appointments
          setSlotsRefreshKey(prev => prev + 1);
        }

        setTimeout(() => {
          if (isMountedRef.current) {
            setShowNextAppointment(false);
            setBookingSuccess(false);
            setBookingWarning(null);
            // Reset all appointment dates, visit types, and times
            setCheckupDate('');
            setCheckupTime('');
            setCheckupVisitType('');
            setVaccinationDate('');
            setVaccinationTime('');
            setVaccinationVisitType('');
            setDewormingDate('');
            setDewormingTime('');
            setDewormingVisitType('');
            setSurgeryDate('');
            setSurgeryTime('');
            setSurgeryVisitType('');
            setAppointmentNotes('');
            setAppointmentVetId(effectiveAppointment?.vet?.id || '');
          }
        }, 3000);
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
        priceBeforeTax: item.priceBeforeTax,
        taxRate: item.taxRate,
        discount: item.discount,
      })),
    });

    return newInvoice;
  };

  // Handle items change - local state only (no auto-save, saved on modal close)
  const handleItemsChange = (newItems: SelectedItem[]) => {
    setSelectedItems(newItems);
    setHasUnsavedInvoiceChanges(true);
  };

  // Handle payments change - local state only (no auto-save, saved on modal close)
  const handlePaymentsChange = (newPayments: PaymentEntry[]) => {
    setPayments(newPayments);
    setHasUnsavedInvoiceChanges(true);
  };

  // Handle remove payment - local state only (no auto-save, saved on modal close)
  const handleRemovePayment = (paymentId: string) => {
    setPayments(prev => prev.filter(p => p.id !== paymentId));
    setHasUnsavedInvoiceChanges(true);
  };

  // Batch save all invoice changes (called on modal close)
  const saveInvoiceChanges = async () => {
    if (!hasUnsavedInvoiceChanges) return;

    setSavingInvoice(true);
    setInvoiceError(null);

    try {
      const ownerId = effectiveAppointment?.pet?.owner?.id || record?.pet?.owner?.id;

      if (!invoice) {
        // No invoice exists yet — create one with all current items
        if (selectedItems.length > 0 && ownerId) {
          const newInvoice = await createInvoiceWithItems(selectedItems);
          if (newInvoice && isMountedRef.current) {
            // Add payments to the new invoice
            for (const payment of payments) {
              await invoicesApi.addPayment(newInvoice.id, {
                amount: payment.amount,
                paymentMethod: payment.paymentMethod,
              });
            }
            // Refresh to get real IDs
            const refreshed = await invoicesApi.getById(newInvoice.id);
            setInvoice(refreshed);
            const syncedItems = refreshed.items.map((item) => ({
              id: item.id,
              name: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              priceBeforeTax: item.priceBeforeTax ?? (item.unitPrice / (1 + (item.taxRate ?? 15) / 100)),
              taxRate: item.taxRate ?? 15,
              discount: item.discount || 0,
              totalPrice: item.totalPrice,
            }));
            const syncedPayments = refreshed.payments.map((p) => ({
              id: p.id,
              amount: p.amount,
              paymentMethod: p.paymentMethod,
            }));
            setSelectedItems(syncedItems);
            setOriginalItems(syncedItems);
            setPayments(syncedPayments);
            setOriginalPayments(syncedPayments);
          }
        }
      } else {
        // Invoice exists — diff against originals and apply changes

        // Items: find added, changed, removed
        const originalIds = originalItems.map(item => item.id);
        const newlyAddedItems = selectedItems.filter(item => !originalIds.includes(item.id));
        const removedItems = originalItems.filter(
          orig => !selectedItems.some(current => current.id === orig.id)
        );
        const changedItems = selectedItems.filter(current => {
          const orig = originalItems.find(o => o.id === current.id);
          return orig && (orig.quantity !== current.quantity || orig.discount !== current.discount);
        });

        // Apply item changes
        for (const item of newlyAddedItems) {
          await invoicesApi.addItem(invoice.id, {
            description: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            priceBeforeTax: item.priceBeforeTax,
            taxRate: item.taxRate,
            discount: item.discount,
          });
        }
        for (const item of changedItems) {
          await invoicesApi.updateItem(item.id, {
            quantity: item.quantity,
            discount: item.discount,
          });
        }
        for (const item of removedItems) {
          await invoicesApi.removeItem(item.id);
        }

        // Payments: find added, removed
        const originalPaymentIds = originalPayments.map(p => p.id);
        const newPayments = payments.filter(p => !originalPaymentIds.includes(p.id));
        const removedPayments = originalPayments.filter(
          orig => !payments.some(current => current.id === orig.id)
        );

        for (const payment of newPayments) {
          await invoicesApi.addPayment(invoice.id, {
            amount: payment.amount,
            paymentMethod: payment.paymentMethod,
          });
        }
        for (const payment of removedPayments) {
          await invoicesApi.removePayment(payment.id);
        }

        // Refresh invoice to sync state
        const refreshed = await invoicesApi.getById(invoice.id);
        if (isMountedRef.current) {
          setInvoice(refreshed);
          const syncedItems = refreshed.items.map((item) => ({
            id: item.id,
            name: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            priceBeforeTax: item.priceBeforeTax ?? (item.unitPrice / (1 + (item.taxRate ?? 15) / 100)),
            taxRate: item.taxRate ?? 15,
            discount: item.discount || 0,
            totalPrice: item.totalPrice,
          }));
          const syncedPayments = refreshed.payments.map((p) => ({
            id: p.id,
            amount: p.amount,
            paymentMethod: p.paymentMethod,
          }));
          setSelectedItems(syncedItems);
          setOriginalItems(syncedItems);
          setPayments(syncedPayments);
          setOriginalPayments(syncedPayments);
        }
      }

      setHasUnsavedInvoiceChanges(false);
    } catch (err) {
      console.error('Failed to save invoice changes:', err);
      if (isMountedRef.current) {
        setInvoiceError(tFlow('invoice.createError'));
      }
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
    setError(null);
    try {
      // Cancel any pending auto-save
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // First, fetch the latest record state from server to ensure we have current isClosed status
      const currentRecord = await medicalRecordsApi.getById(record.id);

      // Don't try to close if already closed
      if (currentRecord.isClosed) {
        if (isMountedRef.current) {
          setRecord(currentRecord);
          setShowCloseWarning(false);
          setError(t('errors.alreadyClosed'));
        }
        return;
      }

      // Save medical record data first to ensure all fields are persisted
      // Sanitize data to prevent empty strings from overwriting existing values
      const sanitizedData = sanitizeFormDataForApi(formData);
      if (Object.keys(sanitizedData).length > 0) {
        await medicalRecordsApi.update(record.id, sanitizedData);
      }
      // Then close the record
      const closedRecord = await medicalRecordsApi.closeRecord(record.id);
      if (isMountedRef.current) {
        setRecord(closedRecord); // Update local state
        setShowCloseWarning(false);
        // Close modal and refresh Flow Board to show card in COMPLETED column
        onClose();
        onSuccess?.();
      }
    } catch (err: unknown) {
      // Extract error message from axios response
      let errorMessage = 'Failed to close record';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        errorMessage = axiosErr.response?.data?.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      if (isMountedRef.current) {
        setError(errorMessage);
        setShowCloseWarning(false);
      }
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
    setError(null);
    try {
      // First, fetch the latest record state from server
      const currentRecord = await medicalRecordsApi.getById(record.id);

      // Don't try to reopen if not closed
      if (!currentRecord.isClosed) {
        if (isMountedRef.current) {
          setRecord(currentRecord);
          setError(t('errors.alreadyOpen'));
        }
        return;
      }

      const reopenedRecord = await medicalRecordsApi.reopenRecord(record.id);
      if (isMountedRef.current) {
        setRecord(reopenedRecord); // Update local state
        // Close modal and refresh Flow Board to show card in IN_PROGRESS column
        onClose();
        onSuccess?.();
      }
    } catch (err: unknown) {
      console.error('Failed to reopen record:', err);
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to reopen record';
        setError(errorMessage);
      }
    } finally {
      if (isMountedRef.current) {
        setReopeningRecord(false);
      }
    }
  };


  // Auto-save function - uses ref to get latest formData
  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  const saveRecord = useCallback(async (dataToSave?: MedicalRecordInput): Promise<boolean> => {
    // Don't check isMountedRef here - save must complete even if modal is closing
    if (!record) return false;

    const data = dataToSave || formDataRef.current;
    // Sanitize data to prevent empty strings from overwriting existing values
    const sanitizedData = sanitizeFormDataForApi(data);

    // If no actual data to save, skip the API call
    if (Object.keys(sanitizedData).length === 0) {
      if (isMountedRef.current) {
        setHasUnsavedChanges(false);
      }
      return true;
    }

    setSaving(true);
    try {
      await medicalRecordsApi.update(record.id, sanitizedData);
      if (isMountedRef.current) {
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
      }
      return true;
    } catch (err) {
      console.error('Failed to save medical record:', err);
      if (isMountedRef.current) {
        setError(t('errors.saveFailed') || 'Failed to save');
      }
      return false;
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
      }
    }
  }, [record, t]);

  // Handle form field changes with auto-save
  const handleFieldChange = useCallback((field: keyof MedicalRecordInput, value: string | number | undefined) => {
    setHasUnsavedChanges(true);
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      // Update ref immediately to ensure latest data is available for save
      formDataRef.current = newData;

      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      autoSaveTimeoutRef.current = setTimeout(() => {
        saveRecord(newData);
      }, 1000); // Reduced from 2000ms to 1000ms for faster auto-save

      return newData;
    });
  }, [saveRecord]);

  // Save immediately when user leaves a field (blur)
  // Can be added to form inputs with onBlur={handleFieldBlur} for immediate save on field exit
  const handleFieldBlur = useCallback(() => {
    if (hasUnsavedChanges && autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
      saveRecord(formDataRef.current);
    }
  }, [hasUnsavedChanges, saveRecord]);
  // Suppress unused warning - available for future use on form inputs
  void handleFieldBlur;

  // Manual save
  const handleManualSave = useCallback(async () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    await saveRecord();
  }, [saveRecord]);

  const handleClose = useCallback(async () => {
    // Cancel any pending auto-save
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }

    // For standalone records (from Medical Records page), check if record is empty
    if (isStandaloneRecord && isRecordEmpty && record?.id) {
      setShowEmptyRecordWarning(true);
      return;
    }

    // If there are unsaved changes or a save is in progress, save first
    if (hasUnsavedChanges || saving) {
      setIsSavingBeforeClose(true);
      const success = await saveRecord(formDataRef.current);
      setIsSavingBeforeClose(false);

      if (!success) {
        // Save failed, don't close the modal
        return;
      }
    }

    // Save unsaved invoice changes before closing
    if (hasUnsavedInvoiceChanges) {
      await saveInvoiceChanges();
    }

    onClose();
  }, [onClose, saveRecord, hasUnsavedChanges, saving, isStandaloneRecord, isRecordEmpty, record?.id, hasUnsavedInvoiceChanges, saveInvoiceChanges]);

  // Handle deleting empty standalone record
  const handleDeleteEmptyRecord = useCallback(async () => {
    if (!record?.id) return;

    setDeletingEmptyRecord(true);
    try {
      await medicalRecordsApi.delete(record.id);
      setShowEmptyRecordWarning(false);
      onClose();
    } catch (error) {
      console.error('Error deleting empty record:', error);
      setShowEmptyRecordWarning(false);
    } finally {
      setDeletingEmptyRecord(false);
    }
  }, [record?.id, onClose]);

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
        className="bg-white dark:bg-[var(--app-bg-primary)] rounded-xl shadow-2xl dark:shadow-black/50 w-full max-w-7xl max-h-[98vh] overflow-hidden flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Saving before close overlay */}
        {isSavingBeforeClose && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-50 rounded-xl">
            <div className="bg-white dark:bg-[var(--app-bg-card)] rounded-lg p-6 shadow-xl dark:shadow-black/50 flex items-center gap-4">
              <ArrowPathIcon className="w-6 h-6 animate-spin text-primary-500" />
              <span className="text-lg font-medium text-gray-700 dark:text-[var(--app-text-primary)]">{tFlow('record.savingBeforeClose')}</span>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-primary-200 to-primary-300 text-brand-dark">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold flex items-center gap-2">📋 {t('title')}</h2>
            {record?.isClosed && (
              <span className="flex items-center gap-1 text-sm bg-accent-300 text-brand-dark px-3 py-1 rounded-full">
                {tFlow('record.closed')}
              </span>
            )}
            {saving && (
              <span className="flex items-center gap-1 text-sm bg-secondary-300/50 text-brand-dark px-3 py-1 rounded-full">
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                {t('saving')}
              </span>
            )}
            {!saving && lastSaved && !record?.isClosed && (
              <span className="text-sm text-primary-700">
                {t('lastSaved')}: {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Reopen Record Button - shown when record is closed and user has permission */}
            {record && record.isClosed && canReopenRecord && (
              <button
                onClick={handleReopenRecord}
                disabled={reopeningRecord}
                className="flex items-center gap-2 px-4 py-2 bg-secondary-300 hover:bg-secondary-400 text-brand-dark rounded-lg transition-colors disabled:opacity-50 font-medium"
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
            )}
            {/* Close Record Button - shown when record is open and user has write permission */}
            {record && !record.isClosed && !isReadOnly && (
                <div className="relative group">
                  <button
                    onClick={() => setShowCloseWarning(true)}
                    disabled={closingRecord || !mandatoryFieldsValid}
                    className="flex items-center gap-2 px-4 py-2 bg-accent-300 hover:bg-accent-400 text-brand-dark rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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
            )}
            <button
              onClick={handleClose}
              className="text-brand-dark/70 hover:text-brand-dark hover:bg-primary-300/50 p-2 rounded-lg transition-colors"
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
              <ArrowPathIcon className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : noMedicalAccess ? (
            <div className="m-6">
              <PermissionAlert type="noAccess" />
            </div>
          ) : error ? (
            <div className="m-6">
              <PermissionAlert type="error" message={error} />
            </div>
          ) : (appointment || record) ? (
            <div className="p-6 space-y-8">
              {/* Patient Info Card */}
              <div className="bg-gradient-to-r from-primary-50 to-accent-50 dark:from-[var(--app-bg-card)] dark:to-[var(--app-bg-tertiary)] rounded-xl p-5 border border-primary-200 dark:border-[var(--app-border-default)]">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">👤 {t('patientInfo.owner')}</label>
                    <p className="font-semibold text-gray-900 dark:text-[var(--app-text-primary)] mt-1">
                      {(effectiveAppointment?.pet?.owner || record?.pet?.owner)
                        ? `${(effectiveAppointment?.pet?.owner || record?.pet?.owner)?.firstName} ${(effectiveAppointment?.pet?.owner || record?.pet?.owner)?.lastName}`
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">📱 {t('patientInfo.phone')}</label>
                    <p className="font-semibold text-gray-900 dark:text-[var(--app-text-primary)] mt-1" dir="ltr">
                      {canViewPhone
                        ? (effectiveAppointment?.pet?.owner?.phone || record?.pet?.owner?.phone || '-')
                        : maskPhoneNumber(effectiveAppointment?.pet?.owner?.phone || record?.pet?.owner?.phone || '')}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">🐾 {t('patientInfo.pet')}</label>
                    <p className="font-semibold text-gray-900 dark:text-[var(--app-text-primary)] mt-1">{effectiveAppointment?.pet?.name || record?.pet?.name || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">🏷️ {t('patientInfo.species')}</label>
                    <p className="font-semibold text-gray-900 dark:text-[var(--app-text-primary)] mt-1">{effectiveAppointment?.pet?.species || record?.pet?.species || '-'}</p>
                  </div>
                  {(effectiveAppointment?.pet?.daftraCode || record?.pet?.daftraCode) && (
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">🏷️ {t('patientInfo.daftraCode')}</label>
                      <p className="font-semibold text-gray-900 dark:text-[var(--app-text-primary)] mt-1" dir="ltr">{effectiveAppointment?.pet?.daftraCode || record?.pet?.daftraCode}</p>
                    </div>
                  )}
                  {effectiveAppointment?.visitType && (
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">📋 {tFlow('form.visitType')}</label>
                      <p className="font-semibold text-gray-900 dark:text-[var(--app-text-primary)] mt-1">{getVisitTypeName(effectiveAppointment.visitType)}</p>
                    </div>
                  )}
                  {(effectiveAppointment?.vet || record?.vet) && (
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">🩺 {tFlow('card.vet')}</label>
                      <p className="font-semibold text-gray-900 dark:text-[var(--app-text-primary)] mt-1">{(effectiveAppointment?.vet || record?.vet)?.firstName} {(effectiveAppointment?.vet || record?.vet)?.lastName}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* SOAP Section */}
              <div className="bg-white dark:bg-[var(--app-bg-card)] rounded-xl border border-primary-200 dark:border-[var(--app-border-default)] overflow-hidden">
                <div className="bg-primary-100 dark:bg-primary-900/30 px-5 py-3 border-b border-primary-200 dark:border-[var(--app-border-default)] flex items-center gap-2">
                  <span className="text-xl">🩺</span>
                  <h3 className="text-lg font-semibold text-brand-dark dark:text-[var(--app-text-primary)]">{tFlow('tabs.soap')}</h3>
                </div>
                <div className="p-5 space-y-6">
                  {/* Subjective */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-[var(--app-text-secondary)] mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-primary-200 dark:bg-primary-900/50 text-primary-700 dark:text-primary-400 rounded-full flex items-center justify-center text-xs font-bold">S</span>
                      {t('sections.subjective')}
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-[var(--app-text-secondary)] mb-1">💬 {t('fields.chiefComplaint')}</label>
                        <textarea
                          value={formData.chiefComplaint || ''}
                          onChange={(e) => handleFieldChange('chiefComplaint', e.target.value)}
                          rows={2}
                          disabled={isReadOnly || record?.isClosed}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-[var(--app-border-default)] dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-[var(--app-bg-tertiary)] disabled:cursor-not-allowed text-sm"
                          placeholder={t('placeholders.chiefComplaint')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-[var(--app-text-secondary)] mb-1">📜 {t('fields.history')}</label>
                        <textarea
                          value={formData.history || ''}
                          onChange={(e) => handleFieldChange('history', e.target.value)}
                          rows={2}
                          disabled={isReadOnly || record?.isClosed}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-[var(--app-border-default)] dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-[var(--app-bg-tertiary)] disabled:cursor-not-allowed text-sm"
                          placeholder={t('placeholders.history')}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Objective */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-[var(--app-text-secondary)] mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-secondary-200 dark:bg-secondary-900/50 text-secondary-700 dark:text-secondary-400 rounded-full flex items-center justify-center text-xs font-bold">O</span>
                      {t('sections.objective')}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-[var(--app-text-secondary)] mb-1">
                          ⚖️ {t('fields.weight')} (kg) <span className="text-red-500">*</span>
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
                          className={`w-full px-2 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-[var(--app-bg-tertiary)] dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] text-sm ${
                            !formData.weight && !record?.isClosed ? 'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-300 dark:border-[var(--app-border-default)]'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-[var(--app-text-secondary)] mb-1">
                          🌡️ {t('fields.temperature')} (C) <span className="text-red-500">*</span>
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
                          className={`w-full px-2 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-[var(--app-bg-tertiary)] dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] text-sm ${
                            !formData.temperature && !record?.isClosed ? 'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-300 dark:border-[var(--app-border-default)]'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-[var(--app-text-secondary)] mb-1">
                          ❤️ {t('fields.heartRate')} (bpm) <span className="text-red-500">*</span>
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
                          className={`w-full px-2 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-[var(--app-bg-tertiary)] dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] text-sm ${
                            !formData.heartRate && !record?.isClosed ? 'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-300 dark:border-[var(--app-border-default)]'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-[var(--app-text-secondary)] mb-1">🫁 {t('fields.respirationRate')} (/min)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.respirationRate || ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            handleFieldChange('respirationRate', e.target.value && val >= 0 ? val : undefined);
                          }}
                          disabled={isReadOnly || record?.isClosed}
                          className="w-full px-2 py-1.5 border border-gray-300 dark:border-[var(--app-border-default)] dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-[var(--app-bg-tertiary)] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-[var(--app-text-secondary)] mb-1">📊 {t('fields.bodyConditionScore')} (1-9)</label>
                        <input
                          type="number"
                          min="1"
                          max="9"
                          value={formData.bodyConditionScore || ''}
                          onChange={(e) => handleFieldChange('bodyConditionScore', e.target.value ? parseInt(e.target.value) : undefined)}
                          disabled={isReadOnly || record?.isClosed}
                          className="w-full px-2 py-1.5 border border-gray-300 dark:border-[var(--app-border-default)] dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-[var(--app-bg-tertiary)] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-[var(--app-text-secondary)] mb-1">😣 {t('fields.painScore')} (0-10)</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={formData.painScore !== undefined && formData.painScore !== null ? formData.painScore : ''}
                          onChange={(e) => handleFieldChange('painScore', e.target.value !== '' ? parseInt(e.target.value) : undefined)}
                          disabled={isReadOnly || record?.isClosed}
                          className="w-full px-2 py-1.5 border border-gray-300 dark:border-[var(--app-border-default)] dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-[var(--app-bg-tertiary)] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-[var(--app-text-secondary)] mb-1">💪 {t('fields.muscleCondition')}</label>
                        <select
                          value={formData.muscleCondition || ''}
                          onChange={(e) => handleFieldChange('muscleCondition', e.target.value)}
                          disabled={isReadOnly || record?.isClosed}
                          className="w-full px-2 py-1.5 border border-gray-300 dark:border-[var(--app-border-default)] dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-[var(--app-bg-tertiary)] text-sm"
                        >
                          <option value="">{t('select')}</option>
                          {MUSCLE_CONDITIONS.map((condition) => (
                            <option key={condition} value={condition}>{t(`muscleConditions.${condition}`) || condition}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-[var(--app-text-secondary)] mb-1">💧 {t('fields.hydration')}</label>
                        <select
                          value={formData.hydration || ''}
                          onChange={(e) => handleFieldChange('hydration', e.target.value)}
                          disabled={isReadOnly || record?.isClosed}
                          className="w-full px-2 py-1.5 border border-gray-300 dark:border-[var(--app-border-default)] dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-[var(--app-bg-tertiary)] text-sm"
                        >
                          <option value="">{t('select')}</option>
                          {HYDRATION_LEVELS.map((level) => (
                            <option key={level} value={level}>{t(`hydrationLevels.${level}`) || level}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-[var(--app-text-secondary)] mb-1">🧠 {t('fields.attitude')}</label>
                        <select
                          value={formData.attitude || ''}
                          onChange={(e) => handleFieldChange('attitude', e.target.value)}
                          disabled={isReadOnly || record?.isClosed}
                          className="w-full px-2 py-1.5 border border-gray-300 dark:border-[var(--app-border-default)] dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-[var(--app-bg-tertiary)] text-sm"
                        >
                          <option value="">{t('select')}</option>
                          {ATTITUDES.map((att) => (
                            <option key={att} value={att}>{t(`attitudes.${att}`) || att}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-[var(--app-text-secondary)] mb-1">👅 {t('fields.mucousMembranes')}</label>
                        <select
                          value={formData.mucousMembranes || ''}
                          onChange={(e) => handleFieldChange('mucousMembranes', e.target.value)}
                          disabled={isReadOnly || record?.isClosed}
                          className="w-full px-2 py-1.5 border border-gray-300 dark:border-[var(--app-border-default)] dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-[var(--app-bg-tertiary)] text-sm"
                        >
                          <option value="">{t('select')}</option>
                          {MUCOUS_MEMBRANES.map((mm) => (
                            <option key={mm} value={mm}>{t(`mucousMembranes.${mm}`) || mm}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-[var(--app-text-secondary)] mb-1">{t('fields.crt')} (sec)</label>
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
                          className="w-full px-2 py-1.5 border border-gray-300 dark:border-[var(--app-border-default)] dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-[var(--app-bg-tertiary)] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-[var(--app-text-secondary)] mb-1">{t('fields.behaviour')}</label>
                        <input
                          type="text"
                          value={formData.behaviour || ''}
                          onChange={(e) => handleFieldChange('behaviour', e.target.value)}
                          disabled={isReadOnly || record?.isClosed}
                          className="w-full px-2 py-1.5 border border-gray-300 dark:border-[var(--app-border-default)] dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-[var(--app-bg-tertiary)] text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Assessment */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-[var(--app-text-secondary)] mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-accent-200 dark:bg-accent-900/50 text-accent-700 dark:text-accent-400 rounded-full flex items-center justify-center text-xs font-bold">A</span>
                      {t('sections.assessment')}
                    </h4>
                    <textarea
                      value={formData.diagnosis || ''}
                      onChange={(e) => handleFieldChange('diagnosis', e.target.value)}
                      rows={2}
                      disabled={isReadOnly || record?.isClosed}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[var(--app-border-default)] dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-[var(--app-bg-tertiary)] disabled:cursor-not-allowed text-sm"
                      placeholder={t('placeholders.diagnosis')}
                    />
                  </div>

                  {/* Plan */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-[var(--app-text-secondary)] mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-primary-300 dark:bg-primary-900/50 text-primary-800 dark:text-primary-400 rounded-full flex items-center justify-center text-xs font-bold">P</span>
                      {t('sections.plan')}
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-[var(--app-text-secondary)] mb-1">💊 {t('fields.treatment')}</label>
                        <textarea
                          value={formData.treatment || ''}
                          onChange={(e) => handleFieldChange('treatment', e.target.value)}
                          rows={2}
                          disabled={isReadOnly || record?.isClosed}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-[var(--app-border-default)] dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-[var(--app-bg-tertiary)] disabled:cursor-not-allowed text-sm"
                          placeholder={t('placeholders.treatment')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-[var(--app-text-secondary)] mb-1">📝 {t('fields.notes')}</label>
                        <textarea
                          value={formData.notes || ''}
                          onChange={(e) => handleFieldChange('notes', e.target.value)}
                          rows={2}
                          disabled={isReadOnly || record?.isClosed}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-[var(--app-border-default)] dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-[var(--app-bg-tertiary)] disabled:cursor-not-allowed text-sm"
                          placeholder={t('placeholders.notes')}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Services & Products Section */}
              <div className="bg-white dark:bg-[var(--app-bg-card)] rounded-xl border border-secondary-200 dark:border-[var(--app-border-default)] overflow-hidden">
                <div className="bg-secondary-100 dark:bg-secondary-900/30 px-5 py-3 border-b border-secondary-200 dark:border-[var(--app-border-default)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🛒</span>
                    <h3 className="text-lg font-semibold text-brand-dark dark:text-[var(--app-text-primary)]">{tFlow('tabs.services')}</h3>
                    {selectedItems.length > 0 && (
                      <span className="bg-secondary-300 text-brand-dark px-2 py-0.5 rounded-full text-xs font-medium">
                        {selectedItems.length}
                      </span>
                    )}
                  </div>
                  {invoice?.isFinalized && (
                    <span className="text-sm text-primary-700 font-medium">
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
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
                      {invoiceError}
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Section */}
              <div className="bg-white dark:bg-[var(--app-bg-card)] rounded-xl border border-accent-200 dark:border-[var(--app-border-default)] overflow-hidden">
                <div className="bg-accent-100 dark:bg-accent-900/30 px-5 py-3 border-b border-accent-200 dark:border-[var(--app-border-default)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💳</span>
                    <h3 className="text-lg font-semibold text-brand-dark dark:text-[var(--app-text-primary)]">{tFlow('tabs.payment')}</h3>
                  </div>
                  {invoice && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      invoice.status === 'PAID'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : invoice.status === 'PARTIALLY_PAID'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}>
                      {tFlow(`invoiceStatus.${invoice.status}`)}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  {selectedItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <CreditCardIcon className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
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
                <div className="bg-white dark:bg-[var(--app-bg-card)] rounded-xl border border-primary-200 dark:border-[var(--app-border-default)] overflow-hidden">
                  <div className="bg-primary-50 dark:bg-primary-900/30 px-5 py-3 border-b border-primary-100 dark:border-[var(--app-border-default)] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📅</span>
                      <h3 className="text-lg font-semibold text-brand-dark dark:text-[var(--app-text-primary)]">{t('nextAppointment.title')}</h3>
                    </div>
                    {!showNextAppointment && (
                      <button
                        type="button"
                        onClick={() => setShowNextAppointment(true)}
                        className="flex items-center gap-1 px-4 py-2 text-sm bg-secondary-300 dark:bg-secondary-700 text-brand-dark dark:text-[var(--app-text-primary)] rounded-lg hover:bg-secondary-400 dark:hover:bg-secondary-600 font-medium transition-colors"
                      >
                        <PlusIcon className="w-4 h-4" />
                        {t('nextAppointment.schedule')}
                      </button>
                    )}
                  </div>

                  {showNextAppointment && (
                    <div className="p-5">
                      {bookingSuccess ? (
                        <div className="flex items-center justify-center gap-2 py-6 text-green-600 dark:text-green-400">
                          <CheckCircleIcon className="w-8 h-8" />
                          <span className="font-semibold text-lg">{t('nextAppointment.success')}</span>
                        </div>
                      ) : bookingWarning ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-6 text-amber-600 dark:text-amber-400">
                          <ExclamationTriangleIcon className="w-8 h-8" />
                          <span className="font-semibold text-lg text-center">{bookingWarning}</span>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* 3 Independent Appointment Date + Time Rows */}
                          <div className="space-y-3">
                            {/* Routine Check-up */}
                            <div className="p-3 rounded-lg border bg-sky-50 dark:bg-sky-900/20 border-sky-100 dark:border-sky-800/50">
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-sky-700 dark:text-sky-400">
                                  {tFlow('nextAppointment.routineCheckup')}
                                </label>
                              </div>
                              {/* Show existing booked appointments */}
                              {bookedAppointmentsByType.checkup.length > 0 && (
                                <div className="mb-3 space-y-2">
                                  {bookedAppointmentsByType.checkup.map((appt) => (
                                    <div key={appt.id} className="flex items-center justify-between p-2 bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded-lg">
                                      <div className="flex items-center gap-2">
                                        <span className="text-orange-500">🟠</span>
                                        <span className="text-sm font-medium text-orange-800 dark:text-orange-300">
                                          {tFlow('nextAppointment.booked')}: {new Date(appt.appointmentDate).toLocaleDateString()} - {appt.appointmentTime}
                                        </span>
                                        {appt.vet && (
                                          <span className="text-xs text-orange-600 dark:text-orange-400">
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
                                    onChange={(e) => { setCheckupDate(e.target.value); setCheckupTime(''); }}
                                    className="w-full px-3 py-2 border border-sky-200 dark:border-sky-700 bg-white dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                  />
                                </div>
                                <div className="flex-1">
                                  <select
                                    value={checkupVisitType}
                                    onChange={(e) => { setCheckupVisitType(e.target.value); setCheckupTime(''); }}
                                    disabled={!checkupDate || !appointmentVetId}
                                    className="w-full px-3 py-2 border border-sky-200 dark:border-sky-700 bg-white dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 disabled:bg-gray-100 dark:disabled:bg-[var(--app-bg-tertiary)] disabled:cursor-not-allowed"
                                  >
                                    <option value="">{tFlow('nextAppointment.visitType')}</option>
                                    {visitTypes.filter(vt => vt.isActive).map(vt => (
                                      <option key={vt.code} value={vt.code}>{isRTL ? vt.nameAr : vt.nameEn}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex-1">
                                  <select
                                    value={checkupTime}
                                    onChange={(e) => setCheckupTime(e.target.value)}
                                    disabled={!checkupDate || !appointmentVetId || !checkupVisitType}
                                    className="w-full px-3 py-2 border border-sky-200 dark:border-sky-700 bg-white dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 disabled:bg-gray-100 dark:disabled:bg-[var(--app-bg-tertiary)] disabled:cursor-not-allowed"
                                  >
                                    <option value="">{t('nextAppointment.time')}</option>
                                    {checkupAvailability?.slots
                                      ?.filter(slot => slot === checkupTime || !isSlotBooked(slot, checkupDuration, getLocallySelectedSlots('checkup', checkupDate)))
                                      .map(slot => (
                                        <option key={slot} value={slot}>{slot}</option>
                                      ))}
                                  </select>
                                </div>
                                {(checkupDate || checkupTime || checkupVisitType) && (
                                  <button
                                    type="button"
                                    onClick={() => { setCheckupDate(''); setCheckupTime(''); setCheckupVisitType(''); }}
                                    className="p-1 text-sky-400 hover:text-sky-600"
                                  >
                                    <XMarkIcon className="w-5 h-5" />
                                  </button>
                                )}
                              </div>
                              {checkupAvailability?.unavailableReason && !checkupAvailability.slots?.length && checkupDate && checkupVisitType && (
                                <p className="mt-2 text-xs text-orange-600 dark:text-orange-400">
                                  {tFlow(`nextAppointment.unavailable.${checkupAvailability.unavailableReason}`)}
                                </p>
                              )}
                              {bookedAppointmentsByType.checkup.length > 0 && (
                                <p className="mt-2 text-xs text-sky-600 dark:text-sky-400">
                                  {tFlow('nextAppointment.addAnother')} {tFlow('nextAppointment.routineCheckup')}
                                </p>
                              )}
                            </div>

                            {/* Vaccination */}
                            <div className="p-3 rounded-lg border bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800/50">
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-green-700 dark:text-green-400">
                                  {tFlow('nextAppointment.nextVaccination')}
                                </label>
                              </div>
                              {/* Show existing booked appointments */}
                              {bookedAppointmentsByType.vaccination.length > 0 && (
                                <div className="mb-3 space-y-2">
                                  {bookedAppointmentsByType.vaccination.map((appt) => (
                                    <div key={appt.id} className="flex items-center justify-between p-2 bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded-lg">
                                      <div className="flex items-center gap-2">
                                        <span className="text-orange-500">🟠</span>
                                        <span className="text-sm font-medium text-orange-800 dark:text-orange-300">
                                          {tFlow('nextAppointment.booked')}: {new Date(appt.appointmentDate).toLocaleDateString()} - {appt.appointmentTime}
                                        </span>
                                        {appt.vet && (
                                          <span className="text-xs text-orange-600 dark:text-orange-400">
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
                                    onChange={(e) => { setVaccinationDate(e.target.value); setVaccinationTime(''); }}
                                    className="w-full px-3 py-2 border border-green-200 dark:border-green-700 bg-white dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                  />
                                </div>
                                <div className="flex-1">
                                  <select
                                    value={vaccinationVisitType}
                                    onChange={(e) => { setVaccinationVisitType(e.target.value); setVaccinationTime(''); }}
                                    disabled={!vaccinationDate || !appointmentVetId}
                                    className="w-full px-3 py-2 border border-green-200 dark:border-green-700 bg-white dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 dark:disabled:bg-[var(--app-bg-tertiary)] disabled:cursor-not-allowed"
                                  >
                                    <option value="">{tFlow('nextAppointment.visitType')}</option>
                                    {visitTypes.filter(vt => vt.isActive).map(vt => (
                                      <option key={vt.code} value={vt.code}>{isRTL ? vt.nameAr : vt.nameEn}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex-1">
                                  <select
                                    value={vaccinationTime}
                                    onChange={(e) => setVaccinationTime(e.target.value)}
                                    disabled={!vaccinationDate || !appointmentVetId || !vaccinationVisitType}
                                    className="w-full px-3 py-2 border border-green-200 dark:border-green-700 bg-white dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 dark:disabled:bg-[var(--app-bg-tertiary)] disabled:cursor-not-allowed"
                                  >
                                    <option value="">{t('nextAppointment.time')}</option>
                                    {vaccinationAvailability?.slots
                                      ?.filter(slot => slot === vaccinationTime || !isSlotBooked(slot, vaccinationDuration, getLocallySelectedSlots('vaccination', vaccinationDate)))
                                      .map(slot => (
                                        <option key={slot} value={slot}>{slot}</option>
                                      ))}
                                  </select>
                                </div>
                                {(vaccinationDate || vaccinationTime || vaccinationVisitType) && (
                                  <button
                                    type="button"
                                    onClick={() => { setVaccinationDate(''); setVaccinationTime(''); setVaccinationVisitType(''); }}
                                    className="p-1 text-green-400 hover:text-green-600"
                                  >
                                    <XMarkIcon className="w-5 h-5" />
                                  </button>
                                )}
                              </div>
                              {vaccinationAvailability?.unavailableReason && !vaccinationAvailability.slots?.length && vaccinationDate && vaccinationVisitType && (
                                <p className="mt-2 text-xs text-orange-600 dark:text-orange-400">
                                  {tFlow(`nextAppointment.unavailable.${vaccinationAvailability.unavailableReason}`)}
                                </p>
                              )}
                              {bookedAppointmentsByType.vaccination.length > 0 && (
                                <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                                  {tFlow('nextAppointment.addAnother')} {tFlow('nextAppointment.nextVaccination')}
                                </p>
                              )}
                            </div>

                            {/* Deworming - Flea */}
                            <div className="p-3 rounded-lg border bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800/50">
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-purple-700 dark:text-purple-400">
                                  {tFlow('nextAppointment.dewormingFlea')}
                                </label>
                              </div>
                              {/* Show existing booked appointments */}
                              {bookedAppointmentsByType.deworming.length > 0 && (
                                <div className="mb-3 space-y-2">
                                  {bookedAppointmentsByType.deworming.map((appt) => (
                                    <div key={appt.id} className="flex items-center justify-between p-2 bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded-lg">
                                      <div className="flex items-center gap-2">
                                        <span className="text-orange-500">🟠</span>
                                        <span className="text-sm font-medium text-orange-800 dark:text-orange-300">
                                          {tFlow('nextAppointment.booked')}: {new Date(appt.appointmentDate).toLocaleDateString()} - {appt.appointmentTime}
                                        </span>
                                        {appt.vet && (
                                          <span className="text-xs text-orange-600 dark:text-orange-400">
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
                                    onChange={(e) => { setDewormingDate(e.target.value); setDewormingTime(''); }}
                                    className="w-full px-3 py-2 border border-purple-200 dark:border-purple-700 bg-white dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                  />
                                </div>
                                <div className="flex-1">
                                  <select
                                    value={dewormingVisitType}
                                    onChange={(e) => { setDewormingVisitType(e.target.value); setDewormingTime(''); }}
                                    disabled={!dewormingDate || !appointmentVetId}
                                    className="w-full px-3 py-2 border border-purple-200 dark:border-purple-700 bg-white dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 dark:disabled:bg-[var(--app-bg-tertiary)] disabled:cursor-not-allowed"
                                  >
                                    <option value="">{tFlow('nextAppointment.visitType')}</option>
                                    {visitTypes.filter(vt => vt.isActive).map(vt => (
                                      <option key={vt.code} value={vt.code}>{isRTL ? vt.nameAr : vt.nameEn}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex-1">
                                  <select
                                    value={dewormingTime}
                                    onChange={(e) => setDewormingTime(e.target.value)}
                                    disabled={!dewormingDate || !appointmentVetId || !dewormingVisitType}
                                    className="w-full px-3 py-2 border border-purple-200 dark:border-purple-700 bg-white dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 dark:disabled:bg-[var(--app-bg-tertiary)] disabled:cursor-not-allowed"
                                  >
                                    <option value="">{t('nextAppointment.time')}</option>
                                    {dewormingAvailability?.slots
                                      ?.filter(slot => slot === dewormingTime || !isSlotBooked(slot, dewormingDuration, getLocallySelectedSlots('deworming', dewormingDate)))
                                      .map(slot => (
                                        <option key={slot} value={slot}>{slot}</option>
                                      ))}
                                  </select>
                                </div>
                                {(dewormingDate || dewormingTime || dewormingVisitType) && (
                                  <button
                                    type="button"
                                    onClick={() => { setDewormingDate(''); setDewormingTime(''); setDewormingVisitType(''); }}
                                    className="p-1 text-purple-400 hover:text-purple-600"
                                  >
                                    <XMarkIcon className="w-5 h-5" />
                                  </button>
                                )}
                              </div>
                              {dewormingAvailability?.unavailableReason && !dewormingAvailability.slots?.length && dewormingDate && dewormingVisitType && (
                                <p className="mt-2 text-xs text-orange-600 dark:text-orange-400">
                                  {tFlow(`nextAppointment.unavailable.${dewormingAvailability.unavailableReason}`)}
                                </p>
                              )}
                              {bookedAppointmentsByType.deworming.length > 0 && (
                                <p className="mt-2 text-xs text-purple-600 dark:text-purple-400">
                                  {tFlow('nextAppointment.addAnother')} {tFlow('nextAppointment.dewormingFlea')}
                                </p>
                              )}
                            </div>

                            {/* Surgery - Dental Scaling */}
                            <div className="p-3 rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/50">
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-red-700 dark:text-red-400">
                                  {tFlow('nextAppointment.surgeryDentalScaling')}
                                </label>
                              </div>
                              {/* Show existing booked appointments */}
                              {bookedAppointmentsByType.surgery.length > 0 && (
                                <div className="mb-3 space-y-2">
                                  {bookedAppointmentsByType.surgery.map((appt) => (
                                    <div key={appt.id} className="flex items-center justify-between p-2 bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded-lg">
                                      <div className="flex items-center gap-2">
                                        <span className="text-orange-500">🟠</span>
                                        <span className="text-sm font-medium text-orange-800 dark:text-orange-300">
                                          {tFlow('nextAppointment.booked')}: {new Date(appt.appointmentDate).toLocaleDateString()} - {appt.appointmentTime}
                                        </span>
                                        {appt.vet && (
                                          <span className="text-xs text-orange-600 dark:text-orange-400">
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
                                    value={surgeryDate}
                                    min={getTomorrowDate()}
                                    onChange={(e) => { setSurgeryDate(e.target.value); setSurgeryTime(''); }}
                                    className="w-full px-3 py-2 border border-red-200 dark:border-red-700 bg-white dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                  />
                                </div>
                                <div className="flex-1">
                                  <select
                                    value={surgeryVisitType}
                                    onChange={(e) => { setSurgeryVisitType(e.target.value); setSurgeryTime(''); }}
                                    disabled={!surgeryDate || !appointmentVetId}
                                    className="w-full px-3 py-2 border border-red-200 dark:border-red-700 bg-white dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 dark:disabled:bg-[var(--app-bg-tertiary)] disabled:cursor-not-allowed"
                                  >
                                    <option value="">{tFlow('nextAppointment.visitType')}</option>
                                    {visitTypes.filter(vt => vt.isActive).map(vt => (
                                      <option key={vt.code} value={vt.code}>{isRTL ? vt.nameAr : vt.nameEn}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex-1">
                                  <select
                                    value={surgeryTime}
                                    onChange={(e) => setSurgeryTime(e.target.value)}
                                    disabled={!surgeryDate || !appointmentVetId || !surgeryVisitType}
                                    className="w-full px-3 py-2 border border-red-200 dark:border-red-700 bg-white dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 dark:disabled:bg-[var(--app-bg-tertiary)] disabled:cursor-not-allowed"
                                  >
                                    <option value="">{t('nextAppointment.time')}</option>
                                    {surgeryAvailability?.slots
                                      ?.filter(slot => slot === surgeryTime || !isSlotBooked(slot, surgeryDuration, getLocallySelectedSlots('surgery', surgeryDate)))
                                      .map(slot => (
                                        <option key={slot} value={slot}>{slot}</option>
                                      ))}
                                  </select>
                                </div>
                                {(surgeryDate || surgeryTime || surgeryVisitType) && (
                                  <button
                                    type="button"
                                    onClick={() => { setSurgeryDate(''); setSurgeryTime(''); setSurgeryVisitType(''); }}
                                    className="p-1 text-red-400 hover:text-red-600"
                                  >
                                    <XMarkIcon className="w-5 h-5" />
                                  </button>
                                )}
                              </div>
                              {surgeryAvailability?.unavailableReason && !surgeryAvailability.slots?.length && surgeryDate && surgeryVisitType && (
                                <p className="mt-2 text-xs text-orange-600 dark:text-orange-400">
                                  {tFlow(`nextAppointment.unavailable.${surgeryAvailability.unavailableReason}`)}
                                </p>
                              )}
                              {bookedAppointmentsByType.surgery.length > 0 && (
                                <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                                  {tFlow('nextAppointment.addAnother')} {tFlow('nextAppointment.surgeryDentalScaling')}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Vet Selection */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-[var(--app-text-secondary)] mb-1">{t('nextAppointment.vet')}</label>
                              <select
                                value={appointmentVetId}
                                onChange={(e) => setAppointmentVetId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-[var(--app-border-default)] bg-white dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
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
                              <label className="block text-sm font-medium text-gray-700 dark:text-[var(--app-text-secondary)] mb-1">{t('nextAppointment.notes')}</label>
                              <input
                                type="text"
                                value={appointmentNotes}
                                onChange={(e) => setAppointmentNotes(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-[var(--app-border-default)] bg-white dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                placeholder={t('nextAppointment.notesPlaceholder')}
                              />
                            </div>
                          </div>

                          {/* Summary */}
                          {appointmentsToBookCount > 0 && (
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-sm">
                              {t('nextAppointment.willBook', { count: appointmentsToBookCount })}
                            </div>
                          )}

                          {bookingError && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
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
                              className="px-4 py-2 border border-gray-300 dark:border-[var(--app-border-default)] rounded-lg text-gray-700 dark:text-[var(--app-text-secondary)] hover:bg-gray-100 dark:hover:bg-[var(--app-bg-elevated)] font-medium transition-colors"
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
                <div className="bg-white rounded-xl border border-primary-200 overflow-hidden">
                  <div className="bg-primary-100 px-5 py-3 border-b border-primary-200 flex items-center gap-2">
                    <span className="text-xl">📆</span>
                    <h3 className="text-lg font-semibold text-brand-dark">{t('upcomingAppointments.title')}</h3>
                    <span className="bg-primary-200 text-primary-700 px-2 py-0.5 rounded-full text-xs font-medium">
                      {upcomingAppointments.length}
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="space-y-2">
                      {upcomingAppointments.map((appt) => (
                        <div
                          key={appt.id}
                          className="flex items-center justify-between p-3 bg-primary-50 rounded-lg border border-primary-100"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-sm font-medium text-primary-700">
                              {new Date(appt.appointmentDate).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-primary-600" dir="ltr">
                              {appt.appointmentTime}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-1 bg-secondary-200 text-brand-dark rounded text-xs font-medium">
                              {appt.notes || getVisitTypeName(appt.visitType)}
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

              {/* Medical Attachments Section */}
              {record && (
                <div className="bg-white rounded-xl border border-secondary-200 overflow-hidden">
                  <div className="bg-secondary-100 px-5 py-3 border-b border-secondary-200 flex items-center gap-2">
                    <span className="text-xl">📎</span>
                    <h3 className="text-lg font-semibold text-brand-dark">{tFlow('tabs.attachments')}</h3>
                    {attachments.length > 0 && (
                      <span className="bg-secondary-300 text-brand-dark px-2 py-0.5 rounded-full text-xs font-medium">
                        {attachments.length}
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <FileAttachment
                      attachments={attachments}
                      onUpload={handleAttachmentUpload}
                      onDelete={handleAttachmentDelete}
                      readonly={isReadOnly || record?.isClosed}
                      loading={attachmentsLoading}
                    />
                  </div>
                </div>
              )}

              {/* Forms & Certificates Section */}
              {effectiveAppointment?.pet?.id && (
                <PetFormsSection
                  petId={effectiveAppointment.pet.id}
                  appointmentId={effectiveAppointment?.id}
                  vetId={effectiveAppointment?.vet?.id}
                  isReadOnly={isReadOnly || record?.isClosed}
                />
              )}

              {/* Audit Log Section */}
              {record && (
                <AuditLogSection recordId={record.id} />
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-primary-50">
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 border border-primary-300 rounded-lg text-brand-dark hover:bg-primary-100 font-medium transition-colors"
          >
            {t('close')}
          </button>
          {!isReadOnly && (
            <button
              type="button"
              onClick={handleManualSave}
              disabled={saving || loading}
              className="px-5 py-2.5 bg-secondary-300 text-brand-dark rounded-lg hover:bg-secondary-400 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
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

      {/* Empty Record Warning Modal (for standalone records from Medical Records) */}
      <ConfirmationModal
        isOpen={showEmptyRecordWarning}
        onClose={() => setShowEmptyRecordWarning(false)}
        onConfirm={handleDeleteEmptyRecord}
        title={tFlow('record.emptyRecordTitle')}
        message={tFlow('record.emptyRecordWarning')}
        confirmText={tFlow('record.emptyRecordConfirm')}
        cancelText={tFlow('record.emptyRecordCancel')}
        variant="danger"
        loading={deletingEmptyRecord}
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
