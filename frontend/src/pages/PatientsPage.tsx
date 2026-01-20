import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useScreenPermission, usePhonePermission, maskPhoneNumber } from '../hooks/useScreenPermission';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { petsApi, PetWithOwner } from '../api/pets';
import { PatientDetails } from '../components/patients/PatientDetails';
import { AddPetModal } from '../components/patients/AddPetModal';
import { EditPetModal } from '../components/patients/EditPetModal';
import { EditOwnerModal } from '../components/patients/EditOwnerModal';
import { Owner, Species, Gender } from '../types';
import { getBreedDisplayName } from '../data/breeds';

export const PatientsPage: React.FC = () => {
  const { t, i18n } = useTranslation('patients');
  const isRtl = i18n.language === 'ar';
  const { canModify, isReadOnly } = useScreenPermission('patients');
  const { canViewPhone } = usePhonePermission();

  // State
  const [pets, setPets] = useState<PetWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditPetModalOpen, setIsEditPetModalOpen] = useState(false);
  const [isEditOwnerModalOpen, setIsEditOwnerModalOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState<PetWithOwner | null>(null);
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [preSelectedOwnerId, setPreSelectedOwnerId] = useState<string | undefined>(undefined);

  // Fetch pets
  const fetchPets = useCallback(async () => {
    setLoading(true);
    try {
      const result = await petsApi.getAll(page, 20, search || undefined);
      setPets(result.data || []);
      setTotalPages(result.totalPages || 1);
    } catch (error) {
      console.error('Error fetching pets:', error);
      setPets([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Handlers
  const handleRowClick = (petId: string) => {
    setExpandedRowId(expandedRowId === petId ? null : petId);
  };

  const handleAddPet = () => {
    setPreSelectedOwnerId(undefined);
    setIsAddModalOpen(true);
  };

  const handleAddAnotherPet = (ownerId: string) => {
    setPreSelectedOwnerId(ownerId);
    setIsAddModalOpen(true);
  };

  const handleEditPet = (pet: PetWithOwner) => {
    setSelectedPet(pet);
    setIsEditPetModalOpen(true);
  };

  const handleEditOwner = (owner: Owner) => {
    setSelectedOwner(owner);
    setIsEditOwnerModalOpen(true);
  };

  const handleDeactivate = async (pet: PetWithOwner) => {
    if (!window.confirm(t('confirmDeactivate'))) return;
    try {
      await petsApi.deactivate(pet.id);
      setSuccessMessage(t('messages.petDeactivated'));
      fetchPets();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deactivating pet:', error);
    }
  };

  const handleSuccess = () => {
    fetchPets();
    setSuccessMessage(t('messages.petCreated'));
    setTimeout(() => setSuccessMessage(''), 3000);
  };

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
    return gender === 'MALE' ? t('gender.MALE') : t('gender.FEMALE');
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('title')}</h1>
          {isReadOnly && (
            <span className="text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded mt-1 inline-block">
              {t('readOnly')}
            </span>
          )}
        </div>
        {canModify && (
          <Button onClick={handleAddPet}>
            + {t('addPet')}
          </Button>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <Input
          type="text"
          placeholder={t('search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-10"></th>
                <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.customerCode')}
                </th>
                <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.ownerName')}
                </th>
                <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.phone')}
                </th>
                <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.petCode')}
                </th>
                <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.petName')}
                </th>
                <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.species')}
                </th>
                <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.breed')}
                </th>
                <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.gender')}
                </th>
                <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    {t('loading')}
                  </td>
                </tr>
              ) : pets.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <span className="text-4xl mb-2">🐾</span>
                      <p>{t('noPatients')}</p>
                      {canModify && (
                        <Button onClick={handleAddPet} className="mt-4">
                          + {t('addPet')}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                pets.map((pet) => (
                  <React.Fragment key={pet.id}>
                    <tr
                      className={`hover:bg-gray-50 cursor-pointer ${
                        expandedRowId === pet.id ? 'bg-primary-50' : ''
                      }`}
                      onClick={() => handleRowClick(pet.id)}
                    >
                      <td className="px-2 py-3 text-center">
                        <span className="text-gray-400">
                          {expandedRowId === pet.id ? '▼' : '▶'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {pet.owner.customerCode || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {pet.owner.firstName} {pet.owner.lastName}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500" dir="ltr">
                        {canViewPhone ? pet.owner.phone : maskPhoneNumber(pet.owner.phone)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {pet.petCode || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{pet.name}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {getSpeciesLabel(pet.species)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {pet.breed ? getBreedDisplayName(pet.species, pet.breed, isRtl) : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {getGenderLabel(pet.gender)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          {canModify && (
                            <>
                              <button
                                onClick={() => handleEditPet(pet)}
                                className="text-primary-600 hover:text-primary-800"
                                title={t('actions.edit')}
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeactivate(pet)}
                                className="text-red-600 hover:text-red-800"
                                title={t('actions.deactivate')}
                              >
                                🗑️
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* Expanded Details Row */}
                    {expandedRowId === pet.id && (
                      <tr>
                        <td colSpan={10} className="px-4 py-4 bg-gray-50">
                          <PatientDetails
                            pet={pet}
                            canModify={canModify}
                            onEditPet={() => handleEditPet(pet)}
                            onEditOwner={() => handleEditOwner(pet.owner as Owner)}
                            onAddAnotherPet={() => handleAddAnotherPet(pet.owner.id)}
                            onDeactivate={() => handleDeactivate(pet)}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex justify-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              {isRtl ? '←' : '→'}
            </Button>
            <span className="flex items-center px-4 text-sm text-gray-600">
              {page} / {totalPages}
            </span>
            <Button
              variant="secondary"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              {isRtl ? '→' : '←'}
            </Button>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddPetModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleSuccess}
        preSelectedOwnerId={preSelectedOwnerId}
      />

      {selectedPet && (
        <EditPetModal
          isOpen={isEditPetModalOpen}
          onClose={() => {
            setIsEditPetModalOpen(false);
            setSelectedPet(null);
          }}
          onSuccess={() => {
            fetchPets();
            setSuccessMessage(t('messages.petUpdated'));
            setTimeout(() => setSuccessMessage(''), 3000);
          }}
          pet={selectedPet}
        />
      )}

      {selectedOwner && (
        <EditOwnerModal
          isOpen={isEditOwnerModalOpen}
          onClose={() => {
            setIsEditOwnerModalOpen(false);
            setSelectedOwner(null);
          }}
          onSuccess={() => {
            fetchPets();
            setSuccessMessage(t('messages.ownerUpdated'));
            setTimeout(() => setSuccessMessage(''), 3000);
          }}
          owner={selectedOwner}
        />
      )}
    </div>
  );
};
