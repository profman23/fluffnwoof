import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, PlusIcon, PencilIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline';
import { serviceProductsApi, Category } from '../../api/serviceProducts';

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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">{t('categories.title')}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
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
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <button
                onClick={handleAdd}
                disabled={loading || !newName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <PlusIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Categories List */}
            <div className="divide-y max-h-64 overflow-y-auto">
              {localCategories.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  {t('categories.noData')}
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
                          className="flex-1 px-3 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEdit(category.id);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                        />
                        <button
                          onClick={() => handleEdit(category.id)}
                          disabled={loading}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        >
                          <CheckIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-gray-900">
                          {category.name}
                        </span>
                        <button
                          onClick={() => startEdit(category)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          disabled={loading}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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
              <button
                onClick={onClose}
                className="w-full px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                {t('categories.close')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
