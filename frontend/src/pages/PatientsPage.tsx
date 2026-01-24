import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { HeartIcon } from '@heroicons/react/24/outline';
import { useScreenPermission, usePhonePermission, maskPhoneNumber } from '../hooks/useScreenPermission';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { DataTable, Column } from '../components/common/DataTable';
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

  // Define columns for DataTable
  const columns: Column<PetWithOwner>[] = [
    {
      id: 'customerCode',
      header: t('table.customerCode'),
      render: (pet) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {pet.owner.customerCode || '-'}
        </span>
      ),
    },
    {
      id: 'ownerName',
      header: t('table.ownerName'),
      render: (pet) => (
        <div className="text-sm font-medium text-gray-900 whitespace-nowrap">
          {pet.owner.firstName} {pet.owner.lastName}
        </div>
      ),
    },
    {
      id: 'phone',
      header: t('table.phone'),
      render: (pet) => (
        <span className="text-sm text-gray-500 whitespace-nowrap" dir="ltr">
          {canViewPhone ? pet.owner.phone : maskPhoneNumber(pet.owner.phone)}
        </span>
      ),
    },
    {
      id: 'petCode',
      header: t('table.petCode'),
      render: (pet) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          {pet.petCode || '-'}
        </span>
      ),
    },
    {
      id: 'petName',
      header: t('table.petName'),
      render: (pet) => (
        <div className="text-sm font-medium text-gray-900 whitespace-nowrap">{pet.name}</div>
      ),
    },
    {
      id: 'species',
      header: t('table.species'),
      render: (pet) => (
        <span className="text-sm text-gray-500 whitespace-nowrap">{getSpeciesLabel(pet.species)}</span>
      ),
    },
    {
      id: 'breed',
      header: t('table.breed'),
      render: (pet) => (
        <span className="text-sm text-gray-500 whitespace-nowrap">
          {pet.breed ? getBreedDisplayName(pet.species, pet.breed, isRtl) : '-'}
        </span>
      ),
    },
    {
      id: 'gender',
      header: t('table.gender'),
      render: (pet) => (
        <span className="text-sm text-gray-500 whitespace-nowrap">{getGenderLabel(pet.gender)}</span>
      ),
    },
  ];

  // Render actions
  const renderActions = (pet: PetWithOwner) => {
    if (!canModify) return null;
    return (
      <div className="flex gap-2">
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
      </div>
    );
  };

  // Render expanded row
  const renderExpandedRow = (pet: PetWithOwner) => (
    <PatientDetails
      pet={pet}
      canModify={canModify}
      onEditPet={() => handleEditPet(pet)}
      onEditOwner={() => handleEditOwner(pet.owner as Owner)}
      onAddAnotherPet={() => handleAddAnotherPet(pet.owner.id)}
      onDeactivate={() => handleDeactivate(pet)}
    />
  );

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <HeartIcon className="w-7 h-7 text-brand-dark" />
            <h1 className="text-2xl font-bold text-brand-dark">{t('title')}</h1>
          </div>
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

      {/* DataTable */}
      <DataTable<PetWithOwner>
        tableId="patients"
        columns={columns}
        data={pets}
        loading={loading}
        emptyIcon="🐾"
        emptyMessage={t('noPatients')}
        rowKey="id"
        showExpandColumn={true}
        expandedRowId={expandedRowId}
        onExpandToggle={setExpandedRowId}
        renderExpandedRow={renderExpandedRow}
        renderActions={canModify ? renderActions : undefined}
        actionsHeader={t('table.actions')}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

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
