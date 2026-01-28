import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { ownersApi, CreateOwnerInput } from '../../api/owners';
import { petsApi, CreatePetInput } from '../../api/pets';
import { Owner, Species, Gender } from '../../types';
import { breedsBySpecies, getBreedLabel, Breed } from '../../data/breeds';
import { usePhonePermission, maskPhoneNumber } from '../../hooks/useScreenPermission';

interface AddPetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preSelectedOwnerId?: string;
}

type OwnerMode = 'existing' | 'new';

interface FormData {
  ownerMode: OwnerMode;
  existingOwnerId: string;
  newOwner: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  pet: {
    name: string;
    species: Species | '';
    breed: string;
    gender: Gender | '';
    birthDate: string;
    color: string;
    weight: string;
    notes: string;
  };
}

interface FormErrors {
  owner?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  petName?: string;
  species?: string;
  gender?: string;
}

const initialFormData: FormData = {
  ownerMode: 'existing',
  existingOwnerId: '',
  newOwner: {
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
  },
  pet: {
    name: '',
    species: '',
    breed: '',
    gender: '',
    birthDate: '',
    color: '',
    weight: '',
    notes: '',
  },
};

export const AddPetModal: React.FC<AddPetModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preSelectedOwnerId,
}) => {
  const { t, i18n } = useTranslation('patients');
  const { canViewPhone } = usePhonePermission();
  const isRtl = i18n.language === 'ar';

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Owner search
  const [ownerSearch, setOwnerSearch] = useState('');
  const [ownerResults, setOwnerResults] = useState<Owner[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);

  // Available breeds based on species
  const [availableBreeds, setAvailableBreeds] = useState<Breed[]>([]);

  // Load pre-selected owner
  useEffect(() => {
    if (isOpen && preSelectedOwnerId) {
      loadPreSelectedOwner(preSelectedOwnerId);
    }
  }, [isOpen, preSelectedOwnerId]);

  const loadPreSelectedOwner = async (ownerId: string) => {
    try {
      const owner = await ownersApi.getById(ownerId);
      setSelectedOwner(owner);
      setFormData((prev) => ({
        ...prev,
        ownerMode: 'existing',
        existingOwnerId: ownerId,
      }));
    } catch (error) {
      console.error('Error loading owner:', error);
    }
  };

  // Search owners with debounce
  const searchOwners = useCallback(async (query: string) => {
    if (query.length < 2) {
      setOwnerResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const results = await ownersApi.search(query, 10);
      setOwnerResults(results);
    } catch (error) {
      console.error('Error searching owners:', error);
      setOwnerResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (ownerSearch) {
        searchOwners(ownerSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [ownerSearch, searchOwners]);

  // Update breeds when species changes
  useEffect(() => {
    if (formData.pet.species) {
      setAvailableBreeds(breedsBySpecies[formData.pet.species] || []);
      // Reset breed when species changes
      setFormData((prev) => ({ ...prev, pet: { ...prev.pet, breed: '' } }));
    } else {
      setAvailableBreeds([]);
    }
  }, [formData.pet.species]);

  const resetForm = () => {
    setFormData(initialFormData);
    setErrors({});
    setSuccessMessage('');
    setApiError('');
    setOwnerSearch('');
    setOwnerResults([]);
    setSelectedOwner(null);
    setAvailableBreeds([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate owner
    if (formData.ownerMode === 'existing') {
      if (!formData.existingOwnerId && !selectedOwner) {
        newErrors.owner = t('errors.ownerRequired');
      }
    } else {
      if (!formData.newOwner.firstName.trim()) {
        newErrors.firstName = t('errors.firstNameRequired');
      }
      if (!formData.newOwner.lastName.trim()) {
        newErrors.lastName = t('errors.lastNameRequired');
      }
      if (!formData.newOwner.phone.trim()) {
        newErrors.phone = t('errors.phoneRequired');
      }
    }

    // Validate pet
    if (!formData.pet.name.trim()) {
      newErrors.petName = t('errors.petNameRequired');
    }
    if (!formData.pet.species) {
      newErrors.species = t('errors.speciesRequired');
    }
    if (!formData.pet.gender) {
      newErrors.gender = t('errors.genderRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (andAddAnother: boolean = false) => {
    if (!validateForm()) return;

    setLoading(true);
    setApiError('');

    try {
      let ownerId = formData.existingOwnerId || selectedOwner?.id;

      // Create new owner if needed
      if (formData.ownerMode === 'new') {
        const ownerData: CreateOwnerInput = {
          firstName: formData.newOwner.firstName.trim(),
          lastName: formData.newOwner.lastName.trim(),
          phone: formData.newOwner.phone.trim(),
          email: formData.newOwner.email.trim() || undefined,
        };
        const newOwner = await ownersApi.create(ownerData);
        ownerId = newOwner.id;
        setSelectedOwner(newOwner);
      }

      if (!ownerId) {
        setApiError(t('errors.ownerRequired'));
        return;
      }

      // Create pet
      const isNewOwner = formData.ownerMode === 'new';
      const petData: CreatePetInput = {
        name: formData.pet.name.trim(),
        species: formData.pet.species as Species,
        breed: formData.pet.breed || undefined,
        gender: formData.pet.gender as Gender,
        ownerId,
        birthDate: formData.pet.birthDate || undefined,
        color: formData.pet.color.trim() || undefined,
        weight: formData.pet.weight ? parseFloat(formData.pet.weight) : undefined,
        notes: formData.pet.notes.trim() || undefined,
        sendWelcomeEmail: isNewOwner, // Send welcome email only for new owners
      };

      await petsApi.create(petData);
      setSuccessMessage(t('messages.petCreated'));
      onSuccess();

      if (andAddAnother) {
        // Reset pet form but keep owner
        setFormData((prev) => ({
          ...prev,
          ownerMode: 'existing',
          existingOwnerId: ownerId!,
          pet: initialFormData.pet,
        }));
        setErrors({});
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setTimeout(() => {
          handleClose();
        }, 500);
      }
    } catch (error: any) {
      const errorCode = error.response?.data?.errorCode;
      if (errorCode === 'PHONE_EXISTS') {
        setApiError(t('errors.phoneExists'));
      } else {
        setApiError(error.response?.data?.message || t('messages.error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOwnerSelect = (owner: Owner) => {
    setSelectedOwner(owner);
    setFormData((prev) => ({ ...prev, existingOwnerId: owner.id }));
    setOwnerSearch('');
    setOwnerResults([]);
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('newOwner.')) {
      const ownerField = field.replace('newOwner.', '');
      setFormData((prev) => ({
        ...prev,
        newOwner: { ...prev.newOwner, [ownerField]: value },
      }));
    } else if (field.startsWith('pet.')) {
      const petField = field.replace('pet.', '');
      setFormData((prev) => ({
        ...prev,
        pet: { ...prev.pet, [petField]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
    setApiError('');
  };

  const speciesOptions: { value: Species; label: string }[] = [
    { value: Species.DOG, label: t('species.DOG') },
    { value: Species.CAT, label: t('species.CAT') },
    { value: Species.BIRD, label: t('species.BIRD') },
    { value: Species.OTHER, label: t('species.OTHER') },
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('addPet')} size="lg">
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(false); }}>
        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* API Error */}
        {apiError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {apiError}
          </div>
        )}

        {/* Owner Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
            {t('ownerSection')}
          </h3>

          {/* Owner Mode Toggle */}
          <div className="flex gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="ownerMode"
                checked={formData.ownerMode === 'existing'}
                onChange={() => {
                  setFormData((prev) => ({ ...prev, ownerMode: 'existing' }));
                  setErrors((prev) => ({ ...prev, firstName: undefined, lastName: undefined, phone: undefined }));
                }}
                className="w-4 h-4 text-primary-600"
              />
              <span>{t('selectExistingOwner')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="ownerMode"
                checked={formData.ownerMode === 'new'}
                onChange={() => {
                  setFormData((prev) => ({ ...prev, ownerMode: 'new', existingOwnerId: '' }));
                  setSelectedOwner(null);
                  setErrors((prev) => ({ ...prev, owner: undefined }));
                }}
                className="w-4 h-4 text-primary-600"
              />
              <span>{t('createNewOwner')}</span>
            </label>
          </div>

          {formData.ownerMode === 'existing' ? (
            <div>
              {selectedOwner ? (
                <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-medium">{selectedOwner.firstName} {selectedOwner.lastName}</p>
                    <p className="text-sm text-gray-500" dir="ltr">
                      {canViewPhone ? selectedOwner.phone : maskPhoneNumber(selectedOwner.phone)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOwner(null);
                      setFormData((prev) => ({ ...prev, existingOwnerId: '' }));
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    type="text"
                    placeholder={t('searchOwner')}
                    value={ownerSearch}
                    onChange={(e) => setOwnerSearch(e.target.value)}
                    error={errors.owner}
                  />
                  {searchLoading && (
                    <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-white border rounded-lg shadow text-center text-gray-500">
                      {t('loading')}
                    </div>
                  )}
                  {ownerResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                      {ownerResults.map((owner) => (
                        <button
                          key={owner.id}
                          type="button"
                          onClick={() => handleOwnerSelect(owner)}
                          className="w-full px-4 py-2 text-start hover:bg-gray-100 border-b last:border-b-0"
                        >
                          <p className="font-medium">{owner.firstName} {owner.lastName}</p>
                          <p className="text-sm text-gray-500" dir="ltr">
                            {canViewPhone ? owner.phone : maskPhoneNumber(owner.phone)}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                  {ownerSearch.length >= 2 && ownerResults.length === 0 && !searchLoading && (
                    <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-white border rounded-lg shadow text-center text-gray-500">
                      {t('noOwnerFound')}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('owner.firstName')}
                  value={formData.newOwner.firstName}
                  onChange={(e) => handleInputChange('newOwner.firstName', e.target.value)}
                  error={errors.firstName}
                  required
                />
                <Input
                  label={t('owner.lastName')}
                  value={formData.newOwner.lastName}
                  onChange={(e) => handleInputChange('newOwner.lastName', e.target.value)}
                  error={errors.lastName}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('owner.phone')}
                  value={formData.newOwner.phone}
                  onChange={(e) => handleInputChange('newOwner.phone', e.target.value)}
                  error={errors.phone}
                  required
                  dir="ltr"
                />
                <Input
                  label={t('owner.email')}
                  type="email"
                  value={formData.newOwner.email}
                  onChange={(e) => handleInputChange('newOwner.email', e.target.value)}
                  dir="ltr"
                />
              </div>
            </div>
          )}
        </div>

        {/* Pet Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
            {t('petSection')}
          </h3>

          <div className="space-y-4">
            <Input
              label={t('pet.name')}
              value={formData.pet.name}
              onChange={(e) => handleInputChange('pet.name', e.target.value)}
              error={errors.petName}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Species */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('pet.species')} <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.pet.species}
                  onChange={(e) => handleInputChange('pet.species', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.species ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">{t('selectSpecies')}</option>
                  {speciesOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {errors.species && (
                  <p className="mt-1 text-sm text-red-500">{errors.species}</p>
                )}
              </div>

              {/* Breed */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('pet.breed')}
                </label>
                {formData.pet.species === Species.OTHER ? (
                  <Input
                    placeholder={t('enterBreed')}
                    value={formData.pet.breed}
                    onChange={(e) => handleInputChange('pet.breed', e.target.value)}
                  />
                ) : (
                  <select
                    value={formData.pet.breed}
                    onChange={(e) => handleInputChange('pet.breed', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={!formData.pet.species}
                  >
                    <option value="">{t('selectBreed')}</option>
                    {availableBreeds.map((breed) => (
                      <option key={breed.value} value={breed.value}>
                        {getBreedLabel(breed, isRtl)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('pet.gender')} <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="MALE"
                    checked={formData.pet.gender === Gender.MALE}
                    onChange={(e) => handleInputChange('pet.gender', e.target.value)}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span>{t('gender.MALE')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="FEMALE"
                    checked={formData.pet.gender === Gender.FEMALE}
                    onChange={(e) => handleInputChange('pet.gender', e.target.value)}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span>{t('gender.FEMALE')}</span>
                </label>
              </div>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-500">{errors.gender}</p>
              )}
            </div>

            {/* Optional Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                type="date"
                label={t('pet.birthDate')}
                value={formData.pet.birthDate}
                onChange={(e) => handleInputChange('pet.birthDate', e.target.value)}
              />
              <Input
                label={t('pet.color')}
                value={formData.pet.color}
                onChange={(e) => handleInputChange('pet.color', e.target.value)}
              />
              <Input
                type="number"
                label={t('pet.weight')}
                value={formData.pet.weight}
                onChange={(e) => handleInputChange('pet.weight', e.target.value)}
                min="0"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('pet.notes')}
              </label>
              <textarea
                value={formData.pet.notes}
                onChange={(e) => handleInputChange('pet.notes', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            {t('cancel')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleSubmit(true)}
            disabled={loading}
          >
            {t('saveAndAddAnother')}
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? t('loading') : t('save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
