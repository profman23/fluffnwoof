import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { serviceProductsApi, Category } from '../../api/serviceProducts';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

interface Props {
  categories: Category[];
  onClose: () => void;
}

export const CategoryModal = ({ categories, onClose }: Props) => {
  const { t } = useTranslation('serviceProducts');

  const [localCategories, setLocalCategories] = useState<Category[]>(categories);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async () => {
    if (!newName.trim()) return;

    setLoading(true);
    setError('');
    try {
      const category = await serviceProductsApi.createCategory(newName.trim());
      setLocalCategories((prev) => [...prev, category]);
      setNewName('');
    } catch (err: any) {
      setError(err.response?.data?.message || t('categories.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (id: string) => {
    if (!editingName.trim()) return;

    setLoading(true);
    setError('');
    try {
      const category = await serviceProductsApi.updateCategory(id, editingName.trim());
      setLocalCategories((prev) =>
        prev.map((c) => (c.id === id ? category : c))
      );
      setEditingId(null);
      setEditingName('');
    } catch (err: any) {
      setError(err.response?.data?.message || t('categories.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('categories.confirmDelete'))) return;

    setLoading(true);
    setError('');
    try {
      await serviceProductsApi.deleteCategory(id);
      setLocalCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || t('categories.deleteError'));
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setEditingName(category.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`📂 ${t('categories.title')}`}
      size="sm"
    >
      <div className="space-y-4">
        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Add New */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t('categories.newPlaceholder')}
            className="input flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <Button
            variant="primary"
            onClick={handleAdd}
            disabled={loading || !newName.trim()}
          >
            <PlusIcon className="w-5 h-5" />
          </Button>
        </div>

        {/* Categories List */}
        <div className="divide-y dark:divide-[var(--app-border-default)] max-h-64 overflow-y-auto">
          {localCategories.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">
              📭 {t('categories.noData')}
            </p>
          ) : (
            localCategories.map((category) => (
              <div
                key={category.id}
                className="flex items-center gap-2 py-3"
              >
                {editingId === category.id ? (
                  <>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="input flex-1"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleEdit(category.id);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                    />
                    <button
                      onClick={() => handleEdit(category.id)}
                      disabled={loading}
                      className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                    >
                      <CheckIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[var(--app-bg-elevated)] rounded-lg transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-gray-900 dark:text-[var(--app-text-primary)]">
                      {category.name}
                    </span>
                    <button
                      onClick={() => startEdit(category)}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      disabled={loading}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* Close Button */}
        <div className="pt-4">
          <Button variant="secondary" onClick={onClose} className="w-full">
            {t('categories.close')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
