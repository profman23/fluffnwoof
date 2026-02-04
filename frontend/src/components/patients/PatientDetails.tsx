import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../common/Button';
import { PetWithOwner } from '../../api/pets';
import { Species, Gender } from '../../types';
import { getBreedDisplayName } from '../../data/breeds';
import { usePhonePermission, maskPhoneNumber } from '../../hooks/useScreenPermission';

interface PatientDetailsProps {
  pet: PetWithOwner;
  canModify: boolean;
  onEditPet: () => void;
  onEditOwner: () => void;
  onAddAnotherPet: () => void;
  onDeactivate: () => void;
}

export const PatientDetails: React.FC<PatientDetailsProps> = ({
  pet,
  canModify,
  onEditPet,
  onEditOwner,
  onAddAnotherPet,
  onDeactivate,
}) => {
  const { t, i18n } = useTranslation('patients');
  const isRtl = i18n.language === 'ar';
  const { canViewPhone } = usePhonePermission();

  const getSpeciesLabel = (species: Species) => {
    const speciesMap: Record<string, string> = {
      DOG: t('species.DOG'),
      CAT: t('species.CAT'),
      BIRD: t('species.BIRD'),
      OTHER: t('species.OTHER'),
    };
    return speciesMap[species] || species;
  };

  const getGenderLabel = (gender: Gender) => {
    return gender === Gender.MALE ? t('gender.MALE') : t('gender.FEMALE');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return t('details.notProvided');
    return new Date(dateString).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Owner Information */}
      <div className="bg-white dark:bg-[var(--app-bg-card)] p-4 rounded-lg border border-gray-200 dark:border-[var(--app-border-default)]">
        <h3 className="font-semibold text-gray-800 dark:text-[var(--app-text-primary)] mb-4 pb-2 border-b dark:border-[var(--app-border-default)]">
          {t('details.ownerInfo')}
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-[var(--app-text-secondary)]">{t('details.name')}:</span>
            <span className="font-medium dark:text-[var(--app-text-primary)]">
              {pet.owner.firstName} {pet.owner.lastName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-[var(--app-text-secondary)]">{t('details.phone')}:</span>
            <span className="font-medium dark:text-[var(--app-text-primary)]" dir="ltr">
              {canViewPhone ? pet.owner.phone : maskPhoneNumber(pet.owner.phone)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-[var(--app-text-secondary)]">{t('details.email')}:</span>
            <span className="font-medium dark:text-[var(--app-text-primary)]" dir="ltr">
              {pet.owner.email || t('details.notProvided')}
            </span>
          </div>
        </div>
        {canModify && (
          <div className="mt-4 pt-4 border-t dark:border-[var(--app-border-default)]">
            <Button variant="secondary" onClick={onEditOwner} className="w-full">
              {t('editOwner')}
            </Button>
          </div>
        )}
      </div>

      {/* Pet Information */}
      <div className="bg-white dark:bg-[var(--app-bg-card)] p-4 rounded-lg border border-gray-200 dark:border-[var(--app-border-default)]">
        <h3 className="font-semibold text-gray-800 dark:text-[var(--app-text-primary)] mb-4 pb-2 border-b dark:border-[var(--app-border-default)]">
          {t('details.petInfo')}
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-[var(--app-text-secondary)]">{t('details.name')}:</span>
            <span className="font-medium dark:text-[var(--app-text-primary)]">{pet.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-[var(--app-text-secondary)]">{t('details.species')}:</span>
            <span className="font-medium dark:text-[var(--app-text-primary)]">{getSpeciesLabel(pet.species)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-[var(--app-text-secondary)]">{t('details.breed')}:</span>
            <span className="font-medium dark:text-[var(--app-text-primary)]">
              {pet.breed ? getBreedDisplayName(pet.species, pet.breed, isRtl) : t('details.notProvided')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-[var(--app-text-secondary)]">{t('details.gender')}:</span>
            <span className="font-medium dark:text-[var(--app-text-primary)]">{getGenderLabel(pet.gender)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-[var(--app-text-secondary)]">{t('details.birthDate')}:</span>
            <span className="font-medium dark:text-[var(--app-text-primary)]">{formatDate(pet.birthDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-[var(--app-text-secondary)]">{t('details.color')}:</span>
            <span className="font-medium dark:text-[var(--app-text-primary)]">{pet.color || t('details.notProvided')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-[var(--app-text-secondary)]">{t('details.weight')}:</span>
            <span className="font-medium dark:text-[var(--app-text-primary)]">
              {pet.weight ? `${pet.weight} kg` : t('details.notProvided')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-[var(--app-text-secondary)]">{t('details.microchip')}:</span>
            <span className="font-medium dark:text-[var(--app-text-primary)]" dir="ltr">
              {pet.microchipId || t('details.notProvided')}
            </span>
          </div>
          {pet.notes && (
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-[var(--app-text-secondary)]">{t('details.notes')}:</span>
              <span className="font-medium dark:text-[var(--app-text-primary)]">{pet.notes}</span>
            </div>
          )}
        </div>
        {canModify && (
          <div className="mt-4 pt-4 border-t dark:border-[var(--app-border-default)] flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onEditPet}>
              {t('editPet')}
            </Button>
            <Button variant="secondary" onClick={onAddAnotherPet}>
              + {t('addAnotherPet')}
            </Button>
            <Button
              variant="secondary"
              onClick={onDeactivate}
              className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              {t('actions.deactivate')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
