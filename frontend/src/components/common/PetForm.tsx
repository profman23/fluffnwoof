import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from './Input';
import { SearchableSelect, SearchableSelectOption } from './SearchableSelect';
import { ImageUpload } from './ImageUpload';
import { Species, Gender } from '../../types';
import {
  speciesList,
  getBreedsBySpecies,
  getBreedLabel,
  getSpeciesIcon,
  Breed,
} from '../../data/petData';

// ============================================
// Types
// ============================================

export interface PetFormData {
  name: string;
  species: Species | string;
  breed: string;
  gender: Gender | string;
  birthDate: string;
  color: string;
  weight: string;
  microchipId?: string;
  notes: string;
}

export interface PetFormErrors {
  name?: string;
  species?: string;
  breed?: string;
  gender?: string;
}

export interface PetFormProps {
  formData: PetFormData;
  onChange: (data: PetFormData) => void;
  errors?: PetFormErrors;
  onErrorChange?: (errors: PetFormErrors) => void;

  // Feature flags for different contexts
  showPhotoUpload?: boolean;
  showMicrochip?: boolean;
  showNotes?: boolean;
  showBreedSelector?: boolean;

  // Photo handling (for edit mode)
  photoUrl?: string | null;
  onPhotoUpload?: (file: File) => Promise<void>;
  onPhotoRemove?: () => Promise<void>;
  photoLoading?: boolean;

  // Translations namespace
  translationNamespace?: 'patients' | 'portal';

  // Disabled state
  disabled?: boolean;
}

// ============================================
// Component
// ============================================

