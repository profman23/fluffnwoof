/**
 * My Pets Page - Redesigned
 * Mobile-first pets management with modern UI
 */

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { customerPortalApi, PortalPet, AddPetInput } from '../../api/customerPortal';
import { Card } from '../../components/portal/ui/Card';
import { Button } from '../../components/portal/ui/Button';
import { Input } from '../../components/portal/ui/Input';
import { BottomSheet } from '../../components/portal/ui/Modal';
import { PetAvatar } from '../../components/portal/ui/Avatar';
import { NoPetsEmptyState, PortalLogoLoader } from '../../components/portal/ui';
import { staggerContainer, fadeInUpSimple } from '../../styles/portal/animations';
import {
  speciesList,
  getBreedsBySpecies,
  getBreedLabel,
  getSpeciesIcon,
  Breed,
} from '../../data/petData';

// ============================================
// ICONS
// ============================================

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const PencilIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);

const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

const CameraIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
  </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const SpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

// ============================================
// PET PHOTO UPLOAD COMPONENT
// ============================================

interface PetPhotoUploadProps {
  currentPhoto?: string | null;
  previewUrl?: string | null;
  onFileSelect: (file: File | null) => void;
  onRemove?: () => void;
  uploading?: boolean;
  species?: string;
  petName?: string;
  isRtl: boolean;
}

const PetPhotoUpload: React.FC<PetPhotoUploadProps> = ({
  currentPhoto,
  previewUrl,
  onFileSelect,
  onRemove,
  uploading = false,
  species = 'DOG',
  petName = '',
  isRtl,
}) => {
  const { t } = useTranslation('portal');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const displayImage = previewUrl || currentPhoto;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);

    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError(t('pets.errors.invalidFileType'));
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(t('pets.errors.fileTooLarge'));
        return;
      }

      onFileSelect(file);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('pets.photo')}
      </label>

      {/* Photo Circle */}
      <div className="relative">
        <motion.div
          whileTap={{ scale: 0.95 }}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`
            w-28 h-28 rounded-full overflow-hidden border-2 border-dashed cursor-pointer
            transition-all flex items-center justify-center
            ${displayImage
              ? 'border-transparent'
              : 'border-gray-300 dark:border-gray-600 hover:border-mint-400 dark:hover:border-mint-500'
            }
            ${uploading ? 'opacity-50 cursor-wait' : ''}
          `}
        >
          {uploading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
              <SpinnerIcon className="w-8 h-8 text-mint-500" />
            </div>
          ) : displayImage ? (
            <img
              src={displayImage}
              alt={petName || 'Pet'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center text-gray-400 dark:text-gray-500">
              <CameraIcon className="w-8 h-8 mb-1" />
              <span className="text-xs">{t('pets.tapToUpload')}</span>
            </div>
          )}

          {/* Hover overlay for existing image */}
          {displayImage && !uploading && (
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
              <CameraIcon className="w-8 h-8 text-white" />
            </div>
          )}
        </motion.div>

        {/* Remove button */}
        {displayImage && !uploading && onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute -bottom-1 -right-1 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Hidden input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {/* Hint */}
      <p className="text-xs text-gray-400 dark:text-gray-500">
        {t('pets.photoHint')}
      </p>
    </div>
  );
};

// ============================================
// SPECIES SELECTOR COMPONENT
// ============================================

interface SpeciesSelectorProps {
  value: string;
  onChange: (species: string) => void;
}

const SpeciesSelector: React.FC<SpeciesSelectorProps> = ({ value, onChange }) => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  return (
    <div className="grid grid-cols-4 gap-2">
      {speciesList.map((species) => (
        <button
          key={species.value}
          type="button"
          onClick={() => onChange(species.value)}
          className={`
            p-3 rounded-xl border-2 transition-all text-center
            ${value === species.value
              ? 'border-mint-500 bg-mint-50 dark:bg-mint-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }
          `}
        >
          <div className="text-2xl mb-1">{species.icon}</div>
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {isRtl ? species.labelAr : species.labelEn}
          </div>
        </button>
      ))}
    </div>
  );
};

