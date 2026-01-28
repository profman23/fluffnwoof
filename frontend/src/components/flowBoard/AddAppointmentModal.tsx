import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, MagnifyingGlassIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { Owner, User, VisitType, Species } from '../../types';
import { ownersApi } from '../../api/owners';
import { petsApi } from '../../api/pets';
import { flowBoardApi } from '../../api/flowBoard';
import { shiftsApi, UnavailableReason } from '../../api/shifts';
import { visitTypesApi, VisitType as VisitTypeConfig } from '../../api/visitTypes';
import { VISIT_TYPE_DURATION, generateTimeSlots, isSlotBooked } from '../../utils/appointmentUtils';
import { usePhonePermission, maskPhoneNumber } from '../../hooks/useScreenPermission';

interface SimplePet {
  id: string;
  name: string;
  species: Species;
}

interface AddAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedDate: string;
}

export const AddAppointmentModal = ({
  isOpen,
  onClose,
  onSuccess,
  selectedDate,
}: AddAppointmentModalProps) => {
  const { t, i18n } = useTranslation('flowBoard');
  const { canViewPhone } = usePhonePermission();
  const isRTL = i18n.language === 'ar';
  const isMountedRef = useRef(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch visit types from the database
  const { data: visitTypesConfig = [] } = useQuery({
    queryKey: ['visit-types-active'],
    queryFn: () => visitTypesApi.getAll(false),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Owner search
  const [ownerSearch, setOwnerSearch] = useState('');
  const [owners, setOwners] = useState<Owner[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);
  const [searchingOwners, setSearchingOwners] = useState(false);

  // Pet selection
  const [pets, setPets] = useState<SimplePet[]>([]);
  const [selectedPet, setSelectedPet] = useState<SimplePet | null>(null);

  // Staff
  const [staff, setStaff] = useState<User[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string>('');

  // Form fields
  const [visitType, setVisitType] = useState<VisitType>(VisitType.GENERAL_CHECKUP);
  const [selectedVisitTypeConfig, setSelectedVisitTypeConfig] = useState<VisitTypeConfig | null>(null);
  const [appointmentDate, setAppointmentDate] = useState(selectedDate);
  const [appointmentTime, setAppointmentTime] = useState('09:00');

  // Booked appointments for selected staff on selected date
  const [bookedAppointments, setBookedAppointments] = useState<{ appointmentTime: string; duration: number }[]>([]);

  // Get the duration from the selected visit type config or fallback to hardcoded values
  const visitTypeDuration = useMemo(() => {
    if (selectedVisitTypeConfig) {
      return selectedVisitTypeConfig.duration;
    }
    return VISIT_TYPE_DURATION[visitType] || 30;
  }, [selectedVisitTypeConfig, visitType]);

  // Fetch availability from shifts API when vet and date are selected
  // Using V2 endpoint which uses the new schedule period system
  const { data: availabilityData, isLoading: loadingAvailability } = useQuery({
    queryKey: ['vet-availability-v2', selectedStaff, appointmentDate, visitTypeDuration],
    queryFn: () => shiftsApi.getAvailabilityV2(selectedStaff, appointmentDate, visitTypeDuration),
    enabled: !!selectedStaff && !!appointmentDate && isOpen,
    staleTime: 1000 * 30, // Cache for 30 seconds
  });

  // Derive unavailableReason from availabilityData directly
  const unavailableReason: UnavailableReason = availabilityData?.unavailableReason ?? null;

  // Calculate time slots - prefer availability API, fallback to local calculation
  const timeSlots = useMemo(() => {
    // If we have availability data from the shifts API, use it
    if (availabilityData && availabilityData.slots) {
      return availabilityData.slots;
    }
    // Fallback to the original local calculation
    const duration = visitTypeDuration;
    const allSlots = generateTimeSlots(duration, appointmentDate);
    // Filter out booked slots
    return allSlots.filter(slot => !isSlotBooked(slot, duration, bookedAppointments));
  }, [availabilityData, visitTypeDuration, appointmentDate, bookedAppointments]);

  // Reset time when visit type changes (to ensure valid slot)
  useEffect(() => {
    if (timeSlots.length > 0 && !timeSlots.includes(appointmentTime)) {
      setAppointmentTime(timeSlots[0]);
    }
  }, [timeSlots, appointmentTime]);

  // Update date when selectedDate prop changes
  useEffect(() => {
    setAppointmentDate(selectedDate);
  }, [selectedDate]);

  // Sync visit type config when visit types are loaded or visit type changes
  useEffect(() => {
    if (visitTypesConfig.length > 0) {
      // Find the matching config by code
      const config = visitTypesConfig.find(c => c.code === visitType);
      if (config) {
        setSelectedVisitTypeConfig(config);
      } else {
        // If no match, use the first active type
        setSelectedVisitTypeConfig(visitTypesConfig[0]);
        setVisitType(visitTypesConfig[0].code as VisitType);
      }
    }
  }, [visitTypesConfig, visitType]);

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load staff when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const loadStaff = async () => {
      try {
        const data = await flowBoardApi.getStaff();
        console.log('Staff loaded:', data);
        if (!isMountedRef.current) return;
        setStaff(data || []);
        if (data && data.length > 0) {
          setSelectedStaff(data[0].id);
          console.log('Selected staff set to:', data[0].id);
        } else {
          console.warn('No staff available');
        }
      } catch (err) {
        console.error('Failed to load staff:', err);
        if (!isMountedRef.current) return;
        setStaff([]);
      }
    };
    loadStaff();
  }, [isOpen]);

  // Load booked appointments when staff or date changes
  useEffect(() => {
    if (!isOpen || !selectedStaff || !appointmentDate) {
      setBookedAppointments([]);
      return;
    }

    const loadBookedAppointments = async () => {
      try {
        const data = await flowBoardApi.getVetAppointments(selectedStaff, appointmentDate);
        if (!isMountedRef.current) return;
        setBookedAppointments(data);
        console.log('Booked appointments loaded:', data);
      } catch (err) {
        console.error('Failed to load booked appointments:', err);
        if (!isMountedRef.current) return;
        setBookedAppointments([]);
      }
    };
    loadBookedAppointments();
  }, [isOpen, selectedStaff, appointmentDate]);

  // Search owners with debounce
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (ownerSearch.length < 2) {
      setOwners([]);
      setSearchingOwners(false);
      return;
    }

    setSearchingOwners(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await ownersApi.search(ownerSearch);
        if (!isMountedRef.current) return;
        setOwners(data || []);
      } catch (err) {
        console.error('Failed to search owners:', err);
        if (!isMountedRef.current) return;
        setOwners([]);
      } finally {
        if (isMountedRef.current) {
          setSearchingOwners(false);
        }
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [ownerSearch]);

  // Load pets when owner is selected
  useEffect(() => {
    if (!selectedOwner) {
      setPets([]);
      setSelectedPet(null);
      return;
    }

    const loadPets = async () => {
      try {
        console.log('Loading pets for owner:', selectedOwner.id);
        const response = await petsApi.getAll(1, 100, undefined, selectedOwner.id);
        console.log('Pets response:', response);
        if (!isMountedRef.current) return;
        const simplePets: SimplePet[] = (response.data || []).map((p) => ({
          id: p.id,
          name: p.name,
          species: p.species,
        }));
        console.log('Simple pets:', simplePets);
        setPets(simplePets);
        if (simplePets.length > 0) {
          setSelectedPet(simplePets[0]);
          console.log('Selected pet set to:', simplePets[0]);
        } else {
          console.warn('No pets found for owner');
        }
      } catch (err) {
        console.error('Failed to load pets:', err);
        if (!isMountedRef.current) return;
        setPets([]);
      }
    };
    loadPets();
  }, [selectedOwner]);

  const handleOwnerSelect = useCallback((owner: Owner) => {
    setSelectedOwner(owner);
    setOwnerSearch(`${owner.firstName} ${owner.lastName}`);
    setShowOwnerDropdown(false);
  }, []);

  const resetForm = useCallback(() => {
    setOwnerSearch('');
    setSelectedOwner(null);
    setSelectedPet(null);
    setPets([]);
    setOwners([]);
    setVisitType(VisitType.GENERAL_CHECKUP);
    setSelectedVisitTypeConfig(null);
    setAppointmentDate(selectedDate);
    setAppointmentTime('09:00');
    setError(null);
    setLoading(false);
    // Don't reset selectedStaff here - it will be set when modal opens
  }, [selectedDate]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOwner || !selectedPet || !selectedStaff) {
      setError(t('form.requiredFields') || 'Please fill all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await flowBoardApi.createAppointment({
        petId: selectedPet.id,
        vetId: selectedStaff,
        appointmentDate,
        appointmentTime,
        visitType,
        duration: visitTypeDuration, // Use configurable duration
      });
      if (!isMountedRef.current) return;
      onSuccess();
      handleClose();
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || t('form.error') || 'Error saving');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  // Debug: Log current form state
  console.log('Form state:', {
    loading,
    selectedOwner: selectedOwner?.id,
    selectedPet: selectedPet?.id,
    selectedStaff,
    canSave: !loading && selectedOwner && selectedPet && selectedStaff,
  });

  if (!isOpen) return null;

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  const modalContent = (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      style={{ zIndex: 9999 }}
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-semibold">{t('addAppointment')}</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            type="button"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Owner Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('form.owner')}
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={ownerSearch}
                onChange={(e) => {
                  setOwnerSearch(e.target.value);
                  setShowOwnerDropdown(true);
                  if (!e.target.value) {
                    setSelectedOwner(null);
                  }
                }}
                onFocus={() => setShowOwnerDropdown(true)}
                onBlur={() => {
                  setTimeout(() => setShowOwnerDropdown(false), 200);
                }}
                placeholder={t('form.searchOwner') || 'Search owner...'}
                className="w-full ps-10 pe-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Owner Dropdown */}
            {showOwnerDropdown && owners.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {owners.map((owner) => (
                  <button
                    key={owner.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleOwnerSelect(owner)}
                    className="w-full px-4 py-2 text-start hover:bg-gray-50 flex flex-col"
                  >
                    <span className="font-medium">
                      {owner.firstName} {owner.lastName}
                    </span>
                    <span className="text-sm text-gray-500" dir="ltr">
                      {canViewPhone ? owner.phone : maskPhoneNumber(owner.phone)}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {searchingOwners && (
              <div className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-lg p-4 text-center text-gray-500">
                {t('form.searching') || 'Searching'}...
              </div>
            )}
          </div>

          {/* Pet Selection */}
          {selectedOwner && pets.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('form.pet')}
              </label>
              <select
                value={selectedPet?.id || ''}
                onChange={(e) => {
                  const pet = pets.find((p) => p.id === e.target.value);
                  setSelectedPet(pet || null);
                }}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {pets.map((pet) => (
                  <option key={pet.id} value={pet.id}>
                    {pet.name} ({pet.species})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Visit Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('form.visitType')}
            </label>
            <select
              value={visitType}
              onChange={(e) => {
                const newType = e.target.value as VisitType;
                setVisitType(newType);
                const config = visitTypesConfig.find(c => c.code === newType);
                if (config) {
                  setSelectedVisitTypeConfig(config);
                }
              }}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {/* Use configurable visit types if available, fallback to enum */}
              {visitTypesConfig.length > 0 ? (
                visitTypesConfig.map((type) => (
                  <option key={type.code} value={type.code}>
                    {isRTL ? type.nameAr : type.nameEn}
                  </option>
                ))
              ) : (
                Object.values(VisitType).map((type) => (
                  <option key={type} value={type}>
                    {t(`visitTypes.${type}`) || type}
                  </option>
                ))
              )}
            </select>
            {/* Duration indicator */}
            <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
              <ClockIcon className="w-4 h-4" />
              <span>
                {t('form.duration')}: {visitTypeDuration} {t('form.minutes')}
              </span>
            </div>
          </div>

          {/* Staff */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('form.staff')}
            </label>
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {staff.length === 0 && (
                <option value="">{t('form.loading') || 'Loading...'}</option>
              )}
              {staff.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('form.date')}
            </label>
            <input
              type="date"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('form.time')} {timeSlots.length > 0 && <span className="text-gray-400">({timeSlots.length})</span>}
            </label>
            {loadingAvailability ? (
              <div className="px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 text-sm flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{isRTL ? 'جاري تحميل المواعيد المتاحة...' : 'Loading available slots...'}</span>
              </div>
            ) : timeSlots.length === 0 ? (
              <div className="px-4 py-3 border border-orange-200 rounded-lg bg-orange-50 text-orange-700 text-sm">
                <p className="font-medium">{t('form.noSlotsAvailable') || 'No available time slots'}</p>
                <p className="mt-1 text-orange-600">
                  {(() => {
                    const doctorName = selectedStaff && staff.find(s => s.id === selectedStaff)
                      ? `${staff.find(s => s.id === selectedStaff)?.firstName} ${staff.find(s => s.id === selectedStaff)?.lastName}`
                      : '';

                    switch (unavailableReason) {
                      case 'dayOff':
                        return isRTL
                          ? `الدكتور ${doctorName} في إجازة في هذا اليوم`
                          : `Dr. ${doctorName} is on day off`;
                      case 'weekendOff':
                        return isRTL
                          ? `الدكتور ${doctorName} لا يعمل في هذا اليوم (عطلة أسبوعية)`
                          : `Dr. ${doctorName} doesn't work on this day (weekly off)`;
                      case 'noSchedule':
                        return isRTL
                          ? `لا يوجد جدول عمل محدد للدكتور ${doctorName}`
                          : `No work schedule set for Dr. ${doctorName}`;
                      case 'fullyBooked':
                        return isRTL
                          ? `الدكتور ${doctorName} محجوز بالكامل في هذا اليوم`
                          : `Dr. ${doctorName} is fully booked on this date`;
                      default:
                        return isRTL
                          ? 'يرجى اختيار تاريخ آخر أو طبيب آخر'
                          : 'Please select another date or doctor';
                    }
                  })()}
                </p>
              </div>
            ) : (
              <select
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
            >
              {t('form.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || !selectedOwner || !selectedPet || !selectedStaff || timeSlots.length === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (t('form.saving') || 'Saving...') : (t('form.save') || 'Save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, modalRoot);
};
