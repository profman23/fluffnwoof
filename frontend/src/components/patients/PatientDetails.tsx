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
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-4 pb-2 border-b">
          {t('details.ownerInfo')}
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500">{t('details.name')}:</span>
            <span className="font-medium">
              {pet.owner.firstName} {pet.owner.lastName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t('details.phone')}:</span>
            <span className="font-medium" dir="ltr">
              {canViewPhone ? pet.owner.phone : maskPhoneNumber(pet.owner.phone)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t('details.email')}:</span>
            <span className="font-medium" dir="ltr">
              {pet.owner.email || t('details.notProvided')}
            </span>
          </div>
        </div>
        {canModify && (
          <div className="mt-4 pt-4 border-t">
            <Button variant="secondary" onClick={onEditOwner} className="w-full">
              {t('editOwner')}
            </Button>
          </div>
        )}
      </div>

      {/* Pet Information */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-4 pb-2 border-b">
          {t('details.petInfo')}
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500">{t('details.name')}:</span>
            <span className="font-medium">{pet.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t('details.species')}:</span>
            <span className="font-medium">{getSpeciesLabel(pet.species)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t('details.breed')}:</span>
            <span className="font-medium">
              {pet.breed ? getBreedDisplayName(pet.species, pet.breed, isRtl) : t('details.notProvided')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t('details.gender')}:</span>
            <span className="font-medium">{getGenderLabel(pet.gender)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t('details.birthDate')}:</span>
            <span className="font-medium">{formatDate(pet.birthDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t('details.color')}:</span>
            <span className="font-medium">{pet.color || t('details.notProvided')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t('details.weight')}:</span>
            <span className="font-medium">
              {pet.weight ? `${pet.weight} kg` : t('details.notProvided')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t('details.microchip')}:</span>
            <span className="font-medium" dir="ltr">
              {pet.microchipId || t('details.notProvided')}
            </span>
          </div>
          {pet.notes && (
            <div className="flex justify-between">
              <span className="text-gray-500">{t('details.notes')}:</span>
              <span className="font-medium">{pet.notes}</span>
            </div>
          )}
        </div>
        {canModify && (
          <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onEditPet}>
              {t('editPet')}
            </Button>
            <Button variant="secondary" onClick={onAddAnotherPet}>
              + {t('addAnotherPet')}
            </Button>
            <Button
              variant="secondary"
              onClick={onDeactivate}
              className="text-red-600 hover:bg-red-50"
            >
              {t('actions.deactivate')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