// ============================================
// GENDER SELECTOR COMPONENT
// ============================================

interface GenderSelectorProps {
  value: string;
  onChange: (gender: string) => void;
}

const GenderSelector: React.FC<GenderSelectorProps> = ({ value, onChange }) => {
  const { t } = useTranslation('portal');

  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => onChange('MALE')}
        className={`
          p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2
          ${value === 'MALE'
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
          }
        `}
      >
        <span className="text-xl">♂️</span>
        <span className="font-medium text-gray-700 dark:text-gray-300">
          {t('pets.genderOptions.MALE')}
        </span>
      </button>
      <button
        type="button"
        onClick={() => onChange('FEMALE')}
        className={`
          p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2
          ${value === 'FEMALE'
            ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
          }
        `}
      >
        <span className="text-xl">♀️</span>
        <span className="font-medium text-gray-700 dark:text-gray-300">
          {t('pets.genderOptions.FEMALE')}
        </span>
      </button>
    </div>
  );
};

// ============================================
// PET CARD COMPONENT
// ============================================

interface PetCardItemProps {
  pet: PortalPet;
  onEdit: () => void;
  onClick: () => void;
  isRtl: boolean;
}

const PetCardItem: React.FC<PetCardItemProps> = ({ pet, onEdit, onClick, isRtl }) => {
  const { t } = useTranslation('portal');

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();

    if (months < 0) {
      years--;
      months += 12;
    }

    if (years > 0) {
      return t('pets.age.years', { count: years });
    }
    if (months > 0) {
      return t('pets.age.months', { count: months });
    }
    return t('pets.age.newborn');
  };

  const getSpeciesDisplayName = (species: string) => {
    const info = speciesList.find(s => s.value === species);
    if (info) {
      return isRtl ? info.labelAr : info.labelEn;
    }
    return species;
  };

  return (
    <motion.div whileTap={{ scale: 0.98 }}>
      <Card
        variant="interactive"
        padding="md"
        onClick={onClick}
        className="cursor-pointer"
      >
        <div className="flex items-start gap-4">
          <PetAvatar
            src={pet.photo}
            name={pet.name}
            species={pet.species}
            size="xl"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                  {pet.name}
                </h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                  {pet.petCode}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-2 text-gray-400 hover:text-mint-600 hover:bg-mint-50 dark:hover:bg-mint-900/20 rounded-xl transition-colors"
                aria-label="Edit pet"
              >
                <PencilIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs text-gray-600 dark:text-gray-400">
                {getSpeciesIcon(pet.species)}
                {getSpeciesDisplayName(pet.species)}
              </span>
              {pet.breed && (
                <span className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs text-gray-600 dark:text-gray-400">
                  {pet.breed}
                </span>
              )}
              <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs ${
                pet.gender === 'MALE'
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400'
              }`}>
                {pet.gender === 'MALE' ? '♂️' : '♀️'}
                {t(`pets.genderOptions.${pet.gender}`)}
              </span>
            </div>

            {pet.birthDate && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {t('pets.age')}: {calculateAge(pet.birthDate)}
              </p>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const MyPets: React.FC = () => {
  const { t, i18n } = useTranslation('portal');
  const isRtl = i18n.language === 'ar';
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [pets, setPets] = useState<PortalPet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPet, setEditingPet] = useState<PortalPet | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState<AddPetInput>({
    name: '',
    species: 'DOG',
    breed: '',
    gender: 'MALE',
    birthDate: '',
    color: '',
    weight: undefined,
    notes: '',
  });

  // Photo state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Available breeds based on species
  const [availableBreeds, setAvailableBreeds] = useState<Breed[]>([]);

  useEffect(() => {
    fetchPets();
  }, []);

  // Check for add=true query param to open modal
  useEffect(() => {
    if (searchParams.get('add') === 'true' && !loading) {
      // Reset form for add mode
      setEditingPet(null);
      setFormData({
        name: '',
        species: 'DOG',
        breed: '',
        gender: 'MALE',
        birthDate: '',
        color: '',
        weight: undefined,
        notes: '',
      });
      setPhotoFile(null);
      setPhotoPreview(null);
      setAvailableBreeds(getBreedsBySpecies('DOG'));
      setError('');
      setShowModal(true);
      // Clear the query param
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, loading, setSearchParams]);

  // Update breeds when species changes
  useEffect(() => {
    if (formData.species) {
      setAvailableBreeds(getBreedsBySpecies(formData.species));
    } else {
      setAvailableBreeds([]);
    }
  }, [formData.species]);

  // Breed options
  const breedOptions = useMemo(() => {
    return availableBreeds.map(b => ({
      value: b.value,
      label: getBreedLabel(b, isRtl),
    }));
  }, [availableBreeds, isRtl]);

  const fetchPets = async () => {
    try {
      const data = await customerPortalApi.getPets();
      setPets(data);
    } catch (error) {
      console.error('Error fetching pets:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingPet(null);
    setFormData({
      name: '',
      species: 'DOG',
      breed: '',
      gender: 'MALE',
      birthDate: '',
      color: '',
      weight: undefined,
      notes: '',
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setAvailableBreeds(getBreedsBySpecies('DOG'));
    setError('');
    setShowModal(true);
  };

  const openEditModal = (pet: PortalPet) => {
    setEditingPet(pet);
    setFormData({
      name: pet.name,
      species: pet.species,
      breed: pet.breed || '',
      gender: pet.gender,
      birthDate: pet.birthDate ? pet.birthDate.split('T')[0] : '',
      color: pet.color || '',
      weight: pet.weight,
      notes: '',
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setAvailableBreeds(getBreedsBySpecies(pet.species));
    setError('');
    setShowModal(true);
  };

  // Handle photo file selection
  const handlePhotoSelect = (file: File | null) => {
    setPhotoFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
  };

  // Handle photo removal for existing pet
  const handleRemovePhoto = async () => {
    if (!editingPet) {
      // For new pets, just clear the preview
      setPhotoFile(null);
      setPhotoPreview(null);
      return;
    }

    // For existing pets, remove from server
    setUploadingPhoto(true);
    try {
      await customerPortalApi.removePetPhoto(editingPet.id);
      setEditingPet({ ...editingPet, photo: null });
      fetchPets();
    } catch (err: any) {
      setError(err.response?.data?.message || t('errors.generic'));
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Handle immediate photo upload for existing pet
  const handlePhotoUploadForExistingPet = async (file: File) => {
    if (!editingPet) return;

    setUploadingPhoto(true);
    try {
      const updatedPet = await customerPortalApi.uploadPetPhoto(editingPet.id, file);
      setEditingPet(updatedPet);
      setPhotoFile(null);
      setPhotoPreview(null);
      fetchPets();
    } catch (err: any) {
      setError(err.response?.data?.message || t('errors.generic'));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (editingPet) {
        // Update existing pet
        await customerPortalApi.updatePet(editingPet.id, formData);
        // Photo is uploaded immediately via handlePhotoUploadForExistingPet, no need here
      } else {
        // Create new pet
        const newPet = await customerPortalApi.addPet(formData);

        // If there's a photo file, upload it after creation
        if (photoFile && newPet.id) {
          setUploadingPhoto(true);
          try {
            await customerPortalApi.uploadPetPhoto(newPet.id, photoFile);
          } catch (photoErr: any) {
            console.error('Photo upload failed:', photoErr);
            // Pet was created, just warn about photo
          } finally {
            setUploadingPhoto(false);
          }
        }
      }
      setShowModal(false);
      setPhotoFile(null);
      setPhotoPreview(null);
      fetchPets();
    } catch (err: any) {
      setError(err.response?.data?.message || t('errors.generic'));
    } finally {
      setSaving(false);
    }
  };

  const handleSpeciesChange = (species: string) => {
    setFormData({ ...formData, species, breed: '' });
  };

  // Show centered logo loader while loading
  if (loading) {
    return <PortalLogoLoader fullScreen={false} size="lg" />;
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        initial={fadeInUpSimple.initial}
        animate={fadeInUpSimple.animate}
        transition={fadeInUpSimple.transition}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <span>🐾</span> {t('pets.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('pets.count', { count: pets.length })}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={openAddModal}
          leftIcon={<PlusIcon className="w-5 h-5" />}
        >
          {t('pets.addPet')}
        </Button>
      </motion.div>

      {/* Pets List */}
      {pets.length === 0 ? (
        <motion.div
          initial={fadeInUpSimple.initial}
          animate={fadeInUpSimple.animate}
          transition={{ ...fadeInUpSimple.transition, delay: 0.1 }}
        >
          <NoPetsEmptyState onAdd={openAddModal} />
        </motion.div>
      ) : (
        <div className="space-y-4">
          {pets.map((pet, index) => (
            <motion.div
              key={pet.id}
              initial={fadeInUpSimple.initial}
              animate={fadeInUpSimple.animate}
              transition={{ ...fadeInUpSimple.transition, delay: 0.1 + index * 0.05 }}
            >
              <PetCardItem
                pet={pet}
                onClick={() => navigate(`/portal/pets/${pet.id}`)}
                onEdit={() => openEditModal(pet)}
                isRtl={isRtl}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Bottom Sheet */}
      <BottomSheet
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingPet ? t('pets.edit') : t('pets.addPet')}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            >
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </motion.div>
          )}

          {/* Pet Photo Upload */}
          <PetPhotoUpload
            currentPhoto={editingPet?.photo}
            previewUrl={photoPreview}
            onFileSelect={(file) => {
              if (editingPet && file) {
                // For existing pets, upload immediately
                handlePhotoUploadForExistingPet(file);
              } else {
                // For new pets, store for later
                handlePhotoSelect(file);
              }
            }}
            onRemove={handleRemovePhoto}
            uploading={uploadingPhoto}
            species={formData.species}
            petName={formData.name}
            isRtl={isRtl}
          />

          {/* Pet Name */}
          <Input
            label={t('pets.name')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={t('pets.namePlaceholder')}
            required
            size="lg"
          />

          {/* Species Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t('pets.species')} <span className="text-red-500">*</span>
            </label>
            <SpeciesSelector
              value={formData.species}
              onChange={handleSpeciesChange}
            />
          </div>

          {/* Breed Select */}
          {breedOptions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('pets.breed')}
              </label>
              <select
                value={formData.breed || ''}
                onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-mint-500 focus:outline-none focus:ring-4 focus:ring-mint-500/20 transition-all"
              >
                <option value="">{t('pets.selectBreed')}</option>
                {breedOptions.map((breed) => (
                  <option key={breed.value} value={breed.value}>
                    {breed.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Gender Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t('pets.gender')} <span className="text-red-500">*</span>
            </label>
            <GenderSelector
              value={formData.gender}
              onChange={(gender) => setFormData({ ...formData, gender })}
            />
          </div>

          {/* Birth Date */}
          <Input
            type="date"
            label={t('pets.birthDate')}
            value={formData.birthDate}
            onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
            size="lg"
          />

          {/* Color & Weight */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('pets.color')}
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              placeholder={t('pets.colorPlaceholder')}
            />
            <Input
              type="number"
              label={t('pets.weight')}
              value={formData.weight || ''}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value ? parseFloat(e.target.value) : undefined })}
              placeholder="Kg"
              hint="Kg"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => setShowModal(false)}
            >
              {t('pets.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={saving}
            >
              {editingPet ? t('pets.save') : t('pets.addPet')}
            </Button>
          </div>
        </form>
      </BottomSheet>
    </motion.div>
  );
};

export default MyPets;
