/**
 * Boarding & ICU Settings Page
 * Manage boarding and ICU slot configurations
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  HomeIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { boardingApi, BoardingSlotConfig, BoardingType, Species, CreateConfigData, UpdateConfigData } from '../../api/boarding';
import { useScreenPermission } from '../../hooks/useScreenPermission';
import { ScreenPermissionGuard } from '../../components/common/ScreenPermissionGuard';

// =====================================================
// Types
// =====================================================

type FilterType = 'ALL' | 'BOARDING' | 'ICU';

interface ConfigModalState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  config?: BoardingSlotConfig;
}

// =====================================================
// Main Component
// =====================================================

const BoardingIcuPage: React.FC = () => {
  const { i18n } = useTranslation('boarding');
  const isRtl = i18n.language === 'ar';
  const queryClient = useQueryClient();
  const { canModify } = useScreenPermission('boardingAndIcu');

  // State
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [showInactive, setShowInactive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [configModal, setConfigModal] = useState<ConfigModalState>({ isOpen: false, mode: 'create' });
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; config?: BoardingSlotConfig }>({ isOpen: false });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch configurations
  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['boarding-configs', filterType, showInactive],
    queryFn: () => boardingApi.getConfigs({
      type: filterType !== 'ALL' ? filterType as BoardingType : undefined,
      isActive: showInactive ? undefined : true,
    }),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: boardingApi.createConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boarding-configs'] });
      setConfigModal({ isOpen: false, mode: 'create' });
      showMessage('success', isRtl ? 'تم إنشاء الإعدادات بنجاح' : 'Configuration created successfully');
    },
    onError: (error: any) => {
      showMessage('error', error.response?.data?.errorAr || error.response?.data?.error || (isRtl ? 'فشل في الإنشاء' : 'Failed to create'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateConfigData }) => boardingApi.updateConfig(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boarding-configs'] });
      setConfigModal({ isOpen: false, mode: 'create' });
      showMessage('success', isRtl ? 'تم تحديث الإعدادات بنجاح' : 'Configuration updated successfully');
    },
    onError: (error: any) => {
      showMessage('error', error.response?.data?.errorAr || error.response?.data?.error || (isRtl ? 'فشل في التحديث' : 'Failed to update'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: boardingApi.deleteConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boarding-configs'] });
      setDeleteConfirm({ isOpen: false });
      showMessage('success', isRtl ? 'تم حذف الإعدادات بنجاح' : 'Configuration deleted successfully');
    },
    onError: (error: any) => {
      showMessage('error', error.response?.data?.errorAr || error.response?.data?.error || (isRtl ? 'فشل في الحذف' : 'Failed to delete'));
    },
  });

  // Helpers
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const getTypeIcon = (type: BoardingType) => {
    return type === 'BOARDING' ? (
      <HomeIcon className="w-6 h-6 text-blue-500" />
    ) : (
      <HeartIcon className="w-6 h-6 text-red-500" />
    );
  };

  const getSpeciesEmoji = (species: Species) => {
    return species === 'DOG' ? '🐕' : species === 'CAT' ? '🐈' : '🐾';
  };

  const getTypeLabel = (type: BoardingType) => {
    if (type === 'BOARDING') {
      return isRtl ? 'إقامة' : 'Boarding';
    }
    return isRtl ? 'عناية مركزة' : 'ICU';
  };

  const getSpeciesLabel = (species: Species) => {
    if (species === 'DOG') return isRtl ? 'كلب' : 'Dog';
    if (species === 'CAT') return isRtl ? 'قطة' : 'Cat';
    return species;
  };

  // Filter configurations
  const filteredConfigs = configs.filter(config => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const typeLabel = getTypeLabel(config.type).toLowerCase();
      const speciesLabel = getSpeciesLabel(config.species).toLowerCase();
      if (!typeLabel.includes(searchLower) && !speciesLabel.includes(searchLower)) {
        return false;
      }
    }
    return true;
  });

  return (
    <ScreenPermissionGuard screenName="boardingAndIcu">
      <div className={`p-6 ${isRtl ? 'rtl' : 'ltr'}`}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isRtl ? 'إعدادات الإقامة والعناية المركزة' : 'Boarding & ICU Settings'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {isRtl ? 'إدارة أماكن الإقامة والعناية المركزة للحيوانات' : 'Manage boarding and ICU slot configurations'}
            </p>
          </div>
          {canModify && (
            <button
              onClick={() => setConfigModal({ isOpen: true, mode: 'create' })}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              {isRtl ? 'إنشاء إعدادات' : 'Create Configuration'}
            </button>
          )}
        </div>

        {/* Message */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-4 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              }`}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Type Filter */}
          <div className="flex gap-2">
            {(['ALL', 'BOARDING', 'ICU'] as FilterType[]).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === type
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {type === 'ALL' ? (isRtl ? 'الكل' : 'All') : getTypeLabel(type as BoardingType)}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={isRtl ? 'بحث...' : 'Search...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Show Inactive */}
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            {isRtl ? 'إظهار غير النشطة' : 'Show Inactive'}
          </label>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredConfigs.length === 0 && (
          <div className="text-center py-12">
            <HomeIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {isRtl ? 'لا توجد إعدادات' : 'No configurations'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {isRtl ? 'ابدأ بإنشاء إعدادات جديدة للإقامة أو العناية المركزة' : 'Start by creating a new boarding or ICU configuration'}
            </p>
            {canModify && (
              <button
                onClick={() => setConfigModal({ isOpen: true, mode: 'create' })}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <PlusIcon className="w-5 h-5" />
                {isRtl ? 'إنشاء إعدادات' : 'Create Configuration'}
              </button>
            )}
          </div>
        )}

        {/* Configurations Grid */}
        {!isLoading && filteredConfigs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredConfigs.map((config) => (
              <motion.div
                key={config.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border ${
                  config.isActive
                    ? 'border-gray-200 dark:border-gray-700'
                    : 'border-gray-300 dark:border-gray-600 opacity-60'
                } overflow-hidden`}
              >
                {/* Card Header */}
                <div className={`px-4 py-3 ${config.type === 'BOARDING' ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(config.type)}
                      <span className="text-2xl">{getSpeciesEmoji(config.species)}</span>
                    </div>
                    {!config.isActive && (
                      <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                        {isRtl ? 'غير نشط' : 'Inactive'}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mt-2">
                    {getSpeciesLabel(config.species)} {getTypeLabel(config.type)}
                  </h3>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {isRtl ? 'إجمالي الأماكن' : 'Total Slots'}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">{config.totalSlots}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {isRtl ? 'متاح' : 'Available'}
                    </span>
                    <span className={`font-semibold ${
                      (config.availableSlots || 0) > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {config.availableSlots || config.totalSlots}
                    </span>
                  </div>
                  {config.pricePerDay && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {isRtl ? 'السعر/يوم' : 'Price/Day'}
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {config.pricePerDay} {isRtl ? 'ر.س' : 'SAR'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                {canModify && (
                  <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                    <button
                      onClick={() => setConfigModal({ isOpen: true, mode: 'edit', config })}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <PencilIcon className="w-4 h-4" />
                      {isRtl ? 'تعديل' : 'Edit'}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ isOpen: true, config })}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                      {isRtl ? 'حذف' : 'Delete'}
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        <ConfigModal
          isOpen={configModal.isOpen}
          mode={configModal.mode}
          config={configModal.config}
          onClose={() => setConfigModal({ isOpen: false, mode: 'create' })}
          onSave={(data) => {
            if (configModal.mode === 'create') {
              createMutation.mutate(data as CreateConfigData);
            } else if (configModal.config) {
              updateMutation.mutate({ id: configModal.config.id, data: data as UpdateConfigData });
            }
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
          isRtl={isRtl}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={deleteConfirm.isOpen}
          config={deleteConfirm.config}
          onClose={() => setDeleteConfirm({ isOpen: false })}
          onConfirm={() => {
            if (deleteConfirm.config) {
              deleteMutation.mutate(deleteConfirm.config.id);
            }
          }}
          isLoading={deleteMutation.isPending}
          isRtl={isRtl}
        />
      </div>
    </ScreenPermissionGuard>
  );
};

// =====================================================
// Config Modal Component
// =====================================================

interface ConfigModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  config?: BoardingSlotConfig;
  onClose: () => void;
  onSave: (data: CreateConfigData | UpdateConfigData) => void;
  isLoading: boolean;
  isRtl: boolean;
}

const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, mode, config, onClose, onSave, isLoading, isRtl }) => {
  const [type, setType] = useState<BoardingType>('BOARDING');
  const [species, setSpecies] = useState<Species>('DOG');
  const [totalSlots, setTotalSlots] = useState('10');
  const [pricePerDay, setPricePerDay] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && config) {
        setType(config.type);
        setSpecies(config.species);
        setTotalSlots(config.totalSlots.toString());
        setPricePerDay(config.pricePerDay?.toString() || '');
        setNotes(config.notes || '');
        setIsActive(config.isActive);
      } else {
        setType('BOARDING');
        setSpecies('DOG');
        setTotalSlots('10');
        setPricePerDay('');
        setNotes('');
        setIsActive(true);
      }
    }
  }, [isOpen, mode, config]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'create') {
      onSave({
        type,
        species,
        totalSlots: parseInt(totalSlots),
        pricePerDay: pricePerDay ? parseFloat(pricePerDay) : null,
        notes: notes || null,
      });
    } else {
      onSave({
        totalSlots: parseInt(totalSlots),
        pricePerDay: pricePerDay ? parseFloat(pricePerDay) : null,
        notes: notes || null,
        isActive,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {mode === 'create'
              ? (isRtl ? 'إنشاء إعدادات جديدة' : 'Create Configuration')
              : (isRtl ? 'تعديل الإعدادات' : 'Edit Configuration')}
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type Selection (only for create) */}
          {mode === 'create' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {isRtl ? 'النوع' : 'Type'}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType('BOARDING')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    type === 'BOARDING'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <HomeIcon className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {isRtl ? 'إقامة' : 'Boarding'}
                  </div>
                  <div className="text-xs text-gray-500">{isRtl ? 'فندق الحيوانات' : 'Pet Hotel'}</div>
                </button>
                <button
                  type="button"
                  onClick={() => setType('ICU')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    type === 'ICU'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <HeartIcon className="w-8 h-8 mx-auto text-red-500 mb-2" />
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {isRtl ? 'عناية مركزة' : 'ICU'}
                  </div>
                  <div className="text-xs text-gray-500">{isRtl ? 'العناية المركزة' : 'Intensive Care'}</div>
                </button>
              </div>
            </div>
          )}

          {/* Species Selection (only for create) */}
          {mode === 'create' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {isRtl ? 'الفصيلة' : 'Species'}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSpecies('DOG')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    species === 'DOG'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="text-4xl block mb-2">🐕</span>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {isRtl ? 'كلب' : 'Dog'}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setSpecies('CAT')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    species === 'CAT'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="text-4xl block mb-2">🐈</span>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {isRtl ? 'قطة' : 'Cat'}
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Total Slots */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {isRtl ? 'عدد الأماكن' : 'Number of Slots'}
            </label>
            <input
              type="number"
              min="1"
              value={totalSlots}
              onChange={(e) => setTotalSlots(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>

          {/* Price per Day */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {isRtl ? 'السعر اليومي (اختياري)' : 'Price per Day (Optional)'}
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                value={pricePerDay}
                onChange={(e) => setPricePerDay(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                {isRtl ? 'ر.س' : 'SAR'}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {isRtl ? 'ملاحظات (اختياري)' : 'Notes (Optional)'}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
            />
          </div>

          {/* Active Toggle (only for edit) */}
          {mode === 'edit' && (
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-5 h-5"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {isRtl ? 'نشط' : 'Active'}
              </span>
            </label>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isRtl ? 'جارٍ الحفظ...' : 'Saving...'}
                </span>
              ) : (
                mode === 'create' ? (isRtl ? 'إنشاء' : 'Create') : (isRtl ? 'حفظ' : 'Save')
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// =====================================================
// Delete Confirmation Modal
// =====================================================

interface DeleteConfirmModalProps {
  isOpen: boolean;
  config?: BoardingSlotConfig;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  isRtl: boolean;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ isOpen, config, onClose, onConfirm, isLoading, isRtl }) => {
  if (!isOpen || !config) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm mx-4 p-6"
      >
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
          <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-white mb-2">
          {isRtl ? 'تأكيد الحذف' : 'Confirm Delete'}
        </h3>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-6">
          {isRtl
            ? 'هل أنت متأكد من حذف هذه الإعدادات؟ لا يمكن التراجع عن هذا الإجراء.'
            : 'Are you sure you want to delete this configuration? This action cannot be undone.'}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            {isRtl ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </span>
            ) : (
              isRtl ? 'حذف' : 'Delete'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default BoardingIcuPage;