export const PetForm: React.FC<PetFormProps> = ({
  formData,
  onChange,
  errors = {},
  onErrorChange,
  showPhotoUpload = false,
  showMicrochip = false,
  showNotes = true,
  showBreedSelector = true,
  photoUrl,
  onPhotoUpload,
  onPhotoRemove,
  photoLoading = false,
  translationNamespace = 'patients',
  disabled = false,
}) => {
  const { t, i18n } = useTranslation(translationNamespace);
  const isRtl = i18n.language === 'ar';

  // Available breeds based on selected species
  const [availableBreeds, setAvailableBreeds] = useState<Breed[]>([]);

  // Update breeds when species changes
  useEffect(() => {
    if (formData.species) {
      const breeds = getBreedsBySpecies(formData.species);
      setAvailableBreeds(breeds);

      // Reset breed if species changed and breed is not available
      if (formData.breed && breeds.length > 0) {
        const breedExists = breeds.some(b => b.value === formData.breed);
        if (!breedExists) {
          handleChange('breed', '');
        }
      }
    }
  }, [formData.species]);

  // Handle field changes
  const handleChange = (field: keyof PetFormData, value: string) => {
    const newData = { ...formData, [field]: value };

    // If species changed, reset breed
    if (field === 'species') {
      newData.breed = '';
    }

    onChange(newData);

    // Clear error for this field
    if (errors[field as keyof PetFormErrors] && onErrorChange) {
      const newErrors = { ...errors };
      delete newErrors[field as keyof PetFormErrors];
      onErrorChange(newErrors);
    }
  };

  // Species options with icons
  const speciesOptions: SearchableSelectOption[] = useMemo(() => {
    return speciesList.map(s => ({
      value: s.value,
      label: isRtl ? s.labelAr : s.labelEn,
      icon: s.icon,
    }));
  }, [isRtl]);

  // Breed options with icons
  const breedOptions: SearchableSelectOption[] = useMemo(() => {
    return availableBreeds.map(b => ({
      value: b.value,
      label: getBreedLabel(b, isRtl),
      icon: getSpeciesIcon(formData.species),
    }));
  }, [availableBreeds, isRtl, formData.species]);

  // Get the right translation key based on namespace
  const getLabel = (key: string) => {
    if (translationNamespace === 'portal') {
      // Portal uses pets.xxx structure
      return t(`pets.${key}`);
    }
    // Patients uses pet.xxx structure
    return t(`pet.${key}`);
  };

  return (
    <div className="space-y-4">
      {/* Photo Upload Section - Only shown if enabled */}
      {showPhotoUpload && onPhotoUpload && (
        <div className="flex flex-col items-center mb-4">
          <label className="label mb-2">{getLabel('photo')}</label>
          <ImageUpload
            currentImage={photoUrl}
            onUpload={onPhotoUpload}
            onRemove={photoUrl ? onPhotoRemove : undefined}
            shape="square"
            size="lg"
            loading={photoLoading}
            maxSizeMB={5}
            placeholder={
              <div className="flex flex-col items-center text-gray-400">
                <span className="text-4xl">{getSpeciesIcon(formData.species)}</span>
              </div>
            }
          />
        </div>
      )}

      {/* Pet Name */}
      <Input
        label={getLabel('name')}
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
        error={errors.name}
        required
        disabled={disabled}
      />

      {/* Species & Breed Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Species */}
        <SearchableSelect
          label={getLabel('species')}
          options={speciesOptions}
          value={formData.species}
          onChange={(value) => handleChange('species', value)}
          placeholder={t('selectSpecies')}
          searchPlaceholder={t('search') || 'Search...'}
          required
          error={errors.species}
          disabled={disabled}
          showIcons={true}
        />

        {/* Breed */}
        {showBreedSelector && (
          <SearchableSelect
            label={getLabel('breed')}
            options={breedOptions}
            value={formData.breed}
            onChange={(value) => handleChange('breed', value)}
            placeholder={t('selectBreed')}
            searchPlaceholder={t('search') || 'Search...'}
            error={errors.breed}
            disabled={disabled || !formData.species || availableBreeds.length === 0}
            allowClear
            showIcons={false}
          />
        )}
      </div>

      {/* Gender */}
      <div>
        <label className="label">
          {getLabel('gender')} <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-6 mt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="gender"
              value={Gender.MALE}
              checked={formData.gender === Gender.MALE}
              onChange={(e) => handleChange('gender', e.target.value)}
              className="w-4 h-4 text-primary-600"
              disabled={disabled}
            />
            <span className="flex items-center gap-1">
              <span>♂️</span> {t('gender.MALE')}
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="gender"
              value={Gender.FEMALE}
              checked={formData.gender === Gender.FEMALE}
              onChange={(e) => handleChange('gender', e.target.value)}
              className="w-4 h-4 text-primary-600"
              disabled={disabled}
            />
            <span className="flex items-center gap-1">
              <span>♀️</span> {t('gender.FEMALE')}
            </span>
          </label>
        </div>
        {errors.gender && (
          <p className="mt-1 text-sm text-red-500">{errors.gender}</p>
        )}
      </div>

      {/* Birth Date, Color, Weight Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          type="date"
          label={getLabel('birthDate')}
          value={formData.birthDate}
          onChange={(e) => handleChange('birthDate', e.target.value)}
          disabled={disabled}
        />
        <Input
          label={getLabel('color')}
          value={formData.color}
          onChange={(e) => handleChange('color', e.target.value)}
          disabled={disabled}
        />
        <Input
          type="number"
          label={getLabel('weight')}
          value={formData.weight}
          onChange={(e) => handleChange('weight', e.target.value)}
          min="0"
          step="0.1"
          disabled={disabled}
        />
      </div>

      {/* Microchip ID - Only shown if enabled */}
      {showMicrochip && (
        <Input
          label={getLabel('microchipId')}
          value={formData.microchipId || ''}
          onChange={(e) => handleChange('microchipId', e.target.value)}
          disabled={disabled}
          dir="ltr"
        />
      )}

      {/* Notes - Only shown if enabled */}
      {showNotes && (
        <div>
          <label className="label">{getLabel('notes')}</label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            rows={3}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
};

// ============================================
// Validation Helper
// ============================================

export const validatePetForm = (
  data: PetFormData,
  t: (key: string) => string
): PetFormErrors => {
  const errors: PetFormErrors = {};

  if (!data.name.trim()) {
    errors.name = t('errors.petNameRequired');
  }
  if (!data.species) {
    errors.species = t('errors.speciesRequired');
  }
  if (!data.gender) {
    errors.gender = t('errors.genderRequired');
  }

  return errors;
};

// ============================================
// Default Form Data
// ============================================

export const getDefaultPetFormData = (): PetFormData => ({
  name: '',
  species: Species.DOG,
  breed: '',
  gender: Gender.MALE,
  birthDate: '',
  color: '',
  weight: '',
  microchipId: '',
  notes: '',
});

export default PetForm;
