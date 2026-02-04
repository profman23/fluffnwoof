import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { ImageUpload } from '../common/ImageUpload';
import { SearchableSelect, SearchableSelectOption } from '../common/SearchableSelect';
import { petsApi, UpdatePetInput, PetWithOwner } from '../../api/pets';
import { uploadApi } from '../../api/upload';
import { Species, Gender } from '../../types';
import {
  speciesList,
  getBreedsBySpecies,
  getBreedLabel,
  getSpeciesIcon,
  Breed,
} from '../../data/petData';
import { usePhonePermission, maskPhoneNumber } from '../../hooks/useScreenPermission';

interface EditPetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pet: PetWithOwner;
}

interface FormData {
  name: string;
  species: Species;
  breed: string;
  gender: Gender;
  birthDate: string;
  color: string;
  weight: string;
  notes: string;
}

interface FormErrors {
  name?: string;
  species?: string;
  gender?: string;
}

export const EditPetModal: React.FC<EditPetModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  pet,
}) => {
  const { t, i18n } = useTranslation('patients');
  const { canViewPhone } = usePhonePermission();
  const isRtl = i18n.language === 'ar';

  const [formData, setFormData] = useState<FormData>({
    name: '',
    species: Species.DOG,
    breed: '',
    gender: Gender.MALE,
    birthDate: '',
    color: '',
    weight: '',
    notes: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [availableBreeds, setAvailableBreeds] = useState<Breed[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);

  // Load pet data when modal opens
  useEffect(() => {
    if (isOpen && pet) {
      setFormData({
        name: pet.name,
        species: pet.species,
        breed: pet.breed || '',
        gender: pet.gender,
        birthDate: pet.birthDate ? pet.birthDate.split('T')[0] : '',
        color: pet.color || '',
        weight: pet.weight?.toString() || '',
        notes: pet.notes || '',
      });
      setPhotoUrl(pet.photoUrl || null);
      setAvailableBreeds(getBreedsBySpecies(pet.species));
      setErrors({});
      setApiError('');
    }
  }, [isOpen, pet]);

  // Update breeds when species changes
  useEffect(() => {
    if (formData.species) {
      setAvailableBreeds(getBreedsBySpecies(formData.species));
    }
  }, [formData.species]);

  // Species options with icons
  const speciesOptions: SearchableSelectOption[] = useMemo(() => {
    return speciesList.map(s => ({
      value: s.value,
      label: isRtl ? s.labelAr : s.labelEn,
      icon: s.icon,
    }));
  }, [isRtl]);

  // Breed options
  const breedOptions: SearchableSelectOption[] = useMemo(() => {
    const icon = getSpeciesIcon(formData.species);
    return availableBreeds.map(b => ({
      value: b.value,
      label: getBreedLabel(b, isRtl),
      icon: icon,
    }));
  }, [availableBreeds, isRtl, formData.species]);

  const handleClose = () => {
    setErrors({});
    setApiError('');
    onClose();
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t('errors.petNameRequired');
    }
    if (!formData.species) {
      newErrors.species = t('errors.speciesRequired');
    }
    if (!formData.gender) {
      newErrors.gender = t('errors.genderRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setApiError('');

    try {
      const updateData: UpdatePetInput = {
        name: formData.name.trim(),
        species: formData.species,
        breed: formData.breed || undefined,
        gender: formData.gender,
        birthDate: formData.birthDate || undefined,
        color: formData.color.trim() || undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        notes: formData.notes.trim() || undefined,
      };

      await petsApi.update(pet.id, updateData);
      onSuccess();
      handleClose();
    } catch (error: any) {
      setApiError(error.response?.data?.message || t('messages.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    // Reset breed when species changes
    if (field === 'species') {
      setFormData((prev) => ({ ...prev, species: value as Species, breed: '' }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }

    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    setApiError('');
  };

  const handlePhotoUpload = async (file: File) => {
    setPhotoLoading(true);
    try {
      const updatedPet = await uploadApi.uploadPetPhoto(pet.id, file);
      setPhotoUrl(updatedPet.photoUrl || null);
    } catch (error: any) {
      setApiError(error.response?.data?.message || t('messages.error'));
    } finally {
      setPhotoLoading(false);
    }
  };

  const handlePhotoRemove = async () => {
    setPhotoLoading(true);
    try {
      const updatedPet = await uploadApi.removePetPhoto(pet.id);
      setPhotoUrl(updatedPet.photoUrl || null);
    } catch (error: any) {
      setApiError(error.response?.data?.message || t('messages.error'));
    } finally {
      setPhotoLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('editPet')} size="lg">
      <form onSubmit={handleSubmit}>
        {/* API Error */}
        {apiError && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg">
            {apiError}
          </div>
        )}

        {/* Owner Info (Read Only) */}
        <div className="mb-4 p-3 bg-gray-50 dark:bg-[var(--app-bg-tertiary)] rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('ownerSection')}</p>
          <p className="font-medium dark:text-[var(--app-text-primary)]">{pet.owner.firstName} {pet.owner.lastName}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400" dir="ltr">
            {canViewPhone ? pet.owner.phone : maskPhoneNumber(pet.owner.phone)}
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Pet Photo */}
          <div className="flex flex-col items-center">
            <label className="label mb-2">{t('pet.photo')}</label>
            <ImageUpload
              currentImage={photoUrl}
              onUpload={handlePhotoUpload}
              onRemove={photoUrl ? handlePhotoRemove : undefined}
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

          <div className="flex-1 space-y-4">
            <Input
              label={t('pet.name')}
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              error={errors.name}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Species - Searchable Select */}
              <SearchableSelect
                label={t('pet.species')}
                options={speciesOptions}
                value={formData.species}
                onChange={(value) => handleInputChange('species', value)}
                placeholder={t('selectSpecies')}
                searchPlaceholder={t('searchPlaceholder')}
                required
                error={errors.species}
                showIcons={true}
              />

              {/* Breed - Searchable Select */}
              <SearchableSelect
                label={t('pet.breed')}
                options={breedOptions}
                value={formData.breed}
                onChange={(value) => handleInputChange('breed', value)}
                placeholder={t('selectBreed')}
                searchPlaceholder={t('searchPlaceholder')}
                disabled={!formData.species || availableBreeds.length === 0}
                allowClear
                showIcons={false}
              />
            </div>

            {/* Gender */}
            <div>
              <label className="label">
                {t('pet.gender')} <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-6 mt-2">
                <label className="flex items-center gap-2 cursor-pointer dark:text-[var(--app-text-secondary)]">
                  <input
                    type="radio"
                    name="gender"
                    value="MALE"
                    checked={formData.gender === Gender.MALE}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="flex items-center gap-1">
                    <span>♂️</span> {t('gender.MALE')}
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer dark:text-[var(--app-text-secondary)]">
                  <input
                    type="radio"
                    name="gender"
                    value="FEMALE"
                    checked={formData.gender === Gender.FEMALE}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-4 h-4 text-primary-600"
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

            {/* Optional Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                type="date"
                label={t('pet.birthDate')}
                value={formData.birthDate}
                onChange={(e) => handleInputChange('birthDate', e.target.value)}
              />
              <Input
                label={t('pet.color')}
                value={formData.color}
                onChange={(e) => handleInputChange('color', e.target.value)}
              />
              <Input
                type="number"
                label={t('pet.weight')}
                value={formData.weight}
                onChange={(e) => handleInputChange('weight', e.target.value)}
                min="0"
                step="0.1"
              />
            </div>

            <div>
              <label className="label">
                {t('pet.notes')}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-[var(--app-border-default)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)]"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-[var(--app-border-default)]">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            {t('cancel')}
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? t('loading') : t('save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
